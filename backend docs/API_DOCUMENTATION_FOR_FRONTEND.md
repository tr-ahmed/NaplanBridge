# ?? NaplanBridge API - ???? ???? ?? Front-End

## ?? Base URL
```
Development: https://localhost:5001/api
Production: https://your-api.com/api
```

---

## ?? ???? ?????????
1. [Authentication & Authorization](#authentication--authorization)
2. [User Roles](#user-roles)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [Pagination](#pagination)
6. [Caching](#caching)
7. [Health Checks](#health-checks)
8. [Video Providers](#video-providers)
9. [API Endpoints](#api-endpoints)
   - [Account Management](#1-account-management)
   - [Categories](#2-categories)
   - [Years](#3-years)
   - [Subject Names](#4-subject-names)
   - [Subjects](#5-subjects)
   - [Terms](#6-terms)
   - [Term Instructors](#6b-term-instructors)
   - [Weeks](#7-weeks)
   - [Lessons](#8-lessons)
   - [Resources](#9-resources)
   - [Progress](#10-progress)
   - [Exams](#11-exams)
   - [Lesson Questions](#12-lesson-questions)
   - [Subscription Plans](#13-subscription-plans)
   - [Student Subjects](#13b-student-subjects)
10. [Data Models (DTOs)](#data-models-dtos)

---

## ?? Authentication & Authorization

### JWT Token
???? ??? endpoints ??????? ????? JWT Token ?? ??? Header:

```http
Authorization: Bearer <your-jwt-token>
```

### ?????? ??? Token
??? ?????? ???? ?? ??? response ??? ????? ??????:

```json
{
  "userName": "john_doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["Member", "Parent"]
}
```

---

## ?? User Roles

| Role | ????? | ????????? |
|------|-------|----------|
| **Admin** | ???? ?????? | ?? ????????? |
| **Teacher** | ???? | ?????/????? ?????? ??????????? ???????? |
| **Parent** | ??? ??? | ????? ?????? ??????????? |
| **Student** | ???? | ?????? ?????? ??????????? |
| **Member** | ??? ??? | role ????? ????? ?????????? |

---

## ?? Rate Limiting

| ?????? | ?? ??????? | ????? | Endpoints |
|------|------------|-------|-----------|
| **Login** | 5 ??????? | 15 ????? | `/api/account/login` |
| **API** | 50 ??? | 1 ????? | ???? endpoints |
| **Global** | 100 ??? | 1 ????? | ???? endpoints |

### Response ??? ????? ????
```http
HTTP/1.1 429 Too Many Requests

{
  "error": "Too many requests",
  "message": "Please try again later",
  "retryAfter": 45.5
}
```

---

## ?? Error Handling

### Error Response Structure
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "details": "User with ID 123 not found",
  "errors": null,
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2025-01-24T10:30:00Z"
}
```

### Validation Errors
```json
{
  "statusCode": 400,
  "message": "Validation error",
  "details": "One or more validation errors occurred",
  "errors": {
    "Email": ["Email is required", "Email must be valid"],
    "Password": ["Password must be at least 8 characters"]
  },
  "traceId": "...",
  "timestamp": "2025-01-24T10:30:00Z"
}
```

### Status Codes
| Code | ?????? | ??? ???? |
|------|--------|---------|
| **200** | OK | ???? ??????? |
| **201** | Created | ?? ????? ???? ???? |
| **204** | No Content | ?? ????? ????? |
| **400** | Bad Request | ?????? ??? ????? |
| **401** | Unauthorized | ??? ???? ?????? |
| **403** | Forbidden | ?? ???? ???????? |
| **404** | Not Found | ?????? ??? ????? |
| **429** | Too Many Requests | ????? Rate Limit |
| **500** | Internal Server Error | ??? ?? ??????? |

---

## ?? Pagination

### Query Parameters
| Parameter | ????? | ??????? | ????? |
|-----------|------|----------|-------|
| `page` | int | 1 | ??? ?????? |
| `pageSize` | int | 10 | ??? ??????? (max: 50) |

### Response Structure
```json
{
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "totalCount": 150,
  "totalPages": 8,
  "hasPrevious": false,
  "hasNext": true
}
```

---

## ?? Caching

### Cache Duration
| Data Type | Duration | Cache Key Pattern |
|-----------|----------|------------------|
| **Categories** | 24 hours | `categories_all` |
| **Years** | 24 hours | `years_all` |
| **Subjects** | 1 hour | `subjects_page_{page}_size_{size}` |
| **Plans** | 30 minutes | `plans_subject_{id}` |
| **Terms** | 1 hour | `terms_subject_{id}` |

**??????**: Cache ??? ???? ???????? ??? ???????/?????

---

## ?? Health Checks

### Full Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "Healthy",
  "checks": [
    {
      "name": "database",
      "status": "Healthy",
      "duration": 45.2
    },
    {
      "name": "stripe",
      "status": "Healthy",
      "duration": 123.5
    },
    {
      "name": "cloudinary",
      "status": "Healthy",
      "duration": 2.1
    }
  ],
  "totalDuration": 170.8
}
```

### Liveness Probe
```http
GET /health/live
```

### Readiness Probe  
```http
GET /health/ready
```

---

## ?? Video Providers

?????? ???? 3 ????? ?????:

| Provider | ????????? | ???????? |
|----------|----------|----------|
| **Cloudinary** | ????? ???? | ??? + ???????? ????? |
| **BunnyStorage** | ????? + CDN | ???????? ??????? ???? 10x |
| **BunnyStream** | Adaptive Streaming ? | HLS/DASH? ????? ??????? ????? ?????? |

### Video Response Structure

```json
{
  "id": 1,
  "title": "Lesson 1: Variables",
  "videoUrl": "https://naplan.b-cdn.net/{videoId}/playlist.m3u8",
  "videoProvider": "BunnyStream",
  "videoDuration": 1800,
  "posterUrl": "https://naplan.b-cdn.net/{videoId}/thumbnail.jpg"
}
```

### Frontend Video Player

#### ??? BunnyStream (HLS) - ???? ??

```html
<!-- Using Plyr.js + HLS.js -->
<link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
<script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>

<video id="player" controls></video>

<script>
  const video = document.getElementById('player');
  const source = 'https://naplan.b-cdn.net/{videoId}/playlist.m3u8';

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(source);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      const player = new Plyr(video, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
        settings: ['quality', 'speed']
      });
    });
  }
</script>
```

#### ??? Cloudinary/BunnyStorage

```html
<video controls poster="{posterUrl}">
  <source src="{videoUrl}" type="video/mp4">
</video>
```

---

## ?? API Endpoints

## 1. Account Management

### 1.1 ????? ??????
```http
POST /api/account/login
```

**Rate Limit:** 5 ???????/15 ?????  
**Auth:** ?? ???

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "userName": "john_doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",


  "roles": ["Member", "Parent"]
}
```

**Errors:**
- `401`: Email ?? Password ??? ?????

---

### 1.2 ????? ?????? ???? (??? ???)
```http
POST /api/account/register-parent
```

**Rate Limit:** 50 ???/?????  
**Auth:** ?? ???

**Request Body:**
```json
{
  "userName": "john_doe",
  "email": "john@example.com",
  "password": "Password123",
  "age": 35,
  "phoneNumber": "+1234567890"
}
```

**Response (200):**
```json
{
  "userName": "john_doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",


  "roles": ["Member", "Parent"]
}
```

**Errors:**
- `400`: ?????? ??????? ??? ?????? ???? ?? ??????? ????????

---

### 1.3 ????? ?????? ???? (????)
```http
POST /api/account/register-teacher
```

**Rate Limit:** 50 ???/?????  
**Auth:** Admin ???  
**Roles Required:** `Admin`

**Request Body:**
```json
{
  "userName": "teacher_john",
  "email": "teacher@example.com",
  "password": "Password123",
  "age": 30,
  "phoneNumber": "+1234567890"
}
```

**Response (200):**
```json
{
  "userName": "teacher_john",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",


  "roles": ["Member", "Teacher"]
}
```

---

### 1.4 ????? ?????? ???? (????)
```http
POST /api/account/register-student
```

**Rate Limit:** 50 ???/?????  
**Auth:** ?? ???  
**Roles Required:** `Admin` ?? `Parent`

**Request Body:**
```json
{
  "userName": "student_ali",
  "password": "Password123",
  "age": 12,
  "year": 7
}
```

**Response (200):**
```json
{
  "userName": "student_ali",
  "email": "student_ali@naplan.edu",
  "roles": ["Member", "Student"]
}
```

**Note:** ????? ??? ??????? ?????????? ?? ??????????. ????? ??????? ??? ????? ??????.

---

## 2. Categories

### 2.1 ?????? ??? ???? ??????
```http
GET /api/categories
```

**Auth:** ?????  
**Roles Required:** ?? ???  
**Caching:** 24 ????

**Response (200):**
```json
[
  {
    "id": 1,
 "name": "Mathematics",
    "description": "All math subjects"
  },
  {
 "id": 2,
"name": "Science",
    "description": "Science subjects"
  }
]
```

---

### 2.2 ????? ??? ?????
```http
POST /api/categories
```

**Auth:** ?????  
**Roles Required:** `Admin`

**Request Body:**
```json
{
  "name": "Arts",
  "description": "Artistic subjects"
}
```

**Response (201):**
```json
{
  "id": 3,
  "name": "Arts",
"description": "Artistic subjects"
}
```

---

### 2.3 ????? ?????? ???
```http
PUT /api/categories/{id}
```

**Auth:** ?????  
**Roles Required:** `Admin`

**Request Body:**
```json
{
  "name": "Fine Arts",
  "description": "Updated description"
}
```

---

### 2.4 ??? ???
```http
DELETE /api/categories/{id}
```

**Auth:** ?????  
**Roles Required:** `Admin`

**Response (204):** No Content

**Errors:**
- `400`: ?? ???? ??? ??? ????? ??? ???? ????? ?????

---


## 3. Years

### 3.1 ?????? ??? ???? ??????? ????????
```http
GET /api/years
```

**Auth:** ?????

**Response (200):**
```json
[
  {
    "id": 1,
    "yearNumber": 7,
    "description": "Year 7"
  },
  {
    "id": 2,
    "yearNumber": 8,
    "description": "Year 8"
  }
]
```

---

### 3.2 ????? ??? ?????? ?????
```http
POST /api/years
```

**Auth:** ?????  
**Roles Required:** `Admin`

**Request Body:**
```json
{
  "yearNumber": 9,
  "description": "Year 9"
}
```

---

### 3.3 ????? ?????? ??? ??????
```http
PUT /api/years/{id}
```

**Auth:** ?????  
**Roles Required:** `Admin`

---

### 3.4 ??? ??? ??????
```http
DELETE /api/years/{id}
```

**Auth:** ?????  
**Roles Required:** `Admin`

---

## 4. Subject Names

### 4.1 ?????? ??? ???? ????? ??????
```http
GET /api/subjectnames
```

**Auth:** ?????

**Response (200):**
```json
[

  {
    "id": 1,
    "name": "Algebra",
    "categoryId": 1,
    "categoryName": "Mathematics"
  }
]
```

---

### 4.2 ?????? ??? ????? ?????? ??? ?????
```http
GET /api/subjectnames/by-category/{categoryId}
```

---

### 4.3 ????? ??? ???? ????
```http
POST /api/subjectnames
```

**Auth:** ?????  
**Roles Required:** `Admin`

**Request Body:**
```json
{
  "name": "Geometry",
  "categoryId": 1
}
```

---

## 5. Subjects

### 5.1 ?????? ??? ???? ?????? (?? ??????? ????? ????????)
```http
GET /api/subjects?page=1&pageSize=20&categoryId=1&yearId=1
```

**Auth:** ?????

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | int | ? | 1 | ??? ?????? |
| `pageSize` | int | ? | 10 | ??? ??????? ?? ?????? (max: 50) |
| `categoryId` | int | ? | - | ????? ?????? ??? ????? |
| `yearId` | int | ? | - | ????? ?????? ??? ????? |

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "yearId": 1,
      "subjectNameId": 1,
      "subjectName": "Algebra",
"categoryId": 1,
      "categoryName": "Mathematics",
      "categoryDescription": "Math subjects",
      "price": 99.99,
  "originalPrice": 149.99,
      "discountPercentage": 33,
      "posterUrl": "https://cloudinary.com/poster.jpg",
      "level": "Intermediate",
   "duration": 120,
      "weekNumber": 12,
      "termNumber": 3,
      "termIds": [1, 2, 3],
      "weekIds": [1, 2, 3, 4, 5, 6],
      "subscriptionPlans": [
        {
      "id": 1,
 "name": "Monthly Plan",
       "description": "Access for 1 month",
          "price": 29.99,
          "planType": "Monthly",
          "isActive": true
        }
      ],
      "studentCount": 150
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 45,
  "totalPages": 3,
  "hasPrevious": false,
  "hasNext": true
}
```

---


### 5.2 ?????? ??? ?????? ????
```http
GET /api/subjects/{id}
```

**Auth:** ?????

---

### 5.3 ?????? ??? ?????? ??? ?????
```http
GET /api/subjects/by-category/{categoryId}
```

---

### 5.4 ?????? ??? ?????? ??? ?????
```http
GET /api/subjects/by-year/{yearId}
```

---

### 5.5 ?????? ??? ?????? ??? ????? ???????
```http
GET /api/subjects/by-term/{termId}
```

---

### 5.6 ?????? ??? ?????? ??? ???????
```http
GET /api/subjects/by-week/{weekId}
```

---

### 5.7 ????? ???? ?????
```http
POST /api/subjects
Content-Type: multipart/form-data
```

**Auth:** ?????  
**Roles Required:** `Admin`

**Form Data:**
```
yearId: 1
subjectNameId: 1
teacherId: 5
originalPrice: 149.99
discountPercentage: 33
level: Intermediate
duration: 120
posterFile: (binary file)
```

**Response (201):**
```json
{
  "id": 1,
  "subjectName": "Algebra",
  "price": 99.99,
  "posterUrl": "https://cloudinary.com/poster.jpg"
  // ... other fields
}
```

---

### 5.8 ????? ?????? ????
```http
PUT /api/subjects/{id}
Content-Type: multipart/form-data
```

**Auth:** ?????  
**Roles Required:** `Admin`

---

### 5.9 ??? ????
```http
DELETE /api/subjects/{id}
```

**Auth:** ?????  
**Roles Required:** `Admin`

---

### 5.10 ?????? ??? ??????? ?????? ????? ?????
```http
GET /api/subjects/{id}/enrollment
```

**Auth:** ?????

---

## 6. Terms

### 6.1 ?????? ??? ???? ?????? ????????
```http
GET /api/terms
```

**Auth:** ?????

**Response (200):**
```json
[
  {
    "id": 1,
    "subjectId": 1,
    "termNumber": 1,
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-03-31T00:00:00Z",
    
  // Term-Level Data (????) ?
    "price": 29.99,
    "originalPrice": 39.99,
  "discountPercentage": 25,
    "posterUrl": "https://cdn.com/algebra-term1.jpg",
    "description": "Introduction to Algebra basics",
    "durationHours": 40,
    
    "weekIds": [1, 2, 3, 4],
    "studentsCount": 25
  }
]
```

---

### 6.2 ?????? ??? ?????? Term (?? ????????) ?
```http
GET /api/terms/{id}
```

**Auth:** ?????

**Response (200):**
```json
{
  "id": 1,
  "subjectId": 1,
  "subjectName": "Algebra Year 7",
  "termNumber": 1,
  "startDate": "2025-01-01",
  "endDate": "2025-03-31",
  
  // Term-Level Data
  "price": 29.99,
  "originalPrice": 39.99,
  "discountPercentage": 25,
  "posterUrl": "https://cdn.com/algebra-term1.jpg",
  "description": "Introduction to Algebra basics...",
  "durationHours": 40,
  
  // Instructors (????) ?
  "instructors": [
 {
      "id": 2,
      "name": "John Smith",
      "email": "john@naplan.edu",
      "isPrimary": true,
      "role": "Primary Instructor",
      "assignedAt": "2025-01-01"
    },
    {
      "id": 5,
      "name": "Mike Brown",
 "email": "mike@naplan.edu",
      "isPrimary": false,
      "role": "Assistant",
      "assignedAt": "2025-01-01"
    }
  ],
  
  "weekIds": [1, 2, 3, 4],
  "studentsCount": 25
}
```

---

## 6B. Term Instructors (????) ?

### 6B.1 ?????? ??? ????? Term
```http
GET /api/terms/{termId}/instructors
```

**Auth:** ?????

**Response (200):**
```json
[
  {
    "termId": 1,
    "instructorId": 2,
    "instructorName": "John Smith",
    "instructorEmail": "john.smith@naplan.edu",
    "isPrimary": true,
    "assignedAt": "2025-01-01T00:00:00Z"
  },
  {
    "termId": 1,
    "instructorId": 5,
    "instructorName": "Mike Brown",
    "instructorEmail": "mike.brown@naplan.edu",
    "isPrimary": false,
    "assignedAt": "2025-01-01T00:00:00Z"
  }
]
```

---

### 6B.2 ?????? ??? Terms ?????
```http
GET /api/teachers/{teacherId}/terms
```

**Auth:** ?????  
**Roles Required:** `Teacher`, `Admin`

**Response (200):**
```json
[
  {
    "termId": 1,
    "termNumber": 1,
    "subjectName": "Algebra Year 7",
"subjectId": 1,
  "role": "Primary Instructor",
    "isPrimary": true,
    "startDate": "2025-01-01",
    "price": 29.99,
    "studentsCount": 25
  }
]
```

---

### 6B.3 ????? ???? ?? Term
```http
POST /api/terms/{termId}/instructors
```

**Auth:** ?????  
**Roles Required:** `Admin`

**Request Body:**
```json
{
  "instructorId": 2,
  "isPrimary": true
}
```

---

### 6B.4 ????? ???? ?? Term
```http
DELETE /api/terms/{termId}/instructors/{instructorId}
```

**Auth:** ?????  
**Roles Required:** `Admin`

---

### 6B.5 ????? ??? ??????
```http
PUT /api/terms/{termId}/instructors/{instructorId}
```

**Auth:** ?????  
**Roles Required:** `Admin`

**Request Body:**
```json
{
  "isPrimary": false
}
```

---

## 8. Lessons

### 8.1 ?????? ??? ???? ??????
```http
GET /api/lessons
```

**Auth:** ?????

**Response (200):**
```json
[
  {
    "id": 1,
    "weekId": 1,
    "title": "Lesson 1: Variables",
    "description": "Introduction to variables",
    
 // Video Info (?????) ?
    "videoUrl": "https://naplan.b-cdn.net/{videoId}/playlist.m3u8",
    "videoProvider": "BunnyStream",
    "videoDuration": 1800,
    "posterUrl": "https://naplan.b-cdn.net/{videoId}/thumbnail.jpg",
    
    "order": 1,
    "resources": [...]
  }
]
```

---

## 11. Exams (?????) ?

### ???? ????

**Exam Types ???????:**

| Type | ?????? | ????? | ???? |
|------|-------|-------|------|
| **Lesson** | 1 | ?????? ??? ??? ???? | Quiz ??? ??? Variables |
| **Monthly** | 2 | ?????? ???? | ?????? ????? ????? |
| **Term** | 3 | ?????? ??? Term ???? | Final Exam ??? Term 1 |
| **Year** | 4 | ?????? ????? ??? ????? | ?????? ????? ????? |

**Question Types ???????:**

| Type | ?????? | ????? | ??????? |
|------|-------|-------|---------|
| **Text** | 1 | ???? ??? | ???? (??????) |
| **MultipleChoice** | 2 | ?????? ???? ?? ????? | ?????? |
| **MultipleSelect** | 3 | ?????? ????? | ?????? |
| **TrueFalse** | 4 | ?? ?? ??? | ?????? |

---

### 11.1 ?????? ??? ???? Exams
```http
GET /api/exam
```

**Auth:** ?????

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Algebra Term 1 Final",
    "description": "Covers chapters 1-5",
    "examType": "Term",
    "subjectId": 1,
    "termId": 1,
    "durationInMinutes": 120,
    "totalMarks": 100,
    "passingMarks": 50,
    "startTime": "2025-02-01T10:00:00Z",
    "endTime": "2025-02-01T13:00:00Z",
    "isPublished": true,
  "questionCount": 25
  }
]
```

---

### 11.5 ????? Exam (?????) ?
```http
POST /api/exam
```

**Auth:** ?????  
**Roles Required:** `Teacher`, `Admin`

**Request Body:**
```json
{
  "title": "Algebra Term 1 Final",
  "description": "Final exam for Term 1",
  "examType": "Term",
  "subjectId": 1,
  "termId": 1,
  "durationInMinutes": 120,
  "totalMarks": 100,
"passingMarks": 50,
  "startTime": "2025-02-01T10:00:00Z",
  "endTime": "2025-02-01T13:00:00Z",
  "questions": [
    {
      "questionText": "?? ?? 2 + 2?",
    "questionType": "MultipleChoice",
      "marks": 5,
      "order": 1,
      "options": [
        { "optionText": "3", "isCorrect": false },
        { "optionText": "4", "isCorrect": true },
        { "optionText": "5", "isCorrect": false }
      ]
    },
    {
  "questionText": "???? ??????? ???????",
      "questionType": "MultipleSelect",
      "marks": 10,
      "order": 2,
      "options": [
  { "optionText": "2", "isCorrect": true },
        { "optionText": "3", "isCorrect": true },
      { "optionText": "4", "isCorrect": false },
        { "optionText": "5", "isCorrect": true }
      ]
    },
    {
  "questionText": "???? ????? ????? ?????",
      "questionType": "Text",
      "marks": 15,
      "order": 3
    },
    {
 "questionText": "????? ?????",
      "questionType": "TrueFalse",
      "marks": 2,
      "order": 4,
      "options": [
    { "optionText": "??", "isCorrect": true },
        { "optionText": "???", "isCorrect": false }
      ]
    }
  ]
}
```

---

### 11.6 ??? ????????
```http
POST /api/exam/{examId}/start
```

**Auth:** ?????  
**Roles Required:** `Student`

**Response (200):**
```json
{
  "studentExamId": 1,
  "examId": 1,
  "title": "Algebra Term 1 Final",
  "examType": "Term",
  "startedAt": "2025-02-01T10:05:00Z",
  "durationInMinutes": 120,
  "questions": [
    {
   "id": 1,
      "questionText": "?? ?? 2 + 2?",
      "questionType": "MultipleChoice",
      "marks": 5,
      "order": 1,
   "options": [
        { "id": 1, "optionText": "3" },
        { "id": 2, "optionText": "4" },
{ "id": 3, "optionText": "5" }
      ]
    }
  ]
}
```

---

### 11.7 ????? ???????? (?????) ?
```http
POST /api/exam/{examId}/submit
```

**Auth:** ?????  
**Roles Required:** `Student`

**Request Body:**
```json
{
  "studentExamId": 1,
  "answers": [
    {
      "questionId": 1,
      "selectedOptionId": 2
    },
    {
      "questionId": 2,
    "selectedOptionIds": [4, 5, 7]
    },
    {
  "questionId": 3,
      "textAnswer": "????? ????? ????? ??? ??? ?? ????? ???? ?? ???? ????..."
    },
    {
 "questionId": 4,
      "selectedOptionId": 8
    }
  ]
}
```

**Response (200):**
```json
{
  "studentExamId": 1,
  "totalMarks": 100,
  "obtainedMarks": 75,
  "autoGradedMarks": 60,
  "manualGradingRequired": true,
  "percentage": 75,
  "passed": true,
  "submittedAt": "2025-02-01T11:50:00Z",
  "questions": [
    {
      "questionId": 1,
      "questionText": "?? ?? 2 + 2?",
      "questionType": "MultipleChoice",
      "marks": 5,
      "obtainedMarks": 5,
      "isCorrect": true,
    "correctAnswer": "4",
      "studentAnswer": "4"
    },
  {
      "questionId": 3,
  "questionText": "???? ????? ????? ?????",
      "questionType": "Text",
      "marks": 15,
      "obtainedMarks": null,
  "isCorrect": null,
      "studentAnswer": "????? ????? ????? ??? ???...",
      "requiresManualGrading": true
    }
  ]
}
```

**??????**: ??????? ?? ??? `Text` ????? ????? ???? ?? ??????

---

## 13. Subscription Plans (?????) ?

### ???? ????

**Plan Types:**

| Type | ?????? | ????? | ???? |
|------|-------|-------|------|
| **SingleTerm** | 1 | ??? ?? Term ???? | Algebra - Term 1 ($29.99) |
| **MultiTerm** | 2 | ??? ???? Terms | Algebra - Term 1 & 2 ($49.99) |
| **FullYear** | 3 | ??? ????? ??????? (???? ??????) | Year 7 - All Subjects ($299.99) |
| **SubjectAnnual** | 4 | ??? ????? ????? ?????? | Algebra - Full Year ($89.99) |

---

### 13.4 ?????? ??? ????? ??????? ??????
```http
GET /api/subscriptionplans/student/{studentId}/available
```

**Auth:** ?????  
**Roles Required:** `Student`, `Parent`, `Admin`

**Response (200):**
```json
[
  {
    "planId": 1,
"name": "Algebra - Term 1",
    "description": "Access to Algebra for Term 1",
    "price": 29.99,
    "planType": "SingleTerm",
    "coverageDescription": "Algebra - Term 1"
  },
  {
    "planId": 2,
    "name": "Algebra - Term 1 & 2",
    "description": "Access for 2 terms",
    "price": 49.99,
    "planType": "MultiTerm",
    "coverageDescription": "Multiple Terms - 1,2"
  },
  {
    "planId": 3,
  "name": "Year 7 - All Subjects",
    "description": "Access to all subjects",
    "price": 299.99,
    "planType": "FullYear",
    "coverageDescription": "All Subjects - Grade 7"
  }
]
```

---

## ?? ????? ????????? ????????

### ???? 1: ??? Term ?? ??????? ???????? ?

```typescript
async function displayTermDetails(termId: number) {
  // Get term details with instructors
  const term = await fetch(`/api/terms/${termId}`);
  const data = await term.json();

  // Display term info
  document.getElementById('term-title').textContent = 
    `${data.subjectName} - Term ${data.termNumber}`;
  
  document.getElementById('term-description').textContent = 
    data.description;
  
  // Display pricing
  const priceElement = document.getElementById('term-price');
  priceElement.innerHTML = `
    <del>$${data.originalPrice}</del>
 <strong>$${data.price}</strong>
    <span class="badge">${data.discountPercentage}% OFF</span>
  `;
  
  // Display instructors
  const primaryInstructor = data.instructors.find(i => i.isPrimary);
  const assistants = data.instructors.filter(i => !i.isPrimary);
  
  document.getElementById('primary-instructor').innerHTML = `
  <h3>${primaryInstructor.name}</h3>
    <p>${primaryInstructor.email}</p>
    <span class="badge">Primary Instructor</span>
  `;
  
  if (assistants.length > 0) {
    document.getElementById('assistants').innerHTML = assistants.map(a => `
      <div class="instructor-card">
        <h4>${a.name}</h4>
     <p>${a.email}</p>
  <span class="badge">Assistant</span>
      </div>
    `).join('');
  }
  
  // Display stats
  document.getElementById('stats').innerHTML = `
    <span>?? ${data.durationHours} hours</span>
    <span>?? ${data.weekIds.length} weeks</span>
    <span>?? ${data.studentsCount} students</span>
  `;
}
```

---

### ???? 2: ????? ????? ?? Bunny.net ?

```typescript
async function playLesson(lessonId: number) {
  // Get lesson details
  const lesson = await fetch(`/api/lessons/${lessonId}`);
  const data = await lesson.json();

  const video = document.getElementById('player');
  
  // Check video provider
  if (data.videoProvider === 'BunnyStream') {
    // HLS Streaming
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(data.videoUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const player = new Plyr(video, {
          controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
          settings: ['quality', 'speed']
        });
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = data.videoUrl;
    }
  } else {
    // Regular MP4 (Cloudinary/BunnyStorage)
    video.src = data.videoUrl;
  }
  
  // Set poster
  video.poster = data.posterUrl;
}
```

---

### ???? 3: ???? ???????? ?????? ?

```typescript
class ExamManager {
  private studentExamId: number;
  private answers: Map<number, any>;

  async startExam(examId: number) {
    const response = await fetch(`/api/exam/${examId}/start`, {
 method: 'POST'
    });
    
    const session = await response.json();
    this.studentExamId = session.studentExamId;
    this.answers = new Map();
    
    // Display questions
    this.displayQuestions(session.questions);
    
// Start timer
    this.startTimer(session.durationInMinutes);
  }

  displayQuestions(questions: any[]) {
    const container = document.getElementById('questions');
    
    questions.forEach(q => {
      let html = `<div class="question" data-id="${q.id}">
        <h3>Q${q.order}: ${q.questionText} (${q.marks} marks)</h3>`;
      
      if (q.questionType === 'MultipleChoice' || q.questionType === 'TrueFalse') {
        // Single choice
   html += q.options.map(opt => `
       <label>
         <input type="radio" name="q${q.id}" value="${opt.id}">
            ${opt.optionText}
   </label>
        `).join('');
      } else if (q.questionType === 'MultipleSelect') {
        // Multiple choice
        html += q.options.map(opt => `
    <label>
      <input type="checkbox" name="q${q.id}" value="${opt.id}">
  ${opt.optionText}
          </label>
        `).join('');
      } else if (q.questionType === 'Text') {
        // Text answer
        html += `<textarea name="q${q.id}" rows="5"></textarea>`;
      }
      
      html += '</div>';
      container.innerHTML += html;
    });
  }

  async submitExam() {
    // Collect answers
    const answersArray = [];
    
    document.querySelectorAll('.question').forEach(qDiv => {
      const questionId = parseInt(qDiv.dataset.id);
      const questionType = qDiv.dataset.type;
      
      if (questionType === 'Text') {
        const textarea = qDiv.querySelector('textarea');
        answersArray.push({
     questionId,
          textAnswer: textarea.value
        });
      } else if (questionType === 'MultipleSelect') {
        const checkboxes = qDiv.querySelectorAll('input[type="checkbox"]:checked');
        answersArray.push({
          questionId,
          selectedOptionIds: Array.from(checkboxes).map(cb => parseInt(cb.value))
 });
      } else {
        const radio = qDiv.querySelector('input[type="radio"]:checked');
   if (radio) {
answersArray.push({
         questionId,
  selectedOptionId: parseInt(radio.value)
          });
        }
      }
    });
    
    // Submit
    const response = await fetch(`/api/exam/${this.examId}/submit`, {
  method: 'POST',
      body: JSON.stringify({
        studentExamId: this.studentExamId,
        answers: answersArray
      })
 });
    
    const result = await response.json();
    this.displayResults(result);
  }

  displayResults(result: any) {
    const container = document.getElementById('results');
    
    container.innerHTML = `
      <h2>Exam Results</h2>
      <div class="score ${result.passed ? 'pass' : 'fail'}">
        <strong>${result.obtainedMarks}/${result.totalMarks}</strong>
  <span>${result.percentage}%</span>
  <span class="badge">${result.passed ? 'PASSED' : 'FAILED'}</span>
      </div>
      
    ${result.manualGradingRequired ? `
   <div class="alert alert-info">
          ? Some answers require manual grading by your teacher
        </div>
      ` : ''}
    
      <h3>Question Breakdown</h3>
      ${result.questions.map(q => `
        <div class="question-result ${q.isCorrect ? 'correct' : q.requiresManualGrading ? 'pending' : 'incorrect'}">
     <h4>${q.questionText}</h4>
        <p>Marks: ${q.obtainedMarks ?? 'Pending'}/${q.marks}</p>
          ${q.isCorrect !== null ? `
     <p>Your answer: ${q.studentAnswer}</p>
            ${!q.isCorrect ? `<p class="correct-answer">Correct: ${q.correctAnswer}</p>` : ''}
          ` : '<p>? Awaiting teacher review</p>'}
        </div>
      `).join('')}
    `;
  }
}
```

---

## ?? Best Practices (?????)

### 1. Video Player Initialization

```typescript
class VideoPlayer {
  private hls: Hls;
  private player: Plyr;

  init(videoElement: HTMLVideoElement, videoUrl: string, provider: string) {
    if (provider === 'BunnyStream') {
      this.initHLS(videoElement, videoUrl);
    } else {
      this.initRegular(videoElement, videoUrl);
    }
  }

  private initHLS(video: HTMLVideoElement, url: string) {
    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
  lowLatencyMode: true
      });
    
      this.hls.loadSource(url);
    this.hls.attachMedia(video);
      
    this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
      this.player = new Plyr(video, {
controls: ['play-large', 'play', 'progress', 'current-time', 
    'mute', 'volume', 'settings', 'pip', 'fullscreen'],
          settings: ['quality', 'speed'],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] }
        });
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      this.player = new Plyr(video);
    }
  }

  private initRegular(video: HTMLVideoElement, url: string) {
    video.src = url;
    this.player = new Plyr(video);
  }

  destroy() {
    if (this.hls) this.hls.destroy();
    if (this.player) this.player.destroy();
  }
}
```

---

### 2. Subscription Access Check

```typescript
async function checkAccessAndPlay(studentId: number, lessonId: number) {
  // Check access
  const hasAccess = await fetch(
    `/api/studentsubjects/student/${studentId}/has-access/lesson/${lessonId}`
  ).then(r => r.json());
  
  if (!hasAccess) {
    // Show upgrade modal
    showModal({
      title: 'Subscription Required',
      message: 'You need an active subscription to access this lesson',
      actions: [
        { text: 'View Plans', action: () => navigateTo('/plans') },
        { text: 'Cancel', action: () => closeModal() }
      ]
    });
    return;
  }

  // Play lesson
  await playLesson(lessonId);
}
```

---

## ?? ??????? ??? ?????

| ??? | ????? |
|-----|-------|
| `API/BUNNY_NET_INTEGRATION_GUIDE.md` | ???? ????? Bunny.net ?????????? |
| `API/TERM_LEVEL_DATA_GUIDE.md` | ???? ?????? Term-Level ??????? |
| `API/PAYMENT_SUBSCRIPTION_GUIDE.md` | ???? ???? ????? ??????????? |
| `API/SEEDS_GUIDE.md` | ???? ???????? ????????? |
| `API/FEATURES_USAGE_GUIDE.md` | ???? ??????? ??????? ???????? |

---

**??? ?????**: 2025-01-24  
**???????**: 3.0  
**????????? ???????**:
- ? Bunny.net Video Integration
- ? Term Instructors Support
- ? Enhanced Exam System
- ? Term-Level Pricing & Data
- ? Improved Subscription Plans

**???? ???????**: NaplanBridge

