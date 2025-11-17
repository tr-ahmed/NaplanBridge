---

## applyTo: '**'

## GitHub Copilot Instructions for the Real Angular 17 Project

### Project Path: D:\Private\FrontEnd Team\angular

**Goal:**
Develop a real-world Angular 17 frontend for the **NaplanBridge Educational System**, integrated with a Laravel backend API.
The application must use standalone components, new Angular control flow syntax, authentication via Laravel Sanctum, role-based access using Spatie Laravel Permission, and modern UI built with **Tailwind CSS**.
All data used in the frontend should come from **real backend API endpoints**, not mock data.

---

### 1. Project Setup (Angular 17)

* Generate the project using Angular CLI:

```bash
ng new naplanbridge-frontend --style=scss --routing=true --standalone=true
```

* Default language: **English (en-US)**
* Single language application (English only)

---

### 2. Tailwind CSS Setup

Install and configure Tailwind CSS:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

**tailwind.config.js**

```js
export default {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: "#108092",
        accent: "#bf942d",
      },
    },
  },
  plugins: [],
}
```

**src/styles.scss**

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### 3. Folder Structure

```
/src/app/core/          → interceptors, guards, services
/src/app/features/      → actual app pages (dashboard, students, lessons, subscriptions, etc.)
/src/app/components/    → shared UI (navbar, sidebar, loader, etc.)
/src/app/models/        → TypeScript interfaces (User, Student, Lesson, Subscription)
/src/app/shared/        → reusable pipes, directives
/src/assets/            → images, global assets
```

---

### 4. Core Components (Standalone)

* `NavbarComponent`: navigation with real menu items from backend CMS
* `SidebarComponent`: dynamically generated from backend permissions
* `DashboardComponent`: summary cards (total students, total lessons, total subscriptions)
* `StudentsComponent`: CRUD with live data from `/api/students`
* `LessonsComponent`: lesson management with `/api/lessons`
* `SubscriptionsComponent`: subscription management and tracking
* `ProfileComponent`: user profile and password update

> ⚠️ Always fetch real data using services connected to backend endpoints.

---

### 5. Routing (Standalone API-based)

**app.routes.ts**

```ts
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent) },
  { path: 'students', loadComponent: () => import('./features/students/students.component').then(c => c.StudentsComponent) },
  { path: 'lessons', loadComponent: () => import('./features/lessons/lessons.component').then(c => c.LessonsComponent) },
  { path: 'subscriptions', loadComponent: () => import('./features/subscriptions/subscriptions.component').then(c => c.SubscriptionsComponent) },
  { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(c => c.ProfileComponent) },
];
```

---

### 6. Real API Integration (Example: StudentsService)

**students.service.ts**

```ts
@Injectable({ providedIn: 'root' })
export class StudentsService {
  private apiUrl = environment.apiUrl + '/students';

  constructor(private http: HttpClient) {}

  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.apiUrl);
  }

  addStudent(student: Student): Observable<Student> {
    return this.http.post<Student>(this.apiUrl, student);
  }

  updateStudent(id: number, student: Student): Observable<Student> {
    return this.http.put<Student>(`${this.apiUrl}/${id}`, student);
  }

  deleteStudent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

---

### 7. Error Handling & Interceptors

**functional-error.interceptor.ts**

```ts
export const functionalErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('API Error:', error);
      toast.error(error.error.message || 'An unexpected error occurred');
      return throwError(() => error);
    })
  );
};
```

Register in `app.config.ts`:

```ts
withInterceptors([functionalErrorInterceptor])
```

---

### 8. Security and Authentication

* Use **Laravel Sanctum** tokens for authentication.
* Store access token in `localStorage`.
* Add `AuthInterceptor` to attach the `Authorization: Bearer <token>` header automatically.
* Protect routes with `auth.guard.ts`.

---

### 9. Styling and Theming

* Use Tailwind for all component layouts.
* Apply custom theme colors (`#108092`, `#bf942d`) for consistency.
* Maintain responsive design using Tailwind breakpoints.
* All UI text in English only.

---

### 10. Real Data Dashboard Example

**dashboard.component.ts**

```ts
this.http.get(`${environment.apiUrl}/dashboard/summary`).subscribe((data: any) => {
  this.totalStudents = data.total_students;
  this.totalLessons = data.total_lessons;
  this.totalSubscriptions = data.total_subscriptions;
});
```

**dashboard.component.html**

```html
<div class="grid md:grid-cols-3 gap-4">
  <div class="p-4 bg-primary text-white rounded-2xl shadow">
    <h3>Students</h3>
    <p>{{ totalStudents }}</p>
  </div>
  <div class="p-4 bg-accent text-white rounded-2xl shadow">
    <h3>Lessons</h3>
    <p>{{ totalLessons }}</p>
  </div>
  <div class="p-4 bg-green-600 text-white rounded-2xl shadow">
    <h3>Subscriptions</h3>
    <p>{{ totalSubscriptions }}</p>
  </div>
</div>
```

---

### 11. Language Configuration

* Application uses **English only** (en-US)
* No internationalization (i18n) libraries needed
* All UI text, labels, and messages in English
* Direction: LTR (Left-to-Right) only

---

### 12. Documentation

Create `/docs/` folder including:

* `README.md` – overview, setup, and deployment
* `api-contracts.md` – API endpoints used by the frontend
* `ui-guidelines.md` – Tailwind theme and UI standards

---

### 13. Run the Application

```bash
ng serve --hmr --open
```

Backend must be running on:

```
Laravel API: http://localhost:8000/api/
```

---

### 14. GitHub Copilot Custom Rule

Copilot must only generate a backend report **when** a new or modified Laravel endpoint, model, or migration is needed.
If the change only affects frontend UI, routing, or data binding — respond:

> **"No backend change needed."**

---

### ✅ Summary

* Real API Integration: Laravel endpoints only
* Real educational data: students, lessons, subscriptions, terms, weeks
* English language only (en-US)
* Secure authentication with Laravel Sanctum
* Role-based access control with Spatie Laravel Permission
* Tailwind + Angular 17 best practices
* Clean and modular production-ready code
