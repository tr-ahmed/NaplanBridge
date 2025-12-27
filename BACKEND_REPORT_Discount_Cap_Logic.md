# 📌 BACKEND REPORT: Discount Cap Logic Fix

## Issue
The 20% maximum discount cap is being applied to **ALL discount types** instead of only the **Package Discount** (Multi-Subject + Hours combined).

## Current (Wrong) Behavior
```
Total Discount = MIN(Package + Group + MultiStudents, 20%)
```
Result: Group 35% and Multi-Students 10% discounts are being reduced to 0% when Package reaches 20%.

## Expected (Correct) Behavior
```
Package Discount = MIN(MultiSubject + Hours, 20%)  ← Cap applies HERE only
Group Discount = 35% (if Group session)            ← Added separately, NO cap
MultiStudents Discount = 10% (if multiple students) ← Added separately, NO cap

Total Discount = Package + Group + MultiStudents
```

## Example Calculation

### Scenario: Group session, 6 effective subjects, 3 students

| Discount Type | Base % | After Cap | Amount (on $200) |
|---------------|--------|-----------|------------------|
| Package (subjects + hours) | 20% | **20%** (capped) | $40 |
| Group | 35% | **35%** (no cap) | $70 |
| Multi-Students | 10% | **10%** (no cap) | $20 |
| **TOTAL** | 65% | **65%** | **$130** |

Final Price = $200 - $130 = **$70**

## Impact
- Parents with Group sessions are NOT receiving the 35% discount they should get
- Multi-student families are NOT receiving the 10% discount they should get
- This results in overcharging customers

## Required Backend Changes

### 1. Modify Discount Calculation Logic

```csharp
// Calculate Package Discount (capped at 20%)
var multiSubjectDiscount = CalculateMultiSubjectDiscount(effectiveSubjects);
var hoursDiscount = CalculateHoursDiscount(hours);
var packageDiscount = Math.Min(multiSubjectDiscount + hoursDiscount, 20.0m);

// Calculate other discounts (NOT capped)
var groupDiscount = isGroupSession ? 35.0m : 0m;
var multiStudentsDiscount = totalStudents > 1 ? 10.0m : 0m;

// Total discount = Package (capped) + Group + MultiStudents
var totalDiscount = packageDiscount + groupDiscount + multiStudentsDiscount;
```

### 2. Update Response DTO

```csharp
new DiscountBreakdown {
    PackageSavings = packageAmount,      // Capped portion
    GroupSavings = groupAmount,          // Uncapped
    MultiStudentsSavings = multiStudentsAmount,  // Uncapped
    MaxDiscountApplied = (multiSubjectDiscount + hoursDiscount) > 20,
    MaxDiscountPercentage = 20
}
```

### 3. Update Per-Subject Discount Calculation

For each subject, calculate:
```csharp
subject.Discounts.Package.Amount = basePrice * (packageDiscount / 100);
subject.Discounts.Group.Amount = basePrice * (groupDiscount / 100);  // Should NOT be 0!
subject.Discounts.MultiStudents.Amount = basePrice * (multiStudentsDiscount / 100);  // Should NOT be 0!
subject.TotalDiscount = package + group + multiStudents;
subject.CombinedDiscountPercentage = packageDiscount + groupDiscount + multiStudentsDiscount;
```

## Test Cases

### Test 1: Group session with package discount at max
- Input: Group session, 6 effective subjects, 1 student
- Expected: Package 20% + Group 35% = **55% total discount**
- Current Bug: Only 20% applied

### Test 2: OneToOne with multiple students
- Input: OneToOne session, 6 effective subjects, 3 students
- Expected: Package 20% + MultiStudents 10% = **30% total discount**
- Current Bug: Only 20% applied

### Test 3: Group with multiple students
- Input: Group session, 4 effective subjects, 2 students
- Expected: Package 15% + Group 35% + MultiStudents 10% = **60% total discount**
- Current Bug: Only 20% applied (or less)

## Request
Please fix the discount calculation logic and confirm when ready.

---
**Generated:** 2025-12-28T00:12:29+02:00
