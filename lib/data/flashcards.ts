import { DEFAULT_TOPIC, SAMPLE_TOPICS, type LearningNode } from "./studyPath"

export interface Flashcard {
  id: string
  nodeId: number
  nodeTitle: string
  term: string
  question: string
  definition: string
  analogy?: string
  keyConcepts: string[]
  codeSnippet?: string
  tags?: string[]
}

export const FLASHCARD_VAULT: Record<string, Flashcard[]> = {
  "csc202-queues-deques": [
    {
      id: "card-1-1",
      nodeId: 1,
      nodeTitle: "Arrays & Memory",
      term: "Contiguous Memory",
      question: "Why does contiguous memory allocation give arrays superior read performance?",
      definition:
        "Elements are placed in unbroken, sequential memory addresses. When the CPU fetches one element, hardware prefetching pulls nearby elements into L1/L2 cache lines simultaneously (spatial locality).",
      analogy: "Like houses numbered consecutively on the same street—a postman can deliver mail to 10 neighbors in seconds without driving across town.",
      keyConcepts: ["Contiguous Memory", "Cache Locality", "Direct Indexing"],
      codeSnippet: "address = base_address + (index * sizeof(element))",
      tags: ["Memory", "Performance"],
    },
    {
      id: "card-1-2",
      nodeId: 1,
      nodeTitle: "Arrays & Memory",
      term: "Index Offsets & O(1) Access",
      question: "How does direct offset calculation guarantee O(1) random access in arrays?",
      definition:
        "The CPU computes the target element's memory address in a single arithmetic instruction using the base address and offset multiplier, completely independent of array length.",
      analogy: "Knowing an apartment number (floor 3, door 4) lets you go straight there via elevator without knocking on every earlier door.",
      keyConcepts: ["Index Offsets", "Time Complexity", "Pointer Math"],
      tags: ["Complexity", "Data Structures"],
    },
    {
      id: "card-2-1",
      nodeId: 2,
      nodeTitle: "Pointers & Addresses",
      term: "Memory Dereferencing",
      question: "What actually happens during a pointer dereference operation?",
      definition:
        "The CPU reads the raw integer address stored inside the pointer variable, uses it as a memory bus address, and retrieves or modifies the data payload at that destination.",
      analogy: "Holding a paper with a locker combination and locker number—dereferencing means opening that specific locker.",
      keyConcepts: ["Pointers", "Memory Bus", "Indirection"],
      tags: ["Pointers", "Low Level"],
    },
    {
      id: "card-3-1",
      nodeId: 3,
      nodeTitle: "Stacks & LIFO",
      term: "LIFO Principle",
      question: "What is LIFO semantics and which fundamental system uses it for execution?",
      definition:
        "Last-In, First-Out: the most recently pushed element must be the first one removed. The operating system call stack relies on this to track function scopes and return addresses.",
      analogy: "A stack of dinner plates in a cafeteria dispenser—clean plates go on top, diners pick from the top.",
      keyConcepts: ["LIFO Semantics", "Push & Pop", "Call Stack"],
      tags: ["Stacks", "Execution"],
    },
    {
      id: "card-4-1",
      nodeId: 4,
      nodeTitle: "Queue Fundamentals",
      term: "FIFO Principle",
      question: "How does the First-In, First-Out (FIFO) queue order items compared to a stack?",
      definition:
        "Elements are appended strictly at the rear (enqueue) and extracted strictly from the front (dequeue), preserving chronological order of arrival.",
      analogy: "A single-file line of customers at a coffee shop—the first customer to line up gets served first.",
      keyConcepts: ["FIFO Principle", "Enqueue & Dequeue", "Fair Ordering"],
      tags: ["Queues", "Ordering"],
    },
    {
      id: "card-4-2",
      nodeId: 4,
      nodeTitle: "Queue Fundamentals",
      term: "Circular Ring Buffer",
      question: "How does a circular queue avoid O(n) element shifting when dequeuing?",
      definition:
        "It wraps the head and tail pointer indices using modulo arithmetic: `nextIndex = (currentIndex + 1) % capacity`. This eliminates memory fragmentation and shifting.",
      analogy: "A circular clock face—after 12 o'clock, the hand smoothly wraps back to 1 o'clock without rebuilding the clock.",
      keyConcepts: ["Circular Queues", "Ring Buffer", "Modulo Arithmetic"],
      codeSnippet: "head = (head + 1) % MAX_CAPACITY;",
      tags: ["Queues", "Optimization"],
    },
    {
      id: "card-4-3",
      nodeId: 4,
      nodeTitle: "Queue Fundamentals",
      term: "Double-Ended Queue (Deque)",
      question: "What distinct capability separates a Deque from a regular FIFO queue?",
      definition:
        "A deque supports insertion and deletion at BOTH the front and back in O(1) time, allowing it to act as both a stack (LIFO) and a queue (FIFO) simultaneously.",
      analogy: "A double-ended train car where passengers can enter or exit from both front and rear doors at will.",
      keyConcepts: ["Deque Operations", "Double-Ended", "Bidirectional"],
      tags: ["Deques", "Flexibility"],
    },
    {
      id: "card-5-1",
      nodeId: 5,
      nodeTitle: "Linked Lists",
      term: "O(1) Pointer Insertion",
      question: "Under what condition is inserting a node into a linked list O(1) vs O(n)?",
      definition:
        "If you already possess a direct pointer reference to the predecessor node, insertion requires only rewiring two pointers: O(1). If you must search for the position first, traversal takes O(n).",
      analogy: "Adding a new link into a metal chain when you already have both loose ends in your hands takes 2 seconds.",
      keyConcepts: ["Node References", "O(1) Insertion", "Pointer Splicing"],
      tags: ["Linked Lists", "Tradeoffs"],
    },
    {
      id: "card-7-1",
      nodeId: 7,
      nodeTitle: "Hash Tables",
      term: "Collision Resolution: Chaining",
      question: "How does separate chaining maintain O(1) average lookup when two keys hash to the same bucket?",
      definition:
        "Each bucket points to a linked list (or balanced tree) of entries. If collision occurs, the new item appends to the bucket list. As long as the load factor is low (< 0.75), bucket lists remain tiny.",
      analogy: "A filing cabinet drawer with multiple labeled folders inside if two items share the same drawer index.",
      keyConcepts: ["Hash Functions", "Bucket Arrays", "Collision Resolution"],
      tags: ["Hash Tables", "Performance"],
    },
  ],
  "mth201-calculus": [
    {
      id: "calc-1-1",
      nodeId: 1,
      nodeTitle: "Vectors & 3D Space",
      term: "Dot Product & Orthogonality",
      question: "What does a dot product of zero signify geometrically between two non-zero vectors?",
      definition:
        "The dot product formula is a · b = |a||b|cos(θ). When θ = 90° (perpendicular/orthogonal vectors), cos(90°) = 0, meaning zero directional alignment.",
      analogy: "Pushing a box directly north while the floor only allows east-west movement—zero work is transferred in the orthogonal direction.",
      keyConcepts: ["Dot Product", "Orthogonality", "Angle Formula"],
      codeSnippet: "a · b = (a.x * b.x) + (a.y * b.y) + (a.z * b.z)",
      tags: ["Calculus", "Vectors"],
    },
    {
      id: "calc-2-1",
      nodeId: 2,
      nodeTitle: "Partial Derivatives",
      term: "Gradient Vector Direction",
      question: "In what direction does the gradient ∇f point on a scalar surface?",
      definition:
        "The gradient vector ∇f points directly in the direction of greatest instantaneous rate of increase (steepest ascent). Its magnitude equals that maximum directional rate of change.",
      analogy: "A hiker on a mountain fog looking at a compass that always points straight up the steepest cliff face.",
      keyConcepts: ["Gradient Vector", "Directional Derivatives", "Steepest Ascent"],
      tags: ["Calculus", "Gradients"],
    },
  ],
}

export function getFlashcardsForCourse(courseId: string, nodeIdFilter?: number): Flashcard[] {
  let deck = FLASHCARD_VAULT[courseId]

  if (!deck) {
    // Generate fallback cards from DEFAULT_TOPIC or SAMPLE_TOPICS
    const topic =
      SAMPLE_TOPICS.find((t) => t.topicId === courseId) || DEFAULT_TOPIC
    deck = topic.nodes.flatMap((node) =>
      node.keyConcepts.map((concept, idx) => ({
        id: `gen-${node.id}-${idx}`,
        nodeId: node.id,
        nodeTitle: node.title,
        term: concept,
        question: `How does "${concept}" operate within ${node.title}?`,
        definition:
          node.lessonContent?.paragraphs[idx % (node.lessonContent.paragraphs.length || 1)] ||
          node.summary ||
          `Core conceptual principle of ${concept} applied to ${node.title}.`,
        analogy: node.lessonContent?.analogy,
        keyConcepts: node.keyConcepts,
        tags: [node.title, "Core Concept"],
      }))
    )
  }

  if (nodeIdFilter) {
    const filtered = deck.filter((c) => c.nodeId === nodeIdFilter)
    if (filtered.length > 0) return filtered
  }

  return deck
}
