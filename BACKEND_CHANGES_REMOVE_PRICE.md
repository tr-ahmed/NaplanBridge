# 🔧 Backend Changes Required - Remove PricePerSession

**Date:** 2025-12-25  
**Status:** ⚠️ **BACKEND ACTION REQUIRED**  
**Priority:** 🔴 **HIGH**

---

## 📋 Change Summary

The `pricePerSession` field needs to be removed from the Teacher Session Settings system because:

1. **Pricing is managed by Admin** - Not by individual teachers
2. **Tutoring system is hour-based** - Admin sets the pricing centrally
3. **Frontend already updated** - Backend needs to match

---

## ✅ Frontend Changes (Already Done)

### Files Modified:
1. ✅ `teacher-tutoring-sessions.component.ts`
   - Removed from form initialization
   - Removed from default values
   - Removed from form patching

2. ✅ `teacher-tutoring-sessions.component.html`
   - Removed from welcome message tips
   - Removed from settings display card
   - Removed from settings form input
   - Updated grid layout (5 cols → 4 cols)

3. ✅ `session.models.ts`
   - Removed from `TeacherSessionSettings`
   - Removed from `UpdateSessionSettingsDto`
   - Removed from `TeacherSessionSettingsDto`

---

## 🔴 Backend Changes Required

### 1. **Update Entity Model**

**File:** `API/Entities/TeacherSessionSettings.cs`

**Remove:**
```csharp
public decimal PricePerSession { get; set; }
```

**Before:**
```csharp
public class TeacherSessionSettings
{
    public int Id { get; set; }
    public int TeacherId { get; set; }
    public int SessionDurationMinutes { get; set; }
    public int BufferTimeMinutes { get; set; }
    public decimal PricePerSession { get; set; }  // ❌ REMOVE THIS
    public bool IsAcceptingBookings { get; set; }
    public int? MaxSessionsPerDay { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

**After:**
```csharp
public class TeacherSessionSettings
{
    public int Id { get; set; }
    public int TeacherId { get; set; }
    public int SessionDurationMinutes { get; set; }
    public int BufferTimeMinutes { get; set; }
    // PricePerSession removed - managed by admin
    public bool IsAcceptingBookings { get; set; }
    public int? MaxSessionsPerDay { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

---

### 2. **Update DTOs**

**File:** `API/DTOs/SessionDtos.cs` (or similar)

**Remove from:**

#### `TeacherSessionSettingsDto`
```csharp
public class TeacherSessionSettingsDto
{
    public int Id { get; set; }
    public int SessionDurationMinutes { get; set; }
    public int BufferTimeMinutes { get; set; }
    public decimal PricePerSession { get; set; }  // ❌ REMOVE THIS
    public bool IsAcceptingBookings { get; set; }
    public int? MaxSessionsPerDay { get; set; }
    public string? Description { get; set; }
}
```

#### `UpdateSessionSettingsDto`
```csharp
public class UpdateSessionSettingsDto
{
    [Required]
    [Range(15, 180)]
    public int SessionDurationMinutes { get; set; }
    
    [Required]
    [Range(0, 60)]
    public int BufferTimeMinutes { get; set; }
    
    [Required]
    [Range(1, double.MaxValue)]
    public decimal PricePerSession { get; set; }  // ❌ REMOVE THIS
    
    [Required]
    public bool IsAcceptingBookings { get; set; }
    
    [Range(1, 20)]
    public int? MaxSessionsPerDay { get; set; }
    
    public string? Description { get; set; }
}
```

**After:**
```csharp
public class UpdateSessionSettingsDto
{
    [Required]
    [Range(15, 180)]
    public int SessionDurationMinutes { get; set; }
    
    [Required]
    [Range(0, 60)]
    public int BufferTimeMinutes { get; set; }
    
    // PricePerSession removed - managed by admin
    
    [Required]
    public bool IsAcceptingBookings { get; set; }
    
    [Range(1, 20)]
    public int? MaxSessionsPerDay { get; set; }
    
    public string? Description { get; set; }
}
```

---

### 3. **Update Service Layer**

**File:** `API/Services/Implementations/SessionBookingService.cs`

**Update mapping in `UpdateTeacherSettingsAsync`:**

**Before:**
```csharp
public async Task<TeacherSessionSettingsDto> UpdateTeacherSettingsAsync(int teacherId, UpdateSessionSettingsDto dto)
{
    var settings = await _context.TeacherSessionSettings
        .FirstOrDefaultAsync(s => s.TeacherId == teacherId);

    if (settings == null)
    {
        settings = new TeacherSessionSettings
        {
            TeacherId = teacherId,
            SessionDurationMinutes = dto.SessionDurationMinutes,
            BufferTimeMinutes = dto.BufferTimeMinutes,
            PricePerSession = dto.PricePerSession,  // ❌ REMOVE THIS
            IsAcceptingBookings = dto.IsAcceptingBookings,
            MaxSessionsPerDay = dto.MaxSessionsPerDay,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };
        _context.TeacherSessionSettings.Add(settings);
    }
    else
    {
        settings.SessionDurationMinutes = dto.SessionDurationMinutes;
        settings.BufferTimeMinutes = dto.BufferTimeMinutes;
        settings.PricePerSession = dto.PricePerSession;  // ❌ REMOVE THIS
        settings.IsAcceptingBookings = dto.IsAcceptingBookings;
        settings.MaxSessionsPerDay = dto.MaxSessionsPerDay;
        settings.Description = dto.Description;
        settings.UpdatedAt = DateTime.UtcNow;
    }

    await _context.SaveChangesAsync();
    return MapToDto(settings);
}
```

**After:**
```csharp
public async Task<TeacherSessionSettingsDto> UpdateTeacherSettingsAsync(int teacherId, UpdateSessionSettingsDto dto)
{
    var settings = await _context.TeacherSessionSettings
        .FirstOrDefaultAsync(s => s.TeacherId == teacherId);

    if (settings == null)
    {
        settings = new TeacherSessionSettings
        {
            TeacherId = teacherId,
            SessionDurationMinutes = dto.SessionDurationMinutes,
            BufferTimeMinutes = dto.BufferTimeMinutes,
            // PricePerSession removed - managed by admin
            IsAcceptingBookings = dto.IsAcceptingBookings,
            MaxSessionsPerDay = dto.MaxSessionsPerDay,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };
        _context.TeacherSessionSettings.Add(settings);
    }
    else
    {
        settings.SessionDurationMinutes = dto.SessionDurationMinutes;
        settings.BufferTimeMinutes = dto.BufferTimeMinutes;
        // PricePerSession removed - managed by admin
        settings.IsAcceptingBookings = dto.IsAcceptingBookings;
        settings.MaxSessionsPerDay = dto.MaxSessionsPerDay;
        settings.Description = dto.Description;
        settings.UpdatedAt = DateTime.UtcNow;
    }

    await _context.SaveChangesAsync();
    return MapToDto(settings);
}
```

**Update mapping in `MapToDto`:**

**Before:**
```csharp
private TeacherSessionSettingsDto MapToDto(TeacherSessionSettings settings)
{
    return new TeacherSessionSettingsDto
    {
        Id = settings.Id,
        SessionDurationMinutes = settings.SessionDurationMinutes,
        BufferTimeMinutes = settings.BufferTimeMinutes,
        PricePerSession = settings.PricePerSession,  // ❌ REMOVE THIS
        IsAcceptingBookings = settings.IsAcceptingBookings,
        MaxSessionsPerDay = settings.MaxSessionsPerDay,
        Description = settings.Description
    };
}
```

**After:**
```csharp
private TeacherSessionSettingsDto MapToDto(TeacherSessionSettings settings)
{
    return new TeacherSessionSettingsDto
    {
        Id = settings.Id,
        SessionDurationMinutes = settings.SessionDurationMinutes,
        BufferTimeMinutes = settings.BufferTimeMinutes,
        // PricePerSession removed - managed by admin
        IsAcceptingBookings = settings.IsAcceptingBookings,
        MaxSessionsPerDay = settings.MaxSessionsPerDay,
        Description = settings.Description
    };
}
```

---

### 4. **Create Database Migration**

**Command:**
```bash
dotnet ef migrations add RemovePricePerSessionFromTeacherSettings --project API
```

**Expected Migration:**
```csharp
public partial class RemovePricePerSessionFromTeacherSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "PricePerSession",
            table: "TeacherSessionSettings");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(
            name: "PricePerSession",
            table: "TeacherSessionSettings",
            type: "decimal(18,2)",
            nullable: false,
            defaultValue: 0m);
    }
}
```

**Apply Migration:**
```bash
dotnet ef database update --project API
```

---

## ⚠️ Important Notes

### **Data Loss Warning**
- ⚠️ This migration will **permanently delete** the `PricePerSession` column
- ⚠️ Any existing price data will be **lost**
- ✅ This is **intentional** - pricing is now managed by admin

### **Admin Pricing System**
- Ensure admin panel has pricing management
- Pricing should be set per:
  - Subject
  - Teacher level/experience
  - Session type (individual/group)
  - Package/subscription

### **Backward Compatibility**
- Old API requests with `pricePerSession` will be **ignored**
- Frontend already updated to not send this field
- No breaking changes for existing clients

---

## 🧪 Testing Checklist

### Backend Testing:
- [ ] Create new teacher settings without price
- [ ] Update existing teacher settings
- [ ] Verify price field not in response
- [ ] Verify price field not required in request
- [ ] Check database column removed
- [ ] Test with existing data (if any)

### Integration Testing:
- [ ] Frontend can create settings
- [ ] Frontend can update settings
- [ ] No errors in browser console
- [ ] Settings display correctly
- [ ] Form validation works

### API Response Example:

**Before:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sessionDurationMinutes": 60,
    "bufferTimeMinutes": 15,
    "pricePerSession": 50.00,
    "isAcceptingBookings": true,
    "maxSessionsPerDay": 8,
    "description": "Experienced teacher"
  }
}
```

**After:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sessionDurationMinutes": 60,
    "bufferTimeMinutes": 15,
    "isAcceptingBookings": true,
    "maxSessionsPerDay": 8,
    "description": "Experienced teacher"
  }
}
```

---

## 📝 Implementation Steps

1. **Update Entity Model** - Remove property
2. **Update DTOs** - Remove from all DTOs
3. **Update Service Layer** - Remove from mapping
4. **Create Migration** - Generate and review
5. **Apply Migration** - Update database
6. **Test Endpoints** - Verify all CRUD operations
7. **Deploy** - Push to production

---

## ✅ Verification

After implementation, verify:

```bash
# Test GET settings
curl -X GET "https://naplan2.runasp.net/api/Sessions/teacher/settings" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: No pricePerSession in response

# Test PUT settings
curl -X PUT "https://naplan2.runasp.net/api/Sessions/teacher/settings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionDurationMinutes": 60,
    "bufferTimeMinutes": 15,
    "isAcceptingBookings": true,
    "maxSessionsPerDay": 8,
    "description": "Test"
  }'

# Expected: Success without pricePerSession
```

---

## 📊 Impact Analysis

| Component | Impact | Action Required |
|-----------|--------|-----------------|
| Frontend | ✅ Complete | Already updated |
| Backend Entity | 🔴 High | Remove property |
| Backend DTOs | 🔴 High | Remove property |
| Backend Service | 🔴 High | Update mapping |
| Database | 🔴 High | Create migration |
| API Endpoints | ✅ None | No changes needed |
| Admin Panel | ⚠️ Medium | Implement pricing management |

---

## 🚀 Deployment Plan

### Development:
1. Make code changes
2. Create migration
3. Test locally
4. Commit changes

### Staging:
1. Deploy code
2. Run migration
3. Test thoroughly
4. Verify frontend integration

### Production:
1. Backup database
2. Deploy code
3. Run migration
4. Monitor for errors
5. Verify functionality

---

**Status:** ⏳ **Awaiting Backend Implementation**  
**Frontend:** ✅ **Ready**  
**Backend:** ⚠️ **Action Required**

---

**Last Updated:** 2025-12-25T23:50:00+02:00  
**Created By:** Frontend Team  
**Assigned To:** Backend Team
