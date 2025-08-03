---
applyTo: '**'
---
## GitHub Copilot Instructions for an Angular 17 Project
### AppPATH: D:\Private\Ahmed Hamdi\angular\my-angular-app>

**Goal:** Create a modern and complete Angular 17 project leveraging its latest features like standalone components, new control flow, and best practices for structure, validation, error handling, security, styling with Tailwind CSS, and documentation.

---

### 1. Project Setup (Angular 17 specifics):

* Use Angular CLI to generate a new project named `my-angular-app`.
* Use standalone components as the default (no NgModules).
* Enable routing.
* Use SCSS for styling.
* **Command to run:**

```bash
ng new my-angular-app --style=scss --routing=true --standalone=true
```

---

### 2. Tailwind CSS Setup:

* Install Tailwind and its dependencies:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

* Configure `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

* Add Tailwind directives to `src/styles.scss`:

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

* Verify Tailwind is working by adding a utility class (e.g., `text-blue-500`) to a component template.

---

### 3. Folder Structure:

```
/src/app/components/ → shared, reusable UI components (e.g., header, footer, spinner)
/src/app/features/   → feature-based page components (e.g., home, about, contact)
/src/app/shared/     → reusable directives, pipes, and core services
/src/app/core/       → core functionalities like interceptors, guards, global services
/src/app/models/     → TypeScript interfaces and data models
```

---

### 4. Components to Create:

> **Note for Copilot:** Generate all components as standalone using `--standalone`. Use the new control flow syntax (`@if`, `@for`) in templates instead of `*ngIf` and `*ngFor`.

* `HeaderComponent`: displays navigation links
* `FooterComponent`: displays copyright info
* `HomeComponent`: landing page with welcome text
* `AboutComponent`: static page with basic info
* `ContactFormComponent`: a form with name, email, and message fields

---

### 5. Routing (using Standalone APIs):

* Configure routes in `app.routes.ts`
* Use `loadComponent` for lazy loading

**Example routes:**

```ts
{ path: '', loadComponent: () => import('./features/home/home.component').then(c => c.HomeComponent) }
{ path: 'about', loadComponent: () => import('./features/about/about.component').then(c => c.AboutComponent) }
{ path: 'contact', loadComponent: () => import('./features/contact-form/contact-form.component').then(c => c.ContactFormComponent) }
```

---

### 6. Form Validation (ContactFormComponent):

* Use Reactive Forms (`FormGroup`, `FormControl`)
* Apply `Validators.required` to all fields
* Use `Validators.email` for the email field
* Display friendly error messages using `@if` blocks

**Example:**

```html
@if (contactForm.get('email')?.hasError('required')) {
  <small class="error">Email is required.</small>
}
```

---

### 7. Error Handling:

* Create `functional-error.interceptor.ts` in `/src/app/core/interceptors/`
* Use RxJS `catchError` to handle errors globally
* Display feedback using a Toast/Snackbar service
* Register the interceptor in `app.config.ts`:

```ts
withInterceptors([functionalErrorInterceptor])
```

---

### 8. Basic Security Measures:

* Use Angular’s `DomSanitizer` to prevent XSS with dynamic HTML
* Always validate/sanitize inputs server-side (add a comment reminder)
* Use `environment.ts` for base URLs and config (avoid hardcoding)
* Never expose secrets or logic in frontend code

---

### 9. Styling:

* Use Tailwind CSS utility classes for rapid UI development
* Define custom colors, fonts, etc. in `tailwind.config.js` if needed
* Use responsive utilities and layout helpers (e.g., `grid`, `flex`, `container`, `gap-x`, `md:w-1/2`, etc.)
* Combine Tailwind with SCSS variables if desired (only for scoped or custom styles)

---

### 10. App Layout (`app.component.html`):

```html
<app-header />
<main class="container mx-auto px-4 py-6">
  <router-outlet />
</main>
<app-footer />
```

---

### 11. Optional Enhancements & Advanced Features:

* **Loading Spinner:** Create `LoadingSpinnerComponent` and use Angular Signals (`signal<boolean>`) for visibility
* **Route Guards:** Create `auth.guard.ts` using functional guard pattern
* **Deferred Loading:** Use `@defer` block in `HomeComponent` to lazy load heavy content

**Example:**

```html
@defer (on viewport) {
  <app-heavy-chart />
} @placeholder {
  <p>Chart is loading...</p>
} @loading {
  <app-loading-spinner />
}
```

---

### 12. Documentation:

* Create a dedicated `docs/` folder in the project root for markdown-based developer documentation
* Add a `README.md` that explains:

  * Project overview
  * Development setup and build steps
  * Folder structure and conventions
  * How to contribute or extend the app
* Include API contracts and interface documentation under `docs/interfaces.md`
* Optionally integrate tools like [Compodoc](https://compodoc.app/) for auto-generating technical documentation from your Angular codebase

---

### Notes:

* Include comments in all major parts of the code for clarity
* Use strong typing (`interface`) for all data structures under `/models`
* Maintain clean and modular code
