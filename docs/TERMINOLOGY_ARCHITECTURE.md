# Customizable Terminology - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Terminology Settings Component                            │ │
│  │  - Load current configuration                              │ │
│  │  - Apply presets (Standard/Parts/Modules/Units)           │ │
│  │  - Edit custom terminology                                │ │
│  │  - Live preview                                            │ │
│  │  - Save/Reset/Discard                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              TERMINOLOGY SERVICE (Core)                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • getTerminology()          - Get current config           │ │
│  │ • getTerminology$()         - Observable stream            │ │
│  │ • fetchTerminologyFromServer() - Load from API            │ │
│  │ • updateTerminology()       - Save to API                  │ │
│  │ • resetTerminology()        - Reset to defaults            │ │
│  │ • Helper Methods:                                          │ │
│  │   - getTermNumberLabel()                                   │ │
│  │   - getWeekNumberLabel()                                   │ │
│  │   - getPlaceholder()                                       │ │
│  │   - formatTerm() / formatWeek()                           │ │
│  │   - getValidationMessage()                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ STORAGE:                                                   │ │
│  │ • BehaviorSubject (In-Memory)                             │ │
│  │ • localStorage (Browser Cache)                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND API ENDPOINTS                               │
│                                                                   │
│  • GET    /api/settings/terminology     - Fetch config          │
│  • PUT    /api/settings/terminology     - Update config         │
│  • POST   /api/settings/terminology     - Create config         │
│  • POST   /api/settings/terminology/reset - Reset to defaults  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Initialization Flow
```
App Bootstrap
    ↓
TerminologyService Constructor
    ↓
Check localStorage Cache
    ├─ Found: Load from cache
    ├─ Not Found: Use DEFAULT_TERMINOLOGY
    ↓
BehaviorSubject emits current config
    ↓
All components subscribed to terminology$ receive update
```

### User Changes Terminology Flow
```
Admin opens Terminology Settings
    ↓
Component calls fetchTerminologyFromServer()
    ↓
Service fetches via GET /api/settings/terminology
    ↓
Service updates BehaviorSubject
    ↓
Service caches in localStorage
    ↓
All subscribed components automatically update
```

### Save Changes Flow
```
Admin clicks "Save Changes"
    ↓
Component calls terminologyService.updateTerminology(config)
    ↓
Service sends PUT /api/settings/terminology
    ↓
Backend validates and saves
    ↓
Service receives updated config
    ↓
BehaviorSubject emits new config
    ↓
All subscribed components receive update
    ↓
localStorage updated
    ↓
Admin sees success message
```

## Component Integration

### Components Using Terminology Service

```
┌─────────────────────────────────────────┐
│  Dashboard Component                     │
│  ├─ termNumberLabel binding             │
│  ├─ weekNumberLabel binding             │
│  └─ placeholders                        │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  TerminologyService                      │
│  (Injected as public property)          │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Template Expression                     │
│  {{ terminologyService.getTermNumberLabel() }}
└─────────────────────────────────────────┘

Similar Pattern for:
• ContentManagementComponent
• ContentModalComponent
```

## Configuration Structure

```
TerminologyConfig
├─ Term Settings
│  ├─ termLabel: "Term" → "Part" → "Module" → "Unit"
│  ├─ termNumberLabel: "Term Number" → "Part Number" → etc
│  ├─ termSingular: "term" → "part" → "module" → "unit"
│  └─ termPlural: "terms" → "parts" → "modules" → "units"
│
└─ Week Settings
   ├─ weekLabel: "Week" → "Session" → "Lesson" → "Topic"
   ├─ weekNumberLabel: "Week Number" → "Session Number" → etc
   ├─ weekSingular: "week" → "session" → "lesson" → "topic"
   └─ weekPlural: "weeks" → "sessions" → "lessons" → "topics"
```

## State Management

```
Global State (Singleton Service)
│
├─ terminologySubject: BehaviorSubject<TerminologyConfig>
│  └─ Emits to all subscribers
│
├─ terminology$: Observable<TerminologyConfig>
│  └─ Public stream for component subscriptions
│
└─ Cache (localStorage)
   └─ Key: 'app_terminology_config'
   └─ Value: JSON serialized TerminologyConfig
```

## Usage Pattern in Components

```typescript
// 1. Injection
constructor(public terminologyService: TerminologyService) {}

// 2. Subscribe to changes (optional)
this.terminologyService.terminology$.subscribe(config => {
  // Handle updates
});

// 3. Use in template
<label>{{ terminologyService.getTermNumberLabel() }}</label>
<input [placeholder]="terminologyService.getPlaceholder('week')" />

// 4. Use in component logic
const formatted = this.terminologyService.formatTerm(1);
const validation = this.terminologyService.getValidationMessage('term', 'required');
```

## Preset System

```
TERMINOLOGY_PRESETS
│
├─ standard
│  ├─ Term/Term Number/term/terms
│  └─ Week/Week Number/week/weeks
│
├─ parts
│  ├─ Part/Part Number/part/parts
│  └─ Session/Session Number/session/sessions
│
├─ modules
│  ├─ Module/Module Number/module/modules
│  └─ Lesson/Lesson Number/lesson/lessons
│
└─ units
   ├─ Unit/Unit Number/unit/units
   └─ Topic/Topic Number/topic/topics
```

## Caching Strategy

```
Request Flow:
1. App Initializes
   ├─ Check localStorage for 'app_terminology_config'
   ├─ If exists: Use cached config
   └─ If not: Use DEFAULT_TERMINOLOGY

2. User Updates Terminology
   ├─ Send to backend
   ├─ Receive response
   ├─ Update BehaviorSubject
   ├─ Update localStorage cache
   └─ Components automatically update

3. Page Reload
   ├─ Service loads from cache
   ├─ Instant access without API call
   └─ Matches server state
```

## Error Handling

```
fetchTerminologyFromServer()
├─ Success
│  ├─ Update BehaviorSubject
│  ├─ Update cache
│  └─ Components update
│
└─ Error
   ├─ Log error
   ├─ Use cached config (if available)
   ├─ Fall back to DEFAULT_TERMINOLOGY
   └─ Notify user via admin component

updateTerminology()
├─ Success
│  ├─ Update server
│  ├─ Update local state
│  └─ Show success message
│
└─ Error
   ├─ Log error
   ├─ Show error message
   └─ Keep local changes for retry
```

## Performance Optimization

```
Strategy 1: Caching
- Store config in localStorage
- Avoid repeated API calls on page refresh
- Instant access without network latency

Strategy 2: Observable Pattern
- Single source of truth (BehaviorSubject)
- Components subscribe once during init
- Efficient change propagation via Angular's change detection

Strategy 3: Lazy Loading
- Terminology only loaded when admin accesses settings
- Background fetch doesn't block other components
- Service provides sync access to cached config

Strategy 4: Change Detection
- Use OnPush strategy where applicable
- Minimize re-renders
- Only update affected components
```

## Dependency Graph

```
terminology-settings.component
    ↓
    ├─→ TerminologyService
    │   ├─→ HttpClient
    │   ├─→ localStorage API
    │   └─→ BehaviorSubject (RxJS)
    │
    └─→ TerminologyConfig (interface)

dashboard.component
content-management.component
content-modal.component
    ↓
    └─→ TerminologyService (shared)
        └─→ Uses getTermNumberLabel(), getPlaceholder(), etc.
```

## UI Component Hierarchy

```
AdminArea/
├─ TerminologySettingsComponent (new)
│  ├─ PresetSelector
│  │  ├─ StandardButton
│  │  ├─ PartsButton
│  │  ├─ ModulesButton
│  │  └─ UnitsButton
│  │
│  ├─ ConfigurationForm
│  │  ├─ TermSection
│  │  │  ├─ termLabel input
│  │  │  ├─ termNumberLabel input
│  │  │  ├─ termSingular input
│  │  │  └─ termPlural input
│  │  │
│  │  └─ WeekSection
│  │     ├─ weekLabel input
│  │     ├─ weekNumberLabel input
│  │     ├─ weekSingular input
│  │     └─ weekPlural input
│  │
│  ├─ PreviewSection
│  │  ├─ TermPreview
│  │  ├─ WeekPreview
│  │  └─ CombinedPreview
│  │
│  └─ ActionButtons
│     ├─ SaveButton
│     ├─ DiscardButton
│     └─ ResetButton
```

## Request/Response Lifecycle

```
Admin → Frontend → Backend → Database → Backend → Frontend → Admin
 │        │         │          │          │         │         │
 1        2         3          4          5         6         7

1. User action (click save)
2. Component calls service method
3. Service makes HTTP request
4. Backend processes and stores
5. Backend returns updated config
6. Service updates local state & cache
7. Admin sees confirmation
```

## Security Considerations

```
Frontend Level:
• Only admin components access terminology settings
• Validation on form inputs
• Error handling for failed API calls

Backend Level (TODO):
• Verify admin/super-admin role
• Validate all input fields
• Rate limit terminology updates
• Audit log terminology changes
• Encrypt stored configurations if sensitive
```

---

This architecture ensures:
✅ Centralized terminology management
✅ Real-time updates across components
✅ Efficient caching
✅ Reactive programming pattern
✅ Scalability for future features
✅ Easy testing and debugging
