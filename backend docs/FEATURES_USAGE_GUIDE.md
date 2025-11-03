# ?? ???? ??????? ??????? ???????? - NaplanBridge API

## ?? ???? ?????????
1. [Health Checks](#health-checks)
2. [Rate Limiting](#rate-limiting)
3. [Pagination](#pagination)
4. [Caching](#caching)
5. [Error Handling](#error-handling)
6. [File Upload](#file-upload)
7. [Video Upload (Bunny.net)](#video-upload-bunnynet)
8. [Search & Filtering](#search--filtering)
9. [Soft Delete](#soft-delete)
10. [Background Jobs](#background-jobs)

---

## ?? Health Checks

### ???? ???? Endpoints

#### 1. Full Health Check
```http
GET /health
```

**Response Example:**
```json
{
  "status": "Healthy",
  "checks": [
    {
      "name": "database",
      "status": "Healthy",
      "description": null,
      "duration": 45.2
    },
    {
      "name": "stripe",
      "status": "Healthy",
   "description": "Stripe is responding",
      "duration": 123.5
    },
    {
      "name": "cloudinary",
      "status": "Healthy",
      "description": "Cloudinary is configured",
      "duration": 2.1
    }
  ],
  "totalDuration": 170.8
}
```

**Status Values:**
- `Healthy`: ?????? ???? ???? ????
- `Degraded`: ?????? ???? ??? ?? ?????
- `Unhealthy`: ?????? ?????

---

#### 2. Liveness Probe (?? Kubernetes)
```http
GET /health/live
```
**Response:** `Healthy` (200 OK)

**?????????**: ?????? ?? Kubernetes ?????? ?? ?? ??????? ??? ???????

---

#### 3. Readiness Probe (?? Database)
```http
GET /health/ready
```
**Response:** `Healthy` (200 OK) ?? `Unhealthy` (503)

**?????????**: ?????? ?? Kubernetes ?????? ?? ?? ??????? ???? ???????? ???????

---

### ????? Health Check ????

```csharp
// ?? Startup/Program.cs
services.AddHealthChecks()
    .AddDbContextCheck<DataContext>("database")
    .AddCheck<StripeHealthCheck>("stripe")
    .AddCheck<CloudinaryHealthCheck>("cloudinary")
    .AddCheck<BunnyHealthCheck>("bunny") // ???? ?
    .AddCheck<CustomServiceHealthCheck>("my-service");
```

```csharp
// BunnyHealthCheck.cs
public class BunnyHealthCheck : IHealthCheck
{
    private readonly IBunnyVideoService _bunnyService;
    private readonly ILogger<BunnyHealthCheck> _logger;

    public BunnyHealthCheck(
        IBunnyVideoService bunnyService,
  ILogger<BunnyHealthCheck> logger)
    {
        _bunnyService = bunnyService;
 _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
// Test Bunny.net connection
            var testVideoId = "test-video-id";
         var videoInfo = await _bunnyService.GetVideoInfoAsync(testVideoId);
       
            return HealthCheckResult.Healthy("Bunny.net is responding");
        }
        catch (Exception ex)
      {
         _logger.LogError(ex, "Bunny.net health check failed");
        return HealthCheckResult.Unhealthy(
  "Bunny.net check failed",
          exception: ex
     );
     }
    }
}
```

---

## ?? Rate Limiting

### ?????? ???????

| Endpoint Pattern | ?? ??????? | ????? | ????? |
|------------------|-------------|-------|-------|
| `*` (Global) | 100 requests | 1 minute | ????? ??????? ???? ??? |
| `/api/**` (API) | 50 requests | 1 minute | ?? API calls ????? |
| `/api/account/login` | 5 attempts | 15 minutes | ??????? ?? Brute Force |

---

### Response ??? ????? ????

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Too many requests",
  "message": "Please try again later",
  "retryAfter": 45.5
}
```

---

### ????? Rate Limiting ?? Controller

```csharp
[HttpPost("register-parent")]
[EnableRateLimiting("api")]
public async Task<ActionResult<UserDto>> RegisterParent(ParentRegisterDto dto)
{
    // Your code here
}

[HttpPost("login")]
[EnableRateLimiting("login")]
public async Task<ActionResult<UserDto>> Login(LoginDto dto)
{
    // Your code here
}
```

---

### ????? Rate Limiter ????

```csharp
// ?? Program.cs
builder.Services.AddRateLimiter(options =>
{
    // Custom Rate Limiter ???? ???????
    options.AddFixedWindowLimiter("file-upload", options =>
    {
     options.PermitLimit = 5;
        options.Window = TimeSpan.FromMinutes(10);
    });

    // Custom Rate Limiter ???????? ???????
    options.AddFixedWindowLimiter("sensitive", options =>
    {
      options.PermitLimit = 3;
        options.Window = TimeSpan.FromHours(1);
    });
    
    // ????: Rate Limiter ???? ?????????? ?
    options.AddFixedWindowLimiter("video-upload", options =>
    {
    options.PermitLimit = 3;
        options.Window = TimeSpan.FromHours(1);
  });
});
```

**?????????:**
```csharp
[HttpPost("upload-video")]
[EnableRateLimiting("video-upload")]
[Authorize(Roles = "Admin,Teacher")]
public async Task<ActionResult> UploadVideo(IFormFile videoFile)
{
    // Upload logic
}
```

---

## ?? Pagination

### ?????????

#### Query Parameters

| Parameter | ????? | ??????? | ????? |
|-----------|------|----------|-------|
| `page` | int | 1 | ??? ?????? |
| `pageSize` | int | 10 | ??? ??????? ?? ?????? (max: 50) |

---

#### ???? Request

```http
GET /api/subjects?page=2&pageSize=20&categoryId=1
```

---

#### Response Structure

```json
{
  "items": [
    {
      "id": 1,
      "subjectName": "Mathematics"
    }
  ],
  "page": 2,
  "pageSize": 20,
  "totalCount": 150,
  "totalPages": 8,
  "hasPrevious": true,
  "hasNext": true
}
```

---

### ????? Pagination ?? Controller

```csharp
[HttpGet]
public async Task<ActionResult<PagedResult<SubjectDto>>> GetSubjects(
    [FromQuery] PaginationParams paginationParams,
    [FromQuery] int? categoryId = null)
{
    var query = _context.Subjects.AsQueryable();

    if (categoryId.HasValue)
        query = query.Where(s => s.CategoryId == categoryId.Value);

    var totalCount = await query.CountAsync();

    var items = await query
        .OrderBy(s => s.Id)
 .Skip((paginationParams.Page - 1) * paginationParams.PageSize)
        .Take(paginationParams.PageSize)
   .Select(s => new SubjectDto { /* ... */ })
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

### Frontend Implementation

```typescript
interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

async function loadPage(page: number) {
  const response = await fetch(
    `/api/subjects?page=${page}&pageSize=20`
  );
  const data: PagedResult<Subject> = await response.json();
  
  displayItems(data.items);
  
  // Pagination controls
  document.getElementById('page-info').textContent = 
    `Page ${data.page} of ${data.totalPages}`;
  
  document.getElementById('prev-btn').disabled = !data.hasPrevious;
  document.getElementById('next-btn').disabled = !data.hasNext;
}
```

---

## ?? Caching

### ?????????

#### 1. ??????? ?? Cache

```csharp
public class MyController : ControllerBase
{
    private readonly ICacheService _cache;
    private const string CacheKey = "my_cache_key";

    [HttpGet]
    public async Task<ActionResult<List<MyDto>>> GetData()
    {
    // 1. ?????? ??????? ?? Cache
        var cached = await _cache.GetAsync<List<MyDto>>(CacheKey);
        if (cached != null)
          return Ok(cached);

  // 2. ??????? ?? Database
        var data = await _context.MyEntities
            .Select(e => new MyDto { /* ... */ })
    .ToListAsync();

        // 3. ??? ?? Cache ???? 24 ????
        await _cache.SetAsync(CacheKey, data, TimeSpan.FromHours(24));

return Ok(data);
    }
}
```

---

#### 2. ??? ?? Cache ??? ???????

```csharp
[HttpPost]
[Authorize(Roles = "Admin")]
public async Task<ActionResult<MyDto>> CreateItem(CreateMyDto dto)
{
    var item = new MyEntity { /* ... */ };
    _context.MyEntities.Add(item);
    await _context.SaveChangesAsync();

    // ??? Cache ??? ???????
    await _cache.RemoveAsync(CacheKey);

  return CreatedAtAction(nameof(GetData), new { id = item.Id }, item);
}
```

---

#### 3. ??? ??? Keys ?? Prefix

```csharp
// ??? ???? cache keys ???? ???? ?? "subjects_"
await _cache.RemoveByPrefixAsync("subjects_");
```

---

### Cache Strategies

#### Strategy 1: Cache-Aside (???????????? ???????)
```csharp
// 1. Check cache first
var data = await _cache.GetAsync<T>(key);
if (data != null) return data;

// 2. Load from database
data = await _context.Items.ToListAsync();

// 3. Store in cache
await _cache.SetAsync(key, data, TimeSpan.FromHours(1));

return data;
```

---

#### Strategy 2: Write-Through
```csharp
// ??? ???????? ?? ???????? ?? Database ?Cache ????
public async Task<Item> UpdateItem(Item item)
{
    // 1. Update database
    _context.Items.Update(item);
    await _context.SaveChangesAsync();

    // 2. Update cache
    var cacheKey = $"item_{item.Id}";
    await _cache.SetAsync(cacheKey, item, TimeSpan.FromHours(1));

    return item;
}
```

---

### Best Practices

#### 1. ??????? Cache Keys ?????
```csharp
// ? Bad
private const string Key = "data";

// ? Good
private const string CategoriesCacheKey = "categories_all";
private const string SubjectsCacheKeyPrefix = "subjects_";
private const string SubjectByIdKey = "subject_{0}";
private const string TermsCacheKeyPrefix = "terms_"; // ???? ?
private const string VideoInfoKey = "video_{0}"; // ???? ?
```

---

#### 2. ?????? TTL ?????
```csharp
// ?????? ????? ???????
await _cache.SetAsync(key, data, TimeSpan.FromDays(1));

// ?????? ?????? ???????
await _cache.SetAsync(key, data, TimeSpan.FromHours(1));

// ?????? ????? ???????
await _cache.SetAsync(key, data, TimeSpan.FromMinutes(5));

// ??????? ??????? (????) ?
await _cache.SetAsync($"video_{videoId}", videoInfo, TimeSpan.FromHours(6));
```

---

## ?? Error Handling

### Custom Exceptions ???????

#### 1. NotFoundException
```csharp
var user = await _context.Users.FindAsync(id);
if (user == null)
    throw new NotFoundException($"User with ID {id} not found");
```

**Response (404):**
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "details": "User with ID 123 not found",
  "errors": null,
  "traceId": "...",
  "timestamp": "2025-01-24T10:30:00Z"
}
```

---

#### 2. UnauthorizedException
```csharp
if (!User.Identity.IsAuthenticated)
    throw new UnauthorizedException("You must be logged in");
```

---

#### 3. ForbiddenException
```csharp
if (!await HasAccessToResource(userId, resourceId))
    throw new ForbiddenException("You don't have permission to access this resource");
```

---

#### 4. ValidationException

```csharp
var errors = new Dictionary<string, string[]>
{
    ["Email"] = new[] { "Email is required", "Email must be valid" },
    ["Password"] = new[] { "Password must be at least 8 characters" }
};
throw new ValidationException(errors);
```

---

## ?? File Upload

### Upload Strategy

```csharp
[HttpPost("upload")]
public async Task<ActionResult<FileUploadDto>> UploadFile(IFormFile file)
{
    // 1. Validation
    if (file == null || file.Length == 0)
     throw new ValidationException("File is required");

    if (file.Length > 10 * 1024 * 1024) // 10 MB
        throw new ValidationException("File size must be less than 10 MB");

    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    
    if (!allowedExtensions.Contains(extension))
        throw new ValidationException($"File type {extension} is not allowed");

    // 2. Upload to Cloudinary
    var uploadResult = await _photoService.AddPhotoAsync(file);

    // 3. Save to database
 var fileEntity = new FileEntity
    {
        FileName = file.FileName,
   FileUrl = uploadResult.Url,
      PublicId = uploadResult.PublicId,
        FileSize = file.Length,
   ContentType = file.ContentType
    };

    _context.Files.Add(fileEntity);
    await _context.SaveChangesAsync();

    return Ok(new FileUploadDto
    {
Id = fileEntity.Id,
        FileUrl = fileEntity.FileUrl,
        FileName = fileEntity.FileName
    });
}
```

---

## ?? Video Upload (Bunny.net) ?

### ???? ????

**????? ??????? ????????:**
