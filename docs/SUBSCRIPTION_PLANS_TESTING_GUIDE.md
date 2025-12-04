# 🧪 Subscription Plans Testing Guide

**Date:** 2025-11-21  
**Status:** Ready for Testing  
**Purpose:** Test Year-Specific Pricing & Discount Display

---

## 🎯 What Was Implemented

### 1. ✅ Admin UI Enhancements

#### Auto-Generation Features:
- **Auto-fill Suggestions** button
- Real-time plan name generation
- Suggested pricing based on year level
- Year-specific naming convention

#### Helper Functions Added:
```typescript
- generatePlanName()      // Auto-generate name based on selections
- getSuggestedPrice()     // Calculate suggested price by year
- applySuggestions()      // Apply both name and price
- updatePlanSuggestions() // Auto-update on selection changes
```

### 2. ✅ Discount Display

#### In Plans Table:
- Original price (strikethrough)
- Current price (larger, bold)
- Discount percentage badge
- Save amount display
- Recommended plan badge

#### Visual Enhancements:
- Gradient discount badges
- Color-coded pricing
- Pulse animations
- Hover effects

---

## 🧪 Testing Scenarios

### Test 1: Create Single Term Plan with Auto-Suggestions

**Steps:**
1. Navigate to Subscriptions Management
2. Click "Add New Plan"
3. Select **Plan Type**: Single Term
4. Select **Subject**: Mathematics - Year 7
5. Select **Term**: Term 1
6. Click **"Auto-fill Suggestions"** button

**Expected Result:**
```
✅ Name auto-filled: "Mathematics Term 1 - Year 7"
✅ Price suggested: $49.99
✅ Blue hint shows suggested name
✅ Green hint shows suggested price
```

**API Call Expected:**
```typescript
POST /api/SubscriptionPlans
{
  "name": "Mathematics Term 1 - Year 7",
  "description": "...",
  "planType": 1,
  "subjectId": 5,
  "termId": 12,
  "price": 49.99,
  "isActive": true
}
```

---

### Test 2: Create Multi-Term Plan with Discounts

**Steps:**
1. Add New Plan
2. **Plan Type**: Multi Term
3. **Subject**: Mathematics - Year 8
4. Select **Terms**: Term 1 + Term 2 (checkboxes)
5. Click **Auto-fill**

**Expected Result:**
```
✅ Name: "Mathematics 2 Terms - Year 8"
✅ Suggested Price: $98.99 (2 × $54.99 × 0.9)
✅ Shows "Selected 2 term(s): 12,13"
```

**After Saving - View in Table:**
```
✅ Original Price: $109.98 (calculated by backend)
✅ Current Price: $98.99
✅ Discount Badge: "Save 10%"
✅ Save Amount: "$10.99"
```

---

### Test 3: Create Plans for Different Years

**Goal:** Create same term for multiple years with different prices

**Create 3 Plans:**

**Plan 1 - Year 7:**
```
Name: Mathematics Term 1 - Year 7
Subject: Mathematics Year 7
Term: Term 1
Price: $49.99
```

**Plan 2 - Year 10:**
```
Name: Mathematics Term 1 - Year 10
Subject: Mathematics Year 10
Term: Term 1
Price: $64.99
```

**Plan 3 - Year 12:**
```
Name: Mathematics Term 1 - Year 12
Subject: Mathematics Year 12
Term: Term 1
Price: $79.99
```

**Expected in Table:**
```
✅ 3 separate plan records
✅ Each with its own price
✅ Same subject/term, different years
✅ No discounts (single term plans)
```

---

### Test 4: Full Year Plan

**Steps:**
1. Add New Plan
2. **Plan Type**: Full Year
3. **Year**: Year 8
4. Click Auto-fill

**Expected:**
```
✅ Name: "Full Year Access - Year 8"
✅ Price: $246.99 (calculated: $54.99 × 6 × 0.75)
✅ Subject field hidden
✅ Only Year dropdown visible
```

---

### Test 5: Subject Annual Plan

**Steps:**
1. Add New Plan
2. **Plan Type**: Subject Annual
3. **Subject**: Science - Year 9
4. Click Auto-fill

**Expected:**
```
✅ Name: "Science Full Year - Year 9"
✅ Price: $177.99 (4 terms with 25% discount)
✅ Term selection hidden (includes all 4 automatically)
```

---

## 📊 Backend Response Validation

### Test 6: Verify Discount Calculation

**Create a Multi-Term Plan:**
```json
POST /api/SubscriptionPlans
{
  "name": "Math Terms 1&2 - Year 7",
  "planType": 2,
  "subjectId": 5,
  "includedTermIds": "12,13",
  "price": 89.99
}
```

**Check Response:**
```json
{
  "id": 1,
  "name": "Math Terms 1&2 - Year 7",
  "price": 89.99,
  "planType": "MultiTerm"
}
```

**Then GET the plan from display endpoint:**
```
GET /api/SubscriptionPlans/subject/5/available
```

**Expected Response:**
```json
{
  "availablePlans": [
    {
      "planId": 1,
      "price": 89.99,
      "originalPrice": 99.98,      // ✅ Backend calculated
      "discountPercentage": 10,    // ✅ Backend calculated
      "saveAmount": 9.99           // ✅ Backend calculated
    }
  ]
}
```

**Verify in UI:**
```
✅ Original price shows: $99.98 (strikethrough)
✅ Current price shows: $89.99 (bold)
✅ Badge shows: "Save 10%"
✅ Text shows: "Save $9.99"
```

---

## 🎨 Visual Verification

### UI Elements to Check:

**In Create Modal:**
- [ ] "Auto-fill Suggestions" button visible
- [ ] Blue suggestion hint for name
- [ ] Green suggestion hint for price
- [ ] Year-specific pricing guide box
- [ ] All styling applied correctly

**In Plans Table:**
- [ ] Discount badges visible (green gradient)
- [ ] Original price strikethrough
- [ ] Current price bold and colored
- [ ] Recommended badge (if applicable)
- [ ] Smooth hover animations

---

## 🐛 Common Issues to Check

### Issue 1: Suggestions Not Showing
**Symptom:** Auto-fill doesn't work
**Check:**
```typescript
// In console
- Is subject selected? 
- Are terms loaded?
- Check: console.log in generatePlanName()
```

### Issue 2: Discounts Not Displaying
**Symptom:** No discount badges in table
**Check:**
```typescript
// Verify API response has discount fields
{
  "originalPrice": number,
  "discountPercentage": number,
  "saveAmount": number
}
```

### Issue 3: Wrong Price Suggestions
**Symptom:** Suggested prices incorrect
**Check:**
```typescript
// Verify year extraction
const yearNumber = getYearNumberFromSubject(subjectId)
// Should return 1-6 for Years 7-12
```

---

## 📝 Console Output Expected

### When Creating Plan:

```
✅ openAddPlanModal() called
📊 Current state - Subjects: 10, Years: 6
✓ Subjects already loaded: 10
✓ Years already loaded: 6

🔍 onSubjectChange called with subjectId: 5
📦 Raw Terms API response: {...}
✅ Mapped filteredTerms: 4
📝 Subject name: Mathematics

// After clicking Auto-fill:
Generated name: "Mathematics Term 1 - Year 7"
Suggested price: 49.99
```

### When Saving Plan:

```
✅ Sending plan DTO: {
  name: "Mathematics Term 1 - Year 7",
  planType: 1,
  subjectId: 5,
  termId: 12,
  price: 49.99
}

✅ Plan created successfully!
```

---

## 🔄 API Endpoints Used

### Creating Plans:
```
POST /api/SubscriptionPlans
Authorization: Bearer <admin-token>
```

### Getting Plans (with discounts):
```
GET /api/SubscriptionPlans
GET /api/SubscriptionPlans/subject/{id}/available
```

### Subjects & Terms:
```
GET /api/Subjects
GET /api/Terms/by-subject/{id}
GET /api/Years
```

---

## ✅ Test Checklist

### Phase 1: Admin UI
- [ ] Auto-fill button works
- [ ] Name suggestions accurate
- [ ] Price suggestions correct
- [ ] Year-specific guide shows
- [ ] All plan types supported

### Phase 2: Plan Creation
- [ ] Single Term plan created
- [ ] Multi Term plan created
- [ ] Full Year plan created
- [ ] Subject Annual plan created
- [ ] Different year prices work

### Phase 3: Discount Display
- [ ] Discounts show for multi-term
- [ ] Original price strikethrough
- [ ] Current price highlighted
- [ ] Save percentage badge
- [ ] Save amount displays

### Phase 4: Real API
- [ ] Plans save successfully
- [ ] Backend calculates discounts
- [ ] Discounts display correctly
- [ ] No console errors
- [ ] All CRUD operations work

---

## 🚀 Quick Test Commands

### Test in Browser Console:

```javascript
// Check if plans loaded
console.log('Plans:', this.subscriptionPlans);

// Check discount fields
console.log('First plan discounts:', {
  original: this.subscriptionPlans[0]?.originalPrice,
  discount: this.subscriptionPlans[0]?.discountPercentage,
  save: this.subscriptionPlans[0]?.saveAmount
});

// Test name generation
console.log('Generated name:', this.generatePlanName());

// Test price suggestion
console.log('Suggested price:', this.getSuggestedPrice());
```

---

## 📊 Success Criteria

### All Tests Pass When:

1. ✅ **Auto-suggestions work** - Name and price auto-fill correctly
2. ✅ **Year-specific pricing** - Different prices for different years
3. ✅ **Discounts display** - All discount fields show in table
4. ✅ **API integration** - Backend calculates and returns discounts
5. ✅ **No errors** - No console errors, all CRUD works
6. ✅ **Visual polish** - Animations, colors, badges all working

---

## 🎯 Next Steps After Testing

### If All Tests Pass:
1. Remove any debug console.logs
2. Test with production data
3. Get user feedback
4. Deploy to staging
5. Final production deployment

### If Issues Found:
1. Document the issue
2. Check console for errors
3. Verify API responses
4. Fix and retest
5. Update this guide with solutions

---

**Testing Status:** ⏳ Ready to Begin  
**Estimated Time:** 30-45 minutes  
**Tester:** Frontend Developer

---

*Test thoroughly and document any issues found!*
