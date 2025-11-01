# 🔧 Quick Fix Guide - Student Dashboard APIs

## ⏱️ Estimated Fix Time: 30 minutes

---

## 🎯 **IMMEDIATE FIXES REQUIRED**

### Fix 1: ExamService (500 Error)
**File:** `API\Services\Implementations\ExamService.cs`
**Method:** `GetStudentExamHistoryAsync` (around line 457)

**Find this line:**
```csharp
.Include(se => se.Exam)
```

**Add after it:**
```csharp
.ThenInclude(e => e.Questions)
```

**Also add null checks in the Select:**
```csharp
TotalQuestions = se.Exam != null && se.Exam.Questions != null 
    ? se.Exam.Questions.Count 
    : 0,
```

---

### Fix 2: CertificateService (500 Error)
**File:** `API\Services\Implementations\CertificateService.cs`
**Method:** `GetStudentCertificatesAsync` (around line 66)

**Find this line:**
```csharp
SubjectName = c.Subject != null ? c.Subject.SubjectName!.Name : null,
```

**Replace with:**
```csharp
SubjectName = c.Subject?.SubjectName?.Name,
```

**Apply this change to ALL occurrences in CertificateService.**

---

### Fix 3: Deployment Verification
**Check if latest code is deployed to production:**
```bash
# Verify ExamController has the student history endpoint
grep -r "student/{studentId}/history" /path/to/api/

# Check DashboardController exists
ls -la /path/to/api/Controllers/DashboardController.cs
```

---

## 🧪 **TESTING AFTER FIXES**

Run this script to test all endpoints:

```bash
#!/bin/bash
BASE_URL="https://naplan2.runasp.net"
TOKEN="YOUR_JWT_TOKEN"
STUDENT_ID="8"

echo "Testing fixed endpoints..."

# Test Exam History (should work after Fix 1)
curl -X GET "$BASE_URL/api/Exam/student/$STUDENT_ID/history" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test Certificates (should work after Fix 2)  
curl -X GET "$BASE_URL/api/Certificates/student/$STUDENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test Dashboard (should work after deployment verification)
curl -X GET "$BASE_URL/api/Dashboard/student" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test Progress (should work after deployment verification)
curl -X GET "$BASE_URL/api/Progress/by-student/$STUDENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## ✅ **EXPECTED RESULTS AFTER FIXES**

1. **Exam History**: Should return array of completed exams
2. **Certificates**: Should return array of earned certificates  
3. **Dashboard**: Should return student dashboard data
4. **Progress**: Should return student progress data

---

## 📞 **NEXT STEPS**

1. ✅ Apply the 2 code fixes above
2. ✅ Build the API project locally
3. ✅ Deploy to production server
4. ✅ Run the testing script
5. ✅ Notify frontend team that APIs are working

**Total Time Required:** ~30 minutes

---

**Prepared:** November 1, 2025  
**Status:** Ready for implementation
