# Study Help MVP - Frontend

A modern Next.js frontend application for the Study Help MVP, allowing students to submit questions and receive answers from tutors.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: Axios
- **Language**: TypeScript

## Features

- ✅ Student authentication (signup/login)
- ✅ Question submission
- ✅ Question list with status tracking
- ✅ Question detail view with responses
- ✅ Protected routes
- ✅ Responsive design

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file (copy from `.env.example`):
```bash
cp .env.example .env.local
```

3. Update the API URL in `.env.local` to match your backend:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── dashboard/          # Dashboard page
│   ├── login/              # Login page
│   ├── questions/[id]/     # Question detail page
│   ├── signup/             # Sign up page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── components/
│   ├── Navbar.tsx          # Navigation component
│   └── ProtectedRoute.tsx  # Route protection wrapper
├── lib/
│   ├── api/
│   │   ├── auth.ts         # Auth API endpoints
│   │   ├── client.ts       # Axios client configuration
│   │   └── questions.ts    # Questions API endpoints
│   └── store/
│       └── authStore.ts    # Zustand auth store
└── package.json
```

## API Endpoints

The frontend expects the following API endpoints:

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /questions` - Get all questions (authenticated)
- `POST /questions` - Create a question (authenticated)
- `GET /questions/:id` - Get question by ID (authenticated)

All authenticated endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

## Authentication

- JWT tokens are stored in localStorage using Zustand's persist middleware
- Tokens are automatically included in API requests via Axios interceptors
- 401 responses automatically redirect to the login page

## Error Handling

- All API errors are caught and displayed to users with readable messages
- Loading states are shown during API calls
- Form validation provides immediate feedback

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Notes

- This is an MVP implementation focused on student workflows
- Tutor workflows are not implemented (Phase 2)
- Payment handling is not included
- Data validation is limited to basic form checks
