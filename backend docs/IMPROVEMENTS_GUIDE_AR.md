# ???? ????????? ???????? - NaplanBridge API
## ????? ????? ????????? ???? ?????

---

## ?? ????? ?????: ??????? ?????? (?????? ????)

### 1. ????? CORS

#### ? ????? ?????? (??? ???)
```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
    .AllowAnyHeader()
           .AllowAnyMethod();
    });
});

app.UseCors("AllowAll");
```

#### ? ????? ???????? (???)
```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionPolicy", policy =>
    {
        policy.WithOrigins(
                "https://naplanbridge.netlify.app",
      "http://naplan.babaservice.online"
        )
            .AllowAnyHeader()
.AllowAnyMethod()
         .AllowCredentials();
    });

    // ????? ?????? ???????
    options.AddPolicy("DevelopmentPolicy", policy =>
    {
        policy.WithOrigins(
  "http://localhost:4200",
   "https://localhost:4200"
            )
    .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ??????? ??????? ??? ??????
if (app.Environment.IsProduction())
{
    app.UseCors("ProductionPolicy");
}
else
{
    app.UseCors("DevelopmentPolicy");
}
```

---

### 2. ????? Endpoints ?????? ?????? ?? ?????????

#### ????? Middleware ?????? ?? ????????

```csharp
// Middleware/SubscriptionAuthorizationMiddleware.cs
public class SubscriptionAuthorizationMiddleware
{
    private readonly RequestDelegate _next;

    public SubscriptionAuthorizationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

 public async Task InvokeAsync(
        HttpContext context, 
        ISubscriptionService subscriptionService)
    {
    var endpoint = context.GetEndpoint();
      var requiresSubscription = endpoint?.Metadata
    .GetMetadata<RequireSubscriptionAttribute>();

        if (requiresSubscription != null)
   {
            var studentIdClaim = context.User.FindFirst("StudentId")?.Value;
   if (studentIdClaim == null)
  {
      context.Response.StatusCode = 403;
         await context.Response.WriteAsJsonAsync(new 
       { 
          error = "Student ID not found in token" 
     });
        return;
       }

       int studentId = int.Parse(studentIdClaim);
        int contentId = requiresSubscription.ContentId;
      var contentType = requiresSubscription.ContentType;

            bool hasAccess = contentType switch
   {
 ContentType.Subject => await subscriptionService
   .HasActiveSubscriptionAsync(studentId, contentId),
          ContentType.Lesson => await subscriptionService
         .HasAccessToLessonAsync(studentId, contentId),
              ContentType.Exam => await subscriptionService
       .HasAccessToExamAsync(studentId, contentId),
         _ => false
         };

            if (!hasAccess)
            {
    context.Response.StatusCode = 403;
     await context.Response.WriteAsJsonAsync(new 
 { 
        error = "No active subscription for this content" 
            });
           return;
     }
      }

    await _next(context);
    }
}

// Attribute ??????? ??? Controllers
[AttributeUsage(AttributeTargets.Method)]
public class RequireSubscriptionAttribute : Attribute
{
    public int ContentId { get; set; }
    public ContentType ContentType { get; set; }
}

public enum ContentType
{
    Subject,
    Lesson,
 Exam
}
```

#### ????? Middleware

```csharp
// Program.cs
app.UseMiddleware<SubscriptionAuthorizationMiddleware>();
```

#### ??????? Attribute ?? Controllers

```csharp
// Controllers/LessonsController.cs
[HttpGet("{id:int}")]
[Authorize(Roles = "Student")]
[RequireSubscription(ContentType = ContentType.Lesson)]
public async Task<ActionResult<LessonDetailsDto>> GetLesson(int id)
{
    // ???? ?????? ???????? ?? ????????
    var lesson = await context.Lessons
        .Include(l => l.Week)
            .ThenInclude(w => w.Term)
             .ThenInclude(t => t.Subject)
        .FirstOrDefaultAsync(l => l.Id == id);

    if (lesson == null) return NotFound();

    return Ok(lesson);
}
```

---

### 3. ????? ???? ??????????

```csharp
// Services/Implementations/SubscriptionService.cs
public class SubscriptionService : ISubscriptionService
{
    private readonly DataContext _context;
    private readonly ILogger<SubscriptionService> _logger;

    public async Task<bool> HasActiveSubscriptionAsync(
        int studentId, 
        int subjectId)
    {
        var now = DateTime.UtcNow;
        
        return await _context.Subscriptions
     .AnyAsync(s => 
      s.StudentId == studentId &&
       s.SubjectId == subjectId &&
                s.PaymentStatus == SubscriptionStatus.Active &&
     s.StartDate <= now &&
      s.EndDate >= now
    );
    }

    public async Task<bool> HasAccessToLessonAsync(
        int studentId, 
        int lessonId)
{
      var lesson = await _context.Lessons
  .Include(l => l.Week)
 .ThenInclude(w => w.Term)
 .FirstOrDefaultAsync(l => l.Id == lessonId);

  if (lesson == null) return false;

        var subjectId = lesson.Week?.Term?.SubjectId;
   if (subjectId == null) return false;

        return await HasActiveSubscriptionAsync(studentId, subjectId.Value);
    }

    public async Task<bool> HasAccessToExamAsync(
    int studentId, 
        int examId)
    {
        var exam = await _context.Exams.FindAsync(examId);
        if (exam == null) return false;

        return await HasActiveSubscriptionAsync(studentId, exam.SubjectId);
    }
}
```

---

## ? ????? ??????: ??????? ??????

### 1. ????? Pagination

#### ????? ????? Pagination ???

```csharp
// DTOs/Common/PagedResult.cs
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
  public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPrevious => Page > 1;
    public bool HasNext => Page < TotalPages;
}

// DTOs/Common/PaginationParams.cs
public class PaginationParams
{
    private const int MaxPageSize = 50;
    private int _pageSize = 10;

    public int Page { get; set; } = 1;

    public int PageSize
    {
  get => _pageSize;
        set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
    }
}
```

#### ????? Pagination ?? Controller

```csharp
// Controllers/SubjectsController.cs
[HttpGet]
public async Task<ActionResult<PagedResult<SubjectDto>>> GetSubjects(
    [FromQuery] PaginationParams paginationParams,
 [FromQuery] int? categoryId = null,
    [FromQuery] int? yearId = null)
{
    var query = _context.Subjects.AsQueryable();

    // ???????
    if (categoryId.HasValue)
        query = query.Where(s => s.SubjectName.CategoryId == categoryId.Value);

    if (yearId.HasValue)
        query = query.Where(s => s.YearId == yearId.Value);

    // ?????? ?????
 var totalCount = await query.CountAsync();

    // Pagination
    var items = await query
        .Include(s => s.SubjectName)
  .ThenInclude(sn => sn.Category)
     .Include(s => s.SubscriptionPlans)
        .OrderBy(s => s.Id)
   .Skip((paginationParams.Page - 1) * paginationParams.PageSize)
        .Take(paginationParams.PageSize)
        .Select(s => new SubjectDto
        {
    Id = s.Id,
            SubjectName = s.SubjectName.Name,
            Price = s.Price,
 // ...
        })
        .ToListAsync();

    return Ok(new PagedResult<SubjectDto>
    {
  Items = items,
  Page = paginationParams.Page,
    PageSize = paginationParams.PageSize,
        TotalCount = totalCount
    });
}
```

---

### 2. ????? Caching

#### ????? ??????

```bash
dotnet add package Microsoft.Extensions.Caching.Memory
```

#### ????? ???? Caching

```csharp
// Services/Interfaces/ICacheService.cs
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
 Task RemoveByPrefixAsync(string prefix);
}

// Services/Implementations/CacheService.cs
public class CacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<CacheService> _logger;
    private readonly HashSet<string> _cacheKeys = new();

    public CacheService(
    IMemoryCache cache, 
   ILogger<CacheService> logger)
    {
        _cache = cache;
   _logger = logger;
  }

    public Task<T?> GetAsync<T>(string key)
    {
        _cache.TryGetValue(key, out T? value);
      
        if (value != null)
  _logger.LogDebug("Cache hit for key: {Key}", key);
   else
            _logger.LogDebug("Cache miss for key: {Key}", key);

        return Task.FromResult(value);
    }

    public Task SetAsync<T>(
        string key, 
        T value, 
        TimeSpan? expiration = null)
    {
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromHours(1)
        };

        _cache.Set(key, value, options);
      _cacheKeys.Add(key);
        
        _logger.LogDebug("Cached item with key: {Key}", key);
     return Task.CompletedTask;
    }

    public Task RemoveAsync(string key)
    {
        _cache.Remove(key);
    _cacheKeys.Remove(key);
    _logger.LogDebug("Removed cache item with key: {Key}", key);
        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix)
    {
  var keysToRemove = _cacheKeys
            .Where(k => k.StartsWith(prefix))
       .ToList();

 foreach (var key in keysToRemove)
        {
            _cache.Remove(key);
            _cacheKeys.Remove(key);
        }

     _logger.LogDebug(
            "Removed {Count} cache items with prefix: {Prefix}", 
          keysToRemove.Count, 
            prefix);

        return Task.CompletedTask;
    }
}
```

#### ??????? ?? Program.cs

```csharp
// Program.cs
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<ICacheService, CacheService>();
```

#### ????????? ?? Controllers

```csharp
// Controllers/CategoriesController.cs
public class CategoriesController : ControllerBase
{
    private readonly DataContext _context;
    private readonly ICacheService _cache;
    private const string CategoriesCacheKey = "categories_all";

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        // ?????? ?????? ?? Cache
   var cached = await _cache.GetAsync<List<CategoryDto>>(CategoriesCacheKey);
     if (cached != null)
     return Ok(cached);

        // ??? ?? ??? ??????? ????? ?? DB
        var categories = await _context.Categories
            .Select(c => new CategoryDto
            {
Id = c.Id,
  Name = c.Name,
  Description = c.Description
   })
            .ToListAsync();

  // ????? ?? Cache ???? 24 ????
        await _cache.SetAsync(
         CategoriesCacheKey, 
   categories, 
       TimeSpan.FromHours(24));

        return Ok(categories);
    }

 [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CategoryDto>> CreateCategory(
        CreateCategoryDto dto)
    {
        var category = new Category
        {
          Name = dto.Name,
   Description = dto.Description
        };

 _context.Categories.Add(category);
  await _context.SaveChangesAsync();

        // ????? Cache ??? ???????
await _cache.RemoveAsync(CategoriesCacheKey);

    return CreatedAtAction(
      nameof(GetCategories), 
            new { id = category.Id }, 
            category);
    }
}
```

---

### 3. ?? ????? N+1 Query

#### ? ????? ?????? (???? N+1)

```csharp
// ???: ???? ??????? ????? ??? subject
var subjects = await context.Subjects.ToListAsync();
foreach(var subject in subjects)
{
    var count = await context.Subscriptions
     .CountAsync(s => s.SubjectId == subject.Id);
    // ...
}
```

#### ? ????? ????????

```csharp
// ???: ??????? ???? ???
var subjects = await context.Subjects
    .Select(s => new SubjectDto
    {
        Id = s.Id,
     Name = s.SubjectName.Name,
  // ???? ????? ??? ??? SELECT
StudentCount = context.Subscriptions
   .Count(sub => sub.SubjectId == s.Id && 
         sub.PaymentStatus == SubscriptionStatus.Active)
    })
    .ToListAsync();
```

---

### 4. ????? Database Indexes

```csharp
// Data/DataContext.cs - ?? OnModelCreating
protected override void OnModelCreating(ModelBuilder builder)
{
    base.OnModelCreating(builder);

    // Indexes ??????
    builder.Entity<Subscription>()
        .HasIndex(s => new { s.StudentId, s.SubjectId, s.PaymentStatus })
        .HasDatabaseName("IX_Subscription_Student_Subject_Status");

    builder.Entity<Subscription>()
    .HasIndex(s => new { s.StartDate, s.EndDate })
        .HasDatabaseName("IX_Subscription_Dates");

    builder.Entity<Lesson>()
        .HasIndex(l => l.WeekId)
   .HasDatabaseName("IX_Lesson_WeekId");

    builder.Entity<Progress>()
        .HasIndex(p => new { p.StudentId, p.IsCompleted })
        .HasDatabaseName("IX_Progress_Student_Completed");

    builder.Entity<StudentExam>()
        .HasIndex(se => new { se.StudentId, se.ExamId, se.IsSubmitted })
   .HasDatabaseName("IX_StudentExam_Student_Exam_Submitted");

    // Unique indexes
    builder.Entity<User>()
        .HasIndex(u => u.Email)
        .IsUnique()
     .HasDatabaseName("IX_User_Email_Unique");
}
```

#### ????? Migration ??? Indexes

```bash
dotnet ef migrations add AddPerformanceIndexes
dotnet ef database update
```

---

## ??? ????? ??????: ????? ??????? ???? Logging

### 1. ????? Global Exception Handler

```csharp
// Middleware/GlobalExceptionMiddleware.cs
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(
     RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
     _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
   try
        {
      await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
      }
    }

    private async Task HandleExceptionAsync(
        HttpContext context, 
        Exception exception)
    {
        _logger.LogError(
            exception, 
       "An unhandled exception occurred. Path: {Path}", 
      context.Request.Path);

        var response = exception switch
    {
      NotFoundException notFound => new ErrorResponse
        {
          StatusCode = StatusCodes.Status404NotFound,
       Message = "Resource not found",
 Details = notFound.Message
            },
      UnauthorizedException unauthorized => new ErrorResponse
 {
       StatusCode = StatusCodes.Status401Unauthorized,
         Message = "Unauthorized access",
           Details = unauthorized.Message
            },
ValidationException validation => new ErrorResponse
     {
             StatusCode = StatusCodes.Status400BadRequest,
    Message = "Validation error",
           Details = validation.Message,
                Errors = validation.Errors
    },
   ForbiddenException forbidden => new ErrorResponse
            {
      StatusCode = StatusCodes.Status403Forbidden,
          Message = "Forbidden",
      Details = forbidden.Message
            },
            _ => new ErrorResponse
 {
  StatusCode = StatusCodes.Status500InternalServerError,
     Message = "An internal server error occurred",
     Details = "Please contact support"
            }
   };

        context.Response.ContentType = "application/json";
      context.Response.StatusCode = response.StatusCode;
        await context.Response.WriteAsJsonAsync(response);
    }
}

// Models/ErrorResponse.cs
public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
    public Dictionary<string, string[]>? Errors { get; set; }
    public string TraceId { get; set; } = Guid.NewGuid().ToString();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

// Exceptions/CustomExceptions.cs
public class NotFoundException : Exception
{
  public NotFoundException(string message) : base(message) { }
}

public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message) { }
}

public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message) { }
}

public class ValidationException : Exception
{
    public Dictionary<string, string[]> Errors { get; }

    public ValidationException(Dictionary<string, string[]> errors)
    : base("One or more validation errors occurred")
 {
        Errors = errors;
    }
}
```

#### ??????? ?? Program.cs

```csharp
// Program.cs
app.UseMiddleware<GlobalExceptionMiddleware>();
```

---

### 2. ????? Serilog ??? Structured Logging

#### ????? ?????

```bash
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.File
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Enrichers.Environment
```

#### ??????? ?? Program.cs

```csharp
// Program.cs
using Serilog;

// ????? Serilog ??? builder.Build()
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
  .Enrich.WithEnvironmentName()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/log-.txt",
        rollingInterval: RollingInterval.Day,
   outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}",
        retainedFileCountLimit: 30)
    .CreateLogger();

try
{
    Log.Information("Starting NaplanBridge API");

    var builder = WebApplication.CreateBuilder(args);

    // ??????? Serilog
 builder.Host.UseSerilog();

    // ... ???? ?????????

    var app = builder.Build();

    // Request Logging
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = 
       "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
     diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"]);
      };
    });

 app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
```

#### ??????? Logging ?? Services

```csharp
// Services/Implementations/OrderService.cs
public class OrderService : IOrderService
{
    private readonly DataContext _context;
    private readonly ILogger<OrderService> _logger;

  public async Task<Order> CreateOrderFromCartAsync(int userId)
    {
        _logger.LogInformation(
            "Creating order for user {UserId}", 
            userId);

        try
        {
            var cart = await _context.Carts
         .Include(c => c.CartItems)
   .ThenInclude(ci => ci.SubscriptionPlan)
           .Include(c => c.CartItems)
          .ThenInclude(ci => ci.Student)
      .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || !cart.CartItems.Any())
            {
         _logger.LogWarning(
"User {UserId} tried to create order with empty cart", 
          userId);
             throw new ValidationException("Cart is empty");
         }

            var order = new Order
          {
     UserId = userId,
    TotalAmount = cart.CartItems.Sum(ci => 
    ci.SubscriptionPlan.Price * ci.Quantity),
                OrderStatus = OrderStatus.Pending
       };

         // ??? items ?? Cart ??? Order
            foreach (var cartItem in cart.CartItems)
     {
     order.OrderItems.Add(new OrderItem
       {
  StudentId = cartItem.StudentId,
  SubscriptionPlanId = cartItem.SubscriptionPlanId,
     Quantity = cartItem.Quantity,
       UnitPrice = cartItem.SubscriptionPlan.Price
                });
            }

 _context.Orders.Add(order);
     
  // ????? ?????
            _context.CartItems.RemoveRange(cart.CartItems);
 
   await _context.SaveChangesAsync();

     _logger.LogInformation(
        "Order {OrderId} created successfully for user {UserId} with total amount {TotalAmount}",
 order.Id,
            userId,
       order.TotalAmount);

   return order;
        }
        catch (Exception ex)
        {
            _logger.LogError(
   ex,
         "Failed to create order for user {UserId}",
          userId);
 throw;
        }
    }
}
```

---

## ? ????? ??????: Validation ????????

### 1. ????? FluentValidation

#### ????? ??????

```bash
dotnet add package FluentValidation.AspNetCore
```

#### ????? Validators

```csharp
// DTOs/Validators/CreateExamDtoValidator.cs
public class CreateExamDtoValidator : AbstractValidator<CreateExamDto>
{
    public CreateExamDtoValidator()
    {
        RuleFor(x => x.Title)
   .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters");

        RuleFor(x => x.DurationInMinutes)
.GreaterThan(0).WithMessage("Duration must be positive")
            .LessThanOrEqualTo(480).WithMessage("Maximum duration is 8 hours");

RuleFor(x => x.StartTime)
     .Must(BeInFuture).WithMessage("Start time must be in the future");

        RuleFor(x => x.EndTime)
   .GreaterThan(x => x.StartTime)
            .WithMessage("End time must be after start time");

        RuleFor(x => x.SubjectId)
          .GreaterThan(0).WithMessage("Invalid subject ID");
    }

    private bool BeInFuture(DateTime dateTime)
{
        return dateTime > DateTime.UtcNow;
  }
}

// DTOs/Validators/CreateQuestionDtoValidator.cs
public class CreateQuestionDtoValidator : AbstractValidator<CreateQuestionDto>
{
    public CreateQuestionDtoValidator()
  {
        RuleFor(x => x.QuestionText)
        .NotEmpty().WithMessage("Question text is required")
            .MaximumLength(1000).WithMessage("Question text too long");

RuleFor(x => x.Marks)
   .GreaterThan(0).WithMessage("Marks must be positive")
            .LessThanOrEqualTo(100).WithMessage("Marks cannot exceed 100");

        RuleFor(x => x.Options)
       .NotEmpty().WithMessage("At least one option is required")
    .Must(HaveMinimumOptions).WithMessage("At least 2 options required")
      .Must(HaveAtLeastOneCorrect).WithMessage("At least one option must be correct");

        When(x => !x.IsMultipleSelect, () =>
 {
      RuleFor(x => x.Options)
     .Must(HaveExactlyOneCorrect)
         .WithMessage("Single select questions must have exactly one correct answer");
        });
    }

  private bool HaveMinimumOptions(List<CreateOptionDto> options)
    {
        return options.Count >= 2;
 }

  private bool HaveAtLeastOneCorrect(List<CreateOptionDto> options)
{
        return options.Any(o => o.IsCorrect);
    }

    private bool HaveExactlyOneCorrect(List<CreateOptionDto> options)
    {
      return options.Count(o => o.IsCorrect) == 1;
    }
}
```

#### ??????? ?? Program.cs

```csharp
// Program.cs
builder.Services.AddFluentValidation(fv =>
{
  fv.RegisterValidatorsFromAssemblyContaining<CreateExamDtoValidator>();
    fv.AutomaticValidationEnabled = true;
});
```

---

### 2. ????? ????? Swagger

```csharp
// Program.cs
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
      Title = "NaplanBridge API",
        Version = "v1",
        Description = "Educational platform API with subscription management",
        Contact = new OpenApiContact
        {
         Name = "Support Team",
            Email = "support@naplanbridge.com"
        }
    });

    // JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
     Type = SecuritySchemeType.Http,
        Scheme = "bearer",
   BearerFormat = "JWT",
     In = ParameterLocation.Header,
        Description = "Enter your JWT token like: Bearer {your token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
        Reference = new OpenApiReference
    {
         Type = ReferenceType.SecurityScheme,
  Id = "Bearer"
  }
     },
   Array.Empty<string>()
        }
    });

    // XML Comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
 }

    // Enum as strings
    c.UseInlineDefinitionsForEnums();
    c.SchemaFilter<EnumSchemaFilter>();
});

// Schema Filter ??? Enums
public class EnumSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
    if (context.Type.IsEnum)
        {
   schema.Enum.Clear();
            Enum.GetNames(context.Type)
    .ToList()
        .ForEach(name => schema.Enum.Add(new OpenApiString(name)));
        }
    }
}
```

#### ????? XML Comments ??? Controllers

```csharp
// Controllers/ExamController.cs
/// <summary>
/// ???? ????? ?????? ??????????
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ExamController : ControllerBase
{
    /// <summary>
    /// ????? ?????? ????
    /// </summary>
    /// <param name="dto">?????? ????????</param>
    /// <returns>???????? ???????</returns>
    /// <response code="201">?? ????? ???????? ?????</response>
    /// <response code="400">?????? ??? ?????</response>
    /// <response code="401">??? ?????</response>
  [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    [ProducesResponseType(typeof(ExamResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ExamResponseDto>> CreateExam(
        [FromBody] CreateExamDto dto)
    {
        // ...
    }

    /// <summary>
    /// ??? ?????? ??????
    /// </summary>
    /// <param name="examId">???? ????????</param>
    /// <returns>????? ????????</returns>
    /// <response code="200">?? ??? ???????? ?????</response>
    /// <response code="403">?????? ??? ?????</response>
    /// <response code="404">???????? ??? ?????</response>
    [HttpPost("{examId:int}/start")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(typeof(StartExamResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StartExamResponseDto>> StartExam(int examId)
    {
    // ...
    }
}
```

---

## ?? ????? ??????: Monitoring ? Health Checks

### 1. ????? Health Checks

```csharp
// HealthChecks/StripeHealthCheck.cs
public class StripeHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;

    public StripeHealthCheck(IConfiguration configuration)
    {
   _configuration = configuration;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
    HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
   {
      var secretKey = _configuration["Stripe:SecretKey"];
         if (string.IsNullOrEmpty(secretKey))
    {
       return HealthCheckResult.Unhealthy("Stripe secret key not configured");
        }

         StripeConfiguration.ApiKey = secretKey;
       var service = new BalanceService();
            await service.GetAsync(cancellationToken: cancellationToken);

            return HealthCheckResult.Healthy("Stripe is responding");
        }
        catch (Exception ex)
    {
    return HealthCheckResult.Unhealthy(
            "Stripe connection failed",
         ex);
 }
    }
}

// HealthChecks/CloudinaryHealthCheck.cs
public class CloudinaryHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;

    public CloudinaryHealthCheck(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
  try
        {
  var cloudName = _configuration["CloudinarySettings:CloudName"];
      var apiKey = _configuration["CloudinarySettings:ApiKey"];
            var apiSecret = _configuration["CloudinarySettings:ApiSecret"];

   if (string.IsNullOrEmpty(cloudName) ||
       string.IsNullOrEmpty(apiKey) ||
            string.IsNullOrEmpty(apiSecret))
            {
                return Task.FromResult(
              HealthCheckResult.Unhealthy("Cloudinary not configured"));
            }

 var account = new Account(cloudName, apiKey, apiSecret);
            var cloudinary = new Cloudinary(account);

      return Task.FromResult(
    HealthCheckResult.Healthy("Cloudinary is configured"));
      }
        catch (Exception ex)
    {
            return Task.FromResult(
    HealthCheckResult.Unhealthy("Cloudinary check failed", ex));
        }
    }
}
```

#### ??????? ?? Program.cs

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<DataContext>("database")
    .AddCheck<StripeHealthCheck>("stripe")
    .AddCheck<CloudinaryHealthCheck>("cloudinary");

// Endpoints
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
      context.Response.ContentType = "application/json";
        var response = new
        {
    status = report.Status.ToString(),
      checks = report.Entries.Select(e => new
{
         name = e.Key,
                status = e.Value.Status.ToString(),
      description = e.Value.Description,
      duration = e.Value.Duration.TotalMilliseconds
     }),
   totalDuration = report.TotalDuration.TotalMilliseconds
        };
        await context.Response.WriteAsJsonAsync(response);
    }
});

// Health check ????
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});

// Health check ??????? ???
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Name == "database"
});
```

---

### 2. ????? Rate Limiting

```csharp
// Program.cs
builder.Services.AddRateLimiter(options =>
{
    // ????? ????
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        context => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? 
        context.Connection.RemoteIpAddress?.ToString() ?? 
            "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
  {
                PermitLimit = 100,
           Window = TimeSpan.FromMinutes(1),
           QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
       QueueLimit = 2
      }));

    // ????? ??? API calls
    options.AddFixedWindowLimiter("api", options =>
    {
        options.PermitLimit = 50;
        options.Window = TimeSpan.FromMinutes(1);
    });

    // ????? ??? Login attempts
    options.AddFixedWindowLimiter("login", options =>
    {
        options.PermitLimit = 5;
        options.Window = TimeSpan.FromMinutes(15);
    });

    options.OnRejected = async (context, token) =>
    {
  context.HttpContext.Response.StatusCode = 429;
      await context.HttpContext.Response.WriteAsJsonAsync(new
   {
            error = "Too many requests",
     message = "Please try again later",
    retryAfter = context.Lease.TryGetMetadata(
 MetadataName.RetryAfter, out var retryAfter) 
                ? retryAfter.TotalSeconds 
      : null
        });
    };
});

app.UseRateLimiter();
```

#### ??????? Rate Limiter ?? Controllers

```csharp
// Controllers/AccountController.cs
[HttpPost("login")]
[EnableRateLimiting("login")]
public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
{
    // ...
}

[HttpPost("register-parent")]
[EnableRateLimiting("api")]
public async Task<ActionResult<UserDto>> RegisterParent(ParentRegisterDto dto)
{
    // ...
}
```

---

## ?? ???????

??? ?????? ???? ??? ????????? ????????:

### ? ?? ?????:
1. **??????** - CORS? Authorization? Subscription checks
2. **??????** - Pagination? Caching? Indexes
3. **????? ???????** - Global handler? Structured logging
4. **Validation** - FluentValidation
5. **Monitoring** - Health checks? Rate limiting
6. **???????** - Swagger improvements? XML comments

### ?? ??????? ???????:
1. ????? Soft Delete ? Auditing
2. ????? Unit ? Integration Tests
3. ????? CI/CD Pipeline
4. ????? Background Jobs (Hangfire/Quartz)
5. ????? ???? ?????????

---

**??????:** ????? ?????? ????????? ???? ?????? ??????? ?? ????? ??? ???.
