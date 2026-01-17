# CBT Syllabus-Based Question Generation API

## Overview

The CBT feature now uses exam syllabi to generate standard questions that match each exam's format and style. This document explains how to implement the backend API endpoint.

## Backend API Endpoint Required

### POST `/api/cbt/generate-from-syllabus`

**Request Body:**
```json
{
  "examType": "WAEC" | "JAMB" | "POST_UTME" | "NECO" | "BECE",
  "subject": "Mathematics" | "English" | "Physics" | etc.,
  "year": "2024",
  "syllabus": {
    "topics": [
      {
        "topic": "Algebra",
        "weight": 9,
        "subtopics": ["Linear equations", "Quadratic equations"]
      }
    ],
    "questionStyle": "WAEC Mathematics questions are practical and application-based...",
    "difficultyLevel": "easy" | "medium" | "hard",
    "questionFormat": "Multiple choice with 4 options..."
  },
  "numberOfQuestions": 50
}
```

**Response:**
```json
{
  "questions": [
    {
      "id": "q1",
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

## AI Prompt Template

Use this prompt structure with your AI service (OpenAI, Anthropic, etc.):

```
You are an expert Nigerian exam question generator. Generate ${numberOfQuestions} multiple-choice questions for ${examType} ${subject} exam based on the following syllabus:

EXAM TYPE: ${examType}
SUBJECT: ${subject}
YEAR: ${year}

SYLLABUS TOPICS:
${topics.map(t => `- ${t.topic} (Weight: ${t.weight}/10)`).join('\n')}

QUESTION STYLE: ${questionStyle}
DIFFICULTY LEVEL: ${difficultyLevel}
QUESTION FORMAT: ${questionFormat}

REQUIREMENTS:
1. Questions must match the exact style and format of ${examType} ${subject} questions
2. Each question must have exactly 4 options (A, B, C, D)
3. Questions should test understanding of the syllabus topics
4. Difficulty should match ${difficultyLevel} level
5. Include brief explanations for each answer
6. Questions should be practical and application-based (for WAEC) or more theoretical (for JAMB/POST UTME)
7. Ensure questions are culturally appropriate for Nigerian students

Generate the questions in JSON format:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation"
    }
  ]
}
```

## Implementation Example (Node.js/Express)

```javascript
// routes/cbt.js
const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai'); // or your AI service

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/generate-from-syllabus', async (req, res) => {
  try {
    const { examType, subject, year, syllabus, numberOfQuestions } = req.body;

    // Build AI prompt
    const prompt = buildQuestionGenerationPrompt(
      examType,
      subject,
      year,
      syllabus,
      numberOfQuestions
    );

    // Call AI service
    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // or gpt-3.5-turbo
      messages: [
        {
          role: 'system',
          content: 'You are an expert Nigerian exam question generator. Generate accurate, syllabus-based questions matching the exam format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    
    // Transform to our format
    const questions = aiResponse.questions.map((q, index) => ({
      id: `q-${Date.now()}-${index}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      subject,
      year,
      examType,
    }));

    res.json({
      questions,
      total: questions.length,
      year,
      subject,
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ message: 'Failed to generate questions' });
  }
});

function buildQuestionGenerationPrompt(examType, subject, year, syllabus, numberOfQuestions) {
  // Build the prompt as shown above
  // ...
}
```

## Alternative: Use Existing Backend

If your backend already has AI question generation (like the PDF generation feature), you can:

1. Extend that endpoint to accept syllabus data
2. Use the same AI service but with syllabus-based prompts
3. Return questions in the CBT format

## Current Status

- ✅ Frontend is ready and calls `/api/cbt/generate-from-syllabus`
- ✅ Syllabus data is structured and available
- ⏳ Backend endpoint needs to be implemented
- ⏳ AI integration needs to be configured

## Next Steps

1. Implement the backend endpoint `/api/cbt/generate-from-syllabus`
2. Integrate with your AI service (OpenAI, Anthropic, etc.)
3. Use the syllabus data to generate exam-appropriate questions
4. Test with different exam types and subjects
5. Monitor question quality and adjust prompts as needed
