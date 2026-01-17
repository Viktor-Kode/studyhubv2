# CBT API Integration Guide

## Current Status

The CBT feature is set up with a flexible API structure that can be easily connected to a real past questions API when one becomes available.

## API Structure

The API service is located at `lib/api/cbt.ts` and includes:

- `getQuestions()` - Fetch questions for a specific exam, year, and subject
- `getAvailableYears()` - Get list of available years for an exam type
- `getAvailableSubjects()` - Get list of available subjects for an exam type and year
- `getTriviaQuestions()` - Fallback using OpenTriviaDB for practice questions

## How to Integrate a Real API

When you find an API that provides Nigerian exam past questions:

1. **Update the API Base URL**
   - Set `NEXT_PUBLIC_CBT_API_URL` in your `.env.local` file
   - Or update `CBT_API_BASE` in `lib/api/cbt.ts`

2. **Update API Endpoints**
   - Replace the TODO comments in `lib/api/cbt.ts` with actual API calls
   - Ensure the API response matches the expected format:
     ```typescript
     {
       questions: CBTQuestion[],
       total: number,
       year?: string,
       subject?: string
     }
     ```

3. **Expected Question Format**
   ```typescript
   {
     id: string
     question: string
     options: string[]
     correctAnswer: number  // Index of correct option (0-3)
     explanation?: string
     subject: string
     year: string
     examType: 'WAEC' | 'JAMB' | 'POST_UTME' | 'NECO' | 'BECE'
   }
   ```

## Potential API Sources

Since no public API was found, consider:

1. **Building Your Own Backend**
   - Create an API endpoint that serves past questions
   - Store questions in a database
   - Use the existing API structure to connect

2. **Third-Party Educational APIs**
   - Check if any Nigerian educational platforms offer APIs
   - Consider partnerships with educational content providers

3. **OpenTriviaDB (Current Fallback)**
   - Currently used as a fallback for practice questions
   - Not exam-specific but provides general educational questions

## Current Implementation

- ✅ API structure ready for integration
- ✅ Year and subject selection UI
- ✅ Loading states and error handling
- ✅ Fallback to practice questions if no exam questions available
- ✅ Full CBT test functionality (timer, navigation, scoring)

## Next Steps

1. Find or create an API endpoint for Nigerian exam past questions
2. Update the API calls in `lib/api/cbt.ts`
3. Test with real data
4. Remove fallback/mock data once real API is connected
