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

---

## 📝 Backend Change Report Template

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

## ⚠️ Important Notes for the AI

* ✅ Only generate this report **if backend modification is required.**
* 🚫 Do not generate or modify backend code automatically.
* 🧩 The AI must verify endpoint existence by referencing `.NET API` routes, Swagger documentation, or `api.service.ts` calls.
* ✍️ Reports must be written in **clear, professional English**.

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
