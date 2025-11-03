# Content Management HTML View Structure Guide

**Component:** Content Management  
**File:** `content-management.html`  
**Last Updated:** 2025-11-03

---

## 📋 Overview

This document provides a complete reference for the Content Management HTML view structure and its integration with the TypeScript logic.

---

## 🎨 Main Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Mobile Menu Toggle (visible on mobile only)       │
├──────────────┬──────────────────────────────────────┤
│              │  Top Bar (Search, Filters, Actions)  │
│              ├──────────────────────────────────────┤
│              │  Advanced Filters Card               │
│   Sidebar    ├──────────────────────────────────────┤
│   (Fixed)    │  Stats Cards (6 metrics)             │
│              ├──────────────────────────────────────┤
│              │  Tab Navigation                       │
│              ├──────────────────────────────────────┤
│              │  Tab Content (Tables)                │
└──────────────┴──────────────────────────────────────┘
```

---

## 🎯 Component Sections

### 1. Mobile Menu Toggle
```html
<button class="mobile-menu-toggle d-lg-none" (click)="toggleMobileSidebar()">
  <i [class.fa-bars]="!sidebarMobileOpen" [class.fa-times]="sidebarMobileOpen"></i>
</button>
```
- **Visibility:** Mobile only (`d-lg-none`)
- **Behavior:** Toggles sidebar overlay on mobile
- **State:** `sidebarMobileOpen` boolean

---

### 2. Sidebar
```html
<aside class="sidebar" [class.mobile-active]="sidebarMobileOpen">
  <!-- Logo Section -->
  <!-- Navigation Links -->
  <!-- Profile Section -->
</aside>
```

**Navigation Items:**
- 📊 Dashboard (`/admin/dashboard`)
- 📚 Content Management (active)
- 👥 Users (`/admin/users`)
- 📅 Bookings (`/admin/bookings`)
- 💳 Subscriptions (`/admin/subscriptions`)
- 📈 Reports (`/admin/reports`)

---

### 3. Top Bar
```html
<div class="d-flex justify-content-between align-items-center">
  <!-- Search Input -->
  <input [(ngModel)]="searchTerm" (ngModelChange)="onFilterChange()" />
  
  <!-- Action Buttons Dropdown -->
  <div class="dropdown">
    <button>Quick Actions</button>
    <!-- Dropdown items for each entity type -->
  </div>
</div>
```

**Features:**
- Global search across all entities
- Quick action dropdown for creating new items
- Responsive layout (wraps on mobile)

---

### 4. Advanced Filters Card
```html
<div class="card">
  <div class="card-body">
    <!-- Filter by Year -->
    <select [(ngModel)]="filters.yearId" (change)="onFilterChange()">
    
    <!-- Filter by Category -->
    <select [(ngModel)]="filters.categoryId" (change)="onFilterChange()">
    
    <!-- Filter by Subject -->
    <select [(ngModel)]="filters.subjectId" (change)="onFilterChange()">
    
    <!-- Filter by Term -->
    <select [(ngModel)]="filters.termId" (change)="onFilterChange()">
    
    <!-- Filter by Week -->
    <select [(ngModel)]="filters.weekId" (change)="onFilterChange()">
    
    <!-- Clear Filters Button -->
    <button (click)="clearFilters()">Clear All</button>
  </div>
</div>
```

**Filter Hierarchy:**
```
Year → Subject → Term → Week → Lesson
     ↓
  Category
```

---

### 5. Stats Cards (6 Metrics)
```html
<div class="row g-4">
  <!-- Years Card -->
  <div class="col-12 col-md-6 col-lg-4">
    <div class="card stats-card">
      <i class="fas fa-calendar-alt"></i>
      <h3>{{ stats.years }}</h3>
      <p>Academic Years</p>
    </div>
  </div>
  
  <!-- Similar cards for: -->
  <!-- - Subjects -->
  <!-- - Categories -->
  <!-- - Terms -->
  <!-- - Weeks -->
  <!-- - Lessons -->
</div>
```

**Icons:**
- 📅 Years: `fa-calendar-alt`
- 📚 Subjects: `fa-book`
- 📂 Categories: `fa-folder`
- 📊 Terms: `fa-chart-line`
- 📆 Weeks: `fa-calendar-week`
- 🎓 Lessons: `fa-graduation-cap`

---

### 6. Tab Navigation
```html
<ul class="nav nav-tabs">
  <li class="nav-item">
    <a [class.active]="activeTab === 'years'" (click)="setActiveTab('years')">
      Years
    </a>
  </li>
  <!-- Similar tabs for: -->
  <!-- subjects, terms, weeks, lessons, categories -->
</ul>
```

**Tabs:**
1. Years
2. Subjects
3. Terms
4. Weeks
5. Lessons
6. Categories

---

### 7. Tab Content (Data Tables)

Each tab contains a table with the following structure:

```html
<div class="tab-pane" [class.show]="activeTab === 'years'" [class.active]="activeTab === 'years'">
  <div class="card">
    <div class="card-header">
      <h5>Academic Years</h5>
      <button (click)="openAdd('year')">Add New Year</button>
    </div>
    
    <div class="card-body">
      @if (pagedYears.length === 0) {
        <!-- Empty State -->
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <h5>No years found</h5>
          <p>Get started by creating your first academic year.</p>
          <button (click)="openAdd('year')">Create Year</button>
        </div>
      } @else {
        <!-- Data Table -->
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Year Number</th>
              <th>Subject Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (year of pagedYears; track year.id) {
              <tr>
                <td>{{ year.id }}</td>
                <td>{{ year.yearNumber }}</td>
                <td>{{ countSubjectsByYear(year.id) }}</td>
                <td>
                  <button (click)="openEdit('year', year)">Edit</button>
                  <button (click)="confirmDelete('year', year)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        
        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center">
          <span>Showing {{ yStart }} to {{ yEnd }} of {{ filteredYears.length }}</span>
          <nav>
            <ul class="pagination">
              <li [class.disabled]="yearPage === 1">
                <button (click)="goYearPage(yearPage - 1)">Previous</button>
              </li>
              @for (p of [].constructor(yearTotalPages); track $index; let i = $index) {
                <li [class.active]="yearPage === i + 1">
                  <button (click)="goYearPage(i + 1)">{{ i + 1 }}</button>
                </li>
              }
              <li [class.disabled]="yearPage === yearTotalPages">
                <button (click)="goYearPage(yearPage + 1)">Next</button>
              </li>
            </ul>
          </nav>
        </div>
      }
    </div>
  </div>
</div>
```

---

## 📊 Table Columns by Entity Type

### Years Table
| Column | Description |
|--------|-------------|
| ID | Unique identifier |
| Year Number | Academic year (e.g., 7, 8, 9, 10, 11, 12) |
| Subject Count | Number of subjects in this year |
| Actions | Edit, Delete buttons |

### Categories Table
| Column | Description |
|--------|-------------|
| ID | Unique identifier |
| Name | Category name |
| Description | Category description |
| Color | Color badge |
| Subject Count | Number of subjects in category |
| Actions | Edit, Delete buttons |

### Subjects Table
| Column | Description |
|--------|-------------|
| ID | Unique identifier |
| Poster | Thumbnail image |
| Subject Name | Display name |
| Year | Academic year |
| Category | Category name |
| Price | Current price with discount |
| Level | Difficulty level |
| Duration | Total hours |
| Teacher | Assigned teacher name |
| Actions | Edit, Delete buttons |

### Terms Table
| Column | Description |
|--------|-------------|
| ID | Unique identifier |
| Term Number | Sequential term number |
| Subject | Parent subject name |
| Year | Parent year number |
| Start Date | Term start date |
| Week Count | Number of weeks in term |
| Actions | Edit, Delete buttons |

### Weeks Table
| Column | Description |
|--------|-------------|
| ID | Unique identifier |
| Week Number | Sequential week number |
| Term | Parent term info |
| Subject | Parent subject name |
| Lesson Count | Number of lessons in week |
| Actions | Edit, Delete buttons |

### Lessons Table
| Column | Description |
|--------|-------------|
| ID | Unique identifier |
| Poster | Video thumbnail |
| Title | Lesson title |
| Week | Parent week info |
| Subject | Parent subject name |
| Duration | Video duration |
| Resources | Resource count with manage button |
| Actions | Preview, Edit, Delete buttons |

---

## 🎯 Modals

### 1. Add/Edit Modal
```html
@if (isFormOpen) {
  <div class="modal fade show d-block">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5>{{ formMode === 'add' ? 'Add' : 'Edit' }} {{ entityTitle }}</h5>
          <button (click)="closeForm()">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Dynamic form fields based on entityType -->
          @if (entityType === 'year') {
            <!-- Year form fields -->
          }
          @else if (entityType === 'category') {
            <!-- Category form fields -->
          }
          <!-- etc. -->
        </div>
        
        <div class="modal-footer">
          <button (click)="closeForm()">Cancel</button>
          <button (click)="submitForm()" [disabled]="!isFormValid()">
            {{ formMode === 'add' ? 'Create' : 'Update' }}
          </button>
        </div>
      </div>
    </div>
  </div>
}
```

**Form Fields by Entity Type:**

**Year:**
- Year Number (number input, required)

**Category:**
- Name (text input, required)
- Description (textarea, required)
- Color (color picker, optional)

**Subject Name:**
- Name (text input, required)
- Category (select dropdown, required)

**Subject:**
- Year (select dropdown, required)
- Subject Name (select dropdown, required)
- Teacher (select dropdown, required)
- Original Price (number input, required)
- Discount Percentage (number input, 0-100, required)
- Level (text input, required)
- Duration (number input, hours, required)
- Start Date (date input, required)
- Poster Image (file upload, required for add, optional for edit)

**Term:**
- Subject (select dropdown, required)
- Term Number (number input, required)
- Start Date (date input, required)

**Week:**
- Term (select dropdown, required)
- Week Number (number input, required)

**Lesson:**
- Week (select dropdown, required)
- Subject (select dropdown, auto-filled from week)
- Title (text input, required)
- Description (textarea, required)
- Duration (number input, minutes, optional)
- Order Index (number input, optional)
- Poster Image (file upload, required for add, optional for edit)
- Video File (file upload, required for add, optional for edit)

---

### 2. Resource Management Modal
```html
@if (resourceModalOpen) {
  <div class="modal fade show d-block">
    <div class="modal-dialog modal-lg">
      <div class="modal-header">
        <h5>Manage Resources - {{ selectedLesson?.title }}</h5>
      </div>
      
      <div class="modal-body">
        <button (click)="openAddResource()">Add Resource</button>
        
        <!-- Resources List -->
        @for (resource of lessonResources; track resource.id) {
          <div class="resource-item">
            <div>
              <h6>{{ resource.title }}</h6>
              <small>{{ resource.fileType }} • {{ resource.fileSize }} KB</small>
            </div>
            <div>
              <a [href]="resource.fileUrl" target="_blank">Download</a>
              <button (click)="deleteResource(resource)">Delete</button>
            </div>
          </div>
        }
      </div>
    </div>
  </div>
}
```

---

### 3. Add Resource Modal
```html
@if (resourceFormOpen) {
  <div class="modal fade show d-block">
    <div class="modal-dialog">
      <div class="modal-header">
        <h5>Add Resource</h5>
      </div>
      
      <div class="modal-body">
        <input type="text" [(ngModel)]="resourceForm.title" placeholder="Resource Title" />
        <input type="file" (change)="onResourceFileChange($event)" />
      </div>
      
      <div class="modal-footer">
        <button (click)="closeResourceForm()">Cancel</button>
        <button (click)="saveResource()">Save</button>
      </div>
    </div>
  </div>
}
```

---

### 4. Preview Modal
```html
@if (previewOpen) {
  <div class="modal fade show d-block">
    <div class="modal-dialog modal-xl">
      <div class="modal-header">
        <h5>{{ preview.title }}</h5>
      </div>
      
      <div class="modal-body">
        @if (preview.type === 'lesson') {
          <video [src]="preview.videoUrl" controls></video>
          <h6>{{ preview.title }}</h6>
          <p>{{ preview.description }}</p>
          <div>Duration: {{ preview.duration }} minutes</div>
          <div>Week: {{ preview.week }}</div>
        }
        @else if (preview.type === 'category') {
          <h6>{{ preview.name }}</h6>
          <p>{{ preview.description }}</p>
          <div>Subject Count: {{ preview.subjectCount }}</div>
        }
      </div>
    </div>
  </div>
}
```

---

## 🎨 Styling Classes

### Utility Classes
- `cursor-pointer` - Changes cursor to pointer
- `hover-lift` - Adds elevation on hover
- `glass` - Glass morphism effect
- `empty-state` - Centered empty state layout

### State Classes
- `is-invalid` - Red border + error icon for invalid inputs
- `is-valid` - Green border + check icon for valid inputs
- `mobile-active` - Shows sidebar on mobile
- `active` - Active tab or navigation item

### Responsive Classes
- `d-lg-none` - Hidden on desktop, visible on mobile
- `d-none d-lg-block` - Hidden on mobile, visible on desktop

---

## 📱 Responsive Behavior

### Mobile (<992px)
- Sidebar becomes overlay (hidden by default)
- Mobile menu toggle button appears
- Tables become scrollable horizontally
- Form modals adjust to smaller width
- Pagination controls stack vertically
- Action buttons group differently

### Tablet (768px - 991px)
- Sidebar remains overlay
- Stats cards show 2 per row
- Table columns optimize for space

### Desktop (≥992px)
- Sidebar always visible (fixed position)
- Mobile toggle hidden
- Stats cards show 3 per row
- Full table columns visible

---

## 🔄 Data Flow

### Loading Data
```
Component Init
  ↓
loadAllFromAPI()
  ↓
Parallel API Calls
  ↓
Update Local Arrays
  ↓
refreshAll()
  ↓
applyFilters() → updatePaged() → updateStats()
```

### Filtering Data
```
User Changes Filter
  ↓
onFilterChange()
  ↓
Load Filtered Data from API (if applicable)
  ↓
resetPaging()
  ↓
refreshAll()
```

### Creating Entity
```
User Clicks "Add"
  ↓
openAdd(type)
  ↓
User Fills Form
  ↓
submitForm()
  ↓
Validate Fields
  ↓
addEntity() → API POST
  ↓
Update Local Array
  ↓
refreshAll()
  ↓
Show Success Message
```

### Updating Entity
```
User Clicks "Edit"
  ↓
openEdit(type, entity)
  ↓
Populate Form
  ↓
User Modifies Fields
  ↓
submitForm()
  ↓
Validate Fields
  ↓
updateEntity() → API PUT
  ↓
Update Local Array
  ↓
refreshAll()
  ↓
Show Success Message
```

### Deleting Entity
```
User Clicks "Delete"
  ↓
confirmDelete(type, entity)
  ↓
Show Confirmation Dialog
  ↓
User Confirms
  ↓
API DELETE
  ↓
Remove from Local Array
  ↓
refreshAll()
  ↓
Show Success Message
```

---

## 🎯 Event Handlers Summary

| Event | Method | Description |
|-------|--------|-------------|
| `(click)="toggleMobileSidebar()"` | Open/close sidebar on mobile |
| `(click)="closeMobileSidebar()"` | Close sidebar (overlay click) |
| `(ngModelChange)="onFilterChange()"` | React to filter changes |
| `(click)="clearFilters()"` | Reset all filters |
| `(click)="setActiveTab(tab)"` | Switch between tabs |
| `(click)="openAdd(type)"` | Open add form modal |
| `(click)="openEdit(type, entity)"` | Open edit form modal |
| `(click)="confirmDelete(type, entity)"` | Delete with confirmation |
| `(click)="submitForm()"` | Submit add/edit form |
| `(click)="closeForm()"` | Close form modal |
| `(change)="onFileChange($event, field)"` | Handle file upload |
| `(click)="goYearPage(p)"` | Navigate to page |
| `(click)="manageResources(lesson)"` | Open resource manager |
| `(click)="saveResource()"` | Save new resource |
| `(click)="deleteResource(resource)"` | Delete resource |
| `(click)="openLessonPreview(lesson)"` | Preview lesson |
| `(click)="closePreview()"` | Close preview modal |

---

## ✅ Validation Rules

### Real-time Validation
- Fields are validated on blur
- Error messages appear immediately
- Valid fields show green checkmark
- Invalid fields show red X icon

### Validation Classes
```html
<input 
  [class.is-invalid]="formErrors.fieldName && formTouched.fieldName"
  [class.is-valid]="!formErrors.fieldName && formTouched.fieldName && form.fieldName"
  (blur)="markFieldTouched('fieldName')"
  (input)="validateField('fieldName', form.fieldName)"
/>
```

### Error Display
```html
@if (hasFieldError('fieldName')) {
  <div class="invalid-feedback">
    {{ getFieldError('fieldName') }}
  </div>
}
```

---

## 🎨 Animation Classes

- `fadeIn` - Fade in animation for cards
- `slideDown` - Slide down for error messages
- All transitions use `ease` or `cubic-bezier` timing
- Hover effects include scale and shadow changes

---

**Last Updated:** 2025-11-03  
**Maintained By:** AI Assistant
