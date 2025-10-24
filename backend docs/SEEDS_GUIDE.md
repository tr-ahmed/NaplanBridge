# ?? ???? ???????? ????????? (Seeds) - NaplanBridge

## ?? ???? ????

?? ????? ?????? ??????? ????? ????? Entities ?? ?????? ?????? ??????? ?????????.

---

## ?? ???????? ???????? (Users & Roles)

### 1. Admin Account
```json
{
  "email": "admin@naplan.edu",
  "password": "Admin@123",
  "username": "admin",
  "roles": ["Admin", "Member"]
}
```

---

### 2. Teachers (3 ??????)

#### Teacher 1 - Mathematics
```json
{
  "email": "john.smith@naplan.edu",
  "password": "Teacher@123",
  "username": "john_smith",
  "roles": ["Teacher", "Member"],
  "subjects": ["Algebra", "Geometry"],
  "sessionPrice": 50.00,
  "availability": "Monday to Friday, 9 AM - 5 PM"
}
```

#### Teacher 2 - Science
```json
{
  "email": "sarah.jones@naplan.edu",
  "password": "Teacher@123",
  "username": "sarah_jones",
  "roles": ["Teacher", "Member"],
  "subjects": ["Physics", "Chemistry"],
  "sessionPrice": 45.00,
  "availability": "Monday, Wednesday, Friday, 10 AM - 6 PM"
}
```

#### Teacher 3 - English
```json
{
  "email": "mike.brown@naplan.edu",
  "password": "Teacher@123",
  "username": "mike_brown",
  "roles": ["Teacher", "Member"],
  "subjects": ["Reading", "Writing"],
  "sessionPrice": 55.00
}
```

---

### 3. Parents (3 ?????? ????)

#### Parent 1
```json
{
  "email": "parent1@example.com",
  "password": "Parent@123",
  "username": "ahmed_ali",
  "roles": ["Parent", "Member"],
  "students": ["ali_ahmed", "maryam_hassan"]
}
```

#### Parent 2
```json
{
  "email": "parent2@example.com",
  "password": "Parent@123",
  "username": "fatima_hassan",
  "roles": ["Parent", "Member"],
  "students": ["omar_mohammed", "fatima_ali"]
}
```

#### Parent 3
```json
{
  "email": "parent3@example.com",
  "password": "Parent@123",
  "username": "mohammed_omar",
  "roles": ["Parent", "Member"],
  "students": ["sara_ibrahim", "youssef_khalil"]
}
```

---

### 4. Students (6 ????)

#### Year 7 Students
```json
[
  {
    "email": "ali_ahmed@naplan.edu",
    "password": "Student@123",
  "username": "ali_ahmed",
    "roles": ["Student", "Member"],
  "year": 7,
    "parent": "parent1@example.com"
  },
  {
    "email": "maryam_hassan@naplan.edu",
    "password": "Student@123",
    "username": "maryam_hassan",
    "roles": ["Student", "Member"],
    "year": 7,
    "parent": "parent1@example.com"
  }
]
```

#### Year 8 Students
```json
[
  {
  "email": "omar_mohammed@naplan.edu",
  "password": "Student@123",
 "username": "omar_mohammed",
    "roles": ["Student", "Member"],
    "year": 8,
    "parent": "parent2@example.com"
  },
  {
    "email": "fatima_ali@naplan.edu",
    "password": "Student@123",
    "username": "fatima_ali",
    "roles": ["Student", "Member"],
    "year": 8,
    "parent": "parent2@example.com"
  }
]
```

#### Year 9 Students
```json
[
  {
 "email": "sara_ibrahim@naplan.edu",
    "password": "Student@123",
    "username": "sara_ibrahim",
    "roles": ["Student", "Member"],
  "year": 9,
    "parent": "parent3@example.com"
  },
  {
    "email": "youssef_khalil@naplan.edu",
    "password": "Student@123",
    "username": "youssef_khalil",
    "roles": ["Student", "Member"],
    "year": 9,
    "parent": "parent3@example.com"
  }
]
```

---

## ?? ?????? ???????? (Subjects)

### Categories (5 ????)
1. **Mathematics**: Algebra, Geometry, Statistics, Calculus
2. **Science**: Physics, Chemistry, Biology, Earth Science
3. **English**: Reading, Writing, Grammar, Literature
4. **Languages**: Arabic, French, Spanish
5. **Social Studies**: History, Geography, Civics

---

### Years (6 ????? ??????)
- Year 7 (Middle School)
- Year 8 (Middle School)
- Year 9 (High School)
- Year 10 (High School)
- Year 11 (Senior School)
- Year 12 (Senior School)

---

### Subjects (9 ????)

#### Year 7 Subjects
```json
[
  {
    "subject": "Algebra",
    "year": 7,
    "originalPrice": 149.99,
    "price": 99.99,
    "discount": 33,
    "level": "Beginner",
  "duration": 120,
    "terms": 4,
    "weeks": 48,
    "lessons": 30
  },
  {
    "subject": "Physics",
    "year": 7,
    "originalPrice": 129.99,
    "price": 99.99,
    "discount": 23,
    "level": "Beginner",
    "duration": 100
  },
  {
    "subject": "Reading Comprehension",
 "year": 7,
    "originalPrice": 99.99,
    "price": 79.99,
    "discount": 20,
    "level": "Beginner",
    "duration": 80
  }
]
```

#### Year 8 Subjects
```json
[
  {
    "subject": "Algebra",
    "year": 8,
    "price": 109.99,
    "level": "Intermediate"
  },
  {
    "subject": "Geometry",
    "year": 8,
    "price": 109.99,
    "level": "Intermediate"
  },
{
    "subject": "Chemistry",
    "year": 8,
    "price": 99.99,
 "level": "Intermediate"
  }
]
```

#### Year 9 Subjects
```json
[
  {
    "subject": "Algebra",
    "year": 9,
    "price": 119.99,
    "level": "Advanced"
  },
  {
 "subject": "Physics",
    "year": 9,
    "price": 119.99,
    "level": "Advanced"
  },
  {
    "subject": "Creative Writing",
    "year": 9,
    "price": 89.99,
    "level": "Advanced"
  }
]
```

---

## ?? ?????? ????????

### Structure
```
Subject
??? Terms (4)
    ??? Weeks (12 per term = 48 total)
     ??? Lessons (3 per week = 30 for first 10 weeks)
      ??? Resources (2-3 per lesson)
            ??? Lesson Questions (2 per lesson)
```

### Example: Algebra Year 7
- **4 Terms** (90 days each)
  - **Term 1**: Jan 1 - Mar 28
  - **Term 2**: Apr 1 - Jun 28
  - **Term 3**: Jul 1 - Sep 28
  - **Term 4**: Oct 1 - Dec 28

- **48 Weeks** (12 per term)

- **30 Lessons** (first 10 weeks seeded)
  - Videos: 30-45 minutes each
  - Resources: PDF worksheets and practice problems

- **20 Lesson Questions**
  - Multiple Choice
  - Multiple Select

---

## ?? ??? ???????? (Subscription Plans)

?? ????? 4 ??? ?? Algebra Year 7:

### Plan 1: Single Term
```json
{
"name": "Algebra Year 7 - Term 1",
  "planType": "SingleTerm",
"price": 29.99,
  "duration": 90,
  "subjectId": "Algebra Year 7",
  "termId": "Term 1"
}
```

### Plan 2: Multi-Term
```json
{
  "name": "Algebra Year 7 - Term 1 & 2",
  "planType": "MultiTerm",
  "price": 49.99,
  "duration": 180,
  "subjectId": "Algebra Year 7",
  "includedTermIds": "1,2"
}
```

### Plan 3: Subject Annual
```json
{
  "name": "Algebra Year 7 - Full Year",
  "planType": "SubjectAnnual",
  "price": 89.99,
  "duration": 365,
  "subjectId": "Algebra Year 7"
}
```

### Plan 4: Full Year
```json
{
  "name": "Year 7 - All Subjects",
  "planType": "FullYear",
  "price": 299.99,
  "duration": 365,
  "yearId": "Year 7"
}
```

---

## ?? ?????????? (Exams)

?? ????? 4 ????? ?? ?????????? ?? Algebra Year 7:

### 1. Lesson Exam
```json
{
  "title": "Lesson 1 Quick Quiz",
  "examType": "Lesson",
  "subjectId": "Algebra Year 7",
  "lessonId": "Lesson 1",
  "duration": 15,
  "totalMarks": 20,
  "passingMarks": 12,
  "questions": 4
}
```

### 2. Monthly Exam
```json
{
  "title": "Month 1 Assessment",
  "examType": "Monthly",
  "subjectId": "Algebra Year 7",
  "weekId": "Week 1",
  "duration": 60,
  "totalMarks": 50,
  "passingMarks": 30,
  "startDate": "+30 days"
}
```

### 3. Term Exam
```json
{
  "title": "Term 1 Final Exam",
  "examType": "Term",
  "subjectId": "Algebra Year 7",
  "termId": "Term 1",
  "duration": 120,
  "totalMarks": 100,
  "passingMarks": 50,
  "startDate": "+90 days"
}
```

### 4. Year Exam
```json
{
  "title": "Algebra Year 7 Final Exam",
  "examType": "Year",
  "subjectId": "Algebra Year 7",
  "duration": 180,
  "totalMarks": 150,
  "passingMarks": 75,
  "startDate": "+365 days"
}
```

---

## ? ????? ??????? (Question Types)

### 1. Multiple Choice
```json
{
  "questionText": "What is 5 + 3?",
  "questionType": "MultipleChoice",
  "marks": 5,
  "options": [
    { "text": "7", "isCorrect": false },
    { "text": "8", "isCorrect": true },
    { "text": "9", "isCorrect": false },
    { "text": "10", "isCorrect": false }
  ]
}
```

### 2. Multiple Select
```json
{
  "questionText": "Select all even numbers",
  "questionType": "MultipleSelect",
  "marks": 5,
  "options": [
    { "text": "2", "isCorrect": true },
    { "text": "3", "isCorrect": false },
    { "text": "4", "isCorrect": true },
    { "text": "6", "isCorrect": true }
  ]
}
```

### 3. Text Question
```json
{
  "questionText": "Explain the concept of variables in algebra",
  "questionType": "Text",
  "marks": 10
}
```

### 4. True/False
```json
{
  "questionText": "The square root of 16 is 4",
  "questionType": "TrueFalse",
  "marks": 2,
  "options": [
    { "text": "True", "isCorrect": true },
    { "text": "False", "isCorrect": false }
  ]
}
```

---

## ?? ????????? (Achievements)

?? ????? 8 ???????:

```json
[
  {
    "name": "First Lesson Complete",
    "description": "Complete your first lesson",
    "points": 10,
    "category": "Progress"
  },
  {
    "name": "Perfect Score",
    "description": "Get 100% on any exam",
    "points": 50,
  "category": "Exam"
  },
  {
    "name": "Week Warrior",
    "description": "Complete all lessons in a week",
    "points": 25,
    "category": "Progress"
  },
  {
    "name": "Term Champion",
    "description": "Complete all lessons in a term",
    "points": 100,
    "category": "Progress"
  },
  {
 "name": "7 Day Streak",
    "description": "Study for 7 consecutive days",
    "points": 30,
    "category": "Streak"
  },
  {
    "name": "30 Day Streak",
    "description": "Study for 30 consecutive days",
    "points": 150,
    "category": "Streak"
  },
  {
    "name": "Quiz Master",
 "description": "Pass 10 quizzes with 80%+",
    "points": 75,
    "category": "Exam"
  },
  {
    "name": "Subject Expert",
    "description": "Complete an entire subject",
    "points": 200,
    "category": "Progress"
  }
]
```

---

## ????? ??????? ?????? (Private Sessions)

### Teacher Session Settings
```json
[
  {
    "teacher": "john.smith@naplan.edu",
    "pricePerSession": 50.00,
    "sessionDuration": 60,
    "isAcceptingBookings": true,
    "availability": "Mon-Fri, 9 AM - 5 PM"
  },
  {
    "teacher": "sarah.jones@naplan.edu",
    "pricePerSession": 45.00,
    "sessionDuration": 60,
    "isAcceptingBookings": true,
    "availability": "Mon, Wed, Fri, 10 AM - 6 PM"
  },
  {
    "teacher": "mike.brown@naplan.edu",
    "pricePerSession": 55.00,
    "sessionDuration": 60,
    "isAcceptingBookings": true
  }
]
```

---

## ?? ????? ????? ??? Seeds

### ??????? 1: ???????? ??? ????? ???????
Seeds ???? ???????? ??? ????? ??????? ???? ???.

```bash
cd API
dotnet run
```

### ??????? 2: ?????? ?? Package Manager Console
```powershell
cd API
dotnet ef database drop
dotnet ef database update
dotnet run
```

### ??????? 3: ?? Visual Studio
1. ???? **Package Manager Console**
2. ???? **API** ?? Default Project
3. ??? ???????:
```powershell
Drop-Database
Update-Database
```
4. ???? ??????? (F5)

---

## ?? ???????? ???????? ????????

| Entity | ????? |
|--------|-------|
| Roles | 5 |
| Users | 13 |
| Teachers | 3 |
| Parents | 3 |
| Students | 6 |
| Categories | 5 |
| Subject Names | 18 |
| Years | 6 |
| Subjects | 9 |
| Terms | 36 |
| Weeks | 432 |
| Lessons | 30 |
| Resources | 60 |
| Lesson Questions | 20 |
| Subscription Plans | 4 |
| Exams | 4 |
| Exam Questions | 5+ |
| Achievements | 8 |
| Teacher Session Settings | 3 |
| Teacher Availabilities | 8 |

**?????? Records**: ~700+ record

---

## ?? ?????? ??? API ?? ???????? ?????????

### 1. ????? ?????? ?? Admin
```http
POST /api/account/login
Content-Type: application/json

{
  "email": "admin@naplan.edu",
"password": "Admin@123"
}
```

### 2. ????? ?????? ?? Teacher
```http
POST /api/account/login
Content-Type: application/json

{
  "email": "john.smith@naplan.edu",
  "password": "Teacher@123"
}
```

### 3. ????? ?????? ?? Parent
```http
POST /api/account/login
Content-Type: application/json

{
  "email": "parent1@example.com",
  "password": "Parent@123"
}
```

### 4. ????? ?????? ?? Student
```http
POST /api/account/login
Content-Type: application/json

{
  "email": "ali_ahmed@naplan.edu",
  "password": "Student@123"
}
```

### 5. ?????? ??? ??????
```http
GET /api/subject
Authorization: Bearer {token}
```

### 6. ?????? ??? ??? ????????
```http
GET /api/subscriptionplans
Authorization: Bearer {token}
```

### 7. ?????? ??? ??????????
```http
GET /api/exam
Authorization: Bearer {token}
```

---

## ?? ????? ????

### 1. ????? ????? ?????? ?? Production
```csharp
// ?? Production? ?????? ????? ???? ????
// ?? ?????? "Admin@123" ?? "Teacher@123"
```

### 2. ????? Seeds ?? Production
```csharp
// ?? Program.cs? ??? ???:
if (app.Environment.IsDevelopment())
{
    await SeedData.SeedAsync(context, userManager, roleManager);
}
```

### 3. Backup ??? Re-Seeding
```bash
# ??? Backup ??? Database
sqlcmd -S server -d database -U user -P pass -Q "BACKUP DATABASE..."
```

---

## ?? Troubleshooting

### ?????: Seeds ?? ????
**????**:
```bash
# ???? ??? Database ???? ???????
dotnet ef database drop --force
dotnet ef database update
dotnet run
```

### ?????: Duplicate Key Error
**????**: Seeds ????? ?? ???? ???????? ??? ???????? ??? ??? ??? ???:
```csharp
// ?? SeedData.cs? ?? method ???? ??:
if (await context.EntityName.AnyAsync()) return;
```

### ?????: Foreign Key Constraint
**????**: ???? ?? ????? Seeds (Years ??? Subjects? Subjects ??? Terms? ???)

---

## ?? ??????? ??? ?????

| ??? | ????? |
|-----|-------|
| `API/Data/SeedData.cs` | ??? Seeds ??????? |
| `API/Program.cs` | ????? Seeds ??? ??????? |
| `API/SEEDS_GUIDE.md` | ??? ????? |

---

**??? ?????**: 2025-01-24  
**???????**: 1.0  
**??????**: Development
