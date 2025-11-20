## 🚀 Copilot Development Mode (Deadline Focus)

> **This project must be delivered TODAY — priority is WORKING CODE, not documentation.**
> If the feature is not tested and working with the real API, it is **NOT done.**

---

### 🎯 Project Goal

Build the real Angular 17 frontend for **NaplanBridge** connected to a Laravel backend using **real API data only** (no mock, no placeholder).

---

### 📌 Development Priorities (Ordered)

1. 🧠 Write code that works correctly
2. 🔌 Integrate with real Laravel API
3. 🧪 Test API responses (GET / POST / PUT / DELETE)
4. ⚠️ If an endpoint is missing, broken, or unclear → create **Backend Report**
5. ⛔ Skip documentation unless requested

---

### 📁 Project Structure

```
/core       → auth, services, guards, interceptors
/features   → actual pages (students, lessons, subscriptions, ...)
/components → UI reusable components
/models     → TypeScript interfaces only
/shared     → pipes, directives
/assets     → images, fonts
```

---

### 🔧 Technical Rules

* Angular 17 **Standalone Components Only**
* New Angular control flow (`@if`, `@for`, etc.)
* Tailwind CSS only for styling
* Laravel Sanctum authentication
* Role-based access via Spatie permission
* **No mock data — must fetch from API**

---

### 🔐 Authentication Behavior

* Store token in `localStorage`
* Automatically attach:

```
Authorization: Bearer <token>
Accept: application/json
```

* If unauthorized → redirect to `/login`

---

### 🧪 API Interaction Rules

Before building UI:

```ts
service.get().subscribe({
  next: res => console.log("API OK:", res),
  error: err => this.reportBackendIssue('/endpoint', err)
});
```

If API returns wrong data → **stop and report**, don't continue UI blindly.

---

### 📝 Backend Issue Format

If something blocks development, generate:

```
📌 BACKEND REPORT
Endpoint: /api/<name>
Issue: <what is missing or broken>
Expected: <expected structure or behavior>
Impact: <why frontend cannot continue>
Request: Fix and confirm when ready.
```

Copilot must continue ONLY after receiving:

```
✔ BACKEND FIX CONFIRMED
```

---

### UI Rules

* English only
* Responsive enough for delivery (not perfect)
* Use Tailwind utilities, no heavy CSS customizations

---

### ✔ Definition of "DONE"

A feature is considered done ONLY if:

| Condition                 | Required |
| ------------------------- | -------- |
| UI renders                | ✔        |
| Connected to real backend | ✔        |
| API tested for CRUD       | ✔        |
| No console errors         | ✔        |
| Permissions respected     | ✔        |

If ANY of these is missing → NOT DONE.

---

### ❌ Documentation

* Not required for now.
* Skip README, API docs, UI guidelines unless specifically requested.

---

### Final Rule

> **"If it doesn't work with the real backend, it is NOT done — no matter how good the UI looks."**
