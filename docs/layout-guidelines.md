# Layout Guidelines

## Fixed Header Layout Solution

This document describes the layout solution implemented to handle the fixed header across all pages.

### Problem
The header component uses `fixed top-0 left-0 w-full z-50` positioning, which causes it to overlay content on all pages, particularly affecting hero sections and page headers.

### Solution Implementation

#### 1. Main Layout (app.html)
- Added `pt-16` (64px padding-top) to the main content container
- This creates space for the fixed header across all pages

#### 2. Global CSS Classes (styles.scss)
```scss
/* Layout fixes for fixed header */
.main-content {
  padding-top: 4rem; /* 64px - matches header height */
}

/* Hero section adjustments for fixed header */
.hero-section {
  min-height: calc(100vh - 4rem); /* Subtract header height from viewport */
}

.hero-full-height {
  min-height: 100vh; /* For sections that should still be full height */
}

/* Page content wrapper to ensure consistent spacing */
.page-content {
  padding-top: 4rem; /* Space for fixed header */
}
```

#### 3. Usage Guidelines

##### For Hero Sections:
Use the `.hero-section` class for hero sections that should account for the header:
```html
<section class="hero-section relative flex items-center bg-gradient-to-br from-gray-50 to-gray-100">
  <!-- Hero content -->
</section>
```

##### For Full-Height Sections:
If you need a section to be truly full viewport height (ignoring header), use:
```html
<section class="hero-full-height relative flex items-center">
  <!-- Content -->
</section>
```

##### For Regular Page Content:
For pages without hero sections, wrap content in:
```html
<div class="page-content">
  <!-- Page content -->
</div>
```

### Header Specifications
- **Height**: 4rem (64px)
- **Position**: `fixed top-0 left-0 w-full`
- **Z-index**: 50
- **Background**: White with shadow

### Benefits
1. **Consistent spacing** across all pages
2. **No content overlap** with the fixed header
3. **Responsive design** that works on all screen sizes
4. **Easy maintenance** - changes only needed in one place
5. **Developer-friendly** - clear classes and guidelines

### Files Modified
1. `src/app/app.html` - Added main content padding
2. `src/styles.scss` - Added utility classes
3. `src/app/features/home/home.html` - Updated hero section
4. `src/app/features/courses/courses.component.html` - Updated hero section

### Testing Checklist
- [ ] Header doesn't overlap hero sections
- [ ] Page content starts below header on all pages
- [ ] Mobile responsiveness maintained
- [ ] No scrolling issues
- [ ] Hero sections display properly on all screen sizes
