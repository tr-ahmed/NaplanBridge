# Backend Report: Parent Subscriptions - Missing Usage Statistics

**Date:** December 2, 2025  
**Component:** `/parent/subscriptions` Page  
**Priority:** High  
**Status:** Missing Backend Data

---

## Problem Description

The `/parent/subscriptions` page displays **Usage Statistics** (Progress %, Completed Lessons, Total Lessons) as **0/0** and **0%** for all subscriptions.

### Current Behavior:
```
Usage Statistics
- Progress: 0%
- Lessons: 0/0
- Last Access: Not started
Learning Progress: 0%
```

### Expected Behavior:
```
Usage Statistics
- Progress: 75%
- Lessons: 15/20
- Last Access: Nov 28
Learning Progress: 75%
```

---

## Root Cause Analysis

### Current API Endpoint
**Endpoint:** `GET /api/Parent/student/{studentId}/subscriptions`

**Current Response Structure:**
```json
{
  "success": true,
  "data": {
    "active": [
      {
        "id": 123,
        "planId": 5,
        "planName": "Math - Term 1",
        "subjectId": 10,
        "subjectName": "Mathematics",
        "totalAmount": 150.00,
        "paidAmount": 150.00,
        "paymentMethod": "credit_card",
        "paymentStatus": "paid",
        "startDate": "2025-09-01",
        "endDate": "2025-12-31",
        "expiryDate": "2025-12-31",
        "daysRemaining": 29,
        "isActive": true,
        "autoRenew": false,
        "orderId": 456,
        
        // ❌ MISSING: Usage Statistics
        "completedLessons": null,
        "totalLessons": null,
        "progressPercentage": null,
        "lastAccessDate": null
      }
    ],
    "expired": [...],
    "totalActive": 3,
    "totalExpired": 1,
    "totalSpent": 450.00
  }
}
```

### Missing Data Fields:
Each subscription in the `active` and `expired` arrays needs to include:

1. **`completedLessons`** (int): Number of lessons completed by the student in this subscription/subject
2. **`totalLessons`** (int): Total number of lessons available in this subscription/subject
3. **`progressPercentage`** (decimal): Calculated as `(completedLessons / totalLessons) * 100`
4. **`lastAccessDate`** (DateTime?): Last time the student accessed any lesson in this subscription/subject

---

## Required Backend Changes

### 1. Update ParentController Endpoint

**File:** `ParentController.cs`  
**Method:** `GetStudentSubscriptions(int studentId, bool includeExpired = false)`

**Required Logic:**
```csharp
// For each subscription in the response:
foreach (var subscription in activeSubscriptions)
{
    // Get subject/plan lessons count
    var totalLessons = await _context.Lessons
        .Where(l => l.SubjectId == subscription.SubjectId && l.IsActive)
        .CountAsync();
    
    // Get completed lessons for this student
    var completedLessons = await _context.Progress
        .Where(p => p.StudentId == studentId 
                 && p.SubjectId == subscription.SubjectId 
                 && p.IsCompleted)
        .CountAsync();
    
    // Calculate progress percentage
    var progressPercentage = totalLessons > 0 
        ? (decimal)completedLessons / totalLessons * 100 
        : 0;
    
    // Get last access date
    var lastAccess = await _context.Progress
        .Where(p => p.StudentId == studentId 
                 && p.SubjectId == subscription.SubjectId)
        .OrderByDescending(p => p.UpdatedAt)
        .Select(p => p.UpdatedAt)
        .FirstOrDefaultAsync();
    
    // Add to response
    subscription.CompletedLessons = completedLessons;
    subscription.TotalLessons = totalLessons;
    subscription.ProgressPercentage = Math.Round(progressPercentage, 2);
    subscription.LastAccessDate = lastAccess;
}
```

### 2. Update DTO/Response Model

**File:** `StudentSubscriptionDto.cs` (or equivalent)

```csharp
public class StudentSubscriptionDto
{
    // Existing fields...
    public int Id { get; set; }
    public int PlanId { get; set; }
    public string PlanName { get; set; }
    public int SubjectId { get; set; }
    public string SubjectName { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string PaymentMethod { get; set; }
    public string PaymentStatus { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int DaysRemaining { get; set; }
    public bool IsActive { get; set; }
    public bool AutoRenew { get; set; }
    public int? OrderId { get; set; }
    
    // ✅ NEW: Usage Statistics Fields
    public int CompletedLessons { get; set; }
    public int TotalLessons { get; set; }
    public decimal ProgressPercentage { get; set; }
    public DateTime? LastAccessDate { get; set; }
}
```

---

## Expected API Response (After Fix)

```json
{
  "success": true,
  "data": {
    "active": [
      {
        "id": 123,
        "planId": 5,
        "planName": "Math - Term 1",
        "subjectId": 10,
        "subjectName": "Mathematics",
        "totalAmount": 150.00,
        "paidAmount": 150.00,
        "paymentMethod": "credit_card",
        "paymentStatus": "paid",
        "startDate": "2025-09-01T00:00:00",
        "endDate": "2025-12-31T23:59:59",
        "expiryDate": "2025-12-31T23:59:59",
        "daysRemaining": 29,
        "isActive": true,
        "autoRenew": false,
        "orderId": 456,
        
        // ✅ ADDED: Usage Statistics
        "completedLessons": 15,
        "totalLessons": 20,
        "progressPercentage": 75.00,
        "lastAccessDate": "2025-11-28T14:30:00"
      }
    ],
    "expired": [...],
    "totalActive": 3,
    "totalExpired": 1,
    "totalSpent": 450.00
  }
}
```

---

## Database Queries Needed

### Query 1: Get Total Lessons for Subject
```sql
SELECT COUNT(*) 
FROM Lessons 
WHERE SubjectId = @SubjectId 
  AND IsActive = 1
```

### Query 2: Get Completed Lessons for Student
```sql
SELECT COUNT(*) 
FROM Progress 
WHERE StudentId = @StudentId 
  AND SubjectId = @SubjectId 
  AND IsCompleted = 1
```

### Query 3: Get Last Access Date
```sql
SELECT TOP 1 UpdatedAt 
FROM Progress 
WHERE StudentId = @StudentId 
  AND SubjectId = @SubjectId 
ORDER BY UpdatedAt DESC
```

---

## Performance Considerations

### Option 1: Individual Queries (Simple but slower)
- Execute 3 queries per subscription
- Good for small datasets (<10 subscriptions per student)

### Option 2: Bulk Query (Recommended for production)
```csharp
// Get all subject IDs
var subjectIds = subscriptions.Select(s => s.SubjectId).Distinct().ToList();

// Bulk query for all lessons counts
var lessonCounts = await _context.Lessons
    .Where(l => subjectIds.Contains(l.SubjectId) && l.IsActive)
    .GroupBy(l => l.SubjectId)
    .Select(g => new { SubjectId = g.Key, Count = g.Count() })
    .ToDictionaryAsync(x => x.SubjectId, x => x.Count);

// Bulk query for all progress
var progressData = await _context.Progress
    .Where(p => p.StudentId == studentId && subjectIds.Contains(p.SubjectId))
    .GroupBy(p => p.SubjectId)
    .Select(g => new {
        SubjectId = g.Key,
        CompletedCount = g.Count(p => p.IsCompleted),
        LastAccess = g.Max(p => p.UpdatedAt)
    })
    .ToDictionaryAsync(x => x.SubjectId);

// Map to subscriptions
foreach (var subscription in subscriptions)
{
    lessonCounts.TryGetValue(subscription.SubjectId, out int totalLessons);
    progressData.TryGetValue(subscription.SubjectId, out var progress);
    
    subscription.TotalLessons = totalLessons;
    subscription.CompletedLessons = progress?.CompletedCount ?? 0;
    subscription.ProgressPercentage = totalLessons > 0 
        ? Math.Round((decimal)subscription.CompletedLessons / totalLessons * 100, 2) 
        : 0;
    subscription.LastAccessDate = progress?.LastAccess;
}
```

---

## Testing Checklist

- [ ] Verify `completedLessons` matches actual completed lessons in Progress table
- [ ] Verify `totalLessons` matches active lessons in Lessons table for the subject
- [ ] Verify `progressPercentage` calculation is correct (0-100 range)
- [ ] Verify `lastAccessDate` returns the most recent progress update
- [ ] Test with students who have:
  - [ ] No progress (should show 0/X)
  - [ ] Partial progress (should show correct percentage)
  - [ ] Completed all lessons (should show 100%)
  - [ ] Multiple subscriptions (should show separate stats for each)
- [ ] Verify expired subscriptions also include usage stats
- [ ] Test performance with 10+ subscriptions per student

---

## Frontend Status

✅ **Frontend is ready** - The code in `my-subscriptions.component.ts` already handles these fields:

```typescript
completedLessons: sub.completedLessons ?? 0,
totalLessons: sub.totalLessons ?? 0,
progressPercentage: sub.progressPercentage ?? 0,
lastAccessDate: sub.lastAccessDate ? new Date(sub.lastAccessDate) : undefined
```

The frontend will automatically display the correct data once the backend provides it.

---

## Priority Justification

**High Priority** because:
1. Parents cannot see their children's learning progress
2. Core feature of subscription management page
3. Affects user satisfaction and trust
4. Data already exists in database (Progress table)
5. Simple backend fix with significant UX improvement

---

## Related Endpoints to Check

Ensure consistency across these endpoints as well:
- `GET /api/StudentSubjects/student/{studentId}/subscriptions-summary`
- `GET /api/Dashboard/student/{studentId}`
- `GET /api/Progress/by-student/{studentId}/summary`

All should include or calculate similar usage statistics for consistency.
