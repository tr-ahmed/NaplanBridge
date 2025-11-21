# ✅ Frontend Implementation Guide - Year-Specific Pricing

**Date:** 2025-11-21  
**Based On:** Backend Response - Subscription Plan Pricing Structure  
**Status:** Implementation Ready

---

## 🎯 Backend Decision Summary

### ✅ Confirmed Approach:
**Option C: Year-Specific Plans (Separate Plans per Year)**

**Key Points:**
- ✅ No database changes required
- ✅ No new endpoints needed  
- ✅ Discounts calculated automatically by backend
- ✅ `YearId` remains optional for all plan types
- ✅ Create separate plan records for different years

---

## 📊 How It Works

### Pricing Strategy

Instead of one plan with multiple prices, create **separate plans** for each year:

```typescript
// Example: Mathematics Term 1 for different years

// Plan 1 - Year 7
{
  name: "Mathematics Term 1 - Year 7",
  planType: PlanType.SingleTerm,
  subjectId: 5,      // Mathematics Year 7
  termId: 12,
  price: 49.99
}

// Plan 2 - Year 8
{
  name: "Mathematics Term 1 - Year 8",
  planType: PlanType.SingleTerm,
  subjectId: 8,      // Mathematics Year 8
  termId: 15,
  price: 59.99
}

// Plan 3 - Year 12
{
  name: "Mathematics Term 1 - Year 12",
  planType: PlanType.SingleTerm,
  subjectId: 20,     // Mathematics Year 12
  termId: 30,
  price: 79.99
}
```

---

## 🎨 Admin UI Implementation

### Step 1: Plan Creation Form

The admin form should guide users to create year-specific plans:

```typescript
// Component: subscriptions.component.ts

createPlan() {
  // Automatically include year in plan name
  const yearName = this.getYearName(this.selectedSubject.yearId);
  const subjectName = this.selectedSubject.subjectName;
  const termName = this.selectedTerm?.name || '';
  
  const suggestedName = this.generatePlanName(
    subjectName,
    termName,
    yearName,
    this.currentPlan.planType
  );
  
  const dto: CreateSubscriptionPlanDto = {
    name: suggestedName,  // "Mathematics Term 1 - Year 7"
    description: this.currentPlan.description,
    planType: this.currentPlan.planType,
    price: this.currentPlan.price,
    subjectId: this.currentPlan.subjectId,
    termId: this.currentPlan.termId,
    yearId: this.currentPlan.yearId,  // Optional
    includedTermIds: this.currentPlan.includedTermIds,
    isActive: true
  };
  
  this.plansService.createPlan(dto).subscribe({
    next: (plan) => {
      console.log('✅ Plan created:', plan);
      this.showSuccess(`Plan "${plan.name}" created successfully!`);
      this.loadPlans();
      this.closePlanModal();
    },
    error: (err) => this.showError(err.message)
  });
}

generatePlanName(subject: string, term: string, year: string, planType: PlanType): string {
  switch (planType) {
    case PlanType.SingleTerm:
      return `${subject} ${term} - ${year}`;
    case PlanType.MultiTerm:
      return `${subject} Multiple Terms - ${year}`;
    case PlanType.SubjectAnnual:
      return `${subject} Full Year - ${year}`;
    case PlanType.FullYear:
      return `Full Year Access - ${year}`;
    default:
      return '';
  }
}
```

### Step 2: UI Helper Messages

Add helpful hints in the UI:

```html
<!-- In the modal -->
<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
  <h4 class="font-semibold text-blue-900 mb-2">
    <i class="fas fa-info-circle mr-2"></i>
    Year-Specific Pricing Guide
  </h4>
  <ul class="text-sm text-blue-800 space-y-1">
    <li>✓ Create separate plans for each year level (Year 7, Year 8, etc.)</li>
    <li>✓ Set different prices based on year complexity</li>
    <li>✓ Students will only see plans relevant to their year</li>
    <li>✓ Example: "Mathematics Term 1 - Year 7" at $49.99</li>
  </ul>
</div>
```

### Step 3: Suggested Pricing Helper

Show pricing suggestions based on year:

```typescript
getSuggestedPrice(subjectId: number, termId: number, yearNumber: number): number {
  // Base prices by year (example)
  const basePriceByYear: { [key: number]: number } = {
    7: 49.99,
    8: 54.99,
    9: 59.99,
    10: 64.99,
    11: 69.99,
    12: 79.99
  };
  
  return basePriceByYear[yearNumber] || 49.99;
}
```

```html
<!-- Show suggested price -->
<div class="mt-1 text-sm text-gray-600" *ngIf="selectedSubject && selectedTerm">
  <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>
  Suggested price for Year {{ getYearNumber() }}: 
  <strong class="text-blue-600">${{ getSuggestedPrice() }}</strong>
</div>
```

---

## 💰 Discount Display

### Backend Calculates Discounts Automatically

The backend automatically calculates and returns discount info for Multi-Term and Annual plans:

```typescript
// Response from backend
interface SubscriptionPlan {
  planId: number;
  name: string;
  price: number;
  originalPrice?: number;      // ✅ Calculated by backend
  discountPercentage?: number; // ✅ Calculated by backend
  saveAmount?: number;         // ✅ Calculated by backend
  // ...
}
```

### Display Discounts in UI

```html
<!-- Plan card with discount badge -->
<div class="plan-card">
  <div class="plan-header">
    <h3>{{ plan.name }}</h3>
    
    <!-- Discount badge (only if discount exists) -->
    <span class="discount-badge" *ngIf="plan.discountPercentage">
      Save {{ plan.discountPercentage }}%
    </span>
  </div>
  
  <div class="plan-pricing">
    <!-- Original price (strikethrough) -->
    <span class="original-price" *ngIf="plan.originalPrice">
      ${{ plan.originalPrice }}
    </span>
    
    <!-- Current price -->
    <span class="current-price">
      ${{ plan.price }}
    </span>
    
    <!-- Save amount -->
    <span class="save-amount" *ngIf="plan.saveAmount">
      Save ${{ plan.saveAmount }}
    </span>
  </div>
</div>
```

### CSS Styling

```scss
.plan-card {
  .discount-badge {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .original-price {
    text-decoration: line-through;
    color: #9ca3af;
    font-size: 0.875rem;
    margin-right: 8px;
  }
  
  .current-price {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
  }
  
  .save-amount {
    color: #10b981;
    font-size: 0.875rem;
    font-weight: 600;
    margin-left: 8px;
  }
}
```

---

## 🔄 Creating Multiple Year Plans - Bulk Creation

### Option 1: Create One by One

Admin creates each plan manually:
1. Select Year 7 subject → Create plan
2. Select Year 8 subject → Create plan
3. Repeat for all years

### Option 2: Bulk Creation Helper (Optional Enhancement)

Add a "Create for All Years" feature:

```typescript
createPlanForAllYears() {
  const basePrice = 49.99;
  const priceIncrement = 5.00;
  
  for (let year = 7; year <= 12; year++) {
    const yearSubjectId = this.getSubjectIdForYear(
      this.selectedSubject.baseName,
      year
    );
    
    const dto: CreateSubscriptionPlanDto = {
      name: `${this.selectedSubject.name} Term 1 - Year ${year}`,
      description: `Access to ${this.selectedSubject.name} Term 1 for Year ${year}`,
      planType: PlanType.SingleTerm,
      price: basePrice + ((year - 7) * priceIncrement),
      subjectId: yearSubjectId,
      termId: this.getTermIdForYear(year, 1),
      isActive: true
    };
    
    this.plansService.createPlan(dto).subscribe({
      next: (plan) => console.log(`✅ Created plan for Year ${year}`)
    });
  }
}
```

---

## 📋 Plan Management - List View

### Grouping Plans by Subject/Year

Display plans grouped for easier management:

```html
<div class="plans-list">
  <div *ngFor="let group of groupedPlans" class="plan-group">
    <h3>{{ group.subjectName }}</h3>
    
    <div class="year-plans" *ngFor="let yearGroup of group.byYear">
      <h4>Year {{ yearGroup.yearNumber }}</h4>
      
      <div class="plan-items">
        <div *ngFor="let plan of yearGroup.plans" class="plan-item">
          <span class="plan-name">{{ plan.name }}</span>
          <span class="plan-price">${{ plan.price }}</span>
          <span class="plan-type">{{ getPlanTypeLabel(plan.planType) }}</span>
          
          <div class="plan-actions">
            <button (click)="editPlan(plan)">Edit</button>
            <button (click)="deactivatePlan(plan)">Deactivate</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

```typescript
groupPlansBySubjectAndYear() {
  const grouped: any[] = [];
  
  // Group by subject
  const bySubject = this.plans.reduce((acc, plan) => {
    const key = plan.subjectId || 'no-subject';
    if (!acc[key]) acc[key] = [];
    acc[key].push(plan);
    return acc;
  }, {});
  
  // Then group by year within each subject
  Object.keys(bySubject).forEach(subjectId => {
    const plans = bySubject[subjectId];
    const byYear = plans.reduce((acc, plan) => {
      const yearNumber = this.getYearNumberFromSubject(plan.subjectId);
      const key = yearNumber || 'all-years';
      if (!acc[key]) acc[key] = [];
      acc[key].push(plan);
      return acc;
    }, {});
    
    grouped.push({
      subjectName: plans[0].subjectName,
      byYear: Object.keys(byYear).map(year => ({
        yearNumber: year,
        plans: byYear[year]
      }))
    });
  });
  
  return grouped;
}
```

---

## 🧪 Testing Scenarios

### Test 1: Create Year-Specific Single Term Plans

```typescript
// Test creating plans for different years
async testYearSpecificPlans() {
  const years = [
    { yearId: 1, subjectId: 5, termId: 12, price: 49.99 },  // Year 7
    { yearId: 2, subjectId: 8, termId: 15, price: 59.99 },  // Year 8
    { yearId: 6, subjectId: 20, termId: 30, price: 79.99 }  // Year 12
  ];
  
  for (const year of years) {
    const dto: CreateSubscriptionPlanDto = {
      name: `Mathematics Term 1 - Year ${year.yearId + 6}`,
      description: `Test plan for Year ${year.yearId + 6}`,
      planType: PlanType.SingleTerm,
      price: year.price,
      subjectId: year.subjectId,
      termId: year.termId,
      isActive: true
    };
    
    await this.plansService.createPlan(dto).toPromise();
  }
}
```

### Test 2: Verify Discount Calculation

```typescript
async testDiscountCalculation() {
  // Get plans for a subject
  const response = await this.plansService
    .getPlansForSubject(5)
    .toPromise();
  
  const multiTermPlan = response.availablePlans.find(
    p => p.planType === 'MultiTerm'
  );
  
  console.assert(
    multiTermPlan.originalPrice > multiTermPlan.price,
    'Original price should be higher than discounted price'
  );
  
  console.assert(
    multiTermPlan.discountPercentage > 0,
    'Discount percentage should be calculated'
  );
  
  console.assert(
    multiTermPlan.saveAmount === 
      multiTermPlan.originalPrice - multiTermPlan.price,
    'Save amount should match difference'
  );
}
```

---

## 📊 Updated Models

### TypeScript Interfaces

```typescript
// ✅ Updated SubscriptionPlan interface
export interface SubscriptionPlan {
  id: number;
  planId?: number;
  name: string;
  description: string;
  price: number;
  
  // ✅ Discount fields (calculated by backend)
  originalPrice?: number;
  discountPercentage?: number;
  saveAmount?: number;
  
  planType: PlanType;
  subjectId?: number;
  subjectName?: string;
  termId?: number;
  termNumber?: number;
  yearId?: number;
  durationInDays?: number;
  duration?: string;
  includedTermIds?: string;
  stripePriceId?: string;
  isActive: boolean;
  isRecommended?: boolean;
  features?: string[];
  currency?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ CreateSubscriptionPlanDto (no changes needed)
export interface CreateSubscriptionPlanDto {
  name: string;
  description: string;
  price: number;
  planType: PlanType;
  isActive?: boolean;
  subjectId?: number;
  termId?: number;
  yearId?: number;
  includedTermIds?: string;
  durationInDays?: number;
  features?: string[];
}
```

---

## 🎯 Summary

### What Changed:
1. ✅ **SubscriptionPlan model** - Added discount fields
2. ✅ **CreateSubscriptionPlanDto** - Clarified optional fields
3. ✅ **Admin workflow** - Create separate plans per year
4. ✅ **Discount display** - Show calculated discounts from backend

### What Stayed the Same:
- ✅ API endpoints
- ✅ Database schema
- ✅ Authentication
- ✅ Basic CRUD operations

### Implementation Checklist:
- [x] Update TypeScript models
- [ ] Add year-specific plan creation helper
- [ ] Implement discount display UI
- [ ] Add bulk creation feature (optional)
- [ ] Add plan grouping by year (optional)
- [ ] Test with real API
- [ ] Deploy to production

---

**Status:** ✅ Ready for Implementation  
**Estimated Time:** 2-3 hours  
**No Backend Changes Required**
