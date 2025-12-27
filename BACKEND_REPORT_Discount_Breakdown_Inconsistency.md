# 📌 BACKEND REPORT: Discount Breakdown Inconsistency (Cap Not Reflected)

## Endpoint
`POST /api/Tutoring/CalculatePrice`

---

## 🚨 Issue Summary

The `breakdown` object and individual discount amounts show **pre-cap values** instead of **actual applied values**. This causes:
1. `totalDiscount` to show incorrect sum
2. Confusion between calculated vs applied discounts
3. Mismatch between `breakdown` totals and actual savings

---

## ❌ Current Wrong Behavior

### Input:
- **ch6**: 2 subjects
  - Math: 20h, OneToOne, $200
  - English: 20h, Group, $200

### Response (Wrong):
```json
{
    "subjects": [
        {
            "subjectName": "Math",
            "basePrice": 200,
            "discounts": {
                "package": { "amount": 30.00 },
                "group": { "amount": 0 }
            },
            "totalDiscount": 30.00,
            "finalPrice": 170.00
        },
        {
            "subjectName": "English",
            "basePrice": 200,
            "discounts": {
                "package": { "amount": 30.00 },  // Pre-cap
                "group": { "amount": 70.00 }     // ❌ Pre-cap (35% × $200)
            },
            "totalDiscount": 40.00,              // ✓ Correct (capped at 20%)
            "finalPrice": 160.00                 // ✓ Correct
        }
    ],
    "grandTotal": 330.00,
    "totalDiscount": 130.00,    // ❌ WRONG! (60 + 70 = 130, but actual is 70)
    "breakdown": {
        "packageSavings": 60.00,  // ✓ Correct
        "groupSavings": 70.00     // ❌ WRONG! Should be 10 (after cap)
    }
}
```

### The Math Problem:
```
Actual discounts applied:
  Math:    $30 (package only)
  English: $40 (capped at 20% = $40)
  ───────────────────────────────
  Total:   $70

But response shows:
  totalDiscount: $130 ❌
  
Because:
  packageSavings: $60 (30 + 30) ✓
  groupSavings:   $70 (pre-cap)  ❌
  Sum:            $130           ❌
```

---

## ✅ Expected Correct Behavior

### For English Subject (Group + Package):
```
Available discounts:
  Package: 15% = $30
  Group:   35% = $70
  Total:   50% = $100

After 20% cap:
  Max discount: 20% = $40
  
Applied breakdown:
  Package: $30 (full amount, fits in cap)
  Group:   $10 (remaining: $40 - $30 = $10)
```

### Correct Response:
```json
{
    "subjects": [
        {
            "subjectName": "Math",
            "basePrice": 200,
            "discounts": {
                "package": { 
                    "percentage": 15.00,
                    "calculatedAmount": 30.00,
                    "appliedAmount": 30.00      // ✅ Same (no cap hit)
                },
                "group": { 
                    "percentage": 0,
                    "calculatedAmount": 0,
                    "appliedAmount": 0
                }
            },
            "totalDiscount": 30.00,
            "finalPrice": 170.00
        },
        {
            "subjectName": "English",
            "basePrice": 200,
            "discounts": {
                "package": { 
                    "percentage": 15.00,
                    "calculatedAmount": 30.00,
                    "appliedAmount": 30.00      // ✅ Full amount applied
                },
                "group": { 
                    "percentage": 35.00,
                    "calculatedAmount": 70.00,  // What it WOULD be
                    "appliedAmount": 10.00      // ✅ After cap ($40 - $30)
                }
            },
            "totalDiscount": 40.00,
            "finalPrice": 160.00,
            "cappedDueToMaxDiscount": true,
            "discountBeforeCap": 100.00,
            "discountAfterCap": 40.00
        }
    ],
    "grandTotal": 330.00,
    "totalDiscount": 70.00,         // ✅ Correct (30 + 40)
    "breakdown": {
        "packageSavings": 60.00,    // ✅ (30 + 30)
        "groupSavings": 10.00,      // ✅ After cap (not 70!)
        "multiStudentsSavings": 0
    }
}
```

---

## 🔧 Implementation Fix

### Option A: Add `appliedAmount` field (Recommended)
```csharp
public class DiscountDetail
{
    public decimal Percentage { get; set; }
    public decimal CalculatedAmount { get; set; }  // Before cap
    public decimal AppliedAmount { get; set; }     // After cap ✅
    public string Reason { get; set; }
}
```

### Option B: Only show applied amounts
```csharp
// When calculating discounts with cap:
decimal totalBeforeCap = package + group + multiStudent;
decimal cappedTotal = Math.Min(totalBeforeCap, maxDiscount);

if (cappedTotal < totalBeforeCap)
{
    // Proportionally reduce each discount
    decimal ratio = cappedTotal / totalBeforeCap;
    packageApplied = package * ratio;
    groupApplied = group * ratio;
    multiStudentApplied = multiStudent * ratio;
}
```

### Priority-Based Cap (Recommended):
```csharp
// Apply discounts in priority order until cap reached
decimal remaining = maxDiscount; // 20% of base price

// Priority 1: Package discount
decimal packageApplied = Math.Min(packageAmount, remaining);
remaining -= packageApplied;

// Priority 2: Group discount
decimal groupApplied = Math.Min(groupAmount, remaining);
remaining -= groupApplied;

// Priority 3: Multi-student discount
decimal multiStudentApplied = Math.Min(multiStudentAmount, remaining);
```

---

## 📐 Validation Rules

### Rule 1: totalDiscount must match sum of finalPrice differences
```csharp
decimal expectedTotal = subjects.Sum(s => s.BasePrice - s.FinalPrice);
Assert(totalDiscount == expectedTotal);
```

### Rule 2: breakdown must match totalDiscount
```csharp
decimal breakdownSum = breakdown.PackageSavings 
                     + breakdown.GroupSavings 
                     + breakdown.MultiStudentsSavings;
Assert(breakdownSum == totalDiscount);
```

### Rule 3: Each subject's discount amounts must sum to totalDiscount
```csharp
foreach (var subject in subjects)
{
    decimal discountSum = subject.Discounts.Package.AppliedAmount
                        + subject.Discounts.Group.AppliedAmount
                        + subject.Discounts.MultiStudents.AppliedAmount;
    Assert(discountSum == subject.TotalDiscount);
}
```

---

## ✅ Verification Checklist

| Test Case | Current | Expected |
|-----------|---------|----------|
| English discounts sum | 30 + 70 = 100 | 30 + 10 = 40 ✅ |
| totalDiscount | 130 ❌ | 70 ✅ |
| breakdown.groupSavings | 70 ❌ | 10 ✅ |
| Sum of applied = totalDiscount | ❌ | ✅ |
| grandTotal verification | 400 - 130 = 270 ❌ | 400 - 70 = 330 ✅ |

---

## 📋 Summary

| Field | Issue | Fix |
|-------|-------|-----|
| `discounts.*.amount` | Shows pre-cap value | Add `appliedAmount` or show only applied |
| `totalDiscount` | Sum of pre-cap amounts | Sum of actual applied amounts |
| `breakdown.*Savings` | Pre-cap amounts | Post-cap amounts |

---

## Request

Please update the `CalculatePrice` endpoint:
1. Show **applied amounts** (after cap) in `breakdown`
2. Ensure `totalDiscount` = sum of all subjects' `totalDiscount`
3. Optionally add `calculatedAmount` vs `appliedAmount` for transparency

Confirm when ready:
```
✔ BACKEND FIX CONFIRMED
```
