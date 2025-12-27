# 📌 BACKEND REPORT: Discount Cap Implementation (FINAL)

## 📋 Issue Summary
**Feature**: Maximum Combined Discount Cap (20%) + Cumulative Hours Discount  
**Endpoint**: `POST /api/Tutoring/CalculatePrice` and `POST /api/Tutoring/create-order-v2`  
**Priority**: HIGH  
**Date**: 2025-12-27 (Final Update)

---

## 🎯 Business Rules (FINAL)

### Rule 1: Multi-Subject Discount (Per Student)
Based on the number of subjects selected for a student:
- 2 subjects = 5%
- 3 subjects = 10%
- 4 subjects = 15%
- 5+ subjects = 20%

**Applied to**: Entire student invoice (all subjects)

### Rule 2: Hours Package Discount (CUMULATIVE)
**⚠️ CRITICAL**: Hours discount is **CUMULATIVE** - each subject contributes its own hours tier discount.

| Subject Hours | Discount Contribution |
|---------------|----------------------|
| 10 hours      | +0%                  |
| 20 hours      | +5%                  |
| 30 hours      | +10%                 |

**Example:**
- Subject 1: 20 hours → +5%
- Subject 2: 30 hours → +10%
- Subject 3: 10 hours → +0%
- **Total Hours Discount = 5% + 10% + 0% = 15%**

### Rule 3: Maximum Combined Discount = 20%
```
Total Discount = Multi-Subject Discount + Cumulative Hours Discount
Total Discount MUST NOT EXCEED 20%
```

---

## 📊 Complete Scenarios

### Scenario 1: 2 subjects (20h + 30h)
```
Subjects: 2 → Multi-Subject Discount = 5%
Hours Discounts: 5% (20h) + 10% (30h) = 15%
Available after multi-subject: 20% - 5% = 15%
Effective Hours Discount: min(15%, 15%) = 15%
Total: 5% + 15% = 20% ✅
```

### Scenario 2: 2 subjects (20h + 20h)
```
Subjects: 2 → Multi-Subject Discount = 5%
Hours Discounts: 5% (20h) + 5% (20h) = 10%
Available after multi-subject: 20% - 5% = 15%
Effective Hours Discount: min(10%, 15%) = 10%
Total: 5% + 10% = 15% ✅
```

### Scenario 3: 3 subjects (30h + 30h + 10h)
```
Subjects: 3 → Multi-Subject Discount = 10%
Hours Discounts: 10% (30h) + 10% (30h) + 0% (10h) = 20%
Available after multi-subject: 20% - 10% = 10%
Effective Hours Discount: min(20%, 10%) = 10% (CAPPED!)
Total: 10% + 10% = 20% ✅
```

### Scenario 4: 4 subjects (20h + 20h + 20h + 20h)
```
Subjects: 4 → Multi-Subject Discount = 15%
Hours Discounts: 5% × 4 = 20%
Available after multi-subject: 20% - 15% = 5%
Effective Hours Discount: min(20%, 5%) = 5% (CAPPED!)
Total: 15% + 5% = 20% ✅
```

### Scenario 5: 5 subjects (all 10h)
```
Subjects: 5 → Multi-Subject Discount = 20%
Hours Discounts: 0% × 5 = 0%
Available after multi-subject: 20% - 20% = 0%
Effective Hours Discount: 0%
Total: 20% ✅
```

---

## 🔧 Backend Implementation Algorithm

```csharp
public class StudentDiscountCalculator
{
    private const decimal MAX_TOTAL_DISCOUNT = 20m;
    
    public StudentDiscountResult CalculateStudentDiscount(
        List<SubjectSelection> subjects,
        DiscountRulesDto discountRules)
    {
        int subjectCount = subjects.Count;
        
        // Step 1: Calculate multi-subject discount
        decimal multiSubjectDiscount = GetMultiSubjectDiscount(subjectCount, discountRules);
        
        // Step 2: Calculate CUMULATIVE hours discount
        decimal cumulativeHoursDiscount = 0;
        foreach (var subject in subjects)
        {
            cumulativeHoursDiscount += GetSubjectHoursDiscount(subject.Hours, discountRules);
        }
        
        // Step 3: Calculate remaining discount available after multi-subject
        decimal remainingDiscount = MAX_TOTAL_DISCOUNT - multiSubjectDiscount;
        
        // Step 4: Cap hours discount to remaining available
        decimal effectiveHoursDiscount = Math.Min(cumulativeHoursDiscount, Math.Max(0, remainingDiscount));
        
        // Step 5: Calculate total discount
        decimal totalDiscount = multiSubjectDiscount + effectiveHoursDiscount;
        
        return new StudentDiscountResult
        {
            SubjectCount = subjectCount,
            MultiSubjectDiscountPercentage = multiSubjectDiscount,
            CumulativeHoursDiscountPercentage = cumulativeHoursDiscount,
            EffectiveHoursDiscountPercentage = effectiveHoursDiscount,
            TotalDiscountPercentage = totalDiscount,
            IsCapped = cumulativeHoursDiscount > effectiveHoursDiscount
        };
    }
    
    private decimal GetSubjectHoursDiscount(int hours, DiscountRulesDto rules)
    {
        if (!rules.HoursDiscount.IsActive)
            return 0;
            
        if (hours >= 30)
            return rules.HoursDiscount.Tiers.Hours30;
        if (hours >= 20)
            return rules.HoursDiscount.Tiers.Hours20;
            
        return 0;
    }
    
    private decimal GetMultiSubjectDiscount(int count, DiscountRulesDto rules)
    {
        if (!rules.MultiSubjectDiscount.IsActive || count <= 1)
            return 0;
            
        var tiers = rules.MultiSubjectDiscount.Tiers;
        
        if (count >= 5) return tiers.Subjects5;
        if (count >= 4) return tiers.Subjects4;
        if (count >= 3) return tiers.Subjects3;
        if (count >= 2) return tiers.Subjects2;
        
        return 0;
    }
}
```

---

## 📊 Expected API Response Structure

### Request: `POST /api/Tutoring/CalculatePrice`

```json
{
  "students": [
    {
      "studentId": 123,
      "subjects": [
        { "subjectId": 1, "hours": 20, "teachingType": "OneToOne" },
        { "subjectId": 2, "hours": 30, "teachingType": "OneToOne" }
      ]
    }
  ]
}
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "students": [
      {
        "studentId": 123,
        "studentName": "Ahmed",
        "subjectCount": 2,
        "discountBreakdown": {
          "multiSubject": {
            "percentage": 5,
            "reason": "2 subjects selected"
          },
          "hoursPackage": {
            "cumulativePercentage": 15,
            "effectivePercentage": 15,
            "subjectContributions": [
              { "subjectId": 1, "hours": 20, "discount": 5 },
              { "subjectId": 2, "hours": 30, "discount": 10 }
            ],
            "cappedDueToMaxDiscount": false,
            "reason": "Cumulative hours discount"
          },
          "totalPercentage": 20,
          "isMaxReached": true
        },
        "subjects": [
          {
            "subjectId": 1,
            "hours": 20,
            "basePrice": 100,
            "subtotal": 2000,
            "discountApplied": 20,
            "discountAmount": 400,
            "finalPrice": 1600
          },
          {
            "subjectId": 2,
            "hours": 30,
            "basePrice": 100,
            "subtotal": 3000,
            "discountApplied": 20,
            "discountAmount": 600,
            "finalPrice": 2400
          }
        ],
        "studentSubtotal": 5000,
        "studentDiscountAmount": 1000,
        "studentFinalPrice": 4000
      }
    ],
    "grandTotal": 4000
  }
}
```

---

## 🧪 Test Cases

### Test Case 1: 2 subjects (20h + 30h) → 20% total
```
Input: 2 subjects, hours [20, 30]
Expected:
  - Multi-subject: 5%
  - Hours: 5% + 10% = 15%
  - Total: 20% ✅
```

### Test Case 2: 2 subjects (20h + 20h) → 15% total
```
Input: 2 subjects, hours [20, 20]
Expected:
  - Multi-subject: 5%
  - Hours: 5% + 5% = 10%
  - Total: 15% ✅
```

### Test Case 3: 3 subjects (30h + 30h + 30h) → 20% total (capped)
```
Input: 3 subjects, hours [30, 30, 30]
Expected:
  - Multi-subject: 10%
  - Hours raw: 30%
  - Hours capped: 10%
  - Total: 20% (capped) ✅
```

### Test Case 4: 4 subjects (all 20h) → 20% total (capped)
```
Input: 4 subjects, hours [20, 20, 20, 20]
Expected:
  - Multi-subject: 15%
  - Hours raw: 20%
  - Hours capped: 5%
  - Total: 20% (capped) ✅
```

### Test Case 5: 1 subject (30h) → 10% total
```
Input: 1 subject, hours [30]
Expected:
  - Multi-subject: 0%
  - Hours: 10%
  - Total: 10% ✅
```

---

## ⚠️ Key Points for Backend

1. **Hours discount is CUMULATIVE** - each subject adds its own tier discount
2. **Same discount percentage applies to ALL subjects** for that student
3. **Capping happens at student level after summing all hours discounts**
4. Frontend now shows cumulative hours breakdown

---

## ✅ Acceptance Criteria

1. [ ] Each subject's hours tier contributes to cumulative hours discount
2. [ ] Combined discount (multi-subject + cumulative hours) capped at 20%
3. [ ] `CalculatePrice` returns proper breakdown showing cumulative
4. [ ] `create-order-v2` uses same calculation logic
5. [ ] All test cases pass

---

## 📬 Request

Please confirm when this is implemented and tested. Reply with:

```
✔ BACKEND FIX CONFIRMED
- CalculatePrice endpoint updated with cumulative hours discount
- create-order-v2 endpoint updated  
- Test cases verified
```

---

**Frontend Implementation**: ✅ Completed (Cumulative Hours Discount)  
**Backend Implementation**: ⏳ Pending Confirmation
