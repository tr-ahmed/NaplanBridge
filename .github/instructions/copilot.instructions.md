---

## applyTo: '**'

## GitHub Copilot Instructions for the Real Angular 17 Project

### Project Path: D:\Projects\HospitalSystem\frontend>

**Goal:**
Develop a real-world Angular 17 frontend for the **Hospital Information System (HIS)**, integrated with a Laravel backend API.
The application must use standalone components, new Angular control flow syntax, authentication via Laravel Sanctum, role-based access using Spatie Laravel Permission, and modern UI built with **Tailwind CSS**.
All data used in the frontend should come from **real backend API endpoints**, not mock data.

---

### 1. Project Setup (Angular 17)

* Generate the project using Angular CLI:

```bash
ng new hospital-frontend --style=scss --routing=true --standalone=true
```

* Default language: **Arabic (ar-EG)**
* Enable internationalization (i18n) to support English (LTR) and Arabic (RTL).

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

html[dir="rtl"] {
  direction: rtl;
  text-align: right;
}
```

---

### 3. Folder Structure

```
/src/app/core/          → interceptors, guards, services
/src/app/features/      → actual app pages (dashboard, patients, doctors, etc.)
/src/app/components/    → shared UI (navbar, sidebar, loader, etc.)
/src/app/models/        → TypeScript interfaces (User, Patient, Appointment)
/src/app/shared/        → reusable pipes, directives
/src/assets/            → images, translations, global assets
```

---

### 4. Core Components (Standalone)

* `NavbarComponent`: navigation with real menu items from backend CMS
* `SidebarComponent`: dynamically generated from backend permissions
* `DashboardComponent`: summary cards (total patients, doctors, appointments)
* `PatientsComponent`: CRUD with live data from `/api/patients`
* `DoctorsComponent`: CRUD with `/api/doctors`
* `AppointmentsComponent`: appointment booking, edit, and cancel
* `ProfileComponent`: user profile and password update

> ⚠️ Always fetch real data using services connected to backend endpoints.

---

### 5. Routing (Standalone API-based)

**app.routes.ts**

```ts
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent) },
  { path: 'patients', loadComponent: () => import('./features/patients/patients.component').then(c => c.PatientsComponent) },
  { path: 'doctors', loadComponent: () => import('./features/doctors/doctors.component').then(c => c.DoctorsComponent) },
  { path: 'appointments', loadComponent: () => import('./features/appointments/appointments.component').then(c => c.AppointmentsComponent) },
  { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(c => c.ProfileComponent) },
];
```

---

### 6. Real API Integration (Example: PatientsService)

**patients.service.ts**

```ts
@Injectable({ providedIn: 'root' })
export class PatientsService {
  private apiUrl = environment.apiUrl + '/patients';

  constructor(private http: HttpClient) {}

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl);
  }

  addPatient(patient: Patient): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, patient);
  }

  updatePatient(id: number, patient: Patient): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patient);
  }

  deletePatient(id: number): Observable<void> {
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
* All UI text must support translation through i18n.

---

### 10. Real Data Dashboard Example

**dashboard.component.ts**

```ts
this.http.get(`${environment.apiUrl}/dashboard/summary`).subscribe((data: any) => {
  this.totalPatients = data.total_patients;
  this.totalDoctors = data.total_doctors;
  this.totalAppointments = data.total_appointments;
});
```

**dashboard.component.html**

```html
<div class="grid md:grid-cols-3 gap-4">
  <div class="p-4 bg-primary text-white rounded-2xl shadow">
    <h3>Patients</h3>
    <p>{{ totalPatients }}</p>
  </div>
  <div class="p-4 bg-accent text-white rounded-2xl shadow">
    <h3>Doctors</h3>
    <p>{{ totalDoctors }}</p>
  </div>
  <div class="p-4 bg-green-600 text-white rounded-2xl shadow">
    <h3>Appointments</h3>
    <p>{{ totalAppointments }}</p>
  </div>
</div>
```

---

### 11. Internationalization (i18n)

* Use `@ngx-translate/core`.
* Load language files from `/assets/i18n/en.json` and `/assets/i18n/ar.json`.
* Change direction dynamically (`dir="ltr"` or `dir="rtl"`) in `app.component.ts`.

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

> **“No backend change needed.”**

---

### ✅ Summary

* Real API Integration: Laravel endpoints only
* Real user data: patients, doctors, appointments
* Secure and localized
* Tailwind + Angular 17 best practices
* Clean and modular production-ready code
