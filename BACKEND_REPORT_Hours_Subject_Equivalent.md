# 📌 BACKEND REPORT: Hours Package = Subject Equivalent

## Endpoint
`POST /api/Tutoring/CalculatePrice`

---

## 🎯 Business Rule

**كل 10 ساعات = مادة واحدة في حساب الخصم**

| Hours | Subject Equivalent |
|-------|-------------------|
| 10h | 1 subject |
| 20h | 2 subjects |
| 30h | 3 subjects |

---

## 📐 Calculation Formula

```csharp
// Calculate effective subject count for a student
int effectiveSubjectCount = student.Subjects.Sum(s => s.Hours / 10);

// Get discount percentage based on effective count
decimal discountPercent = GetMultiSubjectDiscount(effectiveSubjectCount);

// Example discount table:
// 1 effective = 0%
// 2 effective = 5%
// 3 effective = 10%
// 4 effective = 15%
// 5+ effective = 20% (capped)
```

---

## 📊 Example Calculation

### Input:
**ch6** has:
- Math: 20 hours
- English: 30 hours

### Step 1: Calculate Effective Subject Count
```
Math: 20h ÷ 10 = 2 subjects
English: 30h ÷ 10 = 3 subjects
─────────────────────────────
Total Effective: 5 subjects
```

### Step 2: Get Discount Percentage
```
5 subjects → 20% discount (capped at max)
```

### Step 3: Apply to ALL Subjects
```
Math:    $200 × 20% = $40 discount → Final: $160
English: $300 × 20% = $60 discount → Final: $240
```

---

## ❌ Current Wrong Behavior

The current implementation treats hours and multi-subject as **separate discounts**:
```
Math: 5% (multi-subject) + 10% (hours) = 15%
```

## ✅ Correct Behavior

Hours should **contribute to subject count**, not be a separate discount:
```
effectiveSubjects = 2 + 3 = 5
discountPercent = 20% (for 5 subjects)
```

---

## 🔧 Implementation

### Step 1: Calculate Effective Subject Count
```csharp
public int GetEffectiveSubjectCount(List<SubjectSelection> subjects)
{
    // Each 10 hours = 1 subject equivalent
    return subjects.Sum(s => s.Hours / 10);
}
```

### Step 2: Get Discount Percentage
```csharp
public decimal GetDiscountPercentage(int effectiveCount)
{
    return effectiveCount switch
    {
        1 => 0m,
        2 => 5m,
        3 => 10m,
        4 => 15m,
        _ => 20m  // 5+ subjects = 20% max
    };
}
```

### Step 3: Apply to All Subjects
```csharp
public void CalculateStudentDiscounts(StudentSelection student, int totalStudents)
{
    // Calculate effective subject count (hours / 10)
    int effectiveCount = GetEffectiveSubjectCount(student.Subjects);
    
    // Get single discount percentage (NOT separate multi-subject + hours)
    decimal subjectDiscountPercent = GetDiscountPercentage(effectiveCount);
    
    // Get multi-student discount (separate, applies to all students)
    decimal multiStudentPercent = GetMultiStudentDiscount(totalStudents);
    
    // Combined discount (capped at 20%)
    decimal combinedPercent = Math.Min(subjectDiscountPercent + multiStudentPercent, 20m);
    
    // Apply to ALL subjects for this student
    foreach (var subject in student.Subjects)
    {
        decimal discountAmount = subject.BasePrice * combinedPercent / 100;
        subject.TotalDiscount = discountAmount;
        subject.FinalPrice = subject.BasePrice - discountAmount;
        
        // For display breakdown:
        subject.Discounts = new SubjectDiscounts
        {
            // Combine into single "Package" discount
            SubjectPackage = new DiscountDetail
            {
                Percentage = subjectDiscountPercent,
                Amount = subject.BasePrice * subjectDiscountPercent / 100,
                Reason = $"{effectiveCount} effective subjects ({subjectDiscountPercent}%)"
            },
            MultiStudents = new DiscountDetail
            {
                Percentage = multiStudentPercent,
                Amount = subject.BasePrice * multiStudentPercent / 100,
                Reason = $"Multi-student discount: {totalStudents} students"
            },
            Group = new DiscountDetail { ... }
        };
    }
}
```

---

## 📊 Expected Response (Corrected)

### Input:
- **ahmed2**: Linear Algebra (10h)
- **ch6**: Math (20h) + English (30h)
- **Total students**: 2

### Calculations:

**ahmed2:**
- Effective subjects: 10 ÷ 10 = **1 subject**
- Subject discount: 0%
- Multi-student: 5%
- **Combined: 5%**

**ch6:**
- Effective subjects: (20 + 30) ÷ 10 = **5 subjects**
- Subject discount: 20%
- Multi-student: 5%
- Combined: 25% → **Capped at 20%**

### Expected Response:
```json
{
    "students": [
        {
            "studentId": 31,
            "studentName": "ahmed2",
            "subjects": [
                {
                    "subjectName": "Linear Algebra",
                    "hours": 10,
                    "basePrice": 100,
                    "discounts": {
                        "subjectPackage": {
                            "percentage": 0,
                            "amount": 0,
                            "effectiveSubjects": 1,
                            "reason": "1 effective subject (no discount)"
                        },
                        "multiStudents": {
                            "percentage": 5.00,
                            "amount": 5.00,
                            "reason": "Multi-student: 2 students"
                        }
                    },
                    "combinedDiscountPercentage": 5.00,
                    "totalDiscount": 5.00,
                    "finalPrice": 95.00
                }
            ],
            "effectiveSubjectCount": 1,
            "studentTotal": 95.00
        },
        {
            "studentId": 35,
            "studentName": "ch6",
            "subjects": [
                {
                    "subjectName": "Math",
                    "hours": 20,
                    "basePrice": 200,
                    "discounts": {
                        "subjectPackage": {
                            "percentage": 20.00,
                            "amount": 40.00,
                            "effectiveSubjects": 5,
                            "reason": "5 effective subjects (20% - capped)"
                        },
                        "multiStudents": {
                            "percentage": 0,
                            "amount": 0,
                            "reason": "Absorbed by 20% cap"
                        }
                    },
                    "combinedDiscountPercentage": 20.00,
                    "totalDiscount": 40.00,
                    "finalPrice": 160.00
                },
                {
                    "subjectName": "English",
                    "hours": 30,
                    "basePrice": 300,
                    "discounts": {
                        "subjectPackage": {
                            "percentage": 20.00,
                            "amount": 60.00,
                            "effectiveSubjects": 5,
                            "reason": "5 effective subjects (20% - capped)"
                        },
                        "multiStudents": {
                            "percentage": 0,
                            "amount": 0,
                            "reason": "Absorbed by 20% cap"
                        }
                    },
                    "combinedDiscountPercentage": 20.00,
                    "totalDiscount": 60.00,
                    "finalPrice": 240.00
                }
            ],
            "effectiveSubjectCount": 5,
            "studentTotal": 400.00
        }
    ],
    "grandTotal": 495.00,
    "totalDiscount": 105.00,
    "breakdown": {
        "subjectPackageSavings": 100.00,
        "multiStudentsSavings": 5.00,
        "groupSavings": 0
    }
}
```

---

## 📋 Summary

| Aspect | Old (Wrong) | New (Correct) |
|--------|-------------|---------------|
| Hours discount | Separate % | Contributes to subject count |
| Multi-subject discount | Separate % | Based on effective count |
| Formula | multiSubject% + hours% | effectiveSubjects = Σ(hours/10) |
| Discount source | Each discount separate | Single "Package" discount |

---

## ✅ Verification Checklist

| Test Case | Expected |
|-----------|----------|
| 1 subject, 10h | 0% package discount |
| 1 subject, 20h | 5% (2 effective) |
| 1 subject, 30h | 10% (3 effective) |
| 2 subjects, 10h each | 5% (2 effective) |
| 2 subjects, 20h + 30h | 20% (5 effective, capped) |
| Add 2 students | +5% multi-student (capped at 20% total) |

---

## Request

Please update the `CalculatePrice` endpoint:
1. Remove separate "hours" and "multiSubject" discounts
2. Calculate **effectiveSubjectCount = Σ(hours / 10)**
3. Apply single **Package discount** based on effective count
4. Add multi-student discount (capped at 20% total)

Confirm when ready:
```
✔ BACKEND FIX CONFIRMED
```
