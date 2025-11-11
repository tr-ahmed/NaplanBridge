# 🔧 Backend Change Report

## Date: November 5, 2025
## Feature: Teacher Content Management System with Permissions & Approval

---

## 1. Reason for Change

المعلمون يحتاجون إلى نظام إدارة محتوى خاص بهم مشابه لنظام الإدمن، لكن مع القيود التالية:
- المعلم يستطيع إدارة المواد (Subjects) التي أعطاه الإدمن صلاحية عليها فقط
- المعلم يستطيع إنشاء محتوى جديد (Lessons, Weeks, Terms, Resources)
- كل محتوى جديد ينشئه المعلم يحتاج موافقة الإدمن قبل أن يظهر للطلاب
- المعلم يستطيع رؤية وتعديل المحتوى المعتمد والمحتوى في انتظار الموافقة

---

## 2. Required Database Changes

### 2.1 New Table: `TeacherSubjectPermissions`
```sql
CREATE TABLE TeacherSubjectPermissions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    TeacherId INT NOT NULL,
    SubjectId INT NOT NULL,
    CanCreate BIT NOT NULL DEFAULT 1,
    CanEdit BIT NOT NULL DEFAULT 1,
    CanDelete BIT NOT NULL DEFAULT 0,
    GrantedBy INT NOT NULL, -- Admin who granted permission
    GrantedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    IsActive BIT NOT NULL DEFAULT 1,
    
    CONSTRAINT FK_TeacherPermissions_Teacher FOREIGN KEY (TeacherId) REFERENCES AspNetUsers(Id),
    CONSTRAINT FK_TeacherPermissions_Subject FOREIGN KEY (SubjectId) REFERENCES Subjects(Id),
    CONSTRAINT FK_TeacherPermissions_Admin FOREIGN KEY (GrantedBy) REFERENCES AspNetUsers(Id),
    CONSTRAINT UQ_TeacherSubject UNIQUE (TeacherId, SubjectId)
)
```

### 2.2 Add Columns to Existing Tables

#### Lessons Table
```sql
ALTER TABLE Lessons ADD CreatedBy INT NULL;
ALTER TABLE Lessons ADD ApprovalStatus NVARCHAR(20) NOT NULL DEFAULT 'Approved';
ALTER TABLE Lessons ADD ApprovedBy INT NULL;
ALTER TABLE Lessons ADD ApprovedAt DATETIME2 NULL;
ALTER TABLE Lessons ADD RejectionReason NVARCHAR(500) NULL;

ALTER TABLE Lessons ADD CONSTRAINT FK_Lessons_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES AspNetUsers(Id);
ALTER TABLE Lessons ADD CONSTRAINT FK_Lessons_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES AspNetUsers(Id);
ALTER TABLE Lessons ADD CONSTRAINT CHK_Lessons_ApprovalStatus CHECK (ApprovalStatus IN ('Pending', 'Approved', 'Rejected'));
```

#### Weeks Table
```sql
ALTER TABLE Weeks ADD CreatedBy INT NULL;
ALTER TABLE Weeks ADD ApprovalStatus NVARCHAR(20) NOT NULL DEFAULT 'Approved';
ALTER TABLE Weeks ADD ApprovedBy INT NULL;
ALTER TABLE Weeks ADD ApprovedAt DATETIME2 NULL;
ALTER TABLE Weeks ADD RejectionReason NVARCHAR(500) NULL;

ALTER TABLE Weeks ADD CONSTRAINT FK_Weeks_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES AspNetUsers(Id);
ALTER TABLE Weeks ADD CONSTRAINT FK_Weeks_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES AspNetUsers(Id);
ALTER TABLE Weeks ADD CONSTRAINT CHK_Weeks_ApprovalStatus CHECK (ApprovalStatus IN ('Pending', 'Approved', 'Rejected'));
```

#### Terms Table
```sql
ALTER TABLE Terms ADD CreatedBy INT NULL;
ALTER TABLE Terms ADD ApprovalStatus NVARCHAR(20) NOT NULL DEFAULT 'Approved';
ALTER TABLE Terms ADD ApprovedBy INT NULL;
ALTER TABLE Terms ADD ApprovedAt DATETIME2 NULL;
ALTER TABLE Terms ADD RejectionReason NVARCHAR(500) NULL;

ALTER TABLE Terms ADD CONSTRAINT FK_Terms_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES AspNetUsers(Id);
ALTER TABLE Terms ADD CONSTRAINT FK_Terms_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES AspNetUsers(Id);
ALTER TABLE Terms ADD CONSTRAINT CHK_Terms_ApprovalStatus CHECK (ApprovalStatus IN ('Pending', 'Approved', 'Rejected'));
```

#### Resources Table
```sql
ALTER TABLE Resources ADD CreatedBy INT NULL;
ALTER TABLE Resources ADD ApprovalStatus NVARCHAR(20) NOT NULL DEFAULT 'Approved';
ALTER TABLE Resources ADD ApprovedBy INT NULL;
ALTER TABLE Resources ADD ApprovedAt DATETIME2 NULL;
ALTER TABLE Resources ADD RejectionReason NVARCHAR(500) NULL;

ALTER TABLE Resources ADD CONSTRAINT FK_Resources_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES AspNetUsers(Id);
ALTER TABLE Resources ADD CONSTRAINT FK_Resources_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES AspNetUsers(Id);
ALTER TABLE Resources ADD CONSTRAINT CHK_Resources_ApprovalStatus CHECK (ApprovalStatus IN ('Pending', 'Approved', 'Rejected'));
```

---

## 3. New API Endpoints Required

### 3.1 Teacher Permissions Management (Admin Only)

#### Grant Permission to Teacher
- **URL:** `/api/TeacherPermissions/grant`
- **Method:** `POST`
- **Authorization:** Admin only
- **Request Body:**
```json
{
  "teacherId": 123,
  "subjectId": 45,
  "canCreate": true,
  "canEdit": true,
  "canDelete": false
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Permission granted successfully",
  "permission": {
    "id": 1,
    "teacherId": 123,
    "teacherName": "John Doe",
    "subjectId": 45,
    "subjectName": "Mathematics",
    "canCreate": true,
    "canEdit": true,
    "canDelete": false,
    "grantedAt": "2025-11-05T10:00:00Z"
  }
}
```

#### Get Teacher's Permissions
- **URL:** `/api/TeacherPermissions/teacher/{teacherId}`
- **Method:** `GET`
- **Authorization:** Teacher (own) or Admin
- **Response:**
```json
{
  "teacherId": 123,
  "teacherName": "John Doe",
  "permissions": [
    {
      "id": 1,
      "subjectId": 45,
      "subjectName": "Mathematics",
      "yearId": 2,
      "yearName": "Year 8",
      "canCreate": true,
      "canEdit": true,
      "canDelete": false,
      "isActive": true
    }
  ]
}
```

#### Revoke Permission
- **URL:** `/api/TeacherPermissions/{permissionId}/revoke`
- **Method:** `DELETE`
- **Authorization:** Admin only
- **Response:**
```json
{
  "success": true,
  "message": "Permission revoked successfully"
}
```

#### List All Teachers with Permissions
- **URL:** `/api/TeacherPermissions/all`
- **Method:** `GET`
- **Authorization:** Admin only
- **Response:**
```json
{
  "teachers": [
    {
      "teacherId": 123,
      "teacherName": "John Doe",
      "email": "john@example.com",
      "totalPermissions": 3,
      "subjects": ["Mathematics", "Physics", "Chemistry"]
    }
  ]
}
```

### 3.2 Teacher Content Management Endpoints

#### Get Teacher's Allowed Subjects
- **URL:** `/api/TeacherContent/my-subjects`
- **Method:** `GET`
- **Authorization:** Teacher only
- **Response:**
```json
{
  "subjects": [
    {
      "subjectId": 45,
      "subjectName": "Mathematics",
      "yearId": 2,
      "yearName": "Year 8",
      "canCreate": true,
      "canEdit": true,
      "canDelete": false,
      "termsCount": 4,
      "lessonsCount": 48,
      "pendingCount": 5
    }
  ]
}
```

#### Get Content by Subject (Teacher View)
- **URL:** `/api/TeacherContent/subject/{subjectId}`
- **Method:** `GET`
- **Authorization:** Teacher (with permission)
- **Query Params:** `?includeStatus=all|approved|pending|rejected`
- **Response:**
```json
{
  "subject": {
    "id": 45,
    "name": "Mathematics",
    "yearName": "Year 8"
  },
  "terms": [
    {
      "id": 10,
      "termNumber": 1,
      "name": "Term 1",
      "approvalStatus": "Approved",
      "createdBy": "John Doe",
      "weeksCount": 10
    }
  ],
  "weeks": [],
  "lessons": [],
  "statistics": {
    "totalLessons": 48,
    "approvedLessons": 43,
    "pendingLessons": 5,
    "rejectedLessons": 0
  }
}
```

#### Create Lesson (Teacher)
- **URL:** `/api/TeacherContent/lessons`
- **Method:** `POST`
- **Authorization:** Teacher (with permission)
- **Request Body:**
```json
{
  "title": "Introduction to Algebra",
  "description": "Basic algebra concepts",
  "weekId": 25,
  "order": 1,
  "videoUrl": "https://example.com/video.mp4",
  "duration": 45,
  "objectives": ["Understand variables", "Solve equations"]
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Lesson created and pending approval",
  "lesson": {
    "id": 100,
    "title": "Introduction to Algebra",
    "approvalStatus": "Pending",
    "createdBy": "John Doe",
    "createdAt": "2025-11-05T10:00:00Z"
  }
}
```

#### Update Lesson (Teacher)
- **URL:** `/api/TeacherContent/lessons/{lessonId}`
- **Method:** `PUT`
- **Authorization:** Teacher (creator or with permission)
- **Request Body:** Same as create
- **Response:**
```json
{
  "success": true,
  "message": "Lesson updated and pending re-approval",
  "lesson": {
    "id": 100,
    "approvalStatus": "Pending"
  }
}
```

#### Get Pending Approvals (Admin)
- **URL:** `/api/TeacherContent/pending-approvals`
- **Method:** `GET`
- **Authorization:** Admin only
- **Query Params:** `?type=lesson|week|term|resource`
- **Response:**
```json
{
  "pendingItems": [
    {
      "id": 100,
      "type": "Lesson",
      "title": "Introduction to Algebra",
      "subjectName": "Mathematics",
      "weekNumber": 5,
      "termNumber": 2,
      "createdBy": "John Doe",
      "createdByEmail": "john@example.com",
      "createdAt": "2025-11-05T10:00:00Z",
      "pendingDays": 2
    }
  ],
  "totalPending": 15
}
```

#### Approve/Reject Content (Admin)
- **URL:** `/api/TeacherContent/approve`
- **Method:** `POST`
- **Authorization:** Admin only
- **Request Body:**
```json
{
  "itemType": "Lesson",
  "itemId": 100,
  "action": "Approve",
  "rejectionReason": "Content quality issue"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Lesson approved successfully",
  "item": {
    "id": 100,
    "approvalStatus": "Approved",
    "approvedBy": "Admin User",
    "approvedAt": "2025-11-05T12:00:00Z"
  }
}
```

### 3.3 Notifications Endpoints

#### Get Teacher Notifications
- **URL:** `/api/TeacherContent/notifications`
- **Method:** `GET`
- **Authorization:** Teacher
- **Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "Approved",
      "message": "Your lesson 'Introduction to Algebra' has been approved",
      "itemType": "Lesson",
      "itemId": 100,
      "createdAt": "2025-11-05T12:00:00Z",
      "isRead": false
    }
  ]
}
```

---

## 4. Updated Models/DTOs

### TeacherPermissionDto
```csharp
public class TeacherPermissionDto
{
    public int Id { get; set; }
    public int TeacherId { get; set; }
    public string TeacherName { get; set; }
    public int SubjectId { get; set; }
    public string SubjectName { get; set; }
    public int YearId { get; set; }
    public string YearName { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public bool IsActive { get; set; }
    public DateTime GrantedAt { get; set; }
}
```

### ContentItemDto (Base)
```csharp
public class ContentItemDto
{
    public int Id { get; set; }
    public string ApprovalStatus { get; set; } // Pending, Approved, Rejected
    public int? CreatedBy { get; set; }
    public string CreatedByName { get; set; }
    public DateTime? CreatedAt { get; set; }
    public int? ApprovedBy { get; set; }
    public string ApprovedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string RejectionReason { get; set; }
}
```

### ApprovalActionDto
```csharp
public class ApprovalActionDto
{
    public string ItemType { get; set; } // Lesson, Week, Term, Resource
    public int ItemId { get; set; }
    public string Action { get; set; } // Approve, Reject
    public string RejectionReason { get; set; }
}
```

---

## 5. Business Logic Requirements

### Permission Checking Service
```csharp
public interface ITeacherPermissionService
{
    Task<bool> HasPermissionAsync(int teacherId, int subjectId, string action);
    Task<List<int>> GetAuthorizedSubjectIdsAsync(int teacherId);
    Task<TeacherPermissionDto> GrantPermissionAsync(GrantPermissionDto dto);
    Task RevokePermissionAsync(int permissionId);
}
```

### Content Approval Service
```csharp
public interface IContentApprovalService
{
    Task<bool> RequiresApprovalAsync(string itemType, int itemId);
    Task ApproveContentAsync(int adminId, ApprovalActionDto dto);
    Task RejectContentAsync(int adminId, ApprovalActionDto dto);
    Task<List<PendingApprovalDto>> GetPendingApprovalsAsync(string itemType = null);
}
```

### Validation Rules
1. Teachers can only create content in subjects they have permission for
2. All new content created by teachers starts with `ApprovalStatus = "Pending"`
3. Admins can bypass approval and create with `ApprovalStatus = "Approved"`
4. Only content with `ApprovalStatus = "Approved"` is visible to students
5. Teachers can view their own pending/rejected content
6. Editing approved content changes status back to "Pending"

---

## 6. Controllers to Create/Modify

### New Controllers
- `TeacherPermissionsController.cs`
- `TeacherContentController.cs`

### Modified Controllers
- `LessonsController.cs` - Add approval status filtering
- `WeeksController.cs` - Add approval status filtering
- `TermsController.cs` - Add approval status filtering
- `ResourcesController.cs` - Add approval status filtering

---

## 7. Authorization Policies

### Add New Policies in Startup/Program.cs
```csharp
services.AddAuthorization(options =>
{
    options.AddPolicy("TeacherOnly", policy => 
        policy.RequireRole("Teacher"));
    
    options.AddPolicy("AdminOnly", policy => 
        policy.RequireRole("Admin"));
    
    options.AddPolicy("TeacherOrAdmin", policy => 
        policy.RequireRole("Teacher", "Admin"));
});
```

---

## 8. Migration Files Required

1. `2025xxxx_AddTeacherSubjectPermissions.cs`
2. `2025xxxx_AddApprovalColumnsToLessons.cs`
3. `2025xxxx_AddApprovalColumnsToWeeks.cs`
4. `2025xxxx_AddApprovalColumnsToTerms.cs`
5. `2025xxxx_AddApprovalColumnsToResources.cs`

---

## 9. Expected Frontend Integration Points

Frontend will need to:
1. Display permission management UI for admins
2. Show teacher's authorized subjects
3. Display approval status badges (Pending/Approved/Rejected)
4. Show pending approvals dashboard for admins
5. Display notifications for approval/rejection
6. Filter content by approval status
7. Show "Awaiting Approval" indicators

---

## 10. Testing Scenarios

1. Admin grants permission to teacher for specific subject
2. Teacher creates lesson in authorized subject → Status: Pending
3. Teacher tries to create lesson in unauthorized subject → 403 Forbidden
4. Admin approves lesson → Status: Approved, visible to students
5. Admin rejects lesson → Status: Rejected, teacher notified
6. Teacher edits approved lesson → Status changes back to Pending
7. Student queries lessons → Only sees approved content

---

## 11. Security Considerations

- Use `[Authorize(Policy = "TeacherOnly")]` on teacher endpoints
- Use `[Authorize(Policy = "AdminOnly")]` on admin endpoints
- Validate teacher has permission before any content operation
- Log all approval/rejection actions for audit trail
- Implement rate limiting on content creation
- Validate file uploads for resources

---

## 12. Performance Considerations

- Index `TeacherSubjectPermissions.TeacherId`
- Index `Lessons.ApprovalStatus`
- Index `Lessons.CreatedBy`
- Cache teacher permissions in memory
- Use pagination for pending approvals list

---

**Priority:** High  
**Estimated Backend Implementation Time:** 3-4 days  
**Dependencies:** None  
**Breaking Changes:** No (only additions)

