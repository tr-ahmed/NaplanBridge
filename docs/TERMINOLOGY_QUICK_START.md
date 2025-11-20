# Customizable Terminology - Quick Reference

## What Was Changed

### New Files Created
1. **`src/app/models/terminology.models.ts`** - Data models and interfaces
2. **`src/app/core/services/terminology.service.ts`** - Main service for terminology management
3. **`src/app/admin/terminology-settings/terminology-settings.component.ts`** - Admin component
4. **`src/app/admin/terminology-settings/terminology-settings.component.html`** - Admin UI
5. **`src/app/admin/terminology-settings/terminology-settings.component.scss`** - Styles

### Updated Files
1. **`src/app/teacher/dashboard/dashboard.component.ts`** - Injected terminology service
2. **`src/app/teacher/dashboard/dashboard.component.html`** - Updated labels and placeholders
3. **`src/app/features/content-management/content-management.ts`** - Injected terminology service
4. **`src/app/features/content-management/content-management.html`** - Updated labels and placeholders
5. **`src/app/features/content-management/components/content-modal/content-modal.component.ts`** - Injected terminology service
6. **`src/app/features/content-management/components/content-modal/content-modal.component.html`** - Updated labels and placeholders

## How It Works

### For Administrators
1. Navigate to Admin → Terminology Settings
2. Choose a preset (Parts/Sessions, Modules/Lessons, Units/Topics) or create custom names
3. See live preview of how labels will appear
4. Click "Save Changes" to apply across the entire application
5. All users see the updated terminology immediately

### For Developers
```typescript
// Inject service
constructor(public terminologyService: TerminologyService) {}

// Use in templates
<label>{{ terminologyService.getTermNumberLabel() }}</label>
<input [placeholder]="terminologyService.getPlaceholder('week')" />
<p>{{ terminologyService.formatTerm(1) }}</p>

// Use in components
const label = this.terminologyService.getTermLabel();
const message = this.terminologyService.getValidationMessage('term', 'required');
```

## Key Features

✅ **Quick Presets** - 4 built-in preset configurations
✅ **Custom Configuration** - Full control over all terminology
✅ **Live Preview** - See changes before saving
✅ **Global Application** - Changes reflect across all components
✅ **Local Caching** - Fast access without server calls
✅ **Reactive Updates** - Components automatically update
✅ **Validation Messages** - Error messages use custom terminology
✅ **Dynamic Placeholders** - Form hints use custom terminology
✅ **Reset Option** - Restore to standard terminology anytime

## Preset Configurations

| Preset | Term | Week | Use Case |
|--------|------|------|----------|
| Standard | Term | Week | Default English terminology |
| Parts | Part | Session | Course divided into parts and sessions |
| Modules | Module | Lesson | Modular course structure |
| Units | Unit | Topic | Unit-based curriculum |

## Customizable Fields Per Label

For each term/week type, you can customize:
- **Label**: Display name (e.g., "Part", "Module")
- **Number Label**: Form field label (e.g., "Part Number")
- **Singular**: Used in messages (e.g., "Enter part number")
- **Plural**: Used in lists (e.g., "3 parts")

## Where Changes Appear

- ✅ Form field labels in teacher dashboard
- ✅ Form field labels in content management
- ✅ Form field labels in content modal
- ✅ Form placeholders throughout app
- ✅ Helper text and descriptions
- ✅ Validation error messages
- ✅ Display throughout content pages

## Backend Requirements

Your API must provide these endpoints:

```
GET    /api/settings/terminology              → Returns current config
PUT    /api/settings/terminology              → Updates config
POST   /api/settings/terminology              → Creates config
POST   /api/settings/terminology/reset        → Resets to defaults
```

## Next Steps to Implement

1. **Implement Backend API**
   - Create the 4 endpoints mentioned above
   - Store terminology config per organization/system
   - Add authentication/authorization checks

2. **Add Admin Route** (if not already present)
   ```typescript
   {
     path: 'admin/terminology-settings',
     component: TerminologySettingsComponent
   }
   ```

3. **Add to Navigation** 
   - Add menu item in admin sidebar pointing to terminology settings

4. **Test Thoroughly**
   - Test all preset configurations
   - Test custom configuration
   - Verify all components display updated labels
   - Test cache functionality

5. **Deploy & Monitor**
   - Deploy changes to staging first
   - Test end-to-end with admin users
   - Monitor for any issues in production

## FAQ

**Q: Will existing data be affected?**
A: No. Terminology is just labels - all existing terms/weeks/lessons remain unchanged.

**Q: Can different organizations have different terminology?**
A: Currently, terminology is global. Future enhancement could add per-organization support.

**Q: What happens if I reset terminology?**
A: All labels return to standard English (Term/Week). Existing data remains untouched.

**Q: Can users change terminology?**
A: No. Only admin users can access the terminology settings page.

**Q: Is terminology cached?**
A: Yes! Configuration is cached locally in browser storage for instant access.

## Troubleshooting

**Labels not updating:**
- Clear browser cache/localStorage
- Verify terminology service is injected
- Check browser console for errors

**Presets not applying:**
- Verify backend endpoints are implemented
- Check network tab for API responses
- Ensure form bindings are correct

**Changes not persisting:**
- Verify backend implementation
- Check server error responses
- Ensure proper authentication

---

For detailed implementation guide, see: `CUSTOMIZABLE_TERMINOLOGY_GUIDE.md`
