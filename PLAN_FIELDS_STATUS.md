# ✅ Plan Management - حالة جميع الحقول

## 📊 الحقول حسب Plan Type

### 1️⃣ Single Term (planType = 1)
**الحقول المطلوبة:**
- ✅ Name
- ✅ Description
- ✅ Price
- ✅ Plan Type = "Single Term"
- ✅ **Subject** ← dropdown (محمل من API)
- ✅ **Term** ← dropdown (يتم تحميله بعد اختيار Subject)

**كيفية العمل:**
1. اختر Plan Type = "Single Term"
2. اختر Subject من القائمة (10 subjects متاحة)
3. انتظر تحميل Terms
4. اختر Term واحد

---

### 2️⃣ Multi Term (planType = 2)
**الحقول المطلوبة:**
- ✅ Name
- ✅ Description
- ✅ Price
- ✅ Plan Type = "Multi Term"
- ✅ **Subject** ← dropdown (محمل من API)
- ✅ **Terms** ← checkboxes (يتم تحميلها بعد اختيار Subject)

**كيفية العمل:**
1. اختر Plan Type = "Multi Term"
2. اختر Subject من القائمة
3. ✅ **ستظهر checkboxes** لكل الـ Terms المتاحة
4. اختر term واحد أو أكثر (على الأقل 2)
5. ستظهر رسالة: "✓ Selected X term(s): 1,2,3"

**الحالات الثلاث:**
- لم يتم اختيار Subject → رسالة "Please select a Subject first"
- Subject مختار لكن لا توجد Terms → رسالة "No terms available"
- Terms موجودة → ✅ Checkboxes تظهر

---

### 3️⃣ Full Year (planType = 3)
**الحقول المطلوبة:**
- ✅ Name
- ✅ Description
- ✅ Price
- ✅ Plan Type = "Full Year"
- ✅ **Year** ← dropdown (محمل من API أو fallback)

**كيفية العمل:**
1. اختر Plan Type = "Full Year"
2. حقل Subject **مخفي** (لا يحتاجه)
3. حقل Term **مخفي** (لا يحتاجه)
4. ✅ حقل **Year يظهر** (Year 7 - Year 12)
5. اختر Year

**Console logs المتوقعة:**
```
🔄 onPlanTypeChange called with: 3
   → Full Year selected - clearing subject/term fields
   Final state: {planType: 3, subjectId: undefined, ...}
```

---

### 4️⃣ Subject Annual (planType = 4)
**الحقول المطلوبة:**
- ✅ Name
- ✅ Description
- ✅ Price
- ✅ Plan Type = "Subject Annual"
- ✅ **Subject** ← dropdown (محمل من API)

**كيفية العمل:**
1. اختر Plan Type = "Subject Annual"
2. اختر Subject من القائمة
3. حقل Term **مخفي** (يشمل كل الـ 4 terms تلقائياً)

---

## 🔍 التحقق من ظهور الحقول

### ✅ الحقول الأساسية (تظهر دائماً):
- [x] Plan Name
- [x] Description
- [x] Price
- [x] Plan Type dropdown
- [x] Coverage Description

### ✅ حقل Subject (يظهر في):
- [x] Single Term (planType = 1)
- [x] Multi Term (planType = 2)
- [x] Subject Annual (planType = 4)
- [ ] **لا يظهر** في Full Year (planType = 3)

### ✅ حقل Term dropdown (يظهر في):
- [x] Single Term (planType = 1) فقط
- [ ] **لا يظهر** في Multi Term (يستخدم checkboxes)
- [ ] **لا يظهر** في Full Year
- [ ] **لا يظهر** في Subject Annual

### ✅ Term Checkboxes (تظهر في):
- [ ] **لا تظهر** في Single Term
- [x] Multi Term (planType = 2) فقط
- [ ] **لا تظهر** في Full Year
- [ ] **لا تظهر** في Subject Annual

### ✅ حقل Year (يظهر في):
- [ ] **لا يظهر** في Single Term
- [ ] **لا يظهر** في Multi Term
- [x] Full Year (planType = 3) فقط
- [ ] **لا يظهر** في Subject Annual

---

## 🧪 اختبار سريع لكل Plan Type

### Test 1: Single Term ✅
```
1. Plan Type = "Single Term"
2. Subject dropdown يظهر ✅
3. اختر Subject → Terms تحمل ✅
4. Term dropdown يظهر ✅
```

### Test 2: Multi Term ✅
```
1. Plan Type = "Multi Term"
2. Subject dropdown يظهر ✅
3. اختر Subject → Checkboxes تظهر ✅
4. اختر عدة terms ✅
```

### Test 3: Full Year ✅
```
1. Plan Type = "Full Year"
2. Subject يختفي ✅
3. Year dropdown يظهر ✅
4. Years محملة (6 years) ✅
```

### Test 4: Subject Annual ✅
```
1. Plan Type = "Subject Annual"
2. Subject dropdown يظهر ✅
3. Terms مخفية ✅
```

---

## 📦 البيانات المحملة

### من API:
- ✅ **Subjects**: 10 subjects محملة
  ```
  {id: 1, subjectName: 'Algebra', ...}
  ```

- ✅ **Terms**: يتم تحميلها عند اختيار Subject
  ```
  GET /api/Terms/by-subject/{subjectId}
  ```

- ✅ **Years**: 6 years (أو من API)
  ```
  Year 7, Year 8, ..., Year 12
  ```

---

## 🎯 الحالة النهائية

### ✅ يعمل بشكل صحيح:
- [x] تحميل Subjects من API
- [x] تحميل Terms بعد اختيار Subject
- [x] تحميل Years من API (مع fallback)
- [x] Plan Type selection مع type conversion
- [x] إظهار/إخفاء الحقول حسب Plan Type
- [x] Multi Term checkboxes
- [x] Console logging مفصل

### 📝 ملاحظات:
- كل Plan Type له حقول مختلفة
- الحقول تظهر/تختفي تلقائياً حسب Plan Type
- Console logs تساعد في التتبع
- Type conversion من string إلى number يعمل تلقائياً

---

## 🚀 الخطوة التالية

**جرب الآن:**
1. افتح Modal
2. جرب كل Plan Type
3. تأكد من ظهور الحقول الصحيحة
4. تحقق من Console logs

**إذا لم تظهر checkboxes في Multi Term:**
- تأكد من اختيار Subject أولاً
- افتح Console وابحث عن `filteredTerms.length`
- يجب أن ترى Terms محملة

**إذا لم يظهر Year في Full Year:**
- افتح Console وابحث عن `loadYears()`
- يجب أن ترى `✅ Mapped years: 6`
- أو `⚠️ Falling back to hardcoded years`
