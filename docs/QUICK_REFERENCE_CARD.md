# ⚡ Subscription Plans CRUD - Quick Reference Card

## 📋 Plan Types

```typescript
enum PlanType {
  SingleTerm = 1,      // One term
  MultiTerm = 2,       // Multiple terms
  FullYear = 3,        // All subjects/terms
  SubjectAnnual = 4    // One subject, all terms
}
```

## 🎯 Import Statements

```typescript
import { SubscriptionPlansService } from '@app/core/services/subscription-plans.service';
import { PlanType } from '@app/models/enums';
import { CreateSubscriptionPlanDto } from '@app/models/subscription.models';
import { validateSubscriptionPlan } from '@app/utils/validation.helpers';
```

## ✨ CRUD Operations

### Create
```typescript
const dto: CreateSubscriptionPlanDto = {
  name: 'Plan Name',
  description: 'Description',
  planType: PlanType.SingleTerm,
  price: 49.99,
  subjectId: 5,
  termId: 12,
  isActive: true
};

this.plansService.createPlan(dto).subscribe({
  next: (plan) => console.log('Created:', plan),
  error: (err) => console.error('Error:', err.message)
});
```

### Read All
```typescript
this.plansService.getAllPlans().subscribe({
  next: (plans) => console.log('Plans:', plans),
  error: (err) => console.error('Error:', err)
});
```

### Update
```typescript
this.plansService.updatePlan(planId, dto).subscribe({
  next: (plan) => console.log('Updated:', plan),
  error: (err) => console.error('Error:', err)
});
```

### Delete/Deactivate
```typescript
this.plansService.deactivatePlan(planId).subscribe({
  next: () => console.log('Deactivated'),
  error: (err) => console.error('Error:', err)
});
```

## ✅ Validation

```typescript
const validation = validateSubscriptionPlan(dto);

if (!validation.isValid) {
  console.log('Errors:', validation.errors);
  return;
}

// Proceed with API call
this.plansService.createPlan(dto).subscribe(...);
```

## 🎨 Plan Type Requirements

| Plan Type | Required Fields |
|-----------|----------------|
| SingleTerm | name, description, price, planType, **subjectId**, **termId** |
| MultiTerm | name, description, price, planType, **subjectId**, **includedTermIds** |
| FullYear | name, description, price, planType, **yearId** |
| SubjectAnnual | name, description, price, planType, **subjectId** |

## 🔍 Query Operations

### Get Plans for Term
```typescript
this.plansService.getAvailablePlansForTerm(subjectId, termNumber)
  .subscribe(response => {
    console.log('Plans:', response.availablePlans);
  });
```

### Get Plans for Subject
```typescript
this.plansService.getAvailablePlansForSubject(subjectId)
  .subscribe(response => {
    console.log('Plans:', response.availablePlans);
  });
```

## ⚠️ Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `termId is required` | Missing termId for SingleTerm | Add `termId: 12` |
| `includedTermIds is required` | Missing for MultiTerm | Add `includedTermIds: '1,2'` |
| `yearId is required` | Missing for FullYear | Add `yearId: 2` |
| `Price must be greater than 0` | price <= 0 | Set `price: 49.99` |

## 🎯 Examples by Plan Type

### Single Term
```typescript
{
  name: 'Math Term 1',
  planType: PlanType.SingleTerm,
  price: 49.99,
  subjectId: 5,
  termId: 12
}
```

### Multi Term
```typescript
{
  name: 'Math Terms 1&2',
  planType: PlanType.MultiTerm,
  price: 79.99,
  subjectId: 5,
  includedTermIds: '12,13'
}
```

### Full Year
```typescript
{
  name: 'Year 7 Complete',
  planType: PlanType.FullYear,
  price: 499.99,
  yearId: 2
}
```

### Subject Annual
```typescript
{
  name: 'Math Full Year',
  planType: PlanType.SubjectAnnual,
  price: 149.99,
  subjectId: 5
}
```

## 📊 Service Methods

```typescript
class SubscriptionPlansService {
  // CRUD
  getAllPlans(): Observable<SubscriptionPlan[]>
  getPlanById(id: number): Observable<SubscriptionPlan>
  createPlan(dto: CreateDto): Observable<SubscriptionPlan>
  updatePlan(id: number, dto: UpdateDto): Observable<SubscriptionPlan>
  deactivatePlan(id: number): Observable<void>
  
  // Query
  getAvailablePlansForTerm(subjectId, termNumber): Observable<TermPlansResponse>
  getAvailablePlansForSubject(subjectId): Observable<SubjectPlansResponse>
  
  // Validation
  validatePlanDto(dto): ValidationResult
  isValidPlan(plan): boolean
}
```

## 🗂️ File Locations

```
src/app/
├── models/
│   ├── enums.ts                          ← Enums here
│   └── subscription.models.ts            ← Interfaces
│
├── core/services/
│   └── subscription-plans.service.ts     ← CRUD Service
│
├── utils/
│   └── validation.helpers.ts             ← Validation
│
└── features/
    └── subscriptions/
        ├── subscriptions.component.ts    ← Admin UI
        └── subscriptions.component.html  ← Form
```

## 🎓 Quick Tips

✅ **Always validate** before API calls  
✅ **Use enums** not strings for planType  
✅ **Check** required fields per plan type  
✅ **Handle errors** in subscribe  
✅ **Log** for debugging  

## 📞 Help

- Full docs: `README_SUBSCRIPTION_PLANS.md`
- Testing: `TESTING_GUIDE_AR.md`
- Examples: `src/app/examples/subscription-plans-test-examples.ts`

---

**Version:** 2.0 | **Updated:** Nov 21, 2025
