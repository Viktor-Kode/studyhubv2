import type { jsPDF } from 'jspdf'

// Load jspdf + autotable only in browser (avoids SSR issues)
async function getJsPDF(): Promise<typeof jsPDF | null> {
  if (typeof window === 'undefined') return null
  const mod = await import('jspdf')
  await import('jspdf-autotable')
  return mod.default
}

type JsPDFWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number }
  autoTable: (options: Record<string, unknown>) => void
}

interface HeaderMeta {
  schoolName?: string
  classTeacher?: string
  term?: string
  year?: string
  title: string
}

function addSchoolHeader(doc: JsPDFWithAutoTable, meta: HeaderMeta): number {
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(meta.schoolName || 'SCHOOL NAME', pageW / 2, 18, { align: 'center' })

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(meta.title.toUpperCase(), pageW / 2, 26, { align: 'center' })

  doc.setDrawColor(80, 80, 80)
  doc.setLineWidth(0.5)
  doc.line(14, 29, pageW - 14, 29)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Class Teacher: ${meta.classTeacher || '_______________'}`, 14, 36)
  doc.text(`Term: ${meta.term || '_______________'}`, pageW / 2 - 20, 36)
  doc.text(`Year: ${meta.year || '_______________'}`, pageW - 60, 36)

  doc.line(14, 39, pageW - 14, 39)
  return 44
}

// ─── 1. CLASS REGISTER ─────────────────────────────────────────────────────
export async function generateClassRegister(params: {
  schoolName?: string
  classTeacher?: string
  term?: string
  year?: string
  className?: string
  students?: number | string
  subjects?: string
  weeks?: number | string
}): Promise<void> {
  const jsPDF = await getJsPDF()
  if (!jsPDF) return

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as JsPDFWithAutoTable
  const startY = addSchoolHeader(doc, {
    ...params,
    title: `Class Register — ${params.className || 'Class'}`,
  })

  const numStudents = parseInt(String(params.students), 10) || 30
  const subjectList = params.subjects
    ? params.subjects.split(',').map((s) => s.trim())
    : ['Subject 1', 'Subject 2']
  const numWeeks = parseInt(String(params.weeks), 10) || 4

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ATTENDANCE RECORD', 14, startY)

  const attendanceHead = ['S/N', 'Student Name', ...Array.from({ length: numWeeks }, (_, i) => `Wk ${i + 1}`), 'Total', '%']
  const attendanceBody = Array.from({ length: numStudents }, (_, i) => [
    String(i + 1),
    '',
    ...Array.from({ length: numWeeks }, () => ''),
    '',
    '',
  ])

  doc.autoTable({
    startY: startY + 4,
    head: [attendanceHead],
    body: attendanceBody,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, minCellHeight: 7 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 40 },
    },
    styles: { overflow: 'linebreak' as const },
  })

  doc.addPage('a4', 'landscape')
  addSchoolHeader(doc, {
    ...params,
    title: `Score Sheet — ${params.className || 'Class'}`,
  })

  const scoreHead = ['S/N', 'Student Name', ...subjectList, 'Total', 'Avg', 'Position', 'Remark']
  const scoreBody = Array.from({ length: numStudents }, (_, i) => [
    String(i + 1),
    '',
    ...subjectList.map(() => ''),
    '',
    '',
    '',
    '',
  ])

  doc.autoTable({
    startY: 44,
    head: [scoreHead],
    body: scoreBody,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, minCellHeight: 7 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 38 },
      [scoreHead.length - 1]: { cellWidth: 20 },
    },
  })

  doc.save(`Class_Register_${params.className || 'Class'}.pdf`)
}

// ─── 2. REPORT SHEET ───────────────────────────────────────────────────────
export interface ReportStudent {
  name?: string
  subjects?: Array<{ name?: string; ca1?: string; ca2?: string; exam?: string; total?: string; grade?: string; remark?: string }>
  totalScore?: string
  average?: string
  position?: string
  classSize?: string
  overallGrade?: string
  teacherComment?: string
}

export async function generateReportSheet(params: {
  schoolName?: string
  classTeacher?: string
  term?: string
  year?: string
  className?: string
  students: ReportStudent[]
}): Promise<void> {
  const jsPDF = await getJsPDF()
  if (!jsPDF) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as JsPDFWithAutoTable
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const students = params.students.length ? params.students : [{ name: '' }]

  students.forEach((student, idx) => {
    if (idx > 0) doc.addPage()

    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.text(params.schoolName || 'SCHOOL NAME', pageW / 2, 18, { align: 'center' })
    doc.setFontSize(11)
    doc.text('STUDENT REPORT CARD', pageW / 2, 25, { align: 'center' })
    doc.setLineWidth(0.5)
    doc.line(14, 28, pageW - 14, 28)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Student Name: ${student.name || '___________________________'}`, 14, 35)
    doc.text(`Class: ${params.className || '_____________'}`, 120, 35)
    doc.text(`Term: ${params.term || '_____________'}`, 14, 41)
    doc.text(`Year: ${params.year || '_____________'}`, 120, 41)
    doc.text(`Class Teacher: ${params.classTeacher || '___________________________'}`, 14, 47)
    doc.line(14, 50, pageW - 14, 50)

    const subjectRows = (student.subjects || []).map((s, i) => [
      i + 1,
      s.name || '',
      s.ca1 || '',
      s.ca2 || '',
      s.exam || '',
      s.total || '',
      s.grade || '',
      s.remark || '',
    ])

    while (subjectRows.length < 12) {
      subjectRows.push([subjectRows.length + 1, '', '', '', '', '', '', ''])
    }

    doc.autoTable({
      startY: 53,
      head: [['S/N', 'Subject', 'CA1 (10)', 'CA2 (10)', 'Exam (80)', 'Total (100)', 'Grade', 'Remark']],
      body: subjectRows,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, minCellHeight: 8 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 40 },
        7: { cellWidth: 25 },
      },
    })

    const afterTable = (doc.lastAutoTable?.finalY ?? 53) + 6

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Score: ${student.totalScore || '________'}`, 14, afterTable)
    doc.text(`Average: ${student.average || '________'}`, 70, afterTable)
    doc.text(`Position: ${student.position || '________'} / ${student.classSize || '___'}`, 120, afterTable)
    doc.text(`Grade: ${student.overallGrade || '________'}`, 170, afterTable)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(
      'Grading: A1 (75-100) Excellent | B2 (70-74) Very Good | B3 (65-69) Good | C4 (60-64) Credit | C5 (55-59) Credit | C6 (50-54) Credit | D7 (45-49) Pass | E8 (40-44) Pass | F9 (0-39) Fail',
      14,
      afterTable + 6,
      { maxWidth: pageW - 28 }
    )

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text("Class Teacher's Comment:", 14, afterTable + 16)
    doc.setFont('helvetica', 'normal')
    doc.text(
      student.teacherComment ||
        '_______________________________________________________________________________________________________________',
      14,
      afterTable + 22,
      { maxWidth: pageW - 28 }
    )

    doc.setFont('helvetica', 'bold')
    doc.text("Principal's Remark:", 14, afterTable + 32)
    doc.setFont('helvetica', 'normal')
    doc.text(
      '_______________________________________________________________________________________________________________',
      14,
      afterTable + 38,
      { maxWidth: pageW - 28 }
    )

    doc.text("Class Teacher's Signature: ______________________", 14, afterTable + 50)
    doc.text("Principal's Signature: ______________________", 120, afterTable + 50)
    doc.text('Date: ______________________', 14, afterTable + 58)
    doc.text('School Stamp:', 120, afterTable + 58)
    doc.rect(155, afterTable + 52, 30, 20)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(`Next Term Begins: ______________________`, 14, Math.min(afterTable + 68, pageH - 15))
    doc.text(`School Fees: ₦______________________`, 120, Math.min(afterTable + 68, pageH - 15))
  })

  doc.save(`Report_Sheet_${params.className || 'Class'}_${params.term || 'Term'}.pdf`)
}

// ─── 3. TEACHER'S DIARY ────────────────────────────────────────────────────
export interface DiaryEntry {
  subject?: string
  topic?: string
  objectives?: string
  activities?: string
  resources?: string
  remarks?: string
}

export async function generateTeacherDiary(params: {
  schoolName?: string
  classTeacher?: string
  term?: string
  year?: string
  className?: string
  weekNumber?: string
  startDate?: string
  entries?: DiaryEntry[]
}): Promise<void> {
  const jsPDF = await getJsPDF()
  if (!jsPDF) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as JsPDFWithAutoTable
  const startY = addSchoolHeader(doc, {
    ...params,
    title: `Teacher's Diary — Week ${params.weekNumber || '___'} | ${params.className || 'Class'}`,
  })

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const entries = params.entries || []

  const rows = days.map((day, i) => {
    const entry = entries[i] || {}
    return [
      day,
      entry.subject || '',
      entry.topic || '',
      entry.objectives || '',
      entry.activities || '',
      entry.resources || '',
      entry.remarks || '',
    ]
  })

  doc.autoTable({
    startY: startY + 2,
    head: [['Day', 'Subject', 'Topic', 'Objectives', 'Activities', 'Resources', 'Remarks']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, minCellHeight: 18 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 22 },
      2: { cellWidth: 28 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
      5: { cellWidth: 22 },
      6: { cellWidth: 22 },
    },
  })

  const afterY = (doc.lastAutoTable?.finalY ?? startY) + 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text("Teacher's Signature: ______________________", 14, afterY)
  doc.text("HOD's Signature: ______________________", 110, afterY)
  doc.text(`Date: ${params.startDate || '______________________'}`, 14, afterY + 8)

  doc.save(`Teachers_Diary_Week${params.weekNumber || ''}_${params.className || 'Class'}.pdf`)
}

// ─── 4. BLANK TEMPLATES ───────────────────────────────────────────────────
export async function generateBlankTemplate(
  type: string,
  meta: { schoolName?: string; classTeacher?: string; term?: string; year?: string } = {}
): Promise<void> {
  const jsPDF = await getJsPDF()
  if (!jsPDF) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as JsPDFWithAutoTable
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const line = (y: number) => {
    doc.setDrawColor(180, 180, 180)
    doc.line(14, y, pageW - 14, y)
  }

  const writeLine = (label: string, y: number, valueWidth = 100) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`${label}:`, 14, y)
    doc.setFont('helvetica', 'normal')
    const tw = doc.getTextWidth(`${label}: `) + 2
    doc.line(14 + tw, y + 0.5, 14 + tw + valueWidth, y + 0.5)
  }

  const addHeader = (title: string) => {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(meta.schoolName || 'SCHOOL NAME', pageW / 2, 16, { align: 'center' })
    doc.setFontSize(11)
    doc.text(title, pageW / 2, 23, { align: 'center' })
    doc.setLineWidth(0.5)
    line(26)
    return 32
  }

  const blankLines = (startY: number, count = 8, spacing = 8) => {
    for (let i = 0; i < count; i++) {
      doc.setDrawColor(200, 200, 200)
      doc.line(14, startY + i * spacing, pageW - 14, startY + i * spacing)
    }
    return startY + count * spacing + 4
  }

  if (type === 'lesson_note') {
    let y = addHeader('LESSON NOTE TEMPLATE')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    writeLine('Subject', y)
    y += 8
    writeLine('Topic', y)
    y += 8
    writeLine('Class', y)
    writeLine('Date', y, 50)
    y += 8
    writeLine('Duration', y)
    writeLine('Term', y, 50)
    y += 8
    line(y)
    y += 6

    const sections: [string, number][] = [
      ['BEHAVIOURAL OBJECTIVES', 5],
      ['PREVIOUS KNOWLEDGE / ENTRY BEHAVIOUR', 3],
      ['INSTRUCTIONAL MATERIALS / RESOURCES', 3],
      ['REFERENCE MATERIALS', 2],
      ['INTRODUCTION / MOTIVATION', 4],
      ["PRESENTATION (STEP BY STEP)", 8],
      ["TEACHER'S ACTIVITIES", 4],
      ["STUDENTS' ACTIVITIES", 4],
      ['EVALUATION / ASSESSMENT', 4],
      ['ASSIGNMENT / HOMEWORK', 3],
      ['CONCLUSION', 2],
    ]

    sections.forEach(([title, lines]) => {
      if (y > pageH - 30) {
        doc.addPage()
        y = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(`${title}:`, 14, y)
      y += 5
      y = blankLines(y, lines, 7)
    })
  } else if (type === 'scheme_of_work') {
    const y = addHeader('SCHEME OF WORK TEMPLATE')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'Subject: _________________   Class: _________________   Term: _________________   Year: _________________',
      14,
      y
    )

    doc.autoTable({
      startY: y + 6,
      head: [['Week', 'Topic', 'Sub-topics', 'Objectives', 'Activities', 'Resources', 'Evaluation']],
      body: Array.from({ length: 14 }, (_, i) => [i + 1, '', '', '', '', '', '']),
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, minCellHeight: 14 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 28 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22 },
      },
    })
  } else if (type === 'marking_scheme') {
    let y = addHeader('MARKING SCHEME TEMPLATE')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'Subject: _________________   Class: _________________   Date: _________________   Total Marks: _______',
      14,
      y
    )
    y += 8

    for (let q = 1; q <= 10; q++) {
      if (y > pageH - 40) {
        doc.addPage()
        y = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(`Question ${q}:`, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text('Marks: _______', 160, y)
      y += 5
      y = blankLines(y, 3, 7)
      doc.text('Key Points:', 14, y)
      y += 5
      y = blankLines(y, 2, 7)
    }
  } else if (type === 'reading_comprehension') {
    let y = addHeader('READING COMPREHENSION TEMPLATE')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    writeLine('Subject', y)
    writeLine('Class', y)
    y += 8
    writeLine('Title of Passage', y)
    y += 10

    doc.setFont('helvetica', 'bold')
    doc.text('PASSAGE:', 14, y)
    y += 5
    y = blankLines(y, 12, 7)

    doc.setFont('helvetica', 'bold')
    doc.text('COMPREHENSION QUESTIONS:', 14, y)
    y += 5
    for (let i = 1; i <= 5; i++) {
      doc.setFont('helvetica', 'normal')
      doc.text(`${i}.`, 14, y)
      line(y + 0.5)
      y += 8
    }
    doc.setFont('helvetica', 'bold')
    doc.text('VOCABULARY:', 14, y)
    y += 5
    y = blankLines(y, 4, 7)

    doc.setFont('helvetica', 'bold')
    doc.text('SUMMARY TASK:', 14, y)
    y += 5
    blankLines(y, 4, 7)
  } else if (type === 'exam_timetable') {
    const y = addHeader('EXAMINATION TIMETABLE')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Term: _________________   Year: _________________   Class: _________________', 14, y)

    doc.autoTable({
      startY: y + 6,
      head: [['Date', 'Day', 'Time', 'Subject', 'Duration', 'Venue', 'Invigilator']],
      body: Array.from({ length: 15 }, () => ['', '', '', '', '', '', '']),
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, minCellHeight: 9 },
    })
  } else if (type === 'parent_teacher') {
    let y = addHeader('PARENT-TEACHER MEETING RECORD')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    writeLine('Date', y)
    writeLine('Time', y)
    y += 8
    writeLine('Student Name', y)
    writeLine('Class', y)
    y += 8
    writeLine('Parent/Guardian Name', y)
    y += 8
    writeLine('Contact', y)
    y += 10

    const sections2 = [
      'Academic Performance Discussion',
      "Behavioural Observations",
      "Parent's Concerns / Feedback",
      "Teacher's Recommendations",
      'Action Points / Follow Up',
      'Next Meeting Date',
    ]

    sections2.forEach((s) => {
      if (y > pageH - 30) {
        doc.addPage()
        y = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.text(`${s}:`, 14, y)
      y += 5
      y = blankLines(y, 3, 7)
    })

    doc.setFont('helvetica', 'bold')
    doc.text("Teacher's Signature: ______________________", 14, y + 6)
    doc.text("Parent's Signature: ______________________", 110, y + 6)
  }

  doc.save(`${type}_template.pdf`)
}
