# Study Guide Loader Component

A modern, elegant loading animation for an AI study assistant with multiple animated components.

## Features

- **Animated Header Text**: "Crafting your study guide" with character-by-character typing effect and gradient colors per word
- **Circular Progress Indicator**: 8 dots around circumference that light up sequentially, then converge to center forming a checkmark
- **Background Animation**: Subtle moving gradient with geometric shapes (circles, triangles) fading in/out
- **Skeleton Loading**: Content preview skeleton with shimmer effect (like Medium/Notion)
- **Interactive Elements**: Time remaining countdown, tooltip, and pulsing action button
- **Accessibility**: Supports reduced motion preferences
- **Responsive**: Mobile-first design

## Usage

```tsx
import StudyGuideLoader from '@/components/loading/StudyGuideLoader'

// Basic usage
<StudyGuideLoader />

// With custom duration and network speed
<StudyGuideLoader 
  duration={3} 
  networkSpeed="medium" 
  onComplete={() => console.log('Loading complete!')}
/>

// Fast network simulation
<StudyGuideLoader 
  duration={2} 
  networkSpeed="fast" 
/>

// Slow network simulation
<StudyGuideLoader 
  duration={4} 
  networkSpeed="slow" 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `duration` | `number` | `3` | Duration in seconds (2-4 recommended) |
| `networkSpeed` | `'fast' \| 'medium' \| 'slow'` | `'medium'` | Affects typing animation speed |
| `onComplete` | `() => void` | `undefined` | Callback when loading completes |

## Technical Details

- Built with React + TypeScript
- Uses Tailwind CSS for styling
- CSS keyframes for performance
- Supports dark mode
- Reduced motion support via `prefers-reduced-motion` media query

## Animation Timeline

1. **0-1s**: Text typing animation begins
2. **0-3s**: Progress dots light up sequentially
3. **0-3s**: Skeleton content appears with shimmer
4. **3s**: Dots converge to center, checkmark appears
5. **3.5s**: Action button appears with pulse animation
