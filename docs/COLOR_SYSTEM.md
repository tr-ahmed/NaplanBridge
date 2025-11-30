# 🎨 NaplanBridge Color System

## نظام الألوان الموحد للمنصة

### الألوان الأساسية (Primary Colors)

#### 1. Blue (أزرق) - اللون الأساسي
- **الاستخدام**: العناصر الرئيسية، الأزرار الأساسية، العناوين
- **Tailwind Classes**: 
  - `bg-blue-500`, `bg-blue-600`, `bg-blue-700`
  - `text-blue-600`, `text-blue-700`
  - `from-blue-500`, `to-blue-600`
- **Hex Colors**: `#3b82f6`, `#2563eb`, `#1d4ed8`

#### 2. Indigo/Purple (أرجواني) - اللون الثانوي
- **الاستخدام**: العناصر الثانوية، التأكيدات، التدرجات
- **Tailwind Classes**: 
  - `bg-indigo-500`, `bg-indigo-600`, `bg-purple-500`, `bg-purple-600`
  - `text-indigo-600`, `text-purple-600`
  - `from-indigo-500`, `to-indigo-600`
- **Hex Colors**: `#6366f1`, `#4f46e5`, `#a855f7`, `#9333ea`

#### 3. Cyan/Sky (سماوي) - لون مساعد
- **الاستخدام**: البيانات، الإحصائيات، العناصر المعلوماتية
- **Tailwind Classes**: 
  - `bg-cyan-500`, `bg-cyan-600`, `bg-sky-500`, `bg-sky-600`
  - `text-cyan-600`, `text-sky-600`
- **Hex Colors**: `#06b6d4`, `#0891b2`, `#0ea5e9`, `#0284c7`

### الألوان الوظيفية (Functional Colors)

#### 4. Green (أخضر) - النجاح والتأكيد
- **الاستخدام**: رسائل النجاح، الحالات النشطة، التأكيدات
- **Tailwind Classes**: 
  - `bg-green-500`, `bg-green-600`, `bg-emerald-500`
  - `text-green-600`, `text-green-700`
- **Hex Colors**: `#10b981`, `#059669`, `#16a34a`

#### 5. Yellow/Amber (أصفر/عنبري) - التنبيهات
- **الاستخدام**: التحذيرات، الحالات المعلقة، الأهمية المتوسطة
- **Tailwind Classes**: 
  - `bg-yellow-400`, `bg-yellow-500`, `bg-amber-500`
  - `text-yellow-600`, `text-amber-600`
- **Hex Colors**: `#fbbf24`, `#f59e0b`, `#d97706`

#### 6. Red (أحمر) - الأخطاء والخطر
- **الاستخدام**: رسائل الخطأ، الحذف، الإجراءات الخطرة
- **Tailwind Classes**: 
  - `bg-red-500`, `bg-red-600`
  - `text-red-600`, `text-red-700`
- **Hex Colors**: `#ef4444`, `#dc2626`, `#b91c1c`

### الألوان المحايدة (Neutral Colors)

#### 7. Gray (رمادي) - الخلفيات والنصوص
- **الاستخدام**: الخلفيات، النصوص الثانوية، الحدود
- **Tailwind Classes**: 
  - `bg-gray-50`, `bg-gray-100`, `bg-gray-200`
  - `text-gray-600`, `text-gray-700`, `text-gray-800`, `text-gray-900`
  - `border-gray-200`, `border-gray-300`
- **Hex Colors**: `#f9fafb`, `#f3f4f6`, `#e5e7eb`, `#6b7280`, `#111827`

## 📐 قواعد الاستخدام

### 1. التدرجات (Gradients)
```html
<!-- Header/Hero Sections -->
<div class="bg-gradient-to-r from-blue-600 to-indigo-600">

<!-- Cards -->
<div class="bg-gradient-to-br from-blue-500 to-blue-600">
<div class="bg-gradient-to-br from-indigo-500 to-indigo-600">
<div class="bg-gradient-to-br from-cyan-500 to-cyan-600">
```

### 2. الأزرار (Buttons)
```html
<!-- Primary Button -->
<button class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">

<!-- Secondary Button -->
<button class="bg-white text-blue-600 border border-blue-600 hover:bg-blue-50">

<!-- Success Button -->
<button class="bg-green-600 hover:bg-green-700">

<!-- Danger Button -->
<button class="bg-red-600 hover:bg-red-700">

<!-- Warning Button -->
<button class="bg-yellow-400 hover:bg-yellow-300">
```

### 3. الـ Sidebar
```html
<!-- Background Gradient -->
background: linear-gradient(135deg, #1e293b 0%, #2563eb 100%)

<!-- Active Link -->
<a class="bg-white/10 text-white">

<!-- Hover State -->
<a class="hover:bg-white/10">
```

### 4. الـ Cards الإحصائية
- **Blue**: الأساسي (Years, Primary Stats)
- **Cyan**: البيانات والمعلومات (Categories, Info)
- **Indigo**: المحتوى (Subject Names)
- **Purple**: الموارد التعليمية (Subjects)
- **Sky**: الفترات الزمنية (Terms)
- **Teal**: التفاصيل الزمنية (Weeks)
- **Violet**: الدروس (Lessons)

## ❌ تجنب استخدام
- ~~Pink~~ - استخدم Purple بدلاً منه
- ~~Orange~~ - استخدم Yellow أو Amber بدلاً منه
- ~~Emerald~~ (إلا في حالات النجاح) - استخدم Cyan أو Teal بدلاً منه
- ~~Fuchsia~~ - استخدم Purple أو Violet بدلاً منه

## 🎯 الأولويات
1. **الأساسية**: Blue, Indigo
2. **المساعدة**: Cyan, Sky, Purple, Violet, Teal
3. **الوظيفية**: Green (Success), Yellow (Warning), Red (Error)
4. **المحايدة**: Gray

## 📱 أمثلة على الاستخدام

### Stat Card Template
```html
<div class="bg-gradient-to-br from-[COLOR]-500 to-[COLOR]-600 rounded-xl p-4 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all">
  <div class="relative z-10">
    <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm w-fit mb-2">
      <i class="fas fa-[ICON] text-white text-lg"></i>
    </div>
    <p class="text-2xl font-bold text-white mb-1">{{ count }}</p>
    <p class="text-[COLOR]-100 text-xs font-medium">Label</p>
  </div>
  <div class="absolute -right-2 -bottom-2 opacity-10">
    <i class="fas fa-[ICON] text-white text-4xl"></i>
  </div>
</div>
```

### Button Template
```html
<button class="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2">
  <i class="fas fa-[ICON]"></i>
  <span>Button Text</span>
</button>
```
