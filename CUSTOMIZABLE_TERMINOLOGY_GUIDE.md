# Customizable Terminology Feature Implementation

## Overview
This implementation allows clients to fully customize terminology labels for "Term" and "Week" throughout the application. Users can rename them to "Parts", "Sessions", "Modules", "Units", or any custom naming convention.

## Components Created

### 1. Terminology Models (`src/app/models/terminology.models.ts`)
- **`TerminologyConfig`**: Main interface for terminology configuration
  - `termLabel`: Display label for term (e.g., "Term", "Part", "Module")
  - `termNumberLabel`: Label for term number field (e.g., "Term Number", "Part Number")
  - `termSingular`: Singular form used in messages
  - `termPlural`: Plural form used in lists
  - `weekLabel`: Display label for week
  - `weekNumberLabel`: Label for week number field
  - `weekSingular`: Singular form for weeks
  - `weekPlural`: Plural form for weeks

- **Preset Configurations**:
  - Standard (Term/Week)
  - Parts/Sessions
  - Modules/Lessons
  - Units/Topics

- **DTOs**:
  - `CreateTerminologyConfigDto`: For creating new terminology config
  - `UpdateTerminologyConfigDto`: For updating existing config

### 2. Terminology Service (`src/app/core/services/terminology.service.ts`)
Central service for managing terminology throughout the application.

**Key Methods**:
```typescript
// Retrieve current terminology
getTerminology(): TerminologyConfig
getTerminology$(): Observable<TerminologyConfig>

// Server operations
fetchTerminologyFromServer(): Observable<TerminologyConfig>
updateTerminology(config): Observable<TerminologyConfig>
resetTerminology(): Observable<TerminologyConfig>

// UI Helper methods
getTermLabel(count?: number): string        // Returns "Term" or "Terms"
getWeekLabel(count?: number): string        // Returns "Week" or "Weeks"
getTermNumberLabel(): string                // Returns "Term Number"
getWeekNumberLabel(): string                // Returns "Week Number"
getValidationMessage(type, messageKey): string
getPlaceholder(type): string
formatTerm(number): string                  // e.g., "Term 1"
formatWeek(number): string                  // e.g., "Week 5"
formatTermAndWeek(termNum, weekNum): string // e.g., "Term 1 - Week 5"
```

**Features**:
- Local caching with localStorage for instant access
- Observable pattern for reactive updates
- Helper methods for common UI patterns
- Dynamic validation messages

### 3. Updated Components

#### Dashboard Component
- **File**: `src/app/teacher/dashboard/dashboard.component.ts` & `.html`
- **Changes**:
  - Injected `TerminologyService`
  - Updated label bindings:
    ```html
    <label>{{ terminologyService.getTermNumberLabel() }} *</label>
    <label>{{ terminologyService.getWeekNumberLabel() }} *</label>
    ```
  - Updated placeholders:
    ```html
    [placeholder]="terminologyService.getPlaceholder('term')"
    [placeholder]="terminologyService.getPlaceholder('week')"
    ```

#### Content Management Component
- **File**: `src/app/features/content-management/content-management.ts` & `.html`
- **Changes**:
  - Injected `TerminologyService`
  - Updated all terminology labels and placeholders
  - Updated descriptive text to use terminology dynamically
  - Example: `{{ terminologyService.getWeekLabel() }} number within the {{ terminologyService.getTermLabel().toLowerCase() }}`

#### Content Modal Component
- **File**: `src/app/features/content-management/components/content-modal/content-modal.component.ts` & `.html`
- **Changes**:
  - Injected `TerminologyService`
  - Updated all form labels and placeholders
  - Updated helper messages with dynamic terminology
  - Example: `{{ terminologyService.getTermSingular() }} number will be filled automatically based on selected subject`

### 4. Admin Settings Component
- **File**: `src/app/admin/terminology-settings/terminology-settings.component.ts`
- **Files**:
  - `terminology-settings.component.html` - Admin UI
  - `terminology-settings.component.scss` - Styles

**Features**:
- Load current terminology configuration from server
- Quick preset buttons (Standard, Parts/Sessions, Modules/Lessons, Units/Topics)
- Custom configuration form with all terminology fields
- Live preview of how labels will appear
- Save changes to server
- Reset to defaults functionality
- Change detection to show save/discard buttons only when modified

## Integration Steps

### 1. Register the Terminology Service
The service is already provided in root via `@Injectable({ providedIn: 'root' })`, so it's automatically available across the application.

### 2. Add Admin Route (if needed)
Add to your `app.routes.ts`:
```typescript
{
  path: 'admin/terminology-settings',
  component: TerminologySettingsComponent,
  canActivate: [AdminGuard] // if you have admin guard
}
```

### 3. Add to Admin Navigation
Update your admin navigation menu to include a link to the terminology settings page.

### 4. Backend API Endpoints Required
The service expects these endpoints to exist:

**GET** `/api/settings/terminology`
- Returns current terminology configuration
- Response: `TerminologyConfig`

**PUT** `/api/settings/terminology`
- Updates terminology configuration
- Body: `UpdateTerminologyConfigDto`
- Response: Updated `TerminologyConfig`

**POST** `/api/settings/terminology/reset`
- Resets terminology to defaults
- Response: Default `TerminologyConfig`

**POST** `/api/settings/terminology`
- Creates terminology configuration (if not exists)
- Body: `CreateTerminologyConfigDto`
- Response: Created `TerminologyConfig`

## Usage Examples

### In Components
```typescript
// Inject the service
constructor(public terminologyService: TerminologyService) {}

// In template
<label>{{ terminologyService.getTermNumberLabel() }}</label>
<label>{{ terminologyService.getWeekNumberLabel() }}</label>

// Get dynamic values
getDisplayName() {
  return this.terminologyService.formatTerm(1); // "Term 1" or "Part 1"
}

// Use in messages
showMessage() {
  const label = this.terminologyService.getTermLabel();
  console.log(`${label} created successfully!`); // "Term created successfully!" or "Part created successfully!"
}
```

### In Validation
```typescript
// Get validation message
const message = this.terminologyService.getValidationMessage('term', 'required');
// Returns: "Term Number is required" or "Part Number is required"

// Get placeholder
const placeholder = this.terminologyService.getPlaceholder('week');
// Returns: "Enter week number" or "Enter session number"
```

## Caching Strategy
- Configuration is cached in localStorage with key `app_terminology_config`
- Cache is automatically updated when configuration is fetched or saved
- Provides instant access without server calls on page reload
- Can be cleared manually with `terminologyService.clearCache()`

## Reactive Updates
The service uses RxJS BehaviorSubject for reactive pattern:
```typescript
// Subscribe to terminology changes
this.terminologyService.terminology$.subscribe(config => {
  // Handle configuration updates
});

// Or get current value synchronously
const config = this.terminologyService.getTerminology();
```

## Preset Configurations

### Standard (Default)
```
Term Number → Term Number | Week Number → Week Number
```

### Parts/Sessions
```
Term Number → Part Number | Week Number → Session Number
```

### Modules/Lessons
```
Term Number → Module Number | Week Number → Lesson Number
```

### Units/Topics
```
Term Number → Unit Number | Week Number → Topic Number
```

## Testing Checklist

- [ ] Terminology settings page loads correctly
- [ ] Quick presets apply their configurations
- [ ] Custom configuration fields update
- [ ] Live preview updates in real-time
- [ ] Save functionality updates server
- [ ] Changes reflect across all components
- [ ] Reset to defaults works correctly
- [ ] Discard changes reverts form
- [ ] Cache updates correctly
- [ ] All components show customized labels
- [ ] Dashboard displays custom terminology
- [ ] Content management displays custom terminology
- [ ] Content modal displays custom terminology
- [ ] Form validation messages use custom terminology
- [ ] Placeholder text uses custom terminology
- [ ] Helper messages use custom terminology

## Future Enhancements

1. **Multi-Language Support**: Extend terminology config to support multiple languages
2. **Organization-Level Configuration**: Allow different organizations to have different terminology
3. **Terminology History**: Track changes to terminology over time
4. **Bulk Update**: Update all related content when terminology changes
5. **Template System**: Allow creating and saving custom terminology templates
6. **Localization**: Auto-translate presets to supported languages

## Browser Compatibility
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations
- Terminology loaded once on app initialization
- Cached locally to avoid repeated server calls
- Observable pattern allows efficient change propagation
- Minimal re-renders with Angular change detection

## Migration Notes
If upgrading existing applications:
1. Backend needs to support the new API endpoints
2. Admin users need access to terminology settings page
3. Default configuration will be used if none exists in database
4. No data migration needed - existing terms/weeks remain unchanged
