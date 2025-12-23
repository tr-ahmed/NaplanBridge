# تقرير تطبيق خاصية المواد العالمية (Global Courses) - Backend Implementation

**التاريخ:** 22 ديسمبر 2025  
**الإصدار:** 1.0  
**الحالة:** مطلوب تطبيق على Backend

---

## 📋 ملخص التعديلات المطلوبة

تم تطبيق التعديلات على Frontend بنجاح. المطلوب الآن تطبيق التعديلات على Backend لدعم خاصية **المواد العالمية (isGlobal)** التي تظهر لجميع السنوات الدراسية بغض النظر عن الفلتر المطبق على السنة (Year) أو الفصل الدراسي (Term).

---

## 🎯 المتطلبات الوظيفية

### 1. **المواد العالمية (Global Courses)**
- المواد التي لها `isGlobal: true` في جدول `SubjectNames` يجب أن تظهر لجميع المستخدمين بغض النظر عن السنة الدراسية المختارة
- **لا يطبق عليها فلتر السنة (Year Filter)**
- **لا يطبق عليها فلتر الفصل الدراسي (Term Filter)**
- مثال: مادة "Tajweed" يجب أن تظهر لطلاب Year 7, Year 8, Year 9... إلخ

### 2. **الترتيب في النتائج**
- المواد الخاصة بالسنة المحددة تظهر أولاً
- المواد العالمية تظهر في نهاية القائمة (grouped at bottom)

### 3. **العرض في Frontend**
- تم إضافة Badge بنفسجي مع أيقونة للمواد العالمية
- النص: "Available for All Years"

---

## 🔧 التعديلات المطلوبة على Backend

### ✅ **الملفات المطلوب تعديلها:**

#### **1. SubjectsController.cs**
**المسار المتوقع:** `API/Controllers/SubjectsController.cs`

#### **2. SubjectDto.cs** (إذا لم يكن موجود)
**المسار المتوقع:** `API/DTOs/SubjectDto.cs` أو `API/Models/DTOs/SubjectDto.cs`

---

## 📝 التعديلات التفصيلية

### **1️⃣ تعديل Endpoint: GET /api/Subjects (Paginated)**

**الكود الحالي (مفترض):**
```csharp
[HttpGet]
public async Task<ActionResult<PagedResult<SubjectDto>>> GetSubjects(
    [FromQuery] PaginationParams paginationParams,
    [FromQuery] int? categoryId = null,
    [FromQuery] int? yearId = null,
    [FromQuery] List<int>? yearIds = null,
    [FromQuery] int? termId = null,
    [FromQuery] string? searchTerm = null)
{
    var query = _context.Subjects
        .Include(s => s.SubjectName)
        .Include(s => s.Category)
        .Include(s => s.SubscriptionPlans)
        .AsQueryable();

    // Filter by category
    if (categoryId.HasValue)
        query = query.Where(s => s.CategoryId == categoryId.Value);

    // Filter by single year (backward compatible)
    if (yearId.HasValue)
        query = query.Where(s => s.YearId == yearId.Value);
    
    // Filter by multiple years
    if (yearIds != null && yearIds.Any())
        query = query.Where(s => yearIds.Contains(s.YearId));

    // Filter by term
    if (termId.HasValue)
        query = query.Where(s => s.Terms.Any(t => t.Id == termId.Value));

    // Search by subject name
    if (!string.IsNullOrWhiteSpace(searchTerm))
        query = query.Where(s => s.SubjectName.Name.Contains(searchTerm));

    var totalCount = await query.CountAsync();

    var items = await query
        .OrderBy(s => s.Id)
        .Skip((paginationParams.Page - 1) * paginationParams.PageSize)
        .Take(paginationParams.PageSize)
        .Select(s => MapToDto(s))
        .ToListAsync();

    return Ok(new PagedResult<SubjectDto>
    {
        Items = items,
        Page = paginationParams.Page,
        PageSize = paginationParams.PageSize,
        TotalCount = totalCount,
        TotalPages = (int)Math.Ceiling(totalCount / (double)paginationParams.PageSize)
    });
}
```

---

**✅ الكود المطلوب (بعد التعديل):**
```csharp
[HttpGet]
public async Task<ActionResult<PagedResult<SubjectDto>>> GetSubjects(
    [FromQuery] PaginationParams paginationParams,
    [FromQuery] int? categoryId = null,
    [FromQuery] int? yearId = null,
    [FromQuery] List<int>? yearIds = null,
    [FromQuery] int? termId = null,
    [FromQuery] string? searchTerm = null)
{
    var query = _context.Subjects
        .Include(s => s.SubjectName)        // ⚠️ CRITICAL: Must include to access IsGlobal
        .Include(s => s.Category)
        .Include(s => s.SubscriptionPlans)
        .AsQueryable();

    // Filter by category
    if (categoryId.HasValue)
        query = query.Where(s => s.CategoryId == categoryId.Value);

    // ✅ NEW: Filter by single year + include global courses
    if (yearId.HasValue)
    {
        query = query.Where(s => 
            s.YearId == yearId.Value ||         // Year-specific subjects
            s.SubjectName.IsGlobal              // Global subjects (available for all years)
        );
    }
    
    // ✅ NEW: Filter by multiple years + include global courses
    if (yearIds != null && yearIds.Any())
    {
        query = query.Where(s => 
            yearIds.Contains(s.YearId) ||       // Year-specific subjects
            s.SubjectName.IsGlobal              // Global subjects (available for all years)
        );
    }

    // ✅ NEW: Filter by term BUT exclude global courses from term filtering
    if (termId.HasValue)
    {
        query = query.Where(s => 
            s.SubjectName.IsGlobal ||           // Global courses ignore term filter
            s.Terms.Any(t => t.Id == termId.Value)
        );
    }

    // Search by subject name
    if (!string.IsNullOrWhiteSpace(searchTerm))
        query = query.Where(s => s.SubjectName.Name.Contains(searchTerm));

    var totalCount = await query.CountAsync();

    var items = await query
        // ✅ NEW: Sort regular courses first, then global courses
        .OrderBy(s => s.SubjectName.IsGlobal ? 1 : 0)  // Global courses at bottom
        .ThenBy(s => s.Id)                              // Then by ID
        .Skip((paginationParams.Page - 1) * paginationParams.PageSize)
        .Take(paginationParams.PageSize)
        .Select(s => MapToDto(s))
        .ToListAsync();

    return Ok(new PagedResult<SubjectDto>
    {
        Items = items,
        Page = paginationParams.Page,
        PageSize = paginationParams.PageSize,
        TotalCount = totalCount,
        TotalPages = (int)Math.Ceiling(totalCount / (double)paginationParams.PageSize)
    });
}
```

---

### **2️⃣ التأكد من وجود IsGlobal في SubjectDto**

**ملف:** `SubjectDto.cs`

```csharp
public class SubjectDto
{
    public int Id { get; set; }
    public int YearId { get; set; }
    public int SubjectNameId { get; set; }
    public string SubjectName { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public string CategoryDescription { get; set; }
    
    public decimal Price { get; set; }
    public decimal OriginalPrice { get; set; }
    public decimal DiscountPercentage { get; set; }
    
    public string PosterUrl { get; set; }
    public string Level { get; set; }
    public int Duration { get; set; }
    public int WeekNumber { get; set; }
    public int TermNumber { get; set; }
    public int StudentCount { get; set; }
    
    public List<int> TermIds { get; set; }
    public List<int> WeekIds { get; set; }
    
    // ✅ NEW: Add this property if missing
    public bool IsGlobal { get; set; }  // Maps from SubjectName.IsGlobal
    
    public List<SubscriptionPlanSummaryDto> SubscriptionPlans { get; set; }
    public List<TeacherSummaryDto> Teachers { get; set; }
}
```

---

### **3️⃣ تعديل MapToDto Method**

**في SubjectsController.cs أو SubjectMappingHelper.cs:**

```csharp
private SubjectDto MapToDto(Subject subject)
{
    return new SubjectDto
    {
        Id = subject.Id,
        YearId = subject.YearId,
        SubjectNameId = subject.SubjectNameId,
        SubjectName = subject.SubjectName.Name,
        CategoryId = subject.CategoryId,
        CategoryName = subject.Category.Name,
        CategoryDescription = subject.Category.Description,
        
        Price = subject.Price,
        OriginalPrice = subject.OriginalPrice,
        DiscountPercentage = subject.DiscountPercentage,
        
        PosterUrl = subject.PosterUrl,
        Level = subject.Level,
        Duration = subject.Duration,
        WeekNumber = subject.WeekNumber,
        TermNumber = subject.TermNumber,
        StudentCount = subject.StudentCount,
        
        TermIds = subject.Terms?.Select(t => t.Id).ToList() ?? new List<int>(),
        WeekIds = subject.Weeks?.Select(w => w.Id).ToList() ?? new List<int>(),
        
        // ✅ Map IsGlobal from SubjectName
        IsGlobal = subject.SubjectName.IsGlobal,
        
        SubscriptionPlans = subject.SubscriptionPlans?
            .Where(sp => sp.IsActive)
            .Select(sp => MapToPlanDto(sp))
            .ToList() ?? new List<SubscriptionPlanSummaryDto>(),
            
        Teachers = subject.Teachers?
            .Select(t => MapToTeacherDto(t))
            .ToList() ?? new List<TeacherSummaryDto>()
    };
}
```

---

## 🗄️ التحقق من قاعدة البيانات

### **التأكد من وجود IsGlobal في جدول SubjectNames:**

```sql
-- التحقق من الجدول
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'SubjectNames'
AND COLUMN_NAME = 'IsGlobal';

-- إذا لم يكن موجوداً، قم بإضافته:
ALTER TABLE SubjectNames
ADD IsGlobal BIT NOT NULL DEFAULT 0;

-- تحديث المواد العالمية (مثال: Tajweed)
UPDATE SubjectNames
SET IsGlobal = 1
WHERE Name IN ('Tajweed', 'Quran', 'Arabic Language');
```

---

## 🧪 اختبار التعديلات

### **1. اختبار API عبر Swagger أو Postman:**

#### **Test Case 1: Year Filter with Global Course**
```http
GET /api/Subjects?yearId=7&Page=1&PageSize=15
```
**النتيجة المتوقعة:**
- جميع المواد الخاصة بـ Year 7
- + المواد العالمية (isGlobal: true)

---

#### **Test Case 2: Multiple Years with Global Courses**
```http
GET /api/Subjects?yearIds=7&yearIds=9&Page=1&PageSize=15
```
**النتيجة المتوقعة:**
- مواد Year 7 و Year 9
- + المواد العالمية

---

#### **Test Case 3: Term Filter with Global Courses**
```http
GET /api/Subjects?yearId=7&termId=41&Page=1&PageSize=15
```
**النتيجة المتوقعة:**
- مواد Year 7 في Term 41
- + المواد العالمية (تتجاهل فلتر الـ term)

---

#### **Test Case 4: Search with Global Courses**
```http
GET /api/Subjects?searchTerm=Algebra&Page=1&PageSize=15
```
**النتيجة المتوقعة:**
- جميع المواد التي تحتوي على "Algebra" في الاسم
- بما في ذلك المواد العالمية إن وجدت

---

### **2. التحقق من ترتيب النتائج:**
```json
{
  "items": [
    {
      "id": 16,
      "subjectName": "Linear Algebra",
      "yearId": 11,
      "isGlobal": false,  // ← Year-specific course (appears first)
      ...
    },
    {
      "id": 18,
      "subjectName": "English",
      "yearId": 16,
      "isGlobal": false,  // ← Year-specific course
      ...
    },
    {
      "id": 21,
      "subjectName": "Tajweed",
      "yearId": 11,
      "isGlobal": true,   // ← Global course (appears at bottom)
      ...
    }
  ],
  "page": 1,
  "pageSize": 15,
  "totalCount": 3
}
```

---

## 📊 ملخص التغييرات

| العنصر | التعديل المطلوب | الحالة |
|--------|-----------------|--------|
| **Frontend - Course Model** | إضافة `isGlobal: boolean` | ✅ تم |
| **Frontend - Sorting Logic** | ترتيب المواد العالمية في النهاية | ✅ تم |
| **Frontend - UI Badge** | إضافة Badge "Available for All Years" | ✅ تم |
| **Backend - SubjectDto** | إضافة `IsGlobal` property | ⏳ مطلوب |
| **Backend - GET /api/Subjects** | تعديل Year Filter logic | ⏳ مطلوب |
| **Backend - GET /api/Subjects** | تعديل Term Filter logic | ⏳ مطلوب |
| **Backend - Sorting** | ترتيب النتائج (عادي ثم عالمي) | ⏳ مطلوب |
| **Database - SubjectNames** | التحقق من `IsGlobal` column | ⏳ مطلوب |

---

## 🔍 نقاط هامة للمراجعة

### ✅ **1. التأكد من Include(s => s.SubjectName)**
بدون هذا الـ Include، لن يمكن الوصول إلى `SubjectName.IsGlobal` وسيحدث Null Reference Exception.

### ✅ **2. فلتر الـ Term يجب أن يتجاهل المواد العالمية**
المواد العالمية تظهر في جميع الفصول الدراسية، لذلك يجب استثناءها من فلتر الـ Term.

### ✅ **3. الترتيب مهم للـ UX**
المواد الخاصة بالسنة يجب أن تظهر أولاً، ثم المواد العالمية في النهاية.

### ✅ **4. Pagination Count**
عدد النتائج الإجمالي (TotalCount) يجب أن يشمل المواد العالمية أيضاً.

---

## 🎨 مثال على النتيجة النهائية

### **Request:**
```http
GET /api/Subjects?yearId=7&Page=1&PageSize=15
```

### **Response:**
```json
{
  "items": [
    {
      "id": 16,
      "yearId": 7,
      "subjectName": "Mathematics Year 7",
      "isGlobal": false,
      "termIds": [41, 42],
      ...
    },
    {
      "id": 17,
      "yearId": 7,
      "subjectName": "English Year 7",
      "isGlobal": false,
      "termIds": [41],
      ...
    },
    {
      "id": 21,
      "yearId": 11,  // Note: Different yearId but still appears
      "subjectName": "Tajweed",
      "isGlobal": true,  // ← Global course
      "termIds": [],
      ...
    }
  ],
  "page": 1,
  "pageSize": 15,
  "totalCount": 3,
  "totalPages": 1
}
```

في Frontend، الكارد الخاص بـ "Tajweed" سيظهر عليه Badge بنفسجي مكتوب عليه:
```
🌐 Available for All Years
```

---

## ❓ الأسئلة والأجوبة

### **Q1: هل المواد العالمية تحتاج إلى yearId في قاعدة البيانات؟**
**A:** نعم، المواد العالمية ما زالت تحتاج `yearId` للتوافق مع البنية الحالية، لكن الفلتر يتجاهل هذا الحقل عند عرضها.

### **Q2: هل يمكن للمادة العالمية أن تكون مرتبطة بـ Terms؟**
**A:** نعم ممكن، لكن عند فلترة حسب Term، المواد العالمية ستظهر دائماً بغض النظر عن الـ Term المختار.

### **Q3: هل نحتاج Endpoint منفصل للمواد العالمية؟**
**A:** لا، التعديل الحالي على `/api/Subjects` كافٍ ويوفر مرونة أكبر.

---

## 📞 جهة الاتصال

إذا كان هناك أي استفسارات حول التطبيق:
- **Frontend Developer:** Ahmed Hamdi
- **Backend Team:** الفريق المسؤول عن API

---

## 📅 Timeline المقترح

| المهمة | الوقت المتوقع | الأولوية |
|--------|---------------|---------|
| تعديل SubjectDto | 15 دقيقة | 🔴 عالية |
| تعديل GET /api/Subjects | 30 دقيقة | 🔴 عالية |
| التحقق من Database | 10 دقائق | 🔴 عالية |
| الاختبار | 30 دقيقة | 🟡 متوسطة |
| **الإجمالي** | **~1.5 ساعة** | - |

---

**✅ Frontend تم تطبيقه بنجاح**  
**⏳ Backend في انتظار التطبيق**

---

**نهاية التقرير**
