# NaplanBridge Platform - Complete API Scenarios Documentation

## Table of Contents
1. [Parent Scenarios](#parent-scenarios)
2. [Student Scenarios](#student-scenarios)
3. [Teacher Scenarios](#teacher-scenarios)
4. [Admin Scenarios](#admin-scenarios)
5. [Phase 2 New Features](#phase-2-new-features) ✨ **NEW**

---

## Parent Scenarios

### Scenario 1: Register Parent Account
**Endpoint:** `POST /api/account/register-parent`

**Request:**
```json
{
  "userName": "john_doe",
  "email": "john.doe@example.com",
  "password": "Parent@123456",
  "age": 40,
  "phoneNumber": "+61400123456"
}
```

**Response (Success - 200):**
```json
{
  "userName": "john_doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["Member", "Parent"]
}
```

---

### Scenario 2: Parent Login
**Endpoint:** `POST /api/account/login`

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "Parent@123456"
}
```

**Response (Success - 200):**
```json
{
"userName": "john_doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["Member", "Parent"]
}
```

---

### Scenario 3: Create Student Account
**Endpoint:** `POST /api/account/register-student`
**Authorization:** Bearer Token (Parent or Admin)

**Request:**
```json
{
  "userName": "ali_ahmed",
  "password": "Student@123",
  "age": 13,
  "year": 7
}
```

**Response (Success - 200):**
```json
{
  "userName": "ali_ahmed",
  "email": "ali_ahmed@naplan.edu",
  "roles": ["Member", "Student"]
}
```

---

### Scenario 4: Get Parent's Children
**Endpoint:** `GET /api/user/get-children/{parentId}`
**Authorization:** Bearer Token (Parent or Admin)

**Response (Success - 200):**
```json
[
  {
    "id": 10,
    "userName": "ali_ahmed",
    "email": "ali_ahmed@naplan.edu",
    "age": 13,
    "year": 7
  },
  {
    "id": 11,
    "userName": "sara_ahmed",
    "email": "sara_ahmed@naplan.edu",
    "age": 15,
    "year": 9
  }
]
```

---

### Scenario 5: Browse Subjects by Year
**Endpoint:** `GET /api/subjects/by-year/{yearId}`

**Response (Success - 200):**
```json
[
  {
    "id": 1,
    "yearId": 7,
    "subjectNameId": 1,
    "subjectName": "Algebra",
  "categoryName": "Mathematics",
    "price": 99.99,
    "originalPrice": 149.99,
    "discountPercentage": 33.33,
    "posterUrl": "https://res.cloudinary.com/...",
    "level": "Beginner",
    "duration": 120,
    "subscriptionPlans": [
      {
   "id": 1,
        "name": "Algebra Year 7 - Term 1",
        "description": "Access to Algebra Year 7 for Term 1 only",
      "planType": "SingleTerm",
        "price": 29.99,
        "durationInDays": 90
      },
      {
        "id": 2,
        "name": "Algebra Year 7 - Full Year",
        "description": "Access to Algebra Year 7 for the entire year",
        "planType": "SubjectAnnual",
    "price": 89.99,
        "durationInDays": 365
      }
 ]
  }
]
```

---

### Scenario 6: Add Subscription Plan to Cart
**Endpoint:** `POST /api/cart/items`
**Authorization:** Bearer Token (Parent)

**Request:**
```json
{
  "studentId": 10,
  "subscriptionPlanId": 1,
  "quantity": 1
}
```

**Response (Success - 200):**
```json
{
  "cartId": 1,
  "items": [
    {
      "cartItemId": 1,
"subscriptionPlanId": 1,
      "planName": "Algebra Year 7 - Term 1",
      "studentId": 10,
      "price": 29.99,
      "quantity": 1
    }
  ],
  "totalAmount": 29.99
}
```

---

### Scenario 7: View Cart
**Endpoint:** `GET /api/cart`
**Authorization:** Bearer Token (Parent)

**Response (Success - 200):**
```json
{
  "cartId": 1,
  "items": [
    {
      "cartItemId": 1,
      "subscriptionPlanId": 1,
  "planName": "Algebra Year 7 - Term 1",
      "studentId": 10,
      "price": 29.99,
      "quantity": 1
    },
    {
      "cartItemId": 2,
      "subscriptionPlanId": 3,
      "planName": "Physics Year 7 - Full Year",
      "studentId": 10,
      "price": 89.99,
      "quantity": 1
    }
  ],
  "totalAmount": 119.98
}
```

---

### Scenario 8: Checkout Cart (Create Order)
**Endpoint:** `POST /api/orders/checkout`
**Authorization:** Bearer Token (Parent)

**Response (Success - 200):**
```json
{
  "orderId": 123,
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0"
}
```

**Next Steps:**
1. Redirect parent to `checkoutUrl`
2. Parent completes payment on Stripe
3. Stripe redirects back to success URL

---

### Scenario 9: Payment Success Callback
**Endpoint:** `GET /api/payment/success?session_id={stripe_session_id}`
**Authorization:** Bearer Token (Parent)

**Response (Success - 200):**
```json
{
  "message": "Payment successful! Your subscriptions are being activated.",
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0"
}
```

**Background Process:**
- Order status updated to "Paid"
- Subscriptions created for students
- Cart cleared
- Notifications sent to parent and students

---

### Scenario 10: View Order History
**Endpoint:** `GET /api/orders`
**Authorization:** Bearer Token (Parent)

**Response (Success - 200):**
```json
[
  {
    "orderId": 123,
    "totalAmount": 119.98,
    "status": "Paid",
    "items": [
      {
        "orderItemId": 1,
        "subscriptionPlanId": 1,
"planName": "Algebra Year 7 - Term 1",
    "studentId": 10,
        "unitPrice": 29.99,
        "quantity": 1
      },
      {
        "orderItemId": 2,
        "subscriptionPlanId": 3,
  "planName": "Physics Year 7 - Full Year",
        "studentId": 10,
    "unitPrice": 89.99,
        "quantity": 1
      }
    ]
  }
]
```

---

### Scenario 11: View Student Progress
**Endpoint:** `GET /api/progress/by-student/{studentId}`
**Authorization:** Bearer Token (Parent, Student, or Admin)

**Response (Success - 200):**
```json
[
  {
    "progressNumber": 75.5,
    "timeSpent": 3600,
    "currentPosition": 2700,
    "studentId": 10,
"lessonId": 5
  },
  {
    "progressNumber": 100.0,
    "timeSpent": 2400,
    "currentPosition": 2400,
    "studentId": 10,
    "lessonId": 4
  }
]
```

---

### Scenario 12: Book Private Session with Teacher

#### Step 1: View Available Teachers
**Endpoint:** `GET /api/sessions/teachers/available`
**Authorization:** Bearer Token (Parent)

**Response (Success - 200):**
```json
[
  {
 "teacherId": 5,
    "teacherName": "john_smith",
    "email": "john.smith@naplan.edu",
    "subjects": ["Algebra", "Geometry"],
    "pricePerSession": 50.00,
    "sessionDurationMinutes": 60,
    "isAcceptingBookings": true,
    "description": "Experienced mathematics teacher with 10+ years"
  }
]
```

#### Step 2: View Teacher Available Slots
**Endpoint:** `GET /api/sessions/teachers/5/slots?fromDate=2024-01-20&toDate=2024-01-27`
**Authorization:** Bearer Token (Parent)

**Response (Success - 200):**
```json
[
  {
    "dateTime": "2024-01-22T14:00:00",
    "isAvailable": true,
    "reason": null
  },
  {
    "dateTime": "2024-01-22T15:15:00",
    "isAvailable": true,
    "reason": null
  },
  {
    "dateTime": "2024-01-22T16:30:00",
  "isAvailable": false,
    "reason": "Already booked"
  }
]
```

#### Step 3: Book Session
**Endpoint:** `POST /api/sessions/book`
**Authorization:** Bearer Token (Parent)

**Request:**
```json
{
  "teacherId": 5,
  "studentId": 10,
  "scheduledDateTime": "2024-01-22T14:00:00",
  "notes": "Need help with quadratic equations"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Session booking initiated. Please complete payment.",
  "data": {
    "sessionId": 456,
    "stripeCheckoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
    "stripeSessionId": "cs_test_xyz123"
  }
}
```

#### Step 4: Complete Payment
- Redirect to Stripe checkout URL
- Complete payment
- Return to success page

#### Step 5: View Booked Sessions
**Endpoint:** `GET /api/sessions/parent/bookings`
**Authorization:** Bearer Token (Parent)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": [
    {
      "id": 456,
      "teacherId": 5,
  "teacherName": "john_smith",
  "studentId": 10,
      "studentName": "ali_ahmed",
      "parentId": 8,
      "parentName": "john_doe",
      "scheduledDateTime": "2024-01-22T14:00:00",
      "durationMinutes": 60,
      "price": 50.00,
      "status": "Confirmed",
      "googleMeetLink": "https://meet.google.com/abc-defg-hij",
      "createdAt": "2024-01-15T10:30:00",
      "notes": "Need help with quadratic equations",
      "rating": null,
 "feedback": null
    }
  ]
}
```

---

### Scenario 13: View Notifications
**Endpoint:** `GET /api/notifications`
**Authorization:** Bearer Token (Parent)

**Response (Success - 200):**
```json
[
  {
    "id": 1,
    "title": "Payment Successful",
    "message": "Your payment of $119.98 has been processed successfully",
    "type": "SubscriptionPaymentReceived",
    "isRead": false,
    "sentAt": "2024-01-15T10:35:00"
  },
  {
    "id": 2,
    "title": "Private Session Booked",
    "message": "Session with john_smith scheduled for 2024-01-22 14:00",
    "type": "SessionBooked",
    "isRead": false,
    "sentAt": "2024-01-15T11:00:00"
  },
  {
    "id": 3,
    "title": "Subscription Expiring Soon",
    "message": "Algebra subscription for ali_ahmed expires in 7 days",
    "type": "SubscriptionExpiringSoon",
    "isRead": false,
    "sentAt": "2024-01-15T09:00:00"
  }
]
```

---

## Student Scenarios

### Scenario 1: Student Login
**Endpoint:** `POST /api/account/login`

**Request:**
```json
{
  "email": "ali_ahmed@naplan.edu",
  "password": "Student@123"
}
```

**Response (Success - 200):**
```json
{
  "userName": "ali_ahmed",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["Member", "Student"]
}
```

---

### Scenario 2: View Available Subjects
**Endpoint:** `GET /api/subjects/by-year/{yearId}`

**Response:** (Same as Parent Scenario 5)

---

### Scenario 3: View Lessons in Subject
**Endpoint:** `GET /api/lessons/subject/{subjectId}`

**Response (Success - 200):**
```json
[
  {
    "id": 1,
    "title": "Introduction to Algebra",
    "description": "Learn the basics of algebraic expressions",
    "posterUrl": "https://res.cloudinary.com/...",
    "videoUrl": "https://res.cloudinary.com/...",
    "weekId": 1,
    "subjectId": 1,
    "termId": 1
  },
  {
    "id": 2,
  "title": "Linear Equations",
    "description": "Solving linear equations step by step",
    "posterUrl": "https://res.cloudinary.com/...",
    "videoUrl": "https://res.cloudinary.com/...",
    "weekId": 1,
    "subjectId": 1,
    "termId": 1
  }
]
```

---

### Scenario 4: Watch Lesson and Track Progress

#### Step 1: Get Lesson Details
**Endpoint:** `GET /api/lessons/{lessonId}`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
{
  "id": 1,
  "title": "Introduction to Algebra",
  "description": "Learn the basics of algebraic expressions",
  "posterUrl": "https://res.cloudinary.com/...",
  "videoUrl": "https://res.cloudinary.com/...",
  "weekId": 1
}
```

#### Step 2: Track Progress (Every 30 seconds)
**Endpoint:** `PUT /api/progress/students/{studentId}/lessons/{lessonId}`
**Authorization:** Bearer Token (Student)

**Request (At 5 minutes - 300 seconds):**
```json
{
  "progressNumber": 25.0,
  "timeSpent": 300,
  "currentPosition": 300
}
```

**Response (Success - 200):**
```json
{
  "progressNumber": 25.0,
  "timeSpent": 300,
  "currentPosition": 300,
  "studentId": 10,
  "lessonId": 1
}
```

#### Step 3: Complete Lesson
**Request (At end - 1200 seconds):**
```json
{
  "progressNumber": 100.0,
  "timeSpent": 1200,
  "currentPosition": 1200
}
```

---

### Scenario 5: Answer Lesson Questions

#### Step 1: Get Lesson Questions
**Endpoint:** `GET /api/lessonquestions/lesson/{lessonId}`

**Response (Success - 200):**
```json
[
  {
    "id": 1,
    "lessonId": 1,
    "questionText": "What is 2 + 2?",
    "isMultipleChoice": false,
    "videoMinute": 5,
    "options": [
      {
"id": 1,
      "text": "3"
      },
      {
        "id": 2,
        "text": "4"
      },
      {
        "id": 3,
        "text": "5"
      }
    ]
  },
  {
    "id": 2,
    "lessonId": 1,
    "questionText": "Select all prime numbers",
    "isMultipleChoice": true,
    "videoMinute": 10,
    "options": [
  {
        "id": 4,
        "text": "2"
      },
  {
        "id": 5,
        "text": "3"
      },
      {
        "id": 6,
    "text": "4"
  },
      {
        "id": 7,
        "text": "5"
      }
    ]
  }
]
```

#### Step 2: Submit Answer (Correct)
**Endpoint:** `POST /api/lessonquestions/answer`

**Request:**
```json
{
  "questionId": 1,
  "selectedOptionIds": [2]
}
```

**Response (Success - Correct Answer):**
```json
{
  "isCorrect": true
}
```

#### Step 3: Submit Answer (Incorrect)
**Request:**
```json
{
  "questionId": 1,
  "selectedOptionIds": [1]
}
```

**Response (Success - Incorrect Answer):**
```json
{
  "isCorrect": false,
  "correctAnswers": ["4"],
  "explanation": "Simple addition: 2 + 2 equals 4",
  "videoMinute": 5
}
```

---

### Scenario 6: Take Exam

#### Step 1: View Available Exams
**Endpoint:** `GET /api/exam/subject/{subjectId}`

**Response (Success - 200):**
```json
[
  {
    "id": 1,
    "title": "Lesson 1 Quick Quiz",
    "description": "Quick quiz on Lesson 1 concepts",
    "examType": "Lesson",
    "durationInMinutes": 15,
    "totalMarks": 20,
    "passingMarks": 12,
    "startTime": "2024-01-22T00:00:00",
    "endTime": "2024-01-29T23:59:59",
    "isPublished": true
  },
  {
    "id": 2,
    "title": "Term 1 Final Exam",
    "description": "Comprehensive exam covering all Term 1 content",
    "examType": "Term",
    "durationInMinutes": 120,
    "totalMarks": 100,
    "passingMarks": 50,
    "startTime": "2024-04-01T00:00:00",
    "endTime": "2024-04-08T23:59:59",
    "isPublished": true
  }
]
```

#### Step 2: Start Exam
**Endpoint:** `POST /api/exam/{examId}/start`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
{
  "studentExamId": 789,
  "examId": 1,
  "startTime": "2024-01-22T10:00:00",
  "endTime": "2024-01-22T10:15:00",
  "durationInMinutes": 15,
  "questions": [
    {
      "id": 1,
      "questionText": "What is 5 + 3?",
    "marks": 5,
      "isMultipleSelect": false,
      "options": [
        {
          "id": 1,
   "optionText": "7"
        },
        {
          "id": 2,
          "optionText": "8"
        },
 {
          "id": 3,
          "optionText": "9"
        }
      ]
    },
    {
   "id": 2,
    "questionText": "Select all even numbers",
  "marks": 5,
      "isMultipleSelect": true,
    "options": [
        {
          "id": 4,
          "optionText": "2"
        },
        {
          "id": 5,
      "optionText": "3"
 },
     {
          "id": 6,
          "optionText": "4"
        },
        {
          "id": 7,
      "optionText": "5"
        },
        {
   "id": 8,
          "optionText": "6"
        }
 ]
    },
    {
      "id": 3,
      "questionText": "Explain the concept of variables in algebra",
      "marks": 10,
   "isMultipleSelect": false,
      "options": []
    }
  ]
}
```

#### Step 3: Submit Exam
**Endpoint:** `POST /api/exam/submit`
**Authorization:** Bearer Token (Student)

**Request:**
```json
{
  "studentExamId": 789,
  "answers": [
    {
      "examQuestionId": 1,
      "selectedOptionIds": [2]
    },
    {
      "examQuestionId": 2,
      "selectedOptionIds": [4, 6, 8]
    },
    {
      "examQuestionId": 3,
      "textAnswer": "Variables are symbols that represent unknown values in algebraic expressions..."
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "studentExamId": 789,
  "totalMarks": 20,
  "obtainedMarks": 18,
  "percentage": 90.0,
  "passed": true,
  "submittedAt": "2024-01-22T10:12:30",
  "timeTaken": 12,
  "questionResults": [
    {
      "questionId": 1,
    "questionText": "What is 5 + 3?",
    "marks": 5,
      "obtained": 5,
      "isCorrect": true,
      "correctAnswer": "8",
      "studentAnswer": "8"
    },
    {
      "questionId": 2,
      "questionText": "Select all even numbers",
      "marks": 5,
      "obtained": 5,
      "isCorrect": true,
      "correctAnswer": "2, 4, 6",
      "studentAnswer": "2, 4, 6"
    },
    {
      "questionId": 3,
      "questionText": "Explain the concept of variables in algebra",
      "marks": 10,
    "obtained": 8,
      "isCorrect": true,
      "correctAnswer": "Text answer - manually graded",
      "studentAnswer": "Variables are symbols that represent unknown values..."
    }
  ]
}
```

#### Step 4: View Exam Result
**Endpoint:** `GET /api/exam/{studentExamId}/result`
**Authorization:** Bearer Token (Student)

**Response:** (Same as Submit response)

---

### Scenario 7: View Student Achievements
**Endpoint:** `GET /api/achievements/student/{studentId}`
**Authorization:** Bearer Token (Student, Parent, or Admin)

**Response (Success - 200):**
```json
{
  "studentId": 10,
  "totalPoints": 850,
  "achievements": [
    {
      "id": 1,
      "name": "First Lesson Complete",
      "description": "Complete your first lesson",
      "iconUrl": "https://res.cloudinary.com/...",
      "type": "LessonsCompleted",
      "pointsRequired": 1,
      "pointsReward": 10,
    "earnedDate": "2024-01-10T14:30:00"
    },
    {
      "id": 2,
      "name": "Perfect Score",
      "description": "Get 100% on any exam",
      "iconUrl": "https://res.cloudinary.com/...",
      "type": "PerfectScores",
      "pointsRequired": 1,
      "pointsReward": 50,
      "earnedDate": "2024-01-15T11:20:00"
    },
    {
      "id": 5,
      "name": "7 Day Streak",
      "description": "Study for 7 consecutive days",
      "iconUrl": "https://res.cloudinary.com/...",
      "type": "ConsecutiveDays",
   "pointsRequired": 7,
      "pointsReward": 30,
      "earnedDate": "2024-01-18T09:00:00"
 }
  ]
}
```

---

### Scenario 8: View Certificates
**Endpoint:** `GET /api/certificates/student/{studentId}`
**Authorization:** Bearer Token (Student, Parent, or Admin)

**Response (Success - 200):**
```json
[
  {
    "id": 1,
  "studentId": 10,
    "studentName": "ali_ahmed",
    "type": "SubjectCompletion",
    "title": "Certificate of Completion - Algebra Year 7",
    "description": "Successfully completed all lessons and exams in Algebra Year 7",
    "subjectName": "Algebra",
    "issuedDate": "2024-01-20T00:00:00",
    "verificationCode": "CERT-2024-001-ABC123",
"pdfUrl": "https://res.cloudinary.com/...",
    "isActive": true,
    "score": 92.5,
    "grade": "A"
  }
]
```

---

### Scenario 9: Join Private Session
**Endpoint:** `GET /api/sessions/{sessionId}/join`
**Authorization:** Bearer Token (Student or Teacher)

**Response (Success - 200):**
```json
{
  "success": true,
"message": "Session details retrieved successfully",
  "data": {
    "id": 456,
    "teacherId": 5,
    "teacherName": "john_smith",
    "studentId": 10,
    "studentName": "ali_ahmed",
    "parentId": 8,
    "parentName": "john_doe",
    "scheduledDateTime": "2024-01-22T14:00:00",
    "durationMinutes": 60,
    "price": 50.00,
    "status": "Confirmed",
    "googleMeetLink": "https://meet.google.com/abc-defg-hij",
    "createdAt": "2024-01-15T10:30:00",
    "notes": "Need help with quadratic equations",
    "rating": null,
"feedback": null
  }
}
```

---

## Teacher Scenarios

### Scenario 1: Teacher Login
**Endpoint:** `POST /api/account/login`

**Request:**
```json
{
  "email": "john.smith@naplan.edu",
  "password": "Teacher@123"
}
```

**Response (Success - 200):**
```json
{
  "userName": "john_smith",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["Member", "Teacher"]
}
```

---

### Scenario 2: Create New Lesson

**Note:** Currently requires Admin role. Teacher authorization needs to be added.

**Endpoint:** `POST /api/lessons`
**Authorization:** Bearer Token (Admin only - requires update)

**Request:**
```json
{
  "title": "Quadratic Equations",
  "description": "Learn how to solve quadratic equations",
  "weekId": 1,
  "posterFile": "(multipart/form-data file)",
  "videoFile": "(multipart/form-data file)"
}
```

**Response (Success - 201):**
```json
{
  "id": 15,
  "title": "Quadratic Equations",
  "description": "Learn how to solve quadratic equations",
  "posterUrl": "https://res.cloudinary.com/...",
  "videoUrl": "https://res.cloudinary.com/...",
  "weekId": 1
}
```

---

### Scenario 3: Create Quiz on Lesson

#### Step 1: Create Lesson Question
**Endpoint:** `POST /api/lessonquestions`
**Authorization:** Bearer Token (Admin or Teacher)

**Request (Multiple Choice):**
```json
{
  "lessonId": 15,
  "questionText": "What is the formula for solving quadratic equations?",
  "isMultipleChoice": false,
  "videoMinute": 12,
  "explanation": "The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a",
  "options": [
    {
      "text": "x = (-b ± √(b² + 4ac)) / 2a",
      "isCorrect": true
    },
    {
      "text": "x = (-b ± √(b² + 4ac)) / 2a",
      "isCorrect": false
    },
    {
"text": "x = (b ± √(b² - 4ac)) / 2a",
      "isCorrect": false
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "id": 50,
  "lessonId": 15,
  "questionText": "What is the formula for solving quadratic equations?",
  "isMultipleChoice": false,
  "videoMinute": 12,
  "options": [
    {
      "id": 150,
      "text": "x = (-b ± √(b² + 4ac)) / 2a"
    },
    {
      "id": 151,
      "text": "x = (-b ± √(b² - 4ac)) / 2a"
    },
    {
      "id": 152,
      "text": "x = (b ± √(b² - 4ac)) / 2a"
    }
  ]
}
```

#### Step 2: Create Multiple Questions
Repeat Step 1 for additional questions (recommend 5-10 questions per lesson)

---

### Scenario 4: Create Exam on Multiple Lessons

#### Step 1: Create Exam
**Endpoint:** `POST /api/exam`
**Authorization:** Bearer Token (Teachers need authorization)

**Request:**
```json
{
  "title": "Week 3 Assessment",
  "description": "Assessment covering lessons 10-15",
  "durationInMinutes": 45,
  "totalMarks": 50,
  "passingMarks": 30,
  "examType": "Monthly",
  "subjectId": 1,
  "weekId": 3,
  "startTime": "2024-02-01T00:00:00",
  "endTime": "2024-02-08T23:59:59",
  "isPublished": true
}
```

**Response (Success - 201):**
```json
{
  "id": 10,
  "title": "Week 3 Assessment",
  "description": "Assessment covering lessons 10-15",
  "examType": "Monthly",
  "durationInMinutes": 45,
  "totalMarks": 50,
  "passingMarks": 30
}
```

#### Step 2: Add Questions to Exam
**Endpoint:** `POST /api/exam/{examId}/questions`
**Authorization:** Bearer Token (Teachers need authorization)

**Request (Question 1):**
```json
{
  "questionText": "Solve: x² + 5x + 6 = 0",
  "marks": 10,
  "isMultipleSelect": false,
  "options": [
    {
      "optionText": "x = -2 or x = -3",
      "isCorrect": true
    },
    {
      "optionText": "x = 2 or x = 3",
      "isCorrect": false
    },
    {
      "optionText": "x = -1 or x = -6",
      "isCorrect": false
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "id": 100,
"questionText": "Solve: x² + 5x + 6 = 0",
  "marks": 10,
  "isMultipleSelect": false,
  "options": [
    {
      "id": 200,
      "optionText": "x = -2 or x = -3",
      "isCorrect": true
    },
    {
      "id": 201,
      "optionText": "x = 2 or x = 3",
      "isCorrect": false
    },
    {
      "id": 202,
      "optionText": "x = -1 or x = -6",
      "isCorrect": false
    }
  ]
}
```

#### Step 3: Repeat for All Questions
Add 5-10 questions to complete the exam

---

### Scenario 5: Setup Private Session Availability

#### Step 1: Configure Session Settings
**Endpoint:** `PUT /api/sessions/teacher/settings`
**Authorization:** Bearer Token (Teacher)

**Request:**
```json
{
  "sessionDurationMinutes": 60,
  "bufferTimeMinutes": 15,
  "pricePerSession": 50.00,
  "isAcceptingBookings": true,
  "maxSessionsPerDay": 8,
  "description": "Experienced mathematics teacher specializing in algebra and geometry"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "id": 1,
    "sessionDurationMinutes": 60,
    "bufferTimeMinutes": 15,
    "pricePerSession": 50.00,
    "isAcceptingBookings": true,
    "maxSessionsPerDay": 8,
  "description": "Experienced mathematics teacher specializing in algebra and geometry"
  }
}
```

#### Step 2: Add Availability Slots
**Endpoint:** `POST /api/sessions/teacher/availability`
**Authorization:** Bearer Token (Teacher)

**Request (Monday 9 AM - 5 PM):**
```json
{
  "dayOfWeek": "Monday",
  "startTime": "09:00:00",
  "endTime": "17:00:00"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Availability added successfully",
  "data": {
    "id": 10,
    "dayOfWeek": "Monday",
    "startTime": "09:00:00",
    "endTime": "17:00:00",
  "isActive": true
  }
}
```

#### Step 3: Add Multiple Days
Repeat Step 2 for each day of the week you want to be available

#### Step 4: View All Availability
**Endpoint:** `GET /api/sessions/teacher/availability`
**Authorization:** Bearer Token (Teacher)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Availability retrieved successfully",
  "data": [
  {
      "id": 10,
      "dayOfWeek": "Monday",
   "startTime": "09:00:00",
      "endTime": "17:00:00",
      "isActive": true
    },
    {
      "id": 11,
  "dayOfWeek": "Tuesday",
    "startTime": "09:00:00",
      "endTime": "17:00:00",
      "isActive": true
    },
    {
      "id": 12,
      "dayOfWeek": "Wednesday",
      "startTime": "10:00:00",
      "endTime": "18:00:00",
      "isActive": true
    }
  ]
}
```

---

### Scenario 6: View Upcoming Private Sessions
**Endpoint:** `GET /api/sessions/teacher/upcoming`
**Authorization:** Bearer Token (Teacher)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Sessions retrieved successfully",
  "data": [
    {
      "id": 456,
      "teacherId": 5,
   "teacherName": "john_smith",
      "studentId": 10,
      "studentName": "ali_ahmed",
   "parentId": 8,
      "parentName": "john_doe",
      "scheduledDateTime": "2024-01-22T14:00:00",
      "durationMinutes": 60,
      "price": 50.00,
      "status": "Confirmed",
   "googleMeetLink": "https://meet.google.com/abc-defg-hij",
      "createdAt": "2024-01-15T10:30:00",
      "notes": "Need help with quadratic equations",
      "rating": null,
      "feedback": null
    },
    {
      "id": 457,
      "teacherId": 5,
 "teacherName": "john_smith",
      "studentId": 11,
      "studentName": "sara_ahmed",
      "parentId": 8,
 "parentName": "john_doe",
      "scheduledDateTime": "2024-01-23T10:00:00",
      "durationMinutes": 60,
      "price": 50.00,
      "status": "Confirmed",
      "googleMeetLink": "https://meet.google.com/xyz-abcd-efg",
      "createdAt": "2024-01-16T09:15:00",
      "notes": "Review for upcoming exam",
      "rating": null,
      "feedback": null
    }
  ]
}
```

---

### Scenario 7: View Session History
**Endpoint:** `GET /api/sessions/teacher/history`
**Authorization:** Bearer Token (Teacher)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Session history retrieved successfully",
  "data": [
    {
      "id": 450,
 "teacherId": 5,
      "teacherName": "john_smith",
      "studentId": 9,
      "studentName": "omar_mohammed",
      "parentId": 7,
      "parentName": "fatima_hassan",
      "scheduledDateTime": "2024-01-10T15:00:00",
  "durationMinutes": 60,
      "price": 50.00,
      "status": "Completed",
  "googleMeetLink": "https://meet.google.com/old-session",
      "createdAt": "2024-01-05T11:00:00",
      "notes": "Linear equations help",
      "rating": 5,
      "feedback": "Excellent teacher! Very patient and explains clearly."
    }
  ]
}
```

---

### Scenario 8: Respond to Student Questions in Lessons

**Current Implementation:** Students can ask questions through lesson questions, but there's no specific endpoint for teacher responses in discussions.

**Recommendation:** Add a discussion/comment system:
- `POST /api/lessons/{lessonId}/discussions` - Student posts question
- `POST /api/discussions/{discussionId}/replies` - Teacher responds
- `GET /api/discussions/teacher/pending` - Teacher views unanswered questions

---

### Scenario 9: View Teacher Dashboard Statistics

**Current Implementation:** No dedicated dashboard endpoint exists.

**Recommendation:** Create `GET /api/teacher/dashboard` endpoint with:
- Total students taught
- Upcoming sessions count
- Total private sessions completed
- Average rating
- Total earnings (from private sessions)
- Recent activity
- Pending questions to answer

---

## Admin Scenarios

### Scenario 1: Admin Login
**Endpoint:** `POST /api/account/login`

**Request:**
```json
{
  "email": "admin@naplan.edu",
  "password": "Admin@123"
}
```

**Response (Success - 200):**
```json
{
  "userName": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["Member", "Admin"]
}
```

---

### Scenario 2: Manage System Content (CRUD Operations)

#### Create Subject
**Endpoint:** `POST /api/subjects`
**Authorization:** Bearer Token (Admin)

**Request:**
```json
{
  "yearId": 7,
  "subjectNameId": 1,
  "price": 99.99,
  "originalPrice": 149.99,
  "discountPercentage": 33.33,
  "level": "Beginner",
  "duration": 120,
  "posterFile": "(multipart/form-data)"
}
```

#### Create Term
**Endpoint:** `POST /api/terms`
**Authorization:** Bearer Token (Admin)

**Request:**
```json
{
  "subjectId": 1,
  "termNumber": 1,
  "startDate": "2025-01-15",
  "price": 29.99,
  "originalPrice": 39.99,
  "discountPercentage": 25,
  "description": "First term covering fundamental concepts",
  "durationHours": 40,
  "posterFile": "(multipart/form-data)"
}
```

#### Create Week
**Endpoint:** `POST /api/weeks`
**Authorization:** Bearer Token (Admin)

**Request:**
```json
{
  "termId": 1,
  "weekNumber": 1
}
```

#### Create Lesson
**Endpoint:** `POST /api/lessons`
**Authorization:** Bearer Token (Admin)

(See Teacher Scenario 2)

---

### Scenario 3: View Financial Reports

**Current Implementation:** No financial reporting endpoints exist.

**Recommendation:** Create endpoints:
- `GET /api/admin/reports/financial` - Overall financial report
- `GET /api/admin/reports/revenue-by-subject` - Revenue breakdown by subject
- `GET /api/admin/reports/revenue-by-month` - Monthly revenue trends
- `GET /api/admin/reports/subscription-renewals` - Subscription renewal rates

---

### Scenario 4: View Student Registration Statistics

**Current Implementation:** Can get all users, but no aggregated statistics.

#### Get All Users
**Endpoint:** `GET /api/user`
**Authorization:** Bearer Token (Admin)

**Response (Success - 200):**
```json
[
  {
 "id": 1,
    "userName": "admin",
    "email": "admin@naplan.edu",
  "age": 35,
 "phoneNumber": "+61400000001"
  },
  {
    "id": 10,
    "userName": "ali_ahmed",
    "email": "ali_ahmed@naplan.edu",
    "age": 13,
    "phoneNumber": null
  }
]
```

**Recommendation:** Create statistical endpoints:
- `GET /api/admin/statistics/students` - Student count by year, term, subject
- `GET /api/admin/statistics/registrations` - Registration trends over time
- `GET /api/admin/statistics/active-subscriptions` - Active subscription counts

---

### Scenario 5: View Teacher Performance

**Current Implementation:** Can view teacher sessions individually, but no aggregated reports.

**Recommendation:** Create endpoints:
- `GET /api/admin/reports/teacher/{teacherId}/sessions` - Detailed session report for teacher
  - Total private sessions conducted
  - Average rating
  - Total earnings
  - Session attendance rate
  - Student feedback summary

- `GET /api/admin/reports/teacher/{teacherId}/questions` - Questions answered count
  - Total questions answered
  - Response time average
  - Student satisfaction with answers

- `GET /api/admin/reports/teachers/performance` - Overall teacher performance comparison
  - Ranking by sessions conducted
  - Ranking by average rating
  - Ranking by student satisfaction

---

### Scenario 6: Manage Teacher Availability (Admin Override)

#### View Teacher Availability
**Endpoint:** `GET /api/sessions/teacher/availability`
**Authorization:** Bearer Token (Teacher or Admin)

#### Add Availability for Teacher
**Note:** Currently only teachers can add their own availability. Admin override needed.

**Recommendation:** Add endpoint:
- `POST /api/admin/teachers/{teacherId}/availability` - Admin adds availability for teacher

**Request:**
```json
{
  "dayOfWeek": "Monday",
  "startTime": "09:00:00",
  "endTime": "17:00:00"
}
```

---

### Scenario 7: Create and Manage Subscription Plans

#### Create Subscription Plan
**Endpoint:** `POST /api/subscriptionplans`
**Authorization:** Bearer Token (Admin)

**Request:**
```json
{
  "name": "Algebra Year 7 - Term 1",
  "description": "Access to Algebra Year 7 for Term 1 only",
  "planType": "SingleTerm",
  "price": 29.99,
  "durationInDays": 90,
  "isActive": true,
  "subjectId": 1,
  "termId": 1
}
```

**Response (Success - 200):**
```json
{
  "id": 10,
  "name": "Algebra Year 7 - Term 1",
  "description": "Access to Algebra Year 7 for Term 1 only",
  "planType": "SingleTerm",
  "price": 29.99,
  "durationInDays": 90,
  "isActive": true,
  "subjectId": 1,
  "subjectName": "Algebra",
  "termId": 1
}
```

#### Update Subscription Plan
**Endpoint:** `PUT /api/subscriptionplans/{id}`
**Authorization:** Bearer Token (Admin)

**Request:**
```json
{
  "name": "Algebra Year 7 - Term 1 (Updated)",
  "description": "Updated description",
  "price": 27.99,
"isActive": true
}
```

#### Deactivate Plan
**Endpoint:** `POST /api/subscriptionplans/deactivate-plan/{id}`
**Authorization:** Bearer Token (Admin)

**Response (Success - 200):**
```json
{
  "message": "Plan deactivated successfully"
}
```

---

### Scenario 8: Manage Users and Roles

#### View All Users with Roles
**Endpoint:** `GET /api/admin/users-with-roles`
**Authorization:** Policy="RequireAdminRole"

**Response (Success - 200):**
```json
[
  {
    "id": 1,
    "userName": "admin",
    "email": "admin@naplan.edu",
    "roles": ["Admin", "Member"]
  },
  {
    "id": 5,
    "userName": "john_smith",
    "email": "john.smith@naplan.edu",
    "roles": ["Teacher", "Member"]
  },
  {
    "id": 8,
    "userName": "john_doe",
    "email": "john.doe@example.com",
    "roles": ["Parent", "Member"]
  },
  {
    "id": 10,
    "userName": "ali_ahmed",
    "email": "ali_ahmed@naplan.edu",
    "roles": ["Student", "Member"]
  }
]
```

#### Edit User Roles
**Endpoint:** `PUT /api/admin/edit-user-roles/{username}?roles=Admin,Teacher`
**Authorization:** Policy="RequireAdminRole"

**Example:** Add Admin role to a teacher
**Request:** `PUT /api/admin/edit-user-roles/john_smith?roles=Admin,Teacher,Member`

**Response (Success - 200):**
```json
[
  "Admin",
  "Teacher",
  "Member"
]
```

---

### Scenario 9: Register New Teacher
**Endpoint:** `POST /api/account/register-teacher`
**Authorization:** Bearer Token (Admin)

**Request:**
```json
{
  "userName": "emma_wilson",
  "email": "emma.wilson@naplan.edu",
  "password": "Teacher@123",
  "age": 30,
  "phoneNumber": "+61400000020"
}
```

**Response (Success - 200):**
```json
{
  "userName": "emma_wilson",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["Member", "Teacher"]
}
```

---

### Scenario 10: Send System-Wide Notification
**Endpoint:** `POST /api/notifications`
**Authorization:** Bearer Token (Admin)

**Request:**
```json
{
  "title": "System Maintenance Notice",
  "message": "The system will be under maintenance on Saturday from 2 AM to 6 AM",
  "type": "Info"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Notification created and sent successfully"
}
```

---

### Scenario 11: Issue Certificate to Student
**Endpoint:** `POST /api/certificates/issue`
**Authorization:** Bearer Token (Admin)

**Request:**
```json
{
  "studentId": 10,
  "type": "SubjectCompletion",
  "title": "Certificate of Completion - Algebra Year 7",
  "description": "Successfully completed all lessons and exams in Algebra Year 7",
  "subjectId": 1,
  "score": 92.5,
  "grade": "A"
}
```

**Response (Success - 200):**
```json
{
  "id": 1,
  "studentId": 10,
  "studentName": "ali_ahmed",
  "type": "SubjectCompletion",
  "title": "Certificate of Completion - Algebra Year 7",
  "description": "Successfully completed all lessons and exams in Algebra Year 7",
  "subjectName": "Algebra",
  "issuedDate": "2024-01-20T00:00:00",
  "verificationCode": "CERT-2024-001-ABC123",
  "pdfUrl": "https://res.cloudinary.com/.../certificate.pdf",
  "isActive": true,
  "score": 92.5,
  "grade": "A"
}
```

---

## Phase 2 New Features

### Student Notes System

#### Scenario 1: Create Note During Lesson
**Endpoint:** `POST /api/notes`
**Authorization:** Bearer Token (Student)

**Request:**
```json
{
  "lessonId": 15,
  "content": "Important formula: x = (-b ± √(b² - 4ac)) / 2a",
  "videoTimestamp": 720,
  "tags": ["formula", "quadratic", "important"]
}
```

**Response (Success - 201):**
```json
{
  "id": 50,
  "studentId": 10,
  "lessonId": 15,
  "lessonTitle": "Quadratic Equations",
  "content": "Important formula: x = (-b ± √(b² - 4ac)) / 2a",
  "videoTimestamp": 720,
  "tags": ["formula", "quadratic", "important"],
  "isFavorite": false,
  "createdAt": "2025-01-25T14:30:00Z",
  "updatedAt": "2025-01-25T14:30:00Z"
}
```

---

#### Scenario 2: Get All My Notes
**Endpoint:** `GET /api/notes`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
[
  {
    "id": 50,
    "studentId": 10,
    "lessonId": 15,
    "lessonTitle": "Quadratic Equations",
    "content": "Important formula: x = (-b ± √(b² - 4ac)) / 2a",
  "videoTimestamp": 720,
    "tags": ["formula", "quadratic", "important"],
    "isFavorite": true,
    "createdAt": "2025-01-25T14:30:00Z",
    "updatedAt": "2025-01-25T14:35:00Z"
  },
  {
    "id": 51,
    "studentId": 10,
    "lessonId": 16,
    "lessonTitle": "Linear Equations",
    "content": "Remember: ax + b = 0, solution is x = -b/a",
    "videoTimestamp": 420,
    "tags": ["formula", "linear"],
    "isFavorite": false,
    "createdAt": "2025-01-26T10:15:00Z",
    "updatedAt": "2025-01-26T10:15:00Z"
  }
]
```

---

#### Scenario 3: Get Notes for Specific Lesson
**Endpoint:** `GET /api/notes/lesson/{lessonId}`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
[
  {
    "id": 50,
    "studentId": 10,
    "lessonId": 15,
    "lessonTitle": "Quadratic Equations",
    "content": "Important formula: x = (-b ± √(b² - 4ac)) / 2a",
    "videoTimestamp": 720,
    "tags": ["formula", "quadratic", "important"],
    "isFavorite": true,
    "createdAt": "2025-01-25T14:30:00Z"
  }
]
```

---

#### Scenario 4: Search Notes
**Endpoint:** `GET /api/notes/search?query=formula`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
[
  {
    "id": 50,
    "lessonTitle": "Quadratic Equations",
    "content": "Important formula: x = (-b ± √(b² - 4ac)) / 2a",
    "videoTimestamp": 720,
    "tags": ["formula", "quadratic"],
    "createdAt": "2025-01-25T14:30:00Z"
  },
  {
    "id": 51,
    "lessonTitle": "Linear Equations",
    "content": "Remember: ax + b = 0, solution is x = -b/a",
    "videoTimestamp": 420,
    "tags": ["formula", "linear"],
    "createdAt": "2025-01-26T10:15:00Z"
  }
]
```

---

#### Scenario 5: Mark Note as Favorite
**Endpoint:** `PUT /api/notes/{noteId}/favorite`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
{
  "id": 50,
  "isFavorite": true,
"message": "Note marked as favorite"
}
```

---

#### Scenario 6: Get Favorite Notes
**Endpoint:** `GET /api/notes/favorites`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
[
  {
    "id": 50,
    "lessonTitle": "Quadratic Equations",
    "content": "Important formula: x = (-b ± √(b² - 4ac)) / 2a",
    "videoTimestamp": 720,
    "tags": ["formula", "quadratic", "important"],
    "createdAt": "2025-01-25T14:30:00Z"
  }
]
```

---

#### Scenario 7: Update Note
**Endpoint:** `PUT /api/notes/{noteId}`
**Authorization:** Bearer Token (Student)

**Request:**
```json
{
  "content": "Updated: Quadratic formula x = (-b ± √(b² - 4ac)) / 2a. Don't forget the ± sign!",
  "tags": ["formula", "quadratic", "important", "exam"]
}
```

**Response (Success - 200):**
```json
{
  "id": 50,
  "content": "Updated: Quadratic formula x = (-b ± √(b² - 4ac)) / 2a. Don't forget the ± sign!",
  "tags": ["formula", "quadratic", "important", "exam"],
  "updatedAt": "2025-01-25T15:00:00Z",
  "message": "Note updated successfully"
}
```

---

#### Scenario 8: Delete Note
**Endpoint:** `DELETE /api/notes/{noteId}`
**Authorization:** Bearer Token (Student)

**Response (Success - 204):** No Content

---

### Student Bookmarks System

#### Scenario 1: Bookmark Lesson
**Endpoint:** `POST /api/bookmarks`
**Authorization:** Bearer Token (Student)

**Request:**
```json
{
  "lessonId": 15,
  "videoTimestamp": 720,
  "notes": "Review this section before exam"
}
```

**Response (Success - 201):**
```json
{
  "id": 30,
  "studentId": 10,
  "lessonId": 15,
  "lessonTitle": "Quadratic Equations",
  "videoTimestamp": 720,
  "notes": "Review this section before exam",
  "createdAt": "2025-01-25T14:30:00Z"
}
```

---

#### Scenario 2: Get All Bookmarks
**Endpoint:** `GET /api/bookmarks`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
[
  {
    "id": 30,
    "studentId": 10,
    "lessonId": 15,
    "lessonTitle": "Quadratic Equations",
    "lessonPosterUrl": "https://res.cloudinary.com/...",
    "videoTimestamp": 720,
    "notes": "Review this section before exam",
    "createdAt": "2025-01-25T14:30:00Z"
  },
  {
    "id": 31,
    "studentId": 10,
    "lessonId": 16,
    "lessonTitle": "Linear Equations",
    "lessonPosterUrl": "https://res.cloudinary.com/...",
    "videoTimestamp": 0,
    "notes": "Start from beginning",
  "createdAt": "2025-01-26T10:00:00Z"
  }
]
```

---

#### Scenario 3: Get Bookmarks for Lesson
**Endpoint:** `GET /api/bookmarks/lesson/{lessonId}`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
[
  {
    "id": 30,
    "videoTimestamp": 720,
    "notes": "Review this section before exam",
    "createdAt": "2025-01-25T14:30:00Z"
  }
]
```

---

#### Scenario 4: Check if Lesson is Bookmarked
**Endpoint:** `GET /api/bookmarks/check/{lessonId}`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
{
  "isBookmarked": true,
  "bookmarkId": 30
}
```

---

#### Scenario 5: Toggle Bookmark (Add/Remove)
**Endpoint:** `POST /api/bookmarks/toggle/{lessonId}`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
{
  "isBookmarked": true,
  "bookmarkId": 30,
  "message": "Lesson bookmarked successfully"
}
```

**Or if removing:**
```json
{
  "isBookmarked": false,
  "bookmarkId": null,
  "message": "Bookmark removed successfully"
}
```

---

#### Scenario 6: Delete Bookmark
**Endpoint:** `DELETE /api/bookmarks/{bookmarkId}`
**Authorization:** Bearer Token (Student)

**Response (Success - 204):** No Content

---

### Bunny.net Video Integration

#### Scenario 1: Admin Uploads Video to Bunny.net
**Endpoint:** `POST /api/lessons`
**Authorization:** Bearer Token (Admin)
**Content-Type:** multipart/form-data

**Request:**
```
title: "Advanced Algebra Concepts"
description: "Learn advanced algebraic techniques"
weekId: 5
videoFile: (binary file - MP4/MOV/AVI)
posterFile: (binary image file)
```

**Response (Success - 201):**
```json
{
  "id": 25,
  "title": "Advanced Algebra Concepts",
  "description": "Learn advanced algebraic techniques",
  "weekId": 5,
  "videoUrl": "https://vz-9161a4ae-e6d.b-cdn.net/abc-123-def/playlist.m3u8",
  "videoProvider": "BunnyStream",
  "videoDuration": 1800,
  "bunnyVideoId": "abc-123-def-456",
  "thumbnailUrl": "https://vz-9161a4ae-e6d.b-cdn.net/abc-123-def/thumbnail.jpg",
  "posterUrl": "https://res.cloudinary.com/...",
  "videoStatus": "processing",
  "message": "Video uploaded successfully. Processing in progress."
}
```

**Video Status Values:**
- `queued`: Video uploaded, waiting in queue
- `processing`: Video being transcoded
- `encoding`: Video being encoded to multiple resolutions
- `finished`: Video ready for playback ✅
- `error`: Processing failed ❌

---

#### Scenario 2: Check Video Processing Status
**Endpoint:** `GET /api/lessons/{lessonId}/video-status`
**Authorization:** Bearer Token (Admin, Teacher)

**Response (Success - 200):**
```json
{
  "lessonId": 25,
  "videoId": "abc-123-def-456",
  "status": "finished",
  "duration": 1800,
  "size": 524288000,
  "uploadedAt": "2025-01-25T14:00:00Z",
  "playlistUrl": "https://vz-9161a4ae-e6d.b-cdn.net/abc-123-def/playlist.m3u8",
  "thumbnailUrl": "https://vz-9161a4ae-e6d.b-cdn.net/abc-123-def/thumbnail.jpg",
  "availableQualities": ["360p", "480p", "720p", "1080p"]
}
```

---

#### Scenario 3: Student Watches HLS Video
**Endpoint:** `GET /api/lessons/{lessonId}`
**Authorization:** Bearer Token (Student)

**Response (Success - 200):**
```json
{
  "id": 25,
  "title": "Advanced Algebra Concepts",
  "description": "Learn advanced algebraic techniques",
  "weekId": 5,
  "videoUrl": "https://vz-9161a4ae-e6d.b-cdn.net/abc-123-def/playlist.m3u8",
  "videoProvider": "BunnyStream",
  "videoDuration": 1800,
  "videoStatus": "finished",
  "thumbnailUrl": "https://vz-9161a4ae-e6d.b-cdn.net/abc-123-def/thumbnail.jpg",
  "posterUrl": "https://res.cloudinary.com/...",
  "supportedPlayers": ["HLS.js", "Plyr", "Video.js", "Safari Native"],
  "streamingFeatures": {
    "adaptiveBitrate": true,
    "multipleQualities": ["360p", "480p", "720p", "1080p"],
    "seekable": true,
    "downloadable": false
  }
}
```

**Frontend Implementation:**
```html
<!-- HLS Video Player -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
<link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />

<video id="player" controls poster="{thumbnailUrl}"></video>

<script>
const video = document.getElementById('player');
const source = '{videoUrl}'; // HLS playlist URL

if (Hls.isSupported()) {
  const hls = new Hls({
    enableWorker: true,
    lowLatencyMode: true,
    backBufferLength: 90
  });
  
  hls.loadSource(source);
  hls.attachMedia(video);
  
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    const player = new Plyr(video, {
      controls: ['play', 'progress', 'current-time', 'mute', 
         'volume', 'settings', 'pip', 'fullscreen'],
      settings: ['quality', 'speed']
    });
  });
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  // Safari native HLS support
  video.src = source;
  const player = new Plyr(video);
}
</script>
```

---

#### Scenario 4: Admin Updates Lesson Video
**Endpoint:** `PUT /api/lessons/{lessonId}/video`
**Authorization:** Bearer Token (Admin)
**Content-Type:** multipart/form-data

**Request:**
```
videoFile: (new binary video file)
```

**Response (Success - 200):**
```json
{
  "lessonId": 25,
  "message": "Video updated successfully",
  "newVideoId": "xyz-789-new",
  "status": "processing",
  "oldVideoDeleted": true,
  "newVideoUrl": "https://vz-9161a4ae-e6d.b-cdn.net/xyz-789-new/playlist.m3u8"
}
```

---

#### Scenario 5: Admin Deletes Lesson (with Video Cleanup)
**Endpoint:** `DELETE /api/lessons/{lessonId}`
**Authorization:** Bearer Token (Admin)

**Response (Success - 200):**
```json
{
  "message": "Lesson deleted successfully",
  "videoDeleted": true,
  "posterDeleted": true,
  "relatedDataCleaned": true
}
```

**Cleanup Process:**
1. ✅ Delete video from Bunny.net
2. ✅ Delete poster from Cloudinary
3. ✅ Delete student progress records
4. ✅ Delete lesson questions
5. ✅ Delete student notes
6. ✅ Delete bookmarks
7. ✅ Delete lesson from database

---

### New Endpoints Summary

#### Student Notes (7 endpoints):
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notes` | Create new note |
| GET | `/api/notes` | Get all my notes |
| GET | `/api/notes/lesson/{lessonId}` | Get notes for lesson |
| GET | `/api/notes/search?query={text}` | Search notes |
| GET | `/api/notes/favorites` | Get favorite notes |
| PUT | `/api/notes/{noteId}` | Update note |
| PUT | `/api/notes/{noteId}/favorite` | Toggle favorite |
| DELETE | `/api/notes/{noteId}` | Delete note |

#### Student Bookmarks (6 endpoints):
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookmarks` | Bookmark lesson |
| GET | `/api/bookmarks` | Get all bookmarks |
| GET | `/api/bookmarks/lesson/{lessonId}` | Get bookmarks for lesson |
| GET | `/api/bookmarks/check/{lessonId}` | Check if bookmarked |
| POST | `/api/bookmarks/toggle/{lessonId}` | Toggle bookmark |
| DELETE | `/api/bookmarks/{bookmarkId}` | Delete bookmark |

#### Bunny.net Video (3 endpoints):
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lessons/{lessonId}/video-status` | Check video status |
| PUT | `/api/lessons/{lessonId}/video` | Update video |
| DELETE | `/api/lessons/{lessonId}` | Delete (includes video cleanup) |

---

### Testing Checklist - Phase 2

#### Student Notes:
- [ ] Create note during lesson
- [ ] View all notes
- [ ] View notes for specific lesson
- [ ] Search notes by keyword
- [ ] Mark note as favorite
- [ ] View favorite notes only
- [ ] Update existing note
- [ ] Delete note

#### Student Bookmarks:
- [ ] Bookmark a lesson
- [ ] View all bookmarks
- [ ] View bookmarks for specific lesson
- [ ] Check if lesson is bookmarked
- [ ] Toggle bookmark (add/remove)
- [ ] Resume video from bookmarked position
- [ ] Delete bookmark

#### Bunny.net Video:
- [ ] Upload video (Admin)
- [ ] Check processing status
- [ ] Play HLS video in browser
- [ ] Test adaptive quality switching
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices
- [ ] Update existing video
- [ ] Delete lesson with video cleanup

---

### Benefits of Phase 2 Features

#### Student Notes System:
- ✅ **Take notes** while watching
- ✅ **Tag notes** for organization
- ✅ **Search notes** by keyword
- ✅ **Mark favorites** for quick access
- ✅ **Video timestamps** to jump to specific moments
- ✅ **Portable study material**

#### Bookmarks System:
- ✅ **Save favorite lessons**
- ✅ **Resume playback** from bookmarked position
- ✅ **Quick access** to important content
- ✅ **Add personal notes** to bookmarks
- ✅ **One-click toggle** bookmark on/off

#### Bunny.net Video Streaming:
- ✅ **90% cost savings** vs Cloudinary
- ✅ **Adaptive streaming** - auto-adjusts to connection speed
- ✅ **Multiple resolutions** - 360p, 480p, 720p, 1080p
- ✅ **Auto-generated thumbnails**
- ✅ **Global CDN** - fast everywhere
- ✅ **HLS standard** - works on all devices
- ✅ **No buffering** on slow connections

---

## API Changes Summary

### Phase 2 Additions:
- **20+ new endpoints** added
- **2 new entities** (StudentNote, StudentBookmark)
- **3 new services** (EmailService, StudentNoteService, StudentBookmarkService)
- **2 new controllers** (NotesController, BookmarksController)
- **1 video provider** integrated (Bunny.net)

### Total API Endpoints:
- **Phase 1:** ~100 endpoints
- **Phase 2:** +20 endpoints
- **Total:** **120+ endpoints** 🎉

---

**Document Version:** 2.0  
**Last Updated:** January 2025  
**Status:** Phase 2 Complete ✅
