# Backend API Documentation for StudyHelp Platform

## Overview

This document provides complete API specifications for the StudyHelp platform backend. The frontend is built with Next.js 14 and expects these endpoints to be implemented on the backend.

**Base URL**: `https://studyhelp-jk5j.onrender.com/api` (or your backend URL)

**API Version**: v1

**Content Type**: `application/json` (except file uploads which use `multipart/form-data`)

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The token is obtained from the login or registration endpoints and should be included in all authenticated requests.

**Token Format**: JWT (JSON Web Token)

**Token Storage**: Frontend stores tokens in localStorage

**Token Expiration**: Backend should handle token expiration and return 401 when expired

---

## Error Response Format

All error responses should follow this format:

```json
{
  "message": "Error description",
  "error": "Error code (optional)",
  "statusCode": 400
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 1. Authentication Endpoints

### 1.1 Register User

**Endpoint**: `POST /api/users`

**Description**: Register a new user (student or teacher)

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "student" | "teacher",
  "phone": "+2348012345678" (optional),
  "schoolName": "School Name" (optional)
}
```

**Response** (200 OK):
```json
{
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "student" | "teacher",
      "phone": "+2348012345678",
      "schoolName": "School Name",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

**Alternative Response Format** (also accepted):
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "student" | "teacher"
  },
  "token": "jwt_token_here"
}
```

**Error Responses**:
- `400` - Validation error (email already exists, invalid email format, weak password)
- `500` - Server error

---

### 1.2 Login User

**Endpoint**: `POST /api/users/login`

**Description**: Authenticate user and return JWT token

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "student" | "teacher",
      "phone": "+2348012345678",
      "schoolName": "School Name"
    },
    "token": "jwt_token_here"
  }
}
```

**Alternative Response Format** (also accepted):
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "student" | "teacher"
  },
  "token": "jwt_token_here"
}
```

**Error Responses**:
- `401` - Invalid credentials
- `400` - Missing email or password
- `500` - Server error

---

### 1.3 Get Current User

**Endpoint**: `GET /api/users/me`

**Description**: Get current authenticated user's information including role

**Authentication**: Required

**Response** (200 OK):
```json
{
  "role": "student" | "teacher",
  "id": "user_id",
  "email": "user@example.com",
  "phone": "+2348012345678",
  "schoolName": "School Name"
}
```

**Error Responses**:
- `401` - Unauthorized (invalid or missing token)
- `500` - Server error

**Note**: This endpoint is used for role verification. The frontend calls this to ensure the user's role matches the backend.

---

### 1.4 Forgot Password

**Endpoint**: `POST /api/users/forgot-password`

**Description**: Send password reset email to user

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset email sent successfully"
}
```

**Error Responses**:
- `404` - User not found
- `400` - Invalid email format
- `500` - Server error

---

### 1.5 Reset Password

**Endpoint**: `POST /api/users/reset-password`

**Description**: Reset user password using token from email

**Authentication**: Not required

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses**:
- `400` - Invalid or expired token
- `400` - Weak password
- `500` - Server error

---

## 2. Questions Endpoints

### 2.1 Get All Questions

**Endpoint**: `GET /api/questions`

**Description**: Get all questions for the authenticated user

**Authentication**: Required

**Query Parameters**: None

**Response** (200 OK):
```json
[
  {
    "id": "question_id",
    "content": "What is the capital of Nigeria?",
    "status": "pending" | "answered",
    "response": "The capital of Nigeria is Abuja." (if answered),
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Responses**:
- `401` - Unauthorized
- `500` - Server error

**Note**: 
- Students see their own questions
- Teachers see questions assigned to them or all questions (depending on implementation)

---

### 2.2 Get Question by ID

**Endpoint**: `GET /api/questions/:id`

**Description**: Get a specific question by ID

**Authentication**: Required

**URL Parameters**:
- `id` (string) - Question ID

**Response** (200 OK):
```json
{
  "id": "question_id",
  "content": "What is the capital of Nigeria?",
  "status": "pending" | "answered",
  "response": "The capital of Nigeria is Abuja." (if answered),
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `401` - Unauthorized
- `404` - Question not found
- `403` - Forbidden (user doesn't have access to this question)
- `500` - Server error

---

### 2.3 Create Question

**Endpoint**: `POST /api/questions`

**Description**: Create a new question (students only)

**Authentication**: Required

**Request Body**:
```json
{
  "content": "What is the capital of Nigeria?"
}
```

**Response** (201 Created):
```json
{
  "id": "question_id",
  "content": "What is the capital of Nigeria?",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `401` - Unauthorized
- `400` - Invalid content (empty, too short, etc.)
- `403` - Forbidden (teachers cannot create questions)
- `500` - Server error

---

### 2.4 Answer Question (Teacher Only)

**Endpoint**: `PUT /api/questions/:id` or `PATCH /api/questions/:id`

**Description**: Answer a question (teachers only)

**Authentication**: Required (Teacher role)

**URL Parameters**:
- `id` (string) - Question ID

**Request Body**:
```json
{
  "response": "The capital of Nigeria is Abuja. It became the capital in 1991, replacing Lagos."
}
```

**Response** (200 OK):
```json
{
  "id": "question_id",
  "content": "What is the capital of Nigeria?",
  "status": "answered",
  "response": "The capital of Nigeria is Abuja. It became the capital in 1991, replacing Lagos.",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `401` - Unauthorized
- `403` - Forbidden (not a teacher or question not assigned)
- `404` - Question not found
- `400` - Invalid response (empty, etc.)
- `500` - Server error

---

### 2.5 Generate Questions from PDF

**Endpoint**: `POST /api/questions/generate-from-pdf`

**Description**: Generate questions from uploaded PDF using AI (teachers only)

**Authentication**: Required (Teacher role)

**Content-Type**: `multipart/form-data`

**Request Body** (FormData):
```
pdf: File (PDF file, max 10MB)
difficulty: "easy" | "medium" | "hard" (optional)
questionType: "multiple-choice" | "fill-in-gap" | "theory" | "all" (optional)
numberOfQuestions: number (optional, default: 10)
subject: string (optional)
assessmentType: "assignment" | "mid-term" | "examination" | "classwork" (optional)
marksPerQuestion: number (optional, default: 1)
```

**Response** (200 OK):
```json
{
  "questions": [
    {
      "id": "generated_question_id",
      "question": "What is the main theme of the passage?",
      "type": "multiple-choice" | "fill-in-gap" | "theory",
      "difficulty": "easy" | "medium" | "hard",
      "subject": "English Language",
      "options": ["Option A", "Option B", "Option C", "Option D"] (for multiple-choice),
      "answer": "Correct answer" (for fill-in-gap and theory)
    }
  ],
  "message": "Questions generated successfully"
}
```

**Error Responses**:
- `401` - Unauthorized
- `403` - Forbidden (not a teacher)
- `400` - Invalid file format (not PDF)
- `400` - File too large (>10MB)
- `400` - Invalid parameters
- `500` - Server error (AI processing failed)
- `504` - Gateway timeout (processing took too long)

**Timeout**: Frontend expects this endpoint to handle long processing times (up to 2 minutes)

**Implementation Notes**:
- Extract text from PDF
- Use AI service (OpenAI, Anthropic, etc.) to generate questions
- Return questions in the specified format
- Save generated questions to database (optional)

---

## 3. CBT (Computer-Based Test) Endpoints

### 3.1 Generate Questions from Syllabus

**Endpoint**: `POST /api/cbt/generate-from-syllabus`

**Description**: Generate CBT practice questions based on exam syllabus using AI

**Authentication**: Required

**Request Body**:
```json
{
  "examType": "WAEC" | "JAMB" | "POST_UTME" | "NECO" | "BECE",
  "subject": "Mathematics" | "English Language" | "Physics" | etc.,
  "year": "2024",
  "syllabus": {
    "topics": [
      {
        "topic": "Algebra",
        "weight": 9,
        "subtopics": ["Linear equations", "Quadratic equations"]
      },
      {
        "topic": "Geometry",
        "weight": 8,
        "subtopics": ["Triangles", "Circles"]
      }
    ],
    "questionStyle": "WAEC Mathematics questions are practical and application-based, focusing on real-world problem solving.",
    "difficultyLevel": "easy" | "medium" | "hard",
    "questionFormat": "Multiple choice with 4 options (A, B, C, D). Questions test understanding and application."
  },
  "numberOfQuestions": 50
}
```

**Response** (200 OK):
```json
{
  "questions": [
    {
      "id": "question_id",
      "question": "What is the value of x in 2x + 5 = 15?",
      "options": ["5", "10", "7", "8"],
      "correctAnswer": 0,
      "explanation": "2x + 5 = 15, therefore 2x = 10, so x = 5.",
      "subject": "Mathematics",
      "year": "2024",
      "examType": "WAEC"
    }
  ],
  "total": 50,
  "year": "2024",
  "subject": "Mathematics"
}
```

**Error Responses**:
- `401` - Unauthorized
- `400` - Invalid exam type or subject
- `400` - Invalid syllabus format
- `500` - Server error (AI processing failed)
- `504` - Gateway timeout

**Timeout**: Frontend expects up to 2 minutes for processing

**Implementation Notes**:
- Use AI service to generate questions matching the exam style
- Questions must match the exam format (WAEC, JAMB, etc.)
- Each question must have exactly 4 options
- Include explanations for answers
- Questions should be culturally appropriate for Nigerian students

**AI Prompt Template**:
```
You are an expert Nigerian exam question generator. Generate {numberOfQuestions} multiple-choice questions for {examType} {subject} exam based on the following syllabus:

EXAM TYPE: {examType}
SUBJECT: {subject}
YEAR: {year}

SYLLABUS TOPICS:
{topics.map(t => `- ${t.topic} (Weight: ${t.weight}/10)`).join('\n')}

QUESTION STYLE: {questionStyle}
DIFFICULTY LEVEL: {difficultyLevel}
QUESTION FORMAT: {questionFormat}

REQUIREMENTS:
1. Questions must match the exact style and format of {examType} {subject} questions
2. Each question must have exactly 4 options (A, B, C, D)
3. Questions should test understanding of the syllabus topics
4. Difficulty should match {difficultyLevel} level
5. Include brief explanations for each answer
6. Questions should be practical and application-based (for WAEC) or more theoretical (for JAMB/POST UTME)
7. Ensure questions are culturally appropriate for Nigerian students

Generate the questions in JSON format.
```

---

### 3.2 Get Available Years

**Endpoint**: `GET /api/cbt/years`

**Description**: Get list of available years for an exam type

**Authentication**: Required

**Query Parameters**:
- `examType` (string, required) - "WAEC" | "JAMB" | "POST_UTME" | "NECO" | "BECE"

**Response** (200 OK):
```json
{
  "years": ["2024", "2023", "2022", "2021", "2020", ...]
}
```

**Error Responses**:
- `401` - Unauthorized
- `400` - Invalid exam type
- `500` - Server error

**Note**: Currently frontend generates this list client-side, but backend should provide this for consistency.

---

### 3.3 Get Available Subjects

**Endpoint**: `GET /api/cbt/subjects`

**Description**: Get list of available subjects for an exam type and year

**Authentication**: Required

**Query Parameters**:
- `examType` (string, required) - "WAEC" | "JAMB" | "POST_UTME" | "NECO" | "BECE"
- `year` (string, optional) - Year filter

**Response** (200 OK):
```json
{
  "subjects": [
    "Mathematics",
    "English Language",
    "Physics",
    "Chemistry",
    "Biology",
    ...
  ]
}
```

**Error Responses**:
- `401` - Unauthorized
- `400` - Invalid exam type
- `500` - Server error

**Note**: Currently frontend uses hardcoded syllabus data, but backend should provide this.

---

## 4. Data Models

### 4.1 User Model

```typescript
{
  id: string
  email: string
  password: string (hashed)
  role: "student" | "teacher"
  phone?: string
  schoolName?: string
  createdAt: Date
  updatedAt: Date
}
```

### 4.2 Question Model

```typescript
{
  id: string
  content: string
  status: "pending" | "answered"
  response?: string
  studentId: string (reference to User)
  teacherId?: string (reference to User, if answered)
  createdAt: Date
  updatedAt: Date
}
```

### 4.3 Generated Question Model (PDF/CBT)

```typescript
{
  id: string
  question: string
  type: "multiple-choice" | "fill-in-gap" | "theory"
  difficulty: "easy" | "medium" | "hard"
  subject: string
  options?: string[] (for multiple-choice)
  answer?: string (for fill-in-gap and theory)
  correctAnswer?: number (index for multiple-choice)
  explanation?: string
  examType?: "WAEC" | "JAMB" | "POST_UTME" | "NECO" | "BECE"
  year?: string
  assessmentType?: "assignment" | "mid-term" | "examination" | "classwork"
  marksPerQuestion?: number
  createdAt: Date
}
```

---

## 5. Role-Based Access Control

### Student Permissions
- ✅ Create questions
- ✅ View own questions
- ✅ View question responses
- ✅ Access CBT practice tests
- ❌ Answer questions
- ❌ Generate questions from PDF
- ❌ Access teacher dashboard

### Teacher Permissions
- ✅ Answer questions
- ✅ Generate questions from PDF
- ✅ Access teacher dashboard
- ✅ View all questions
- ❌ Create questions (as student)
- ✅ Access CBT practice tests

**Implementation**: Check user role from JWT token on protected endpoints.

---

## 6. File Upload Requirements

### PDF Upload Specifications
- **Max File Size**: 10MB
- **Allowed Format**: PDF only
- **Content-Type**: `multipart/form-data`
- **Field Name**: `pdf`

### File Processing
- Extract text from PDF
- Handle corrupted or unreadable PDFs
- Return appropriate error messages

---

## 7. AI Integration Requirements

### AI Service Options
- OpenAI GPT-4 or GPT-3.5-turbo
- Anthropic Claude
- Google Gemini
- Any other LLM service

### Required AI Capabilities
1. **Question Generation from PDF**
   - Extract key concepts from PDF
   - Generate questions matching specified type and difficulty
   - Create appropriate answer options

2. **Question Generation from Syllabus**
   - Understand exam-specific question styles
   - Generate culturally appropriate questions
   - Match difficulty levels
   - Create explanations

### AI Prompt Guidelines
- Use structured prompts with clear requirements
- Include examples of desired output format
- Specify cultural context (Nigerian education system)
- Set appropriate temperature (0.7 recommended)
- Use JSON response format when possible

---

## 8. Response Time Requirements

- **Standard Endpoints**: < 2 seconds
- **Question Generation (PDF)**: Up to 2 minutes (frontend timeout: 120s)
- **CBT Question Generation**: Up to 2 minutes (frontend timeout: 120s)
- **File Upload**: Depends on file size, but should handle 10MB files

---

## 9. CORS Configuration

Backend must allow requests from frontend origin:

```
Access-Control-Allow-Origin: https://your-frontend-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## 10. Environment Variables Needed

Backend should use these environment variables:

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=mongodb://...

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# AI Service
OPENAI_API_KEY=sk-... (or equivalent)
AI_MODEL=gpt-4 (or gpt-3.5-turbo)

# Email Service (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
SMTP_FROM=noreply@studyhelp.com

# File Upload
MAX_FILE_SIZE=10485760 (10MB in bytes)
UPLOAD_DIR=./uploads

# API
API_BASE_URL=https://your-backend-url.com/api
```

---

## 11. Testing Checklist

Before deployment, ensure:

- [ ] All authentication endpoints work correctly
- [ ] JWT tokens are properly validated
- [ ] Role-based access control is enforced
- [ ] File uploads work (PDF, max 10MB)
- [ ] AI question generation works for both PDF and syllabus
- [ ] Error responses follow the specified format
- [ ] CORS is properly configured
- [ ] Password reset email functionality works
- [ ] All endpoints return data in expected format
- [ ] Timeout handling works for long-running operations
- [ ] Database connections are properly managed
- [ ] Security best practices are followed (password hashing, SQL injection prevention, etc.)

---

## 12. Frontend Integration Notes

### API Client Configuration
- Base URL: Set via `NEXT_PUBLIC_API_URL` environment variable
- Default timeout: 30 seconds (except file uploads: 120 seconds)
- Automatic token injection via Axios interceptors
- Automatic 401 handling (redirects to login)

### Response Format Flexibility
The frontend handles multiple response formats for authentication:
- `{ data: { user, token } }`
- `{ user, token }`
- `{ data: { data: { user, token } } }`

This flexibility allows for different backend implementations.

### Error Handling
Frontend expects error responses in this format:
```json
{
  "message": "Error description"
}
```

Or:
```json
{
  "error": "Error description"
}
```

---

## 13. Additional Notes

1. **Database**: Use any database (MongoDB, PostgreSQL, MySQL, etc.) - frontend doesn't care
2. **Framework**: Use any backend framework (Express, FastAPI, Django, etc.)
3. **File Storage**: Store uploaded PDFs temporarily or permanently (your choice)
4. **Question Storage**: Decide whether to store generated questions in database or return them only
5. **Caching**: Consider caching frequently accessed data (syllabi, exam types, etc.)
6. **Rate Limiting**: Implement rate limiting to prevent abuse
7. **Logging**: Log all API requests for debugging and monitoring
8. **Monitoring**: Set up monitoring for AI API usage and costs

### Third-Party Services Used by Frontend

**OpenTriviaDB** (Frontend Direct Integration):
- The frontend uses OpenTriviaDB as a fallback for practice questions when the backend CBT endpoint is unavailable
- This is called directly from the frontend: `https://opentdb.com/api.php`
- **No backend endpoint needed** - this is a frontend-only fallback
- The backend should implement `/api/cbt/generate-from-syllabus` to replace this fallback

**Note**: All other API calls go through your backend. OpenTriviaDB is the only external service called directly from the frontend.

---

## 14. Support

For questions or clarifications about API requirements, contact the frontend developer.

**Last Updated**: 2024

**API Version**: 1.0

---

## Quick Reference: All Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users` | No | Register user |
| POST | `/api/users/login` | No | Login user |
| GET | `/api/users/me` | Yes | Get current user |
| POST | `/api/users/forgot-password` | No | Request password reset |
| POST | `/api/users/reset-password` | No | Reset password |
| GET | `/api/questions` | Yes | Get all questions |
| GET | `/api/questions/:id` | Yes | Get question by ID |
| POST | `/api/questions` | Yes | Create question |
| PUT/PATCH | `/api/questions/:id` | Yes (Teacher) | Answer question |
| POST | `/api/questions/generate-from-pdf` | Yes (Teacher) | Generate questions from PDF |
| POST | `/api/cbt/generate-from-syllabus` | Yes | Generate CBT questions |
| GET | `/api/cbt/years` | Yes | Get available years |
| GET | `/api/cbt/subjects` | Yes | Get available subjects |

---

---

## 15. Optional Features (Currently Using localStorage)

The following features are currently implemented with localStorage but would benefit from backend support for data persistence, multi-device sync, and better user experience. These are **optional** for MVP but recommended for production.

### 15.1 Study Timer & Sessions

**Current Implementation**: Uses localStorage to track study sessions, streaks, and completed sessions.

**Optional Endpoints**:

#### Save Study Session
**Endpoint**: `POST /api/study-sessions`

**Request Body**:
```json
{
  "duration": 25,
  "type": "pomodoro" | "custom",
  "completedAt": "2024-01-01T10:00:00.000Z"
}
```

**Response** (201 Created):
```json
{
  "id": "session_id",
  "duration": 25,
  "type": "pomodoro",
  "completedAt": "2024-01-01T10:00:00.000Z",
  "streak": 5,
  "totalSessions": 42
}
```

#### Get Study Statistics
**Endpoint**: `GET /api/study-sessions/stats`

**Response** (200 OK):
```json
{
  "totalSessions": 42,
  "totalHours": 17.5,
  "currentStreak": 5,
  "longestStreak": 12,
  "sessionsThisWeek": 7,
  "sessionsThisMonth": 20
}
```

#### Get Study Sessions
**Endpoint**: `GET /api/study-sessions`

**Query Parameters**:
- `startDate` (optional) - Filter from date
- `endDate` (optional) - Filter to date
- `limit` (optional) - Number of results

**Response** (200 OK):
```json
{
  "sessions": [
    {
      "id": "session_id",
      "duration": 25,
      "type": "pomodoro",
      "completedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "total": 42
}
```

---

### 15.2 Study Reminders

**Current Implementation**: Uses localStorage to store reminders.

**Optional Endpoints**:

#### Get All Reminders
**Endpoint**: `GET /api/reminders`

**Response** (200 OK):
```json
[
  {
    "id": "reminder_id",
    "title": "Math Assignment Due",
    "date": "2024-01-15",
    "time": "23:59",
    "type": "deadline" | "study" | "exam",
    "whatsappNumber": "+2348012345678",
    "sendWhatsApp": true,
    "timetableId": "timetable_id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Reminder
**Endpoint**: `POST /api/reminders`

**Request Body**:
```json
{
  "title": "Math Assignment Due",
  "date": "2024-01-15",
  "time": "23:59",
  "type": "deadline",
  "whatsappNumber": "+2348012345678",
  "sendWhatsApp": true,
  "timetableId": "timetable_id"
}
```

**Response** (201 Created):
```json
{
  "id": "reminder_id",
  "title": "Math Assignment Due",
  "date": "2024-01-15",
  "time": "23:59",
  "type": "deadline",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Reminder
**Endpoint**: `PUT /api/reminders/:id`

#### Delete Reminder
**Endpoint**: `DELETE /api/reminders/:id`

---

### 15.3 CGPA Calculator

**Current Implementation**: Uses localStorage to store courses and grades.

**Optional Endpoints**:

#### Save CGPA Data
**Endpoint**: `POST /api/cgpa`

**Request Body**:
```json
{
  "courses": [
    {
      "name": "Mathematics",
      "creditHours": 3,
      "grade": "A",
      "gradePoint": 4.0
    }
  ],
  "targetCGPA": 4.0,
  "semester": "Fall 2024"
}
```

**Response** (201 Created):
```json
{
  "id": "cgpa_id",
  "currentCGPA": 3.75,
  "targetCGPA": 4.0,
  "courses": [...],
  "semester": "Fall 2024",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get CGPA History
**Endpoint**: `GET /api/cgpa`

**Response** (200 OK):
```json
[
  {
    "id": "cgpa_id",
    "currentCGPA": 3.75,
    "targetCGPA": 4.0,
    "semester": "Fall 2024",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 15.4 Timetable/Schedule

**Current Implementation**: Uses localStorage to store schedules.

**Optional Endpoints**:

#### Get Timetable
**Endpoint**: `GET /api/timetable`

**Response** (200 OK):
```json
{
  "schedules": [
    {
      "id": "schedule_id",
      "title": "Mathematics",
      "course": "MATH 201",
      "day": "Monday",
      "time": "09:00",
      "location": "Room 101",
      "type": "lecture" | "lab" | "tutorial" | "exam"
    }
  ]
}
```

#### Create Schedule Item
**Endpoint**: `POST /api/timetable`

**Request Body**:
```json
{
  "title": "Mathematics",
  "course": "MATH 201",
  "day": "Monday",
  "time": "09:00",
  "location": "Room 101",
  "type": "lecture"
}
```

#### Update Schedule Item
**Endpoint**: `PUT /api/timetable/:id`

#### Delete Schedule Item
**Endpoint**: `DELETE /api/timetable/:id`

#### Generate Timetable
**Endpoint**: `POST /api/timetable/generate`

**Request Body**:
```json
{
  "subjects": [
    {
      "name": "Mathematics",
      "hoursPerWeek": 4,
      "difficulty": "medium",
      "preferredDays": ["Monday", "Wednesday"],
      "preferredTimes": ["09:00", "14:00"]
    }
  ],
  "startTime": "08:00",
  "endTime": "20:00",
  "breakDuration": 15,
  "studySessionDuration": 2,
  "daysPerWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
}
```

**Response** (200 OK):
```json
{
  "schedules": [
    {
      "id": "schedule_id",
      "title": "Mathematics",
      "day": "Monday",
      "time": "09:00",
      "location": "Study Area",
      "type": "tutorial"
    }
  ]
}
```

---

### 15.5 Flash Cards (Flip Cards)

**Current Implementation**: Uses localStorage to store flashcards.

**Optional Endpoints**:

#### Get Flash Cards
**Endpoint**: `GET /api/flashcards`

**Query Parameters**:
- `category` (optional) - Filter by category

**Response** (200 OK):
```json
[
  {
    "id": "card_id",
    "front": "What is React?",
    "back": "React is a JavaScript library for building user interfaces.",
    "category": "Programming",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Flash Card
**Endpoint**: `POST /api/flashcards`

**Request Body**:
```json
{
  "front": "What is React?",
  "back": "React is a JavaScript library for building user interfaces.",
  "category": "Programming"
}
```

#### Update Flash Card
**Endpoint**: `PUT /api/flashcards/:id`

#### Delete Flash Card
**Endpoint**: `DELETE /api/flashcards/:id`

---

### 15.6 Teacher Classes Management

**Current Implementation**: Uses localStorage to store classes, students, assignments, and announcements.

**Optional Endpoints**:

#### Get All Classes
**Endpoint**: `GET /api/classes`

**Response** (200 OK):
```json
[
  {
    "id": "class_id",
    "name": "Mathematics 101",
    "subject": "Mathematics",
    "studentCount": 25,
    "questionsGenerated": 150,
    "description": "Introduction to Mathematics",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Class
**Endpoint**: `POST /api/classes`

**Request Body**:
```json
{
  "name": "Mathematics 101",
  "subject": "Mathematics",
  "description": "Introduction to Mathematics"
}
```

#### Get Class Details
**Endpoint**: `GET /api/classes/:id`

**Response** (200 OK):
```json
{
  "id": "class_id",
  "name": "Mathematics 101",
  "subject": "Mathematics",
  "studentCount": 25,
  "description": "Introduction to Mathematics",
  "students": [
    {
      "id": "student_id",
      "name": "John Doe",
      "email": "john@example.com",
      "studentId": "STU001",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "schedule": [
    {
      "day": "Monday",
      "time": "09:00",
      "location": "Room 101"
    }
  ],
  "assignments": [
    {
      "id": "assignment_id",
      "title": "Algebra Assignment",
      "type": "assignment",
      "dueDate": "2024-01-15",
      "totalMarks": 100,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "announcements": [
    {
      "id": "announcement_id",
      "title": "Class Cancelled",
      "message": "Class is cancelled for this week",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Update Class
**Endpoint**: `PUT /api/classes/:id`

#### Delete Class
**Endpoint**: `DELETE /api/classes/:id`

#### Add Student to Class
**Endpoint**: `POST /api/classes/:id/students`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "studentId": "STU001"
}
```

#### Remove Student from Class
**Endpoint**: `DELETE /api/classes/:id/students/:studentId`

#### Add Assignment to Class
**Endpoint**: `POST /api/classes/:id/assignments`

**Request Body**:
```json
{
  "title": "Algebra Assignment",
  "type": "assignment",
  "dueDate": "2024-01-15",
  "totalMarks": 100
}
```

#### Add Announcement to Class
**Endpoint**: `POST /api/classes/:id/announcements`

**Request Body**:
```json
{
  "title": "Class Cancelled",
  "message": "Class is cancelled for this week"
}
```

---

### 15.7 Progress Analytics

**Current Implementation**: Uses data from localStorage (study sessions, questions, etc.)

**Optional Endpoint**:

#### Get Analytics
**Endpoint**: `GET /api/analytics`

**Query Parameters**:
- `startDate` (optional)
- `endDate` (optional)
- `type` (optional) - "study" | "questions" | "cgpa" | "all"

**Response** (200 OK):
```json
{
  "studyStats": {
    "totalHours": 45.5,
    "totalSessions": 120,
    "currentStreak": 7,
    "averageSessionDuration": 25
  },
  "questionStats": {
    "totalQuestions": 50,
    "answeredQuestions": 45,
    "pendingQuestions": 5,
    "averageResponseTime": "2.5 hours"
  },
  "cgpaStats": {
    "currentCGPA": 3.75,
    "targetCGPA": 4.0,
    "trend": "increasing"
  },
  "activityTimeline": [
    {
      "date": "2024-01-01",
      "sessions": 3,
      "questions": 2
    }
  ]
}
```

---

### 15.8 Teacher Generated Questions Storage

**Current Implementation**: Uses localStorage to store generated questions.

**Optional Endpoints**:

#### Save Generated Questions
**Endpoint**: `POST /api/questions/save-generated`

**Request Body**:
```json
{
  "questions": [
    {
      "question": "What is...?",
      "type": "multiple-choice",
      "difficulty": "medium",
      "subject": "Mathematics",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "marks": 5,
      "assessmentType": "assignment"
    }
  ],
  "classId": "class_id"
}
```

#### Get Saved Generated Questions
**Endpoint**: `GET /api/questions/generated`

**Query Parameters**:
- `classId` (optional)
- `subject` (optional)
- `type` (optional)
- `difficulty` (optional)

**Response** (200 OK):
```json
{
  "questions": [...],
  "total": 150
}
```

---

## 16. Notes on Optional Features

### Priority Levels

**Critical (Required for MVP)**:
- ✅ Authentication endpoints
- ✅ Questions endpoints (create, get, answer)
- ✅ PDF question generation
- ✅ CBT question generation

**Important (Recommended)**:
- ⚠️ Study sessions tracking
- ⚠️ Reminders
- ⚠️ Teacher classes management
- ⚠️ Generated questions storage

**Nice to Have (Can be added later)**:
- 💡 CGPA calculator backend
- 💡 Timetable backend
- 💡 Flash cards backend
- 💡 Analytics aggregation

### Implementation Strategy

1. **Phase 1 (MVP)**: Implement critical endpoints only
2. **Phase 2**: Add important features (study sessions, reminders, classes)
3. **Phase 3**: Add nice-to-have features (CGPA, timetable, flashcards)

### Data Migration

When implementing backend for localStorage features:
- Frontend will check for backend data first
- Fall back to localStorage if backend unavailable
- Provide migration utility to move localStorage data to backend

---

**End of Documentation**
