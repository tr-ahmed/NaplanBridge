# 🔧 Backend Change Report

**Date**: November 20, 2025  
**Feature**: Customizable Terminology (Term/Week Labels)  
**Status**: Required - Backend Implementation Needed

---

## 1. Reason for Change

The frontend has implemented a complete system for customizable terminology labels that allows administrators to rename "Term Number" and "Week Number" to custom labels (e.g., "Parts", "Sessions", "Modules", "Units"). This feature requires backend API support to:

- Store terminology configuration per organization/system
- Provide real-time terminology updates to all users
- Support preset configurations
- Enable administrators to customize and save terminology settings

Without these endpoints, the frontend admin interface will not function, and terminology will remain static.

---

## 2. Required API Endpoints

### Endpoint 1: Get Current Terminology Configuration

* **URL:** `/api/settings/terminology`
* **Method:** `GET`
* **Controller:** `SettingsController` (new or existing)
* **Action:** `GetTerminology`
* **Authentication:** Required (any authenticated user)
* **Authorization:** No specific role required
* **Description:** Retrieves the current terminology configuration for the system/organization

**Response Example:**
```json
{
  "id": 1,
  "organizationId": null,
  "termLabel": "Term",
  "termNumberLabel": "Term Number",
  "termSingular": "term",
  "termPlural": "terms",
  "weekLabel": "Week",
  "weekNumberLabel": "Week Number",
  "weekSingular": "week",
  "weekPlural": "weeks",
  "createdAt": "2025-11-20T00:00:00Z",
  "updatedAt": "2025-11-20T00:00:00Z",
  "createdBy": 1,
  "updatedBy": 1
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - No terminology configuration exists
- `500 Internal Server Error` - Server error

---

### Endpoint 2: Update Terminology Configuration

* **URL:** `/api/settings/terminology`
* **Method:** `PUT`
* **Controller:** `SettingsController`
* **Action:** `UpdateTerminology`
* **Authentication:** Required
* **Authorization:** Admin role required
* **Description:** Updates the terminology configuration. If configuration doesn't exist, creates it.

**Request Body:**
```json
{
  "termLabel": "Part",
  "termNumberLabel": "Part Number",
  "termSingular": "part",
  "termPlural": "parts",
  "weekLabel": "Session",
  "weekNumberLabel": "Session Number",
  "weekSingular": "session",
  "weekPlural": "sessions"
}
```

**Response Example:**
```json
{
  "id": 1,
  "organizationId": null,
  "termLabel": "Part",
  "termNumberLabel": "Part Number",
  "termSingular": "part",
  "termPlural": "parts",
  "weekLabel": "Session",
  "weekNumberLabel": "Session Number",
  "weekSingular": "session",
  "weekPlural": "sessions",
  "createdAt": "2025-11-20T00:00:00Z",
  "updatedAt": "2025-11-20T12:30:45Z",
  "createdBy": 1,
  "updatedBy": 2
}
```

**Validation Rules:**
- All fields are required and must be non-empty strings
- Maximum length: 50 characters per field
- No special characters (only alphanumeric, spaces, hyphens)
- Labels should be unique and meaningful

**Error Responses:**
- `400 Bad Request` - Invalid input, validation failed
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User lacks admin permissions
- `500 Internal Server Error` - Server error

---

### Endpoint 3: Create Terminology Configuration

* **URL:** `/api/settings/terminology`
* **Method:** `POST`
* **Controller:** `SettingsController`
* **Action:** `CreateTerminology`
* **Authentication:** Required
* **Authorization:** Admin role required
* **Description:** Creates a new terminology configuration. Use this during system initialization if no configuration exists.

**Request Body:**
```json
{
  "termLabel": "Term",
  "termNumberLabel": "Term Number",
  "termSingular": "term",
  "termPlural": "terms",
  "weekLabel": "Week",
  "weekNumberLabel": "Week Number",
  "weekSingular": "week",
  "weekPlural": "weeks"
}
```

**Response Example:** Same as Update endpoint

**Error Responses:**
- `400 Bad Request` - Invalid input or configuration already exists
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User lacks admin permissions
- `409 Conflict` - Configuration already exists
- `500 Internal Server Error` - Server error

---

### Endpoint 4: Reset Terminology to Defaults

* **URL:** `/api/settings/terminology/reset`
* **Method:** `POST`
* **Controller:** `SettingsController`
* **Action:** `ResetTerminology`
* **Authentication:** Required
* **Authorization:** Admin role required
* **Description:** Resets terminology configuration to default English labels (Term/Week)

**Request Body:**
```json
{}
```

**Response Example:**
```json
{
  "id": 1,
  "organizationId": null,
  "termLabel": "Term",
  "termNumberLabel": "Term Number",
  "termSingular": "term",
  "termPlural": "terms",
  "weekLabel": "Week",
  "weekNumberLabel": "Week Number",
  "weekSingular": "week",
  "weekPlural": "weeks",
  "createdAt": "2025-11-20T00:00:00Z",
  "updatedAt": "2025-11-20T13:00:00Z",
  "createdBy": 1,
  "updatedBy": 2
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User lacks admin permissions
- `500 Internal Server Error` - Server error

---

## 3. Suggested Backend Implementation

### A. Create Models/DTOs

**1. TerminologyConfiguration Model** (`Models/TerminologyConfiguration.cs`)

```csharp
public class TerminologyConfiguration
{
    public int Id { get; set; }
    public int? OrganizationId { get; set; }
    
    // Term Settings
    public string TermLabel { get; set; } = "Term";
    public string TermNumberLabel { get; set; } = "Term Number";
    public string TermSingular { get; set; } = "term";
    public string TermPlural { get; set; } = "terms";
    
    // Week Settings
    public string WeekLabel { get; set; } = "Week";
    public string WeekNumberLabel { get; set; } = "Week Number";
    public string WeekSingular { get; set; } = "week";
    public string WeekPlural { get; set; } = "weeks";
    
    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
    public int UpdatedBy { get; set; }
}
```

**2. DTOs** (`DTOs/TerminologyDto.cs`)

```csharp
public class TerminologyConfigDto
{
    public int Id { get; set; }
    public string TermLabel { get; set; }
    public string TermNumberLabel { get; set; }
    public string TermSingular { get; set; }
    public string TermPlural { get; set; }
    public string WeekLabel { get; set; }
    public string WeekNumberLabel { get; set; }
    public string WeekSingular { get; set; }
    public string WeekPlural { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int CreatedBy { get; set; }
    public int UpdatedBy { get; set; }
}

public class CreateTerminologyConfigDto
{
    [Required]
    [StringLength(50)]
    public string TermLabel { get; set; }

    [Required]
    [StringLength(50)]
    public string TermNumberLabel { get; set; }

    [Required]
    [StringLength(50)]
    public string TermSingular { get; set; }

    [Required]
    [StringLength(50)]
    public string TermPlural { get; set; }

    [Required]
    [StringLength(50)]
    public string WeekLabel { get; set; }

    [Required]
    [StringLength(50)]
    public string WeekNumberLabel { get; set; }

    [Required]
    [StringLength(50)]
    public string WeekSingular { get; set; }

    [Required]
    [StringLength(50)]
    public string WeekPlural { get; set; }
}

public class UpdateTerminologyConfigDto
{
    [StringLength(50)]
    public string TermLabel { get; set; }

    [StringLength(50)]
    public string TermNumberLabel { get; set; }

    [StringLength(50)]
    public string TermSingular { get; set; }

    [StringLength(50)]
    public string TermPlural { get; set; }

    [StringLength(50)]
    public string WeekLabel { get; set; }

    [StringLength(50)]
    public string WeekNumberLabel { get; set; }

    [StringLength(50)]
    public string WeekSingular { get; set; }

    [StringLength(50)]
    public string WeekPlural { get; set; }
}
```

### B. Create Repository

**TerminologyRepository** (`Repositories/TerminologyRepository.cs`)

```csharp
public interface ITerminologyRepository
{
    Task<TerminologyConfiguration> GetAsync();
    Task<TerminologyConfiguration> CreateAsync(TerminologyConfiguration config);
    Task<TerminologyConfiguration> UpdateAsync(TerminologyConfiguration config);
    Task ResetAsync();
}

public class TerminologyRepository : ITerminologyRepository
{
    private readonly ApplicationDbContext _context;

    public TerminologyRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TerminologyConfiguration> GetAsync()
    {
        return await _context.TerminologyConfigurations.FirstOrDefaultAsync() 
            ?? GetDefaults();
    }

    public async Task<TerminologyConfiguration> CreateAsync(TerminologyConfiguration config)
    {
        // Check if already exists
        var existing = await _context.TerminologyConfigurations.FirstOrDefaultAsync();
        if (existing != null)
            throw new InvalidOperationException("Terminology configuration already exists");

        _context.TerminologyConfigurations.Add(config);
        await _context.SaveChangesAsync();
        return config;
    }

    public async Task<TerminologyConfiguration> UpdateAsync(TerminologyConfiguration config)
    {
        var existing = await _context.TerminologyConfigurations.FirstOrDefaultAsync();
        
        if (existing == null)
        {
            _context.TerminologyConfigurations.Add(config);
        }
        else
        {
            existing.TermLabel = config.TermLabel;
            existing.TermNumberLabel = config.TermNumberLabel;
            existing.TermSingular = config.TermSingular;
            existing.TermPlural = config.TermPlural;
            existing.WeekLabel = config.WeekLabel;
            existing.WeekNumberLabel = config.WeekNumberLabel;
            existing.WeekSingular = config.WeekSingular;
            existing.WeekPlural = config.WeekPlural;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = config.UpdatedBy;
        }

        await _context.SaveChangesAsync();
        return existing ?? config;
    }

    public async Task ResetAsync()
    {
        var existing = await _context.TerminologyConfigurations.FirstOrDefaultAsync();
        if (existing != null)
        {
            var defaults = GetDefaults();
            existing.TermLabel = defaults.TermLabel;
            existing.TermNumberLabel = defaults.TermNumberLabel;
            existing.TermSingular = defaults.TermSingular;
            existing.TermPlural = defaults.TermPlural;
            existing.WeekLabel = defaults.WeekLabel;
            existing.WeekNumberLabel = defaults.WeekNumberLabel;
            existing.WeekSingular = defaults.WeekSingular;
            existing.WeekPlural = defaults.WeekPlural;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
    }

    private TerminologyConfiguration GetDefaults()
    {
        return new TerminologyConfiguration
        {
            TermLabel = "Term",
            TermNumberLabel = "Term Number",
            TermSingular = "term",
            TermPlural = "terms",
            WeekLabel = "Week",
            WeekNumberLabel = "Week Number",
            WeekSingular = "week",
            WeekPlural = "weeks"
        };
    }
}
```

### C. Create Service

**TerminologyService** (`Services/TerminologyService.cs`)

```csharp
public interface ITerminologyService
{
    Task<TerminologyConfigDto> GetAsync();
    Task<TerminologyConfigDto> CreateAsync(CreateTerminologyConfigDto dto, int userId);
    Task<TerminologyConfigDto> UpdateAsync(UpdateTerminologyConfigDto dto, int userId);
    Task<TerminologyConfigDto> ResetAsync(int userId);
}

public class TerminologyService : ITerminologyService
{
    private readonly ITerminologyRepository _repository;
    private readonly IMapper _mapper;

    public TerminologyService(ITerminologyRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<TerminologyConfigDto> GetAsync()
    {
        var config = await _repository.GetAsync();
        return _mapper.Map<TerminologyConfigDto>(config);
    }

    public async Task<TerminologyConfigDto> CreateAsync(CreateTerminologyConfigDto dto, int userId)
    {
        var config = _mapper.Map<TerminologyConfiguration>(dto);
        config.CreatedBy = userId;
        config.UpdatedBy = userId;
        config.CreatedAt = DateTime.UtcNow;
        config.UpdatedAt = DateTime.UtcNow;

        var result = await _repository.CreateAsync(config);
        return _mapper.Map<TerminologyConfigDto>(result);
    }

    public async Task<TerminologyConfigDto> UpdateAsync(UpdateTerminologyConfigDto dto, int userId)
    {
        var config = _mapper.Map<TerminologyConfiguration>(dto);
        config.UpdatedBy = userId;
        config.UpdatedAt = DateTime.UtcNow;

        var result = await _repository.UpdateAsync(config);
        return _mapper.Map<TerminologyConfigDto>(result);
    }

    public async Task<TerminologyConfigDto> ResetAsync(int userId)
    {
        await _repository.ResetAsync();
        return await GetAsync();
    }
}
```

### D. Create Controller

**SettingsController** (`Controllers/SettingsController.cs`)

```csharp
[ApiController]
[Route("api/settings")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly ITerminologyService _terminologyService;
    private readonly ICurrentUserService _currentUserService;

    public SettingsController(ITerminologyService terminologyService, ICurrentUserService currentUserService)
    {
        _terminologyService = terminologyService;
        _currentUserService = currentUserService;
    }

    [HttpGet("terminology")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTerminology()
    {
        try
        {
            var config = await _terminologyService.GetAsync();
            return Ok(new { success = true, data = config });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Error retrieving terminology" });
        }
    }

    [HttpPut("terminology")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> UpdateTerminology([FromBody] UpdateTerminologyConfigDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, errors = ModelState.Values.SelectMany(v => v.Errors) });

        try
        {
            var userId = _currentUserService.GetUserId();
            var config = await _terminologyService.UpdateAsync(dto, userId);
            return Ok(new { success = true, data = config });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Error updating terminology" });
        }
    }

    [HttpPost("terminology")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> CreateTerminology([FromBody] CreateTerminologyConfigDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, errors = ModelState.Values.SelectMany(v => v.Errors) });

        try
        {
            var userId = _currentUserService.GetUserId();
            var config = await _terminologyService.CreateAsync(dto, userId);
            return CreatedAtAction(nameof(GetTerminology), new { data = config });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Error creating terminology" });
        }
    }

    [HttpPost("terminology/reset")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> ResetTerminology()
    {
        try
        {
            var userId = _currentUserService.GetUserId();
            var config = await _terminologyService.ResetAsync(userId);
            return Ok(new { success = true, data = config });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Error resetting terminology" });
        }
    }
}
```

### E. Register Services in Startup

**Program.cs** or **Startup.cs**

```csharp
// In ConfigureServices
services.AddScoped<ITerminologyRepository, TerminologyRepository>();
services.AddScoped<ITerminologyService, TerminologyService>();

// Add AutoMapper profile
services.AddAutoMapper(typeof(TerminologyMappingProfile));
```

**AutoMapper Profile** (`Mappings/TerminologyMappingProfile.cs`)

```csharp
public class TerminologyMappingProfile : Profile
{
    public TerminologyMappingProfile()
    {
        CreateMap<TerminologyConfiguration, TerminologyConfigDto>();
        CreateMap<CreateTerminologyConfigDto, TerminologyConfiguration>();
        CreateMap<UpdateTerminologyConfigDto, TerminologyConfiguration>();
    }
}
```

---

## 4. Database Impact

### Database Migration Required

**File**: `Migrations/[TIMESTAMP]_CreateTerminologyConfigurationTable.cs`

```csharp
public partial class CreateTerminologyConfigurationTable : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "TerminologyConfigurations",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                OrganizationId = table.Column<int>(type: "int", nullable: true),
                TermLabel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                TermNumberLabel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                TermSingular = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                TermPlural = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                WeekLabel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                WeekNumberLabel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                WeekSingular = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                WeekPlural = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                CreatedBy = table.Column<int>(type: "int", nullable: false),
                UpdatedBy = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TerminologyConfigurations", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_TerminologyConfigurations_OrganizationId",
            table: "TerminologyConfigurations",
            column: "OrganizationId");

        // Seed default values if needed
        migrationBuilder.InsertData(
            table: "TerminologyConfigurations",
            columns: new[] { "TermLabel", "TermNumberLabel", "TermSingular", "TermPlural", 
                             "WeekLabel", "WeekNumberLabel", "WeekSingular", "WeekPlural", 
                             "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy" },
            values: new object[] { "Term", "Term Number", "term", "terms", 
                                   "Week", "Week Number", "week", "weeks", 
                                   DateTime.UtcNow, DateTime.UtcNow, 1, 1 });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "TerminologyConfigurations");
    }
}
```

### DbContext Update

**ApplicationDbContext.cs**

```csharp
public DbSet<TerminologyConfiguration> TerminologyConfigurations { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<TerminologyConfiguration>()
        .HasKey(t => t.Id);

    modelBuilder.Entity<TerminologyConfiguration>()
        .Property(t => t.TermLabel)
        .HasMaxLength(50)
        .IsRequired();

    // Configure other properties similarly...

    // Seed default configuration
    modelBuilder.Entity<TerminologyConfiguration>().HasData(
        new TerminologyConfiguration
        {
            Id = 1,
            TermLabel = "Term",
            TermNumberLabel = "Term Number",
            TermSingular = "term",
            TermPlural = "terms",
            WeekLabel = "Week",
            WeekNumberLabel = "Week Number",
            WeekSingular = "week",
            WeekPlural = "weeks",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = 1,
            UpdatedBy = 1
        });
}
```

---

## 5. Files to Modify or Create

| File/Folder | Type | Action | Notes |
|-------------|------|--------|-------|
| `Models/TerminologyConfiguration.cs` | New | Create | Main model |
| `DTOs/TerminologyDto.cs` | New | Create | Request/response DTOs |
| `Repositories/ITerminologyRepository.cs` | New | Create | Repository interface |
| `Repositories/TerminologyRepository.cs` | New | Create | Repository implementation |
| `Services/ITerminologyService.cs` | New | Create | Service interface |
| `Services/TerminologyService.cs` | New | Create | Service implementation |
| `Controllers/SettingsController.cs` | New | Create | API endpoints |
| `Mappings/TerminologyMappingProfile.cs` | New | Create | AutoMapper configuration |
| `Data/ApplicationDbContext.cs` | Existing | Modify | Add DbSet |
| `Migrations/[TIMESTAMP]_CreateTerminologyConfigurationTable.cs` | New | Create | Database migration |
| `Program.cs` or `Startup.cs` | Existing | Modify | Register services |

---

## 6. Authorization & Security Requirements

### Authorization Rules

- **GET /api/settings/terminology**
  - ✅ Allowed: Any authenticated user
  - ✅ Allowed: Anonymous access (preferred for frontend caching)

- **PUT /api/settings/terminology**
  - ✅ Required: Admin role
  - ✅ Required: SuperAdmin role
  - ❌ Denied: Regular users

- **POST /api/settings/terminology**
  - ✅ Required: Admin role
  - ✅ Required: SuperAdmin role
  - ❌ Denied: Regular users

- **POST /api/settings/terminology/reset**
  - ✅ Required: Admin role
  - ✅ Required: SuperAdmin role
  - ❌ Denied: Regular users

### Input Validation

- All string fields must be non-empty
- Maximum 50 characters per field
- Only alphanumeric characters, spaces, and hyphens allowed
- No SQL injection vulnerabilities
- All inputs should be sanitized

### Security Considerations

- ✅ Implement role-based access control (RBAC)
- ✅ Audit log all changes (CreatedBy/UpdatedBy)
- ✅ Use timestamps (CreatedAt/UpdatedAt)
- ✅ Implement rate limiting on settings endpoints
- ✅ Log all admin actions
- ✅ Consider caching GET response with appropriate TTL
- ✅ Validate all input data server-side

---

## 7. Testing Requirements

### Unit Tests

- [ ] Test GET endpoint returns default configuration
- [ ] Test GET endpoint returns saved configuration
- [ ] Test POST endpoint creates configuration
- [ ] Test POST endpoint fails if configuration exists
- [ ] Test PUT endpoint updates configuration
- [ ] Test PUT endpoint creates if doesn't exist
- [ ] Test POST reset endpoint resets to defaults
- [ ] Test unauthorized users cannot modify settings
- [ ] Test input validation (required fields)
- [ ] Test input validation (max length)
- [ ] Test input validation (invalid characters)

### Integration Tests

- [ ] Test full request/response cycle for all endpoints
- [ ] Test database persistence
- [ ] Test concurrent updates
- [ ] Test authentication/authorization
- [ ] Test error responses
- [ ] Test migration runs successfully

### Performance Tests

- [ ] GET endpoint response time < 100ms
- [ ] PUT endpoint response time < 200ms
- [ ] No N+1 queries
- [ ] Proper indexing on queries

---

## 8. Swagger/OpenAPI Documentation

Add to Swagger configuration:

```csharp
/// <summary>
/// Get the current terminology configuration
/// </summary>
/// <returns>Current terminology configuration</returns>
/// <response code="200">Returns the current terminology configuration</response>
/// <response code="404">Configuration not found</response>
/// <response code="500">Server error</response>
[HttpGet("terminology")]
public async Task<IActionResult> GetTerminology() { ... }

/// <summary>
/// Update the terminology configuration
/// </summary>
/// <param name="dto">Updated terminology configuration</param>
/// <returns>Updated terminology configuration</returns>
/// <response code="200">Configuration updated successfully</response>
/// <response code="400">Invalid input</response>
/// <response code="401">Unauthorized</response>
/// <response code="403">Forbidden - Admin role required</response>
/// <response code="500">Server error</response>
[HttpPut("terminology")]
public async Task<IActionResult> UpdateTerminology([FromBody] UpdateTerminologyConfigDto dto) { ... }
```

---

## 9. Deployment Notes

### Pre-Deployment Checklist

- [ ] Code review completed
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Database migration tested on staging
- [ ] Swagger documentation updated
- [ ] Role-based access control configured
- [ ] Rate limiting configured (if applicable)
- [ ] Logging/auditing configured
- [ ] Performance testing passed

### Migration Strategy

1. Run database migration in development/staging
2. Verify migration success
3. Deploy backend code
4. Verify all endpoints responding correctly
5. Deploy frontend code (already complete)
6. Test end-to-end functionality

### Rollback Strategy

- Keep previous database migration available
- Tag backend deployment for quick rollback
- Test rollback procedure before production

---

## 10. Frontend Dependency Status

**Frontend Implementation**: ✅ **COMPLETE** (November 20, 2025)

Frontend files created/modified:
- ✅ `src/app/models/terminology.models.ts` - Data models
- ✅ `src/app/core/services/terminology.service.ts` - Service that calls these endpoints
- ✅ `src/app/admin/terminology-settings/` - Admin UI component
- ✅ Dashboard, Content Management, Content Modal components updated

**Blocking Issue**: Frontend is ready but non-functional until these backend endpoints are implemented.

---

## 11. Timeline Estimate

| Task | Estimated Time |
|------|-----------------|
| Model/DTO creation | 2 hours |
| Repository implementation | 3 hours |
| Service implementation | 2 hours |
| Controller implementation | 2 hours |
| Database migration | 1 hour |
| Unit tests | 4 hours |
| Integration tests | 3 hours |
| Code review | 1 hour |
| **Total** | **18 hours** (~2.5 days) |

---

## 12. Clarifications Needed from Backend Team

Before implementation begins:

- ✅ Should terminology be per-organization or global? (Suggested: Global for now, extendable)
- ✅ Which roles should have admin access to terminology settings? (Suggested: Admin, SuperAdmin)
- ✅ Should GET endpoint be public or require authentication? (Suggested: Public/AllowAnonymous)
- ✅ Should changes be logged in audit table? (Suggested: Yes)
- ✅ Any rate limiting needed on PUT/POST? (Suggested: Yes, reasonable limits)

---

## 13. Contact & Questions

**Frontend Team**: Ready and waiting for backend endpoints  
**Implementation Date**: November 20, 2025  
**Status**: Awaiting backend implementation  

For questions about frontend expectations or integration details, refer to:
- `CUSTOMIZABLE_TERMINOLOGY_GUIDE.md`
- `TERMINOLOGY_ARCHITECTURE.md`
- `TERMINOLOGY_QUICK_START.md`

---

**Report Generated**: November 20, 2025  
**Backend Implementation Required**: YES ✅  
**Frontend Implementation Status**: COMPLETE ✅  
**Next Step**: Backend API Implementation

