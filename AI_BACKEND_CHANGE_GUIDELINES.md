# 🧠 AI Backend Change Guidelines (.NET API Version)

## 🎯 Purpose

When developing or modifying any **Frontend (Angular)** feature, the AI must only generate a backend change report **if** a change or addition to the **.NET API** is required.

---

## 📋 AI Responsibilities

The AI should **not** generate a report unless the frontend feature depends on a backend modification.
When a change **is required**, the AI must:

1. **Analyze the context**
   Understand the purpose of the feature (e.g., authentication, file upload, data filtering, reporting).

2. **Identify backend impact**

   * Is a new endpoint required?
   * Does an existing endpoint need modification?
   * Are there necessary model or database changes?

3. **Generate a backend change report** including the following details:

4. **If clarification is needed**
   When the AI cannot confirm endpoint behavior, data structure, or backend logic, it must generate a **Backend Inquiry Report** to request clarification from the backend team.

---

## 🖟️ Backend Change Report Template

# 🔧 Backend Change Report

## 1. Reason for Change

Explain why this backend change is required.
Example: “The frontend now allows uploading user avatars, but no existing API endpoint handles file uploads.”

## 2. Required or Modified Endpoint

* **URL:** `/api/users/upload-avatar`
* **Method:** `POST`
* **Controller:** `UsersController`
* **Action:** `UploadAvatar`
* **Description:** Handles uploading and saving of user profile pictures.

## 3. Suggested Backend Implementation

* Create or modify the relevant controller action.
* Use `IFormFile` parameter to accept uploaded files.
* Save file to `/wwwroot/uploads/avatars/`.
* Update user record with the new avatar URL in the database.
* Validate allowed file types (`.jpg`, `.png`) and size limit (e.g., 2 MB).

## 4. Database Impact (if any)

* Add column `AvatarUrl` (type: `nvarchar(255)`) to the `Users` table.

## 5. Files to Modify or Create

* `Controllers/UsersController.cs`
* `Models/User.cs`
* `DTOs/UserDto.cs` (if applicable)
* `Migrations/2025xxxx_AddAvatarUrlToUsers.cs`
* `Startup.cs` or `Program.cs` (if new service registration is needed)

## 6. Request and Response Examples (Optional)

**Request Example:**

```http
POST /api/users/upload-avatar
Content-Type: multipart/form-data

avatar: (binary file)
```

**Response Example:**

```json
{
  "success": true,
  "avatarUrl": "https://example.com/uploads/avatars/user123.jpg"
}
```

---

## 🕵️ Backend Inquiry Report Template

If the AI encounters uncertainty about backend logic, unclear endpoint responses, or undocumented APIs, it must create a **Backend Inquiry Report**.

**Example:**

# ❓ Backend Inquiry Report

## 1. Inquiry Topic

Clarify the response structure for `/api/courses/enroll/{id}`.

## 2. Reason for Inquiry

Swagger documentation does not specify whether the endpoint returns the updated enrollment object or a success flag.

## 3. Requested Details from Backend Team

* Full endpoint response schema
* Possible error responses
* Authentication requirements
* Example of successful and failed requests

---

## 🔁 Backend-to-Frontend Update Coordination

Whenever a backend modification has been **implemented**, the AI must:

1. **Request a backend update report** from the backend team or service, including:

   * List of modified or new endpoints.
   * Any parameter changes.
   * Any new or changed response formats.
   * Updated models or DTOs.
   * Version or migration notes.

2. **Validate alignment** between the backend and the Angular frontend:

   * Ensure `api.service.ts` reflects the latest endpoints.
   * Update frontend request/response handling based on the backend’s new structure.
   * Log any discrepancies or missing implementations in `/reports/frontend_updates/`.

3. **Generate a short summary report** describing what was changed on the backend that affects the frontend.

---

## ⚠️ Important Notes for the AI

* ✅ Only generate backend change reports **if backend modification is required.**
* ❓ Generate a **Backend Inquiry Report** when backend clarification is needed.
* 🔁 Always request backend change confirmation before frontend updates.
* ⛔ Do not modify backend code automatically.
* 🧩 Verify endpoint existence via `.NET API` routes, Swagger docs, or `api.service.ts` references.
* ✍️ Write all reports in **clear, professional English**.

---

## 📁 Report Location

All generated reports must be stored in:

```
/reports/backend_changes/
```

with filenames using this pattern:

```
backend_change_<feature_name>_<YYYY-MM-DD>.md
```

And all backend inquiries must be stored in:

```
/reports/backend_inquiries/
```

with filenames using this pattern:

```
backend_inquiry_<topic>_<YYYY-MM-DD>.md
```
