export interface LessonContent {
  analogy: string
  paragraphs: string[]
  keyConcepts: string[]
}

export interface QuizData {
  question: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
  hint: string
}

export interface LearningNode {
  id: number
  title: string
  status: 'completed' | 'active' | 'locked'
  xp: number
  duration: string
  summary: string
  keyConcepts: string[]
  lessonContent?: LessonContent
  quiz?: QuizData
  nextNodeTitle?: string
}

export interface StudyPathTopic {
  topicId: string
  title: string
  courseCode: string
  currentProgress: number
  nodes: LearningNode[]
}

export const DEFAULT_TOPIC: StudyPathTopic = {
  topicId: 'csc202-queues-deques',
  title: 'Queues & Deques',
  courseCode: 'CSC 202 - Data Structures',
  currentProgress: 3,
  nodes: [
    {
      id: 1,
      title: 'Arrays & Memory',
      status: 'completed',
      xp: 20,
      duration: '5 min',
      summary: 'Explore contiguous memory allocation, direct indexing, and spatial cache locality in modern processors.',
      keyConcepts: ['Contiguous Memory', 'Index Offsets', 'Cache Locality'],
      nextNodeTitle: 'Pointers',
      lessonContent: {
        analogy: 'Think of an array like a row of numbered lockers - every locker has a fixed address and you can jump straight to any one instantly.',
        paragraphs: [
          'An array stores elements in a single contiguous block of memory. Because elements sit side-by-side, the CPU can prefetch them into cache before your code even asks, making reads blazing fast.',
          'Each element is accessed via an index offset from the base address. Jumping to index i costs O(1) regardless of array size - no searching involved.'
        ],
        keyConcepts: ['Contiguous Memory', 'Index Offsets', 'Cache Locality']
      },
      quiz: {
        question: 'What makes array element access O(1) time complexity?',
        options: ['Elements are always sorted', 'Direct address calculation via index offset', 'A hidden hash table', 'Binary search under the hood'],
        correctAnswerIndex: 1,
        explanation: 'Arrays compute the exact memory address as base + index x element_size, so any element is reached in a single step.',
        hint: 'Think about how the CPU calculates an exact memory address without looping.'
      }
    },
    {
      id: 2,
      title: 'Pointers',
      status: 'completed',
      xp: 20,
      duration: '7 min',
      summary: 'Master address arithmetic, dynamic heap allocation, and pointer dereferencing safety.',
      keyConcepts: ['Memory Addresses', 'Dereferencing', 'Heap vs Stack'],
      nextNodeTitle: 'Stacks',
      lessonContent: {
        analogy: 'A pointer is like a sticky note saying the data you want is in room 42 - it does not hold the data, it holds the address.',
        paragraphs: [
          'A pointer stores the memory address of another variable. Dereferencing a pointer means following that address to access the actual data stored there.',
          'Heap memory is manually managed and lives until freed. Stack memory is automatically cleaned when a function returns, making lifetime management simpler for locals.'
        ],
        keyConcepts: ['Memory Addresses', 'Dereferencing', 'Heap vs Stack']
      },
      quiz: {
        question: 'What does dereferencing a pointer mean?',
        options: ['Deleting the pointer', 'Accessing the value at the pointer address', 'Moving the pointer to a new location', 'Copying the pointer to another variable'],
        correctAnswerIndex: 1,
        explanation: 'Dereferencing follows the stored address to read or write the actual value at that memory location.',
        hint: 'The pointer holds an address - dereferencing means going to that address.'
      }
    },
    {
      id: 3,
      title: 'Stacks',
      status: 'completed',
      xp: 20,
      duration: '8 min',
      summary: 'Understand LIFO semantics, call stack management, and expression evaluation.',
      keyConcepts: ['LIFO Semantics', 'Push & Pop', 'Call Stack Frames'],
      nextNodeTitle: 'Queue Fundamentals',
      lessonContent: {
        analogy: 'A stack is like a pile of plates - you can only add or remove from the top. The last plate you put on is the first one taken off.',
        paragraphs: [
          'A stack enforces Last-In, First-Out (LIFO) ordering. Push adds an element to the top; pop removes the top element. Both operations are O(1).',
          'The CPU uses a call stack to manage function invocations. Each call pushes a frame; returning pops it, automatically freeing local variables.'
        ],
        keyConcepts: ['LIFO Semantics', 'Push & Pop', 'Call Stack Frames']
      },
      quiz: {
        question: 'In a stack, which element is removed by pop()?',
        options: ['The bottom element', 'A random element', 'The most recently pushed element', 'The element with the lowest value'],
        correctAnswerIndex: 2,
        explanation: 'Stacks follow LIFO - the last element pushed is always the first popped.',
        hint: 'Think about the pile-of-plates analogy: which plate do you remove first?'
      }
    },
    {
      id: 4,
      title: 'Queue Fundamentals',
      status: 'active',
      xp: 20,
      duration: '6 min',
      summary: 'Learn FIFO queue principles, ring buffers, and double-ended queue implementations.',
      keyConcepts: ['FIFO Principle', 'Circular Queues', 'Deque Operations'],
      nextNodeTitle: 'Linked Lists',
      lessonContent: {
        analogy: 'A queue is like people waiting in line at a grocery store checkout - the first person in line is served first, new arrivals join at the back.',
        paragraphs: [
          'A queue operates on First-In, First-Out (FIFO). Elements are added at the rear (enqueue) and removed from the front (dequeue).',
          'A circular (ring) buffer implements a queue in fixed-size memory by wrapping head/tail pointers around, avoiding wasted space without shifting elements.'
        ],
        keyConcepts: ['FIFO Principle', 'Circular Queues', 'Deque Operations']
      },
      quiz: {
        question: 'Which principle governs a standard queue data structure?',
        options: ['Last-In, First-Out (LIFO)', 'First-In, First-Out (FIFO)', 'Random Access', 'First-In, Last-Out (FILO)'],
        correctAnswerIndex: 1,
        explanation: 'Queues strictly follow FIFO: the first element inserted is the first removed - just like a checkout line.',
        hint: 'Picture the checkout line: who gets served first?'
      }
    },
    {
      id: 5,
      title: 'Linked Lists',
      status: 'locked',
      xp: 25,
      duration: '5 min',
      summary: 'Construct dynamic singly and doubly linked node sequences with constant-time insertions.',
      keyConcepts: ['Node References', 'Head & Tail Pointers', 'O(1) Insertion'],
      nextNodeTitle: 'Trees & Traversal',
      lessonContent: {
        analogy: 'A linked list is like a treasure hunt - each clue tells you where the next clue is hidden, so you follow the chain one step at a time.',
        paragraphs: [
          'A linked list stores data in nodes where each node holds a value and a pointer to the next node. Nodes do not need to be contiguous in memory.',
          'Inserting at a known position is O(1) - just rewire pointers. Random access is O(n) since you must traverse from the head.'
        ],
        keyConcepts: ['Node References', 'Head & Tail Pointers', 'O(1) Insertion']
      },
      quiz: {
        question: 'What is the time complexity of accessing the nth element of a singly linked list?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correctAnswerIndex: 2,
        explanation: 'You must traverse from the head, following next pointers one by one, until reaching the nth node - that is O(n).',
        hint: 'Unlike arrays, linked lists have no index - you must walk the chain.'
      }
    },
    {
      id: 6,
      title: 'Trees & Traversal',
      status: 'locked',
      xp: 30,
      duration: '6 min',
      summary: 'Navigate hierarchical structures using Breadth-First and Depth-First traversal algorithms.',
      keyConcepts: ['Binary Trees', 'In-Order Traversal', 'Recursive Exploration'],
      nextNodeTitle: 'Hash Tables',
      lessonContent: {
        analogy: 'A tree is like a company org chart - the CEO is at the root, managers branch below, and employees are the leaves.',
        paragraphs: [
          'A binary tree is hierarchical where each node has at most two children. The topmost node is the root; nodes with no children are leaves.',
          'In-order traversal visits left then root then right, producing sorted output in a BST. BFS uses a queue; DFS variants use a stack or recursion.'
        ],
        keyConcepts: ['Binary Trees', 'In-Order Traversal', 'Recursive Exploration']
      },
      quiz: {
        question: 'Which traversal visits: left subtree, then root, then right subtree?',
        options: ['Pre-order', 'Post-order', 'In-order', 'Level-order BFS'],
        correctAnswerIndex: 2,
        explanation: 'In-order processes left then root then right - yielding sorted output for a BST.',
        hint: 'The word in-order hints the root comes in the middle of the children.'
      }
    },
    {
      id: 7,
      title: 'Hash Tables',
      status: 'locked',
      xp: 35,
      duration: '5 min',
      summary: 'Implement hash functions, chaining collision strategies, and amortized O(1) lookup.',
      keyConcepts: ['Hash Functions', 'Bucket Arrays', 'Collision Resolution'],
      nextNodeTitle: 'Unit Challenge',
      lessonContent: {
        analogy: 'A hash table is like a filing cabinet where a magic label machine tells you exactly which drawer to open - so lookup is almost instant.',
        paragraphs: [
          'A hash function maps keys to integer bucket indices. A good function distributes keys uniformly to minimise collisions.',
          'Collisions are resolved via chaining (linked list per bucket) or open addressing. With a good load factor, average lookup is O(1).'
        ],
        keyConcepts: ['Hash Functions', 'Bucket Arrays', 'Collision Resolution']
      },
      quiz: {
        question: 'What is the average-case time complexity of a hash table lookup?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'],
        correctAnswerIndex: 2,
        explanation: 'With a good hash function and low load factor, the hash table computes the bucket index directly - constant time.',
        hint: 'The whole point of hashing is to skip searching - how many steps does that take?'
      }
    },
    {
      id: 8,
      title: 'Unit Challenge',
      status: 'locked',
      xp: 50,
      duration: '15 min',
      summary: 'Capstone mastery test challenging data structure tradeoffs, runtime complexities, and system design.',
      keyConcepts: ['Time & Space Tradeoffs', 'Capstone Challenge', 'Architecture Review']
    }
  ]
}

export const SAMPLE_TOPICS: StudyPathTopic[] = [
  DEFAULT_TOPIC,
  {
    topicId: 'mth201-calculus',
    title: 'Multivariable Calculus',
    courseCode: 'MTH 201 - Advanced Calculus',
    currentProgress: 1,
    nodes: [
      {
        id: 1,
        title: 'Vectors & 3D Space',
        status: 'completed',
        xp: 25,
        duration: '6 min',
        summary: 'Cartesian coordinates in 3-space, dot products, and vector projections.',
        keyConcepts: ['Dot Product', 'Cross Product', 'Vector Projections'],
        nextNodeTitle: 'Partial Derivatives',
        lessonContent: {
          analogy: 'A vector in 3D is like giving directions: go 3 blocks east, 2 blocks north, climb 5 floors - that is a (3, 2, 5) vector.',
          paragraphs: [
            'Vectors in R3 have three components (x, y, z) representing both magnitude and direction. Adding vectors follows the parallelogram rule.',
            'The dot product of a and b equals magnitude-a times magnitude-b times cos-theta. It is zero when vectors are perpendicular.'
          ],
          keyConcepts: ['Dot Product', 'Cross Product', 'Vector Projections']
        },
        quiz: {
          question: 'If two vectors are perpendicular, what is their dot product?',
          options: ['1', '-1', '0', 'Undefined'],
          correctAnswerIndex: 2,
          explanation: 'The dot product equals |a||b|cos(theta). When theta is 90 degrees, cos(90) equals 0.',
          hint: 'Recall the dot product formula involves the cosine of the angle between vectors.'
        }
      },
      {
        id: 2,
        title: 'Partial Derivatives',
        status: 'active',
        xp: 30,
        duration: '8 min',
        summary: 'Rates of change along coordinate axes, gradient vectors, and tangent planes.',
        keyConcepts: ['Gradient Vector', 'Directional Derivatives', 'Tangent Planes'],
        nextNodeTitle: 'Multiple Integrals',
        lessonContent: {
          analogy: 'Standing on a hilly landscape - a partial derivative tells you how steep the slope is if you walk in exactly one direction while ignoring all others.',
          paragraphs: [
            'A partial derivative df/dx measures the rate of change of f with respect to x, treating all other variables as constants.',
            'The gradient vector points in the direction of steepest ascent and its magnitude gives the maximum slope.'
          ],
          keyConcepts: ['Gradient Vector', 'Directional Derivatives', 'Tangent Planes']
        },
        quiz: {
          question: 'In what direction does the gradient vector point?',
          options: ['Steepest descent', 'Steepest ascent', 'Parallel to the x-axis', 'Perpendicular to the y-axis'],
          correctAnswerIndex: 1,
          explanation: 'The gradient points in the direction of greatest rate of increase of f at any given point.',
          hint: 'Think about which way is uphill on the function surface.'
        }
      },
      {
        id: 3,
        title: 'Multiple Integrals',
        status: 'locked',
        xp: 35,
        duration: '10 min',
        summary: 'Double and triple integrals over general regions and polar transformations.',
        keyConcepts: ['Double Integrals', 'Polar Coordinates', 'Jacobian Determinant']
      },
      {
        id: 4,
        title: 'Vector Calculus',
        status: 'locked',
        xp: 40,
        duration: '12 min',
        summary: 'Vector fields, line integrals, Greens theorem, and divergence.',
        keyConcepts: ['Line Integrals', 'Greens Theorem', 'Curl & Divergence']
      }
    ]
  }
]