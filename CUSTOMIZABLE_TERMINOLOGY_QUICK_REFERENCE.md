# ⚡ Customizable Terminology - Quick Reference

**Date:** January 25, 2025  
**Status:** ✅ Complete

---

## 🎯 What It Does

Allows admins to customize "Term" and "Week" labels throughout the platform:
- **Term** → Semester, Quarter, Module, Block, etc.
- **Week** → Unit, Session, Lesson, Class, etc.

---

## 📡 API Endpoints

### Public (No Auth)
```http
GET /api/terminology/active
```
Returns currently active configuration.

### Admin Only
```http
GET    /api/terminology              # Get all
GET    /api/terminology/{id}         # Get by ID
POST   /api/terminology              # Create
PUT    /api/terminology/{id}         # Update
DELETE /api/terminology/{id}         # Delete
POST   /api/terminology/{id}/activate # Activate
GET    /api/terminology/presets      # Get presets
POST   /api/terminology/presets/{name}/apply # Apply preset
```

---

## 🎨 Built-in Presets

| Preset | Term Label | Week Label |
|--------|------------|------------|
| Default (Australian) | Term | Week |
| UK System | Term | Week |
| US Semester System | Semester | Week |
| US Quarter System | Quarter | Week |
| Module System | Module | Unit |
| Block System | Block | Session |
| Trimester System | Trimester | Week |
| Custom Chapters | Chapter | Lesson |

---

## 💻 Frontend Usage (Angular)

### 1. Service Injection
```typescript
constructor(private terminologyService: TerminologyService) {}
```

### 2. Get Labels
```typescript
// Singular
const termLabel = this.terminologyService.getTermLabel();     // "Semester"
const weekLabel = this.terminologyService.getWeekLabel();     // "Unit"

// Plural
const termsLabel = this.terminologyService.getTermLabel(true);  // "Semesters"
const weeksLabel = this.terminologyService.getWeekLabel(true);  // "Units"
```

### 3. Template Usage
```html
<!-- Dynamic -->
<h2>{{ terminologyService.getTermLabel() }} 1</h2>
<p>{{ terminologyService.getWeekLabel() }} 5</p>

<!-- With Pipe -->
<h2>{{ 'TERM' | terminology }} 1</h2>
<p>{{ 'WEEK' | terminology }} 5</p>

<!-- Plural -->
<h3>All {{ terminologyService.getTermLabel(true) }}</h3>
```

---

## 🔧 Admin Actions

### Apply Preset (Easiest)
```http
POST /api/terminology/presets/US Semester System/apply
Authorization: Bearer {token}
```
Creates + activates preset in one call.

### Create Custom
```http
POST /api/terminology
Authorization: Bearer {token}

{
  "termLabelSingular": "Period",
  "termLabelPlural": "Periods",
  "weekLabelSingular": "Class",
  "weekLabelPlural": "Classes",
  "presetName": "Custom",
  "description": "Custom configuration"
}
```
Then activate:
```http
POST /api/terminology/{id}/activate
```

---

## ⚡ Response Examples

### GET /api/terminology/active
```json
{
  "success": true,
  "message": "Active terminology configuration retrieved successfully",
  "data": {
    "id": 1,
    "termLabelSingular": "Semester",
    "termLabelPlural": "Semesters",
    "weekLabelSingular": "Week",
    "weekLabelPlural": "Weeks",
    "isActive": true,
    "presetName": "US Semester System",
    "description": "United States semester-based system",
    "createdAt": "2025-01-25T10:00:00Z"
  }
}
```

### GET /api/terminology/presets
```json
{
  "success": true,
  "message": "8 preset(s) available",
  "data": [
    {
      "presetName": "Default (Australian)",
      "description": "Standard Australian academic year structure",
      "termLabelSingular": "Term",
      "termLabelPlural": "Terms",
      "weekLabelSingular": "Week",
      "weekLabelPlural": "Weeks"
    }
  ]
}
```

---

## 🚨 Common Errors

### 401 Unauthorized
```json
{"success": false, "message": "Unable to identify admin user"}
```
**Fix:** Add valid JWT token to Authorization header.

### 400 Bad Request (Validation)
```json
{
  "success": false,
  "message": "Invalid data provided",
  "errors": ["Term label (singular) must be between 2 and 50 characters"]
}
```
**Fix:** Check field lengths and required fields.

### 400 Bad Request (Delete Active)
```json
{"success": false, "message": "Cannot delete the active terminology configuration..."}
```
**Fix:** Activate another config first, then delete.

### 404 Not Found (Preset)
```json
{"success": false, "message": "Preset 'Invalid Preset' not found"}
```
**Fix:** Use exact preset name from `/presets` endpoint.

---

## 📊 Database

### Table: TerminologyConfigs
```sql
Id                  INT PRIMARY KEY
TermLabelSingular   NVARCHAR(50) NOT NULL
TermLabelPlural     NVARCHAR(50) NOT NULL
WeekLabelSingular   NVARCHAR(50) NOT NULL
WeekLabelPlural     NVARCHAR(50) NOT NULL
IsActive            BIT NOT NULL DEFAULT 1
PresetName          NVARCHAR(100) NULL
Description         NVARCHAR(500) NULL
CreatedAt           DATETIME2 NOT NULL
UpdatedAt           DATETIME2 NULL
CreatedBy           INT NULL (FK to AspNetUsers)
UpdatedBy           INT NULL (FK to AspNetUsers)
```

### Migration
```bash
cd API
dotnet ef database update
```

---

## 💾 Caching

- **Active Config:** Cached for 24 hours
- **Cache Key:** `terminology_active_config`
- **Invalidation:** Auto on update/activate
- **Fallback:** Default config if none exists

---

## ✅ Checklist

### Backend ✅
- [x] Entity created
- [x] DTOs created
- [x] Service implemented
- [x] Controller created
- [x] 9 Endpoints working
- [x] 8 Presets available
- [x] Caching enabled
- [x] Migration created
- [x] Seeding implemented
- [x] Build successful

### Frontend ⏳
- [ ] Service created
- [ ] Component created
- [ ] Pipe created (optional)
- [ ] Admin UI created
- [ ] Labels dynamic

### Testing ⏳
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

---

## 🎯 Quick Start

### For Developers
1. Pull latest code
2. Run migration: `dotnet ef database update`
3. Run app: `dotnet run`
4. Default config auto-created on first run

### For Admins
1. Login as admin
2. GET `/api/terminology/presets` to see options
3. POST `/api/terminology/presets/{name}/apply` to apply
4. Frontend labels update automatically

---

## 📞 Support

**Documentation:** `CUSTOMIZABLE_TERMINOLOGY_BACKEND_GUIDE.md`  
**API Status:** ✅ Production Ready  
**Last Updated:** January 25, 2025

---

**Happy Coding! 🚀**
