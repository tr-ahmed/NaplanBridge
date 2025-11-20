# 🎨 Profile Edit Feature - UI/UX Visual Guide

**Date:** November 20, 2025  
**Version:** 1.0

---

## 📱 UI Layout Overview

### Desktop View (> 768px)

```
┌─────────────────────────────────────────────────────────────┐
│                   PROFILE EDIT CONTAINER                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  PROFILE EDIT CARD                  │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │                                                     │    │
│  │  ═══════ Edit Profile ═══════  (Title)            │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │    AVATAR SECTION                           │   │    │
│  │  ├─────────────────────────────────────────────┤   │    │
│  │  │                                             │   │    │
│  │  │         ┌──────────────┐                    │   │    │
│  │  │         │              │                    │   │    │
│  │  │         │    Avatar    │  (180x180px)       │   │    │
│  │  │         │   (Circle)   │                    │   │    │
│  │  │         │              │                    │   │    │
│  │  │         └──────────────┘                    │   │    │
│  │  │           [Avatar Label]                    │   │    │
│  │  │                                             │   │    │
│  │  │  [🎥 Change Picture] [✕ Cancel]           │   │    │
│  │  │                                             │   │    │
│  │  │  Supported formats: JPG, PNG, GIF. Max     │   │    │
│  │  │  size: 5MB                                  │   │    │
│  │  │                                             │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │  ACCOUNT INFORMATION                        │   │    │
│  │  ├─────────────────────────────────────────────┤   │    │
│  │  │                                             │   │    │
│  │  │  USERNAME                                   │   │    │
│  │  │  ┌─────────────────────────────────────┐   │   │    │
│  │  │  │ john_doe                            │   │   │    │
│  │  │  └─────────────────────────────────────┘   │   │    │
│  │  │                                             │   │    │
│  │  │  EMAIL ADDRESS                              │   │    │
│  │  │  ┌─────────────────────────────────────┐   │   │    │
│  │  │  │ john@example.com                    │   │   │    │
│  │  │  └─────────────────────────────────────┘   │   │    │
│  │  │                                             │   │    │
│  │  │  AGE                        PHONE NUMBER    │   │    │
│  │  │  ┌──────────────────┐  ┌──────────────┐    │   │    │
│  │  │  │ 25               │  │ +61412345678 │    │   │    │
│  │  │  └──────────────────┘  └──────────────┘    │   │    │
│  │  │                                             │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │  [✓ Save Changes]  [↺ Reset]              │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### Mobile View (< 480px)

```
┌──────────────────────────┐
│  PROFILE EDIT CONTAINER  │
├──────────────────────────┤
│                          │
│  Edit Profile (Title)    │
│                          │
│ ┌────────────────────┐   │
│ │  AVATAR SECTION    │   │
│ ├────────────────────┤   │
│ │                    │   │
│ │    ┌──────────┐    │   │
│ │    │          │    │   │
│ │    │ Avatar   │    │   │
│ │    │(120x120) │    │   │
│ │    │          │    │   │
│ │    └──────────┘    │   │
│ │                    │   │
│ │ [🎥 Change Pict]   │   │
│ │ [✕ Cancel]         │   │
│ │                    │   │
│ │ Max size: 5MB      │   │
│ │                    │   │
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │ ACCOUNT INFO       │   │
│ ├────────────────────┤   │
│ │                    │   │
│ │ Username           │   │
│ │ ┌────────────────┐ │   │
│ │ │ john_doe       │ │   │
│ │ └────────────────┘ │   │
│ │                    │   │
│ │ Email              │   │
│ │ ┌────────────────┐ │   │
│ │ │ john@exam.com  │ │   │
│ │ └────────────────┘ │   │
│ │                    │   │
│ │ Age                │   │
│ │ ┌────────────────┐ │   │
│ │ │ 25             │ │   │
│ │ └────────────────┘ │   │
│ │                    │   │
│ │ Phone              │   │
│ │ ┌────────────────┐ │   │
│ │ │ +614123...     │ │   │
│ │ └────────────────┘ │   │
│ │                    │   │
│ └────────────────────┘   │
│                          │
│ [✓ Save Changes]         │
│ [↺ Reset]                │
│                          │
└──────────────────────────┘
```

---

## 🎯 User Journey Flow

### Step 1: Access Profile Edit
```
Start
  │
  ├─→ Option A: Click Header Menu
  │   └─→ "Edit Profile"
  │
  ├─→ Option B: Direct URL
  │   └─→ /profile/edit
  │
  └─→ Option C: Mobile Menu
      └─→ "Edit Profile" Link
         │
         └─→ ProfileEditComponent Loads
```

### Step 2: Component Initialization
```
Component Loads
  │
  ├─→ Initialize Form
  │   └─→ Create Reactive Form
  │       └─→ Add Validators
  │
  ├─→ Load Current Profile
  │   ├─→ Check localStorage
  │   │   └─→ If found: Use stored data ✓
  │   │
  │   └─→ If not found:
  │       └─→ Call API
  │           └─→ GET /api/user/profile
  │               └─→ Display loaded data
  │
  └─→ Patch Form with Current Data
      └─→ Form Ready for Editing
```

### Step 3: Edit Profile
```
User Editing
  │
  ├─→ Modify Text Field
  │   ├─→ Real-time Validation
  │   │   └─→ Show/Hide Error Message
  │   │
  │   └─→ Form State Updates
  │
  ├─→ Select Avatar (Optional)
  │   ├─→ Click "Change Picture"
  │   │   └─→ File Dialog Opens
  │   │
  │   ├─→ Select Image File
  │   │   ├─→ Validate Type ✓
  │   │   ├─→ Validate Size ✓
  │   │   └─→ Create Preview
  │   │       └─→ Display Avatar Image
  │   │
  │   └─→ Click "Cancel" (Optional)
  │       └─→ Remove Selected File
  │           └─→ Show Original Avatar
  │
  └─→ Continue Editing...
```

### Step 4: Submit Changes
```
Click "Save Changes"
  │
  ├─→ Validate Form
  │   ├─→ All Required Fields Filled? ✓
  │   └─→ No Validation Errors? ✓
  │
  ├─→ If File Selected:
  │   ├─→ Show Loading Dialog
  │   ├─→ Upload Avatar
  │   │   └─→ POST /api/Media/upload-image
  │   │       ├─→ Get avatarUrl from response
  │   │       └─→ Hide Loading Dialog
  │   │
  │   └─→ Handle Upload Error
  │       └─→ Show Error Alert
  │
  ├─→ Update Profile
  │   ├─→ Show Loading Dialog
  │   ├─→ Prepare Data
  │   │   └─→ Include avatarUrl if new
  │   │
  │   ├─→ Send Update
  │   │   └─→ PUT /api/Account/update-profile
  │   │       └─→ Receive Response
  │   │
  │   ├─→ Update localStorage
  │   │   └─→ Save Updated User Data
  │   │
  │   ├─→ Show Success Alert
  │   │   └─→ Reload Profile Data
  │   │
  │   └─→ Hide Loading Dialog
  │
  └─→ Form Ready for Next Edit or Close
```

---

## 🎨 Visual Elements

### Colors Used

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Primary Button | Blue | #007bff | Save/Action buttons |
| Avatar Border | Blue | #007bff | Avatar circle border |
| Success Alert | Green | #28a745 | Success messages |
| Error Alert | Red | #dc3545 | Error messages |
| Background | Light Gray | #f5f7fa | Container background |
| Card Background | White | #ffffff | Form card background |

### Typography

| Element | Font Size | Weight | Usage |
|---------|-----------|--------|-------|
| Page Title | 28px | 700 | Main heading |
| Section Title | 18px | 600 | Section headings |
| Form Label | 14px | 600 | Field labels |
| Form Input | 14px | 400 | Input text |
| Helper Text | 12px | 400 | Validation messages |
| Error Text | 12px | 400 | Error messages (red) |

### Spacing

| Element | Padding | Margin | Usage |
|---------|---------|--------|-------|
| Container | 40px | - | Main container padding |
| Card | 40px | - | Card internal spacing |
| Form Group | - | 20px | Between form fields |
| Button Group | - | 15px gap | Between action buttons |
| Avatar | - | 20px | Below avatar section |

---

## ✨ Interactive States

### Button States

```
┌──────────────────────────────┐
│     [Button Text]            │  ← NORMAL
└──────────────────────────────┘

┌──────────────────────────────┐
│     [Button Text]            │  ← HOVER (darker, raised)
└──────────────────────────────┘

┌──────────────────────────────┐
│   ⊙ Loading...               │  ← LOADING (spinner)
└──────────────────────────────┘

┌──────────────────────────────┐
│     [Button Text] (faded)    │  ← DISABLED
└──────────────────────────────┘
```

### Form Field States

```
┌─────────────────────────┐
│ Label                   │
│ ┌─────────────────────┐ │  EMPTY
│ │                     │ │
│ └─────────────────────┘ │
│ Placeholder text        │
└─────────────────────────┘

┌─────────────────────────┐
│ Label                   │
│ ┌─────────────────────┐ │  FILLED
│ │ Input value         │ │
│ └─────────────────────┘ │
└─────────────────────────┘

┌─────────────────────────┐
│ Label                   │
│ ┌─────────────────────┐ │  FOCUSED
│ │ Input value ⚡      │ │ (Blue border)
│ └─────────────────────┘ │
│ Focus indicator         │
└─────────────────────────┘

┌─────────────────────────┐
│ Label                   │
│ ┌─────────────────────┐ │  ERROR
│ │ Invalid input ✗     │ │ (Red border)
│ └─────────────────────┘ │
│ ✗ Error message         │ (Red text)
└─────────────────────────┘
```

---

## 🖼️ Avatar Display

### With Image
```
        ┌──────────────┐
        │              │
        │    Avatar    │ ← Avatar Label
        │    Image     │
        │   (180x180)  │
        │   Circular   │
        │    Blue      │
        │    Border    │
        │              │
        └──────────────┘
```

### Without Image
```
        ┌──────────────┐
        │              │
        │      👤      │ ← User icon
        │              │
        │ No profile   │
        │  picture     │
        │              │
        │ [Change Pic] │
        │              │
        └──────────────┘
```

---

## 📱 Responsive Behavior

### Breakpoints and Changes

#### Desktop (> 768px)
- ✅ Full layout visible
- ✅ Avatar 180px
- ✅ Card max-width 700px
- ✅ All buttons visible
- ✅ Horizontal form layout

#### Tablet (480px - 768px)
- ✅ Adapted layout
- ✅ Avatar 140px
- ✅ Card full width
- ✅ All buttons visible
- ✅ Vertical form layout

#### Mobile (< 480px)
- ✅ Simplified layout
- ✅ Avatar 120px
- ✅ Card full width
- ✅ Stacked buttons
- ✅ Compact spacing

---

## 🎯 Error Messages & Validation

### Validation in Action

```
1. Username Field (EMPTY)
   ┌─────────────────────────┐
   │ Username                │
   │ ┌─────────────────────┐ │
   │ │                     │ │
   │ └─────────────────────┘ │
   │ ✗ Username is required  │ (Red text)
   └─────────────────────────┘

2. Username Field (TOO SHORT)
   ┌─────────────────────────┐
   │ Username                │
   │ ┌─────────────────────┐ │
   │ │ jo                  │ │
   │ └─────────────────────┘ │
   │ ✗ Minimum 3 characters  │ (Red text)
   └─────────────────────────┘

3. Username Field (VALID)
   ┌─────────────────────────┐
   │ Username                │
   │ ┌─────────────────────┐ │
   │ │ john_doe            │ │
   │ └─────────────────────┘ │
   └─────────────────────────┘
```

---

## 🔔 Alert Messages

### Success Alert
```
╔════════════════════════════════╗
║ ✓ Success                      ║
║ Profile updated successfully   ║
║                                ║
║ [Close or auto-close in 2s]    ║
╚════════════════════════════════╝
```

### Error Alert
```
╔════════════════════════════════╗
║ ✗ Error                        ║
║ Failed to upload image         ║
║                                ║
║ [Close]                        ║
╚════════════════════════════════╝
```

### Loading Alert
```
╔════════════════════════════════╗
║ ⟳ Uploading...                 ║
║ Please wait while uploading... ║
║                                ║
║ [Cancel not available]         ║
╚════════════════════════════════╝
```

---

## 🎬 Animation Details

### Transitions

| Element | Animation | Duration | Timing |
|---------|-----------|----------|--------|
| Page Load | Slide In | 0.3s | Ease-out |
| Button Hover | Color Change | 0.3s | Ease |
| Button Hover | Raise | 0.3s | Ease |
| Border Change | Fade | 0.3s | Ease |
| Error Show | Slide Down | 0.2s | Ease-out |
| Loading Spin | Rotate | 1s | Linear |

### Key Animations

```
1. Page Load
   From: Opacity 0, Translate Y+20px
   To:   Opacity 1, Translate Y 0
   Duration: 0.3s

2. Button Hover
   From: Scale 1, Shadow small
   To:   Scale 1.05, Shadow large
   Duration: 0.3s

3. Spinner Rotation
   From: Rotate 0deg
   To:   Rotate 360deg
   Duration: 1s (repeating)

4. Error Message
   From: Opacity 0, Translate Y-5px
   To:   Opacity 1, Translate Y 0
   Duration: 0.2s
```

---

## ♿ Accessibility Features

### Keyboard Navigation
- ✅ Tab through form fields
- ✅ Enter to submit form
- ✅ Esc to close dropdowns
- ✅ Space to toggle buttons

### Screen Reader Support
- ✅ Form labels properly associated
- ✅ Error messages announced
- ✅ Button purposes clear
- ✅ Loading states announced

### Visual Accessibility
- ✅ Sufficient color contrast
- ✅ Large touch targets (44px minimum)
- ✅ Clear focus indicators
- ✅ Error messages in color + icon

---

## 📊 Component Interaction Diagram

```
Header Menu
    │
    ├─→ Edit Profile Link
    │      │
    │      └─→ Click
    │           │
    │           └─→ Navigate to /profile/edit
    │                │
    │                └─→ ProfileEditComponent
    │                     │
    │                     ├─→ Load Data
    │                     │   ├─→ localStorage
    │                     │   └─→ API (fallback)
    │                     │
    │                     ├─→ Display Form
    │                     │   └─→ Populate fields
    │                     │
    │                     ├─→ User Edits
    │                     │   ├─→ Real-time validation
    │                     │   └─→ Error display
    │                     │
    │                     ├─→ Upload Avatar
    │                     │   ├─→ File selection
    │                     │   ├─→ Validation
    │                     │   └─→ Preview
    │                     │
    │                     └─→ Submit
    │                         ├─→ Upload image
    │                         ├─→ Update profile
    │                         └─→ Show result

           │
           └─→ Success/Error Message
               └─→ Reload or Close
```

---

## 🎨 Design System

### Button Styles

**Primary Button (Save)**
- Background: Linear gradient (Blue → Dark Blue)
- Hover: Darker gradient
- Text: White, bold
- Padding: 14px 28px
- Border radius: 8px
- Shadow: Blue glow

**Secondary Button (Reset)**
- Background: Transparent
- Border: 2px Gray
- Hover: Gray background + White text
- Text: Gray
- Padding: 14px 28px
- Border radius: 8px

### Input Styles

**Text Input**
- Border: 2px #e0e0e0
- Padding: 12px 16px
- Border radius: 8px
- Font size: 14px
- Focus: Blue border + light blue shadow
- Disabled: Gray background + disabled text

---

## 📋 Accessibility Checklist

- [x] Color contrast meets WCAG AA standard
- [x] Form inputs have associated labels
- [x] Error messages are announced
- [x] Focus indicators are visible
- [x] Touch targets are 44px minimum
- [x] Keyboard navigation supported
- [x] Loading states announced
- [x] Form validation clear
- [x] Success/error messages clear
- [x] Mobile responsive working

---

## 🎓 User Tips

1. **Fastest way to update avatar:**
   - Click "Change Picture"
   - Select file
   - Everything else auto-completes

2. **Fastest way to update profile:**
   - Make changes
   - Click "Save Changes"
   - Done! (No page refresh needed)

3. **If something goes wrong:**
   - Check error message
   - Correct the issue
   - Try again

4. **On mobile:**
   - Tap menu button (hamburger)
   - Tap "Edit Profile"
   - Use same flow as desktop

---

**UI/UX Guide Complete!** 🎨  
**Version:** 1.0  
**Date:** November 20, 2025
