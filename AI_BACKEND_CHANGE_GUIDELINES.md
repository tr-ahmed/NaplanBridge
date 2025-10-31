# 🧠 AI Backend Change Guidelines

## 🎯 Purpose
When developing or modifying any **Frontend (Angular)** feature, if the implementation requires a **new or modified backend endpoint**, the AI must automatically generate a **clear and detailed report** describing the required backend changes.

---

## 📋 AI Responsibilities
Whenever an AI assistant detects that a frontend feature depends on an API that doesn’t exist or needs modification, it should:

1. **Analyze the context**  
   Understand the purpose of the new or modified code (e.g., user registration, profile editing, file upload, report viewing).

2. **Identify backend impact**  
   - Is a new endpoint required?  
   - Is an existing endpoint missing parameters or returning an incorrect response?  
   - Are there model, validation, or database changes required?

3. **Generate a complete backend change report** including the following sections:

---

## 📝 Backend Change Report Template

# 🔧 Backend Change Report

## 1. Reason for Change
Briefly explain why a backend change is required.  
Example: "The frontend now supports user avatar uploads, but no existing endpoint handles file uploads."

## 2. Required or Modified Endpoint
- **URL:** /api/users/upload-avatar  
- **Method:** POST  
- **Description:** Upload user profile picture

## 3. Suggested Backend Implementation
- Add new function `uploadAvatar()` inside `UserController`
- Accept `avatar` file input and store it under `storage/app/public/avatars`
- Update `avatar_url` column in `users` table
- Validate file type and size before saving

## 4. Database Impact (if any)
- Add column `avatar_url` to `users` table (VARCHAR(255))


## 6. Request and Response Examples (Optional)

**Request Example:**  
```
POST /api/users/upload-avatar
{
  "avatar": "base64encodedimage..."
}
```

**Response Example:**  
```
{
  "success": true,
  "avatar_url": "https://example.com/storage/avatars/user123.jpg"
}
```

---

## ⚠️ Important Notes for the AI
- **Do not implement the backend changes directly** — only generate a detailed report.  
- Do **not assume** the existence of endpoints without checking the current API documentation (swagger.json or api.ts).  
- If the modification is minor (e.g., a renamed response field), still generate a short report explaining the change.  
- The report must be written in **clear, professional English**.  

---

## 📁 Report Location
All generated reports must be saved under:
```
/reports/backend_changes/
```
with filenames following this pattern:
```
backend_change_<feature_name>_2025-10-31.md
```
