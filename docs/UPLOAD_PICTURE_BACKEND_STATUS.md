# 📸 Upload Picture - Backend Status Check

**Date:** November 20, 2025  
**Checked:** Swagger Documentation  
**Status:** ⚠️ **REQUIRES BACKEND MODIFICATION**

---

## 🔍 Current Backend Status

### Available Endpoints

#### ✅ 1. **Upload Image (Media)**
**Endpoint:** `POST /api/Media/upload-image`  
**Purpose:** Upload image to Bunny Edge Storage or Cloudinary  
**Parameters:**
- `folder` (query): Folder path for the image

**Request:** `multipart/form-data`
- `file`: Binary image file

**Response:** 200 OK with image URL

---

#### ✅ 2. **Update Profile**
**Endpoint:** `PUT /api/Account/update-profile`  
**Purpose:** Update user profile information

**Request Body (EditUserDto):**
```json
{
  "userName": "string",
  "email": "string",
  "age": integer,
  "phoneNumber": "string"
}
```

**Response:** UserDetailsDto with updated profile

---

## ⚠️ Problem Identified

**`EditUserDto` does NOT include:**
- ❌ `avatar` field
- ❌ `profilePicture` field
- ❌ `profilePictureUrl` field
- ❌ Any image-related field

**Current EditUserDto Schema:**
```json
{
  "userName": "string",
  "email": "string",
  "age": integer,
  "phoneNumber": "string"
}
```

---

## 🛠️ Backend Modifications Required

### Solution: Add Avatar Field to EditUserDto

**Backend Code (C# - API/DTOs/EditUserDto.cs):**

```csharp
public class EditUserDto
{
    public string? UserName { get; set; }
    
    public string? Email { get; set; }
    
    public int? Age { get; set; }
    
    public string? PhoneNumber { get; set; }
    
    // ADD THIS FIELD:
    public string? AvatarUrl { get; set; }
    // Or if you're storing file:
    // public IFormFile? AvatarFile { get; set; }
}
```

### Two Approaches:

#### **Approach 1: Store Avatar URL (Recommended)**
User uploads image → Gets URL → Sends URL in profile update

```csharp
public string? AvatarUrl { get; set; }  // e.g., "https://cdn.bunnycdn.com/..."
```

#### **Approach 2: Handle Image in Update Endpoint**
Change endpoint to accept multipart/form-data

```csharp
public class EditUserDto
{
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public int? Age { get; set; }
    public string? PhoneNumber { get; set; }
    public IFormFile? AvatarFile { get; set; }
}
```

---

## 💡 Recommended Frontend Implementation

### Current Approach (Two-Step Process):

1. **User selects image**
2. **Upload image first** → `POST /api/Media/upload-image` → Get URL
3. **Update profile with URL** → `PUT /api/Account/update-profile` → Include `avatarUrl`

```typescript
async updateProfile() {
  // Step 1: Upload image if selected
  if (this.selectedFile) {
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('folder', 'profiles');
    
    const uploadResponse = await this.http.post(
      `${environment.apiUrl}/api/Media/upload-image`,
      formData
    ).toPromise();
    
    const imageUrl = uploadResponse.url; // Get URL from response
  }
  
  // Step 2: Update profile with image URL
  const updateData = {
    userName: this.profileForm.value.userName,
    email: this.profileForm.value.email,
    age: this.profileForm.value.age,
    phoneNumber: this.profileForm.value.phoneNumber,
    avatarUrl: imageUrl // Include URL
  };
  
  this.http.put(`${environment.apiUrl}/api/Account/update-profile`, updateData)
    .subscribe(/* ... */);
}
```

---

## 🔧 Backend Implementation Checklist

- [ ] Add `AvatarUrl` field to `EditUserDto`
- [ ] Update `UserController.UpdateProfile()` to handle avatar field
- [ ] Update database mapping (if needed)
- [ ] Update `UserDetailsDto` response to include `avatarUrl`
- [ ] Test upload → Update flow
- [ ] Update Swagger documentation

---

## 📝 Swagger Update Required

**After Backend Changes:**

```json
"EditUserDto": {
  "type": "object",
  "properties": {
    "userName": { "type": "string" },
    "email": { "type": "string" },
    "age": { "type": "integer" },
    "phoneNumber": { "type": "string" },
    "avatarUrl": { "type": "string" }  // ADD THIS
  }
}
```

---

## 🚀 Frontend Code (Ready to Implement)

```typescript
/**
 * Upload and update profile with image
 */
updateProfile(): void {
  if (this.profileForm.invalid) {
    this.profileForm.markAllAsTouched();
    return;
  }

  this.loading.set(true);
  let avatarUrl: string | null = null;

  // If file selected, upload first
  if (this.selectedFile) {
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('folder', 'profiles');

    this.http.post(`${environment.apiUrl}/api/Media/upload-image`, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          avatarUrl = response.url;
          this.sendProfileUpdate(avatarUrl);
        },
        error: (err) => {
          this.loading.set(false);
          console.error('Error uploading image:', err);
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: 'Failed to upload image'
          });
        }
      });
  } else {
    this.sendProfileUpdate(avatarUrl);
  }
}

private sendProfileUpdate(avatarUrl: string | null): void {
  const updateData = {
    userName: this.profileForm.value.userName,
    email: this.profileForm.value.email,
    age: this.profileForm.value.age,
    phoneNumber: this.profileForm.value.phoneNumber,
    avatarUrl: avatarUrl
  };

  this.http.put(`${environment.apiUrl}/api/Account/update-profile`, updateData, {
    headers: new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    })
  }).pipe(takeUntil(this.destroy$)).subscribe({
    next: (response: any) => {
      this.loading.set(false);
      
      // Update local profile
      const currentProfile = this.profile();
      if (currentProfile) {
        this.profile.set({
          ...currentProfile,
          ...updateData,
          avatar: avatarUrl || currentProfile.avatar
        });
      }

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Profile updated successfully',
        timer: 2000
      });
    },
    error: (err) => {
      this.loading.set(false);
      console.error('Error updating profile:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update profile'
      });
    }
  });
}
```

---

## 📊 Summary

| Item | Status | Notes |
|------|--------|-------|
| Upload Image Endpoint | ✅ Exists | `/api/Media/upload-image` |
| Update Profile Endpoint | ✅ Exists | `/api/Account/update-profile` |
| Avatar Field in DTO | ❌ Missing | Needs to be added |
| Frontend Implementation | ⏳ Ready | Waiting for backend |

---

## 🎯 Next Steps

### Backend Developer:
1. Add `AvatarUrl` field to `EditUserDto`
2. Update `UpdateProfile()` method to handle avatar
3. Update Swagger documentation
4. Test the two-step flow

### Frontend Developer:
1. ✅ Already implemented in profile component
2. Will integrate once backend is ready
3. No code changes needed on frontend

---

## ✅ Current Status

- **API Upload Endpoint:** ✅ Ready
- **API Update Endpoint:** ✅ Ready
- **Backend DTO Support:** ❌ Needs modification
- **Frontend Code:** ✅ Ready to implement
- **Overall Readiness:** ⏳ 70% (Waiting for backend)

---

**To make this work completely, the backend team needs to:**

1. Add `avatarUrl` field to `EditUserDto`
2. Update the update-profile endpoint to handle it
3. Update Swagger/OpenAPI documentation

Once done, the frontend will automatically work!

---

**Last Updated:** November 20, 2025  
**Checked Against:** Swagger v1  
**Recommendation:** Contact backend team to add avatar support to EditUserDto

