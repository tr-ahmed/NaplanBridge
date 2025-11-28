# 🔍 DATABASE VERIFICATION - Terms Configuration

**Date:** 2025-01-28  
**Issue:** term-access endpoint returns empty terms array  
**Root Cause:** Likely database configuration issue

---

## 📋 Backend Confirmation

The backend team has confirmed that the `/api/StudentSubjects/student/{id}/subject/{id}/term-access` endpoint is **fully implemented and working correctly**.

If the frontend sees an empty `terms` array, it's because:
1. ❌ Database is missing AcademicTerms for current year
2. ❌ Subject Terms are not linked to AcademicTerms
3. ❌ Missing `AcademicTermId` in Terms table

---

## 🧪 SQL Queries to Verify Database

### Step 1: Check AcademicTerms Table

Run this to verify academic terms exist for 2025:

```sql
-- Check if academic terms exist for current year
SELECT * FROM AcademicTerms 
WHERE AcademicYear = 2025 
AND IsActive = 1
ORDER BY TermNumber;
```

**Expected Result:** Should return 4 rows (Term 1-4)

**If empty**, run this to create them:

```sql
-- Insert academic terms for 2025
INSERT INTO AcademicTerms (Name, TermNumber, StartDate, EndDate, AcademicYear, IsActive)
VALUES 
('Term 1', 1, '2025-01-27', '2025-03-28', 2025, 1),
('Term 2', 2, '2025-04-14', '2025-06-27', 2025, 1),
('Term 3', 3, '2025-07-14', '2025-09-19', 2025, 1),
('Term 4', 4, '2025-10-06', '2025-12-19', 2025, 1);
```

---

### Step 2: Check Subject Terms Linking

Run this to see if Algebra (Subject ID = 1) has terms linked to AcademicTerms:

```sql
-- Check if subject has terms linked to academic terms
SELECT 
    t.Id as TermId,
    t.SubjectId,
    t.AcademicTermId,
    at.TermNumber,
    at.Name as TermName,
    at.StartDate,
    at.EndDate
FROM Terms t
LEFT JOIN AcademicTerms at ON t.AcademicTermId = at.Id
WHERE t.SubjectId = 1
ORDER BY at.TermNumber;
```

**Expected Result:** Should return 4 rows with `AcademicTermId` populated

**If AcademicTermId is NULL**, run this to link them:

```sql
-- Link subject's terms to academic terms
UPDATE Terms 
SET AcademicTermId = (
    SELECT Id FROM AcademicTerms 
    WHERE TermNumber = 
        CASE 
            WHEN Terms.Name LIKE '%Term 1%' OR Terms.Name LIKE '%1%' THEN 1
            WHEN Terms.Name LIKE '%Term 2%' OR Terms.Name LIKE '%2%' THEN 2
            WHEN Terms.Name LIKE '%Term 3%' OR Terms.Name LIKE '%3%' THEN 3
            WHEN Terms.Name LIKE '%Term 4%' OR Terms.Name LIKE '%4%' THEN 4
            ELSE 1
        END
    AND AcademicYear = 2025 
    AND IsActive = 1
)
WHERE SubjectId = 1
  AND AcademicTermId IS NULL;
```

---

### Step 3: Verify Complete Configuration

Run this to see the full picture:

```sql
-- Check complete term setup for Algebra
SELECT 
    s.Id as SubjectId,
    s.Name as SubjectName,
    t.Id as TermId,
    t.Name as SubjectTermName,
    t.AcademicTermId,
    at.TermNumber,
    at.Name as AcademicTermName,
    at.StartDate,
    at.EndDate,
    at.IsActive,
    COUNT(DISTINCT w.Id) as WeekCount,
    COUNT(DISTINCT l.Id) as LessonCount
FROM Subjects s
LEFT JOIN Terms t ON s.Id = t.SubjectId
LEFT JOIN AcademicTerms at ON t.AcademicTermId = at.Id
LEFT JOIN Weeks w ON t.Id = w.TermId
LEFT JOIN Lessons l ON w.Id = l.WeekId
WHERE s.Id = 1
  AND (at.IsActive = 1 OR at.IsActive IS NULL)
GROUP BY s.Id, s.Name, t.Id, t.Name, t.AcademicTermId, at.TermNumber, at.Name, at.StartDate, at.EndDate, at.IsActive
ORDER BY at.TermNumber;
```

**Expected Result:** 4 rows showing all terms with their lesson counts

---

### Step 4: Check Student's Subscription

Verify student 11 has an active subscription:

```sql
-- Check student's active subscriptions
SELECT 
    s.Id as SubscriptionId,
    s.StudentId,
    s.SubjectId,
    sub.Name as SubjectName,
    s.TermId,
    t.Name as TermName,
    at.TermNumber,
    sp.PlanType,
    s.StartDate,
    s.EndDate,
    s.IsActive,
    CASE 
        WHEN s.EndDate >= GETDATE() AND s.IsActive = 1 THEN 'Active'
        WHEN s.EndDate < GETDATE() THEN 'Expired'
        ELSE 'Inactive'
    END as Status
FROM Subscriptions s
INNER JOIN Subjects sub ON s.SubjectId = sub.Id
LEFT JOIN Terms t ON s.TermId = t.Id
LEFT JOIN AcademicTerms at ON t.AcademicTermId = at.Id
LEFT JOIN SubscriptionPlans sp ON s.PlanId = sp.Id
WHERE s.StudentId = 11
  AND s.SubjectId = 1
ORDER BY s.CreatedAt DESC;
```

---

## 🎯 Quick Fix Summary

If database is the issue, run these in order:

```sql
-- 1. Create AcademicTerms if missing
INSERT INTO AcademicTerms (Name, TermNumber, StartDate, EndDate, AcademicYear, IsActive)
SELECT 'Term 1', 1, '2025-01-27', '2025-03-28', 2025, 1
WHERE NOT EXISTS (SELECT 1 FROM AcademicTerms WHERE TermNumber = 1 AND AcademicYear = 2025);

INSERT INTO AcademicTerms (Name, TermNumber, StartDate, EndDate, AcademicYear, IsActive)
SELECT 'Term 2', 2, '2025-04-14', '2025-06-27', 2025, 1
WHERE NOT EXISTS (SELECT 1 FROM AcademicTerms WHERE TermNumber = 2 AND AcademicYear = 2025);

INSERT INTO AcademicTerms (Name, TermNumber, StartDate, EndDate, AcademicYear, IsActive)
SELECT 'Term 3', 3, '2025-07-14', '2025-09-19', 2025, 1
WHERE NOT EXISTS (SELECT 1 FROM AcademicTerms WHERE TermNumber = 3 AND AcademicYear = 2025);

INSERT INTO AcademicTerms (Name, TermNumber, StartDate, EndDate, AcademicYear, IsActive)
SELECT 'Term 4', 4, '2025-10-06', '2025-12-19', 2025, 1
WHERE NOT EXISTS (SELECT 1 FROM AcademicTerms WHERE TermNumber = 4 AND AcademicYear = 2025);

-- 2. Link Subject Terms to AcademicTerms
UPDATE Terms 
SET AcademicTermId = (
    SELECT TOP 1 Id FROM AcademicTerms 
    WHERE TermNumber = 
        CASE 
            WHEN Terms.Name LIKE '%1%' THEN 1
            WHEN Terms.Name LIKE '%2%' THEN 2
            WHEN Terms.Name LIKE '%3%' THEN 3
            WHEN Terms.Name LIKE '%4%' THEN 4
            ELSE 1
        END
    AND AcademicYear = 2025 
    AND IsActive = 1
)
WHERE SubjectId = 1
  AND AcademicTermId IS NULL;

-- 3. Verify fix worked
SELECT 
    t.Id,
    t.Name,
    t.AcademicTermId,
    at.TermNumber,
    at.Name as AcademicTermName
FROM Terms t
LEFT JOIN AcademicTerms at ON t.AcademicTermId = at.Id
WHERE t.SubjectId = 1
ORDER BY at.TermNumber;
```

---

## 🔄 After Running SQL

1. **Restart the backend API** (if needed)
2. **Refresh the frontend** (clear cache)
3. **Test the endpoint** again
4. **Check console** for `📡 RAW Response from term-access endpoint`

---

## 📞 Next Steps

1. ✅ Run Step 1 query → Check if AcademicTerms exist
2. ✅ Run Step 2 query → Check if Terms are linked
3. ✅ If any issues found, run the fix queries
4. ✅ Test the API endpoint again
5. ✅ Check frontend console for raw response

---

**Status:** Waiting for database verification  
**Last Updated:** 2025-01-28
