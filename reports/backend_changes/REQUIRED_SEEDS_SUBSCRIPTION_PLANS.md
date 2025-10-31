# 🌱 Required Database Seeds Report

## Report Date: October 31, 2025
## Purpose: Seed Data Required for Cart & Subscription System

---

## 🎯 Executive Summary

The frontend cart system requires specific seed data to function properly. Currently, the backend is missing **subscription plans** linked to subjects, causing the error: **"لا توجد خطط اشتراك متاحة لهذه المادة"**

This report provides complete seed data that must be added to the database for the cart and subscription system to work.

---

## 📊 Critical Issue Analysis

### Current Database State (Assumed):
```
✅ Subjects table exists with data
✅ Categories table exists with data
❌ SubscriptionPlans table empty or missing relationship
❌ No plans linked to subjects
```

### Required State:
```
✅ Subjects table with data
✅ Categories table with data
✅ SubscriptionPlans table populated
✅ SubscriptionPlans linked to SubjectId
```

---

## 🗄️ Database Schema Requirements

### 1. SubscriptionPlans Table

**Required Columns:**
```sql
CREATE TABLE SubscriptionPlans (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(500),
    Price DECIMAL(18,2) NOT NULL,
    PlanType NVARCHAR(50) NOT NULL,  -- 'SingleTerm', 'FullYear', 'Monthly', etc.
    IsActive BIT NOT NULL DEFAULT 1,
    DurationInDays INT NOT NULL,
    SubjectId INT,  -- ⚠️ Critical: Foreign key to Subjects
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_SubscriptionPlans_Subjects 
        FOREIGN KEY (SubjectId) REFERENCES Subjects(Id)
);
```

**If using many-to-many relationship:**
```sql
CREATE TABLE SubjectSubscriptionPlans (
    SubjectId INT NOT NULL,
    SubscriptionPlanId INT NOT NULL,
    
    PRIMARY KEY (SubjectId, SubscriptionPlanId),
    CONSTRAINT FK_SubjectPlans_Subject 
        FOREIGN KEY (SubjectId) REFERENCES Subjects(Id),
    CONSTRAINT FK_SubjectPlans_Plan 
        FOREIGN KEY (SubscriptionPlanId) REFERENCES SubscriptionPlans(Id)
);
```

---

## 🌱 Seed Data - Subscription Plans

### Scenario 1: Existing Subjects (from Swagger/API)

Based on the current subjects in the system, here are recommended subscription plans:

```sql
-- ============================================
-- SEED: Subscription Plans for English
-- ============================================

INSERT INTO SubscriptionPlans (Name, Description, Price, PlanType, IsActive, DurationInDays, SubjectId)
VALUES
    ('English - Term 1', 'Complete Term 1 English curriculum with reading, writing, and comprehension', 29.99, 'SingleTerm', 1, 90, 1),
    ('English - Full Year', 'Complete year English curriculum covering all 4 terms', 99.99, 'FullYear', 1, 365, 1),
    ('English - Monthly', 'Monthly subscription for English courses', 12.99, 'Monthly', 1, 30, 1);

-- ============================================
-- SEED: Subscription Plans for Mathematics
-- ============================================

INSERT INTO SubscriptionPlans (Name, Description, Price, PlanType, IsActive, DurationInDays, SubjectId)
VALUES
    ('Mathematics - Term 1', 'Complete Term 1 Mathematics curriculum', 29.99, 'SingleTerm', 1, 90, 2),
    ('Mathematics - Full Year', 'Complete year Mathematics curriculum covering all 4 terms', 99.99, 'FullYear', 1, 365, 2),
    ('Mathematics - Monthly', 'Monthly subscription for Mathematics courses', 12.99, 'Monthly', 1, 30, 2);

-- ============================================
-- SEED: Subscription Plans for Science
-- ============================================

INSERT INTO SubscriptionPlans (Name, Description, Price, PlanType, IsActive, DurationInDays, SubjectId)
VALUES
    ('Science - Term 1', 'Complete Term 1 Science curriculum', 29.99, 'SingleTerm', 1, 90, 3),
    ('Science - Full Year', 'Complete year Science curriculum covering all 4 terms', 99.99, 'FullYear', 1, 365, 3),
    ('Science - Monthly', 'Monthly subscription for Science courses', 12.99, 'Monthly', 1, 30, 3);

-- ============================================
-- SEED: Subscription Plans for Physics
-- ============================================

INSERT INTO SubscriptionPlans (Name, Description, Price, PlanType, IsActive, DurationInDays, SubjectId)
VALUES
    ('Physics - Term 1', 'Explore the fascinating world of physics through hands-on learning and experiments', 0.00, 'SingleTerm', 1, 90, 4),
    ('Physics - Full Year', 'Complete year Physics curriculum', 0.00, 'FullYear', 1, 365, 4),
    ('Physics - Monthly', 'Monthly subscription for Physics courses', 0.00, 'Monthly', 1, 30, 4);
```

---

## 🔄 Alternative: Many-to-Many Approach

If using junction table:

```sql
-- First, create subscription plans WITHOUT SubjectId
INSERT INTO SubscriptionPlans (Name, Description, Price, PlanType, IsActive, DurationInDays)
VALUES
    ('Term 1 Plan', 'Single term subscription', 29.99, 'SingleTerm', 1, 90),
    ('Full Year Plan', 'Full year subscription with 20% discount', 99.99, 'FullYear', 1, 365),
    ('Monthly Plan', 'Flexible monthly subscription', 12.99, 'Monthly', 1, 30);

-- Then, link them to subjects
INSERT INTO SubjectSubscriptionPlans (SubjectId, SubscriptionPlanId)
VALUES
    -- English (SubjectId = 1)
    (1, 1), (1, 2), (1, 3),
    -- Mathematics (SubjectId = 2)
    (2, 1), (2, 2), (2, 3),
    -- Science (SubjectId = 3)
    (3, 1), (3, 2), (3, 3),
    -- Physics (SubjectId = 4)
    (4, 1), (4, 2), (4, 3);
```

---

## 📝 C# Seeder Class

Create `DatabaseSeeder.cs` in your backend:

```csharp
using Microsoft.EntityFrameworkCore;

public class DatabaseSeeder
{
    private readonly ApplicationDbContext _context;

    public DatabaseSeeder(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task SeedSubscriptionPlans()
    {
        // Check if already seeded
        if (await _context.SubscriptionPlans.AnyAsync())
        {
            Console.WriteLine("Subscription plans already exist. Skipping seed.");
            return;
        }

        var subjects = await _context.Subjects.ToListAsync();

        var plans = new List<SubscriptionPlan>();

        foreach (var subject in subjects)
        {
            plans.AddRange(new[]
            {
                new SubscriptionPlan
                {
                    Name = $"{subject.SubjectName} - Term 1",
                    Description = $"Complete Term 1 {subject.SubjectName} curriculum",
                    Price = 29.99m,
                    PlanType = "SingleTerm",
                    IsActive = true,
                    DurationInDays = 90,
                    SubjectId = subject.Id
                },
                new SubscriptionPlan
                {
                    Name = $"{subject.SubjectName} - Full Year",
                    Description = $"Complete year {subject.SubjectName} curriculum",
                    Price = 99.99m,
                    PlanType = "FullYear",
                    IsActive = true,
                    DurationInDays = 365,
                    SubjectId = subject.Id
                },
                new SubscriptionPlan
                {
                    Name = $"{subject.SubjectName} - Monthly",
                    Description = $"Monthly subscription for {subject.SubjectName}",
                    Price = 12.99m,
                    PlanType = "Monthly",
                    IsActive = true,
                    DurationInDays = 30,
                    SubjectId = subject.Id
                }
            });
        }

        await _context.SubscriptionPlans.AddRangeAsync(plans);
        await _context.SaveChangesAsync();

        Console.WriteLine($"✅ Seeded {plans.Count} subscription plans");
    }
}
```

### Call in Program.cs or Startup.cs:

```csharp
// In Program.cs (after app is built)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var seeder = new DatabaseSeeder(context);
    
    await seeder.SeedSubscriptionPlans();
}
```

---

## 🧪 Verification Queries

### Check if plans exist:
```sql
SELECT 
    s.Id AS SubjectId,
    s.SubjectName,
    COUNT(sp.Id) AS PlanCount
FROM Subjects s
LEFT JOIN SubscriptionPlans sp ON s.Id = sp.SubjectId
GROUP BY s.Id, s.SubjectName;
```

**Expected Result:**
```
SubjectId | SubjectName  | PlanCount
----------|--------------|----------
1         | English      | 3
2         | Mathematics  | 3
3         | Science      | 3
4         | Physics      | 3
```

### View all plans with subject names:
```sql
SELECT 
    sp.Id,
    sp.Name,
    sp.Price,
    sp.PlanType,
    sp.DurationInDays,
    s.SubjectName,
    sp.IsActive
FROM SubscriptionPlans sp
INNER JOIN Subjects s ON sp.SubjectId = s.Id
ORDER BY s.SubjectName, sp.Price;
```

---

## 📊 Recommended Plan Types & Pricing

### 1. Educational Standard Pricing:

| Plan Type | Duration | Price | Discount | Best For |
|-----------|----------|-------|----------|----------|
| **Monthly** | 30 days | $12.99 | - | Trial, Flexible |
| **Single Term** | 90 days | $29.99 | 23% off | One term focus |
| **Full Year** | 365 days | $99.99 | 36% off | Committed students |

### 2. Premium Subjects (Optional):
```sql
-- For premium subjects like Advanced Mathematics or Physics
Price = 39.99 (Term), 149.99 (Year)
```

### 3. Bundle Plans (Optional):
```sql
INSERT INTO SubscriptionPlans (Name, Description, Price, PlanType, IsActive, DurationInDays, SubjectId)
VALUES
    ('All Subjects Bundle - Term', 'Access all subjects for one term', 79.99, 'Bundle', 1, 90, NULL),
    ('All Subjects Bundle - Year', 'Access all subjects for full year', 249.99, 'Bundle', 1, 365, NULL);
```

---

## 🔧 Backend API Requirements

### After seeding, verify API returns plans:

**Test Endpoint:**
```http
GET https://naplan2.runasp.net/api/Subjects
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "subjectName": "English",
      "price": 29.99,
      "subscriptionPlans": [  // ✅ This must exist
        {
          "id": 1,
          "name": "English - Term 1",
          "description": "Complete Term 1 English curriculum",
          "price": 29.99,
          "planType": "SingleTerm",
          "isActive": true,
          "durationInDays": 90
        },
        {
          "id": 2,
          "name": "English - Full Year",
          "description": "Complete year English curriculum",
          "price": 99.99,
          "planType": "FullYear",
          "isActive": true,
          "durationInDays": 365
        }
      ]
    }
  ]
}
```

---

## 🚀 Implementation Steps

### Step 1: Backup Database
```sql
BACKUP DATABASE [NaplanBridge] 
TO DISK = 'C:\Backups\NaplanBridge_BeforeSeed.bak';
```

### Step 2: Check Current Subjects
```sql
SELECT Id, SubjectName FROM Subjects ORDER BY Id;
```

### Step 3: Run Seed Script
```sql
-- Use the SQL seed script provided above
-- Adjust SubjectId values based on actual IDs from Step 2
```

### Step 4: Verify Seeds
```sql
SELECT COUNT(*) FROM SubscriptionPlans;
-- Should return at least 12 (4 subjects × 3 plans each)
```

### Step 5: Test API
```bash
curl -X GET "https://naplan2.runasp.net/api/Subjects" \
     -H "Authorization: Bearer {token}"
```

### Step 6: Test Frontend
- Clear browser cache
- Reload courses page
- Click "Add to Cart"
- Should see plan selection modal

---

## ⚠️ Common Issues & Solutions

### Issue 1: "SubjectId column doesn't exist"
**Solution:** Run migration to add column:
```sql
ALTER TABLE SubscriptionPlans 
ADD SubjectId INT NULL;

ALTER TABLE SubscriptionPlans
ADD CONSTRAINT FK_SubscriptionPlans_Subjects 
FOREIGN KEY (SubjectId) REFERENCES Subjects(Id);
```

### Issue 2: "Plans not showing in API"
**Solution:** Add `.Include()` in controller:
```csharp
var subjects = await _context.Subjects
    .Include(s => s.SubscriptionPlans)
    .ToListAsync();
```

### Issue 3: "Cart still shows 'no plans' error"
**Solution:** 
1. Clear API cache
2. Restart backend server
3. Hard refresh frontend (Ctrl+Shift+R)
4. Check browser console for actual API response

---

## 📈 Expected Results After Seeding

### Before:
```
❌ "لا توجد خطط اشتراك متاحة لهذه المادة"
❌ Cannot add to cart
❌ Empty subscriptionPlans array
```

### After:
```
✅ Plan selection modal appears
✅ Shows multiple plan options
✅ Can add to cart successfully
✅ subscriptionPlans array populated
```

---

## 📝 Testing Checklist

- [ ] Subjects table has data
- [ ] SubscriptionPlans table exists
- [ ] Plans seeded successfully
- [ ] Plans linked to subjects (SubjectId set)
- [ ] API returns subscriptionPlans array
- [ ] Frontend shows plan modal
- [ ] Can select and add plan to cart
- [ ] Cart displays correct plan info
- [ ] Checkout works with plan ID

---

## 🎯 Priority & Timeline

| Task | Priority | Estimated Time | Status |
|------|----------|----------------|--------|
| Create SubscriptionPlans table | 🔴 Critical | 15 min | Pending |
| Run seed script | 🔴 Critical | 10 min | Pending |
| Update API to include plans | 🔴 Critical | 30 min | Pending |
| Test frontend cart | 🟡 High | 15 min | Pending |
| Create seeder class | 🟢 Medium | 45 min | Optional |

**Total Estimated Time:** 1-2 hours

---

## 📞 Support Information

**If seeds fail, check:**
1. Database connection string
2. Subjects table has valid data
3. Foreign key constraints enabled
4. Entity Framework migrations up to date

**For help, provide:**
- SQL error message
- Subjects table structure
- Current SubscriptionPlans table structure
- API response from GET /api/Subjects

---

## ✅ Success Criteria

Seeds are successful when:

1. ✅ At least 3 plans per subject exist
2. ✅ All plans have `SubjectId` set
3. ✅ API returns plans in subject response
4. ✅ Frontend cart modal shows plans
5. ✅ Can complete purchase flow

---

**Report Status:** ✅ Complete & Ready for Implementation  
**Next Action:** Execute seed scripts in staging environment first, then production  
**Contact:** Backend team for implementation
