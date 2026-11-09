export interface GradeScaleItem {
  range: string;
  min: number;
  max: number;
  grade: string;
  description: string;
}

export const OFFICIAL_GRADE_SCALE: GradeScaleItem[] = [
  { range: "91-100", min: 91, max: 100, grade: "A-1", description: "Outstanding" },
  { range: "81-90", min: 81, max: 90.999, grade: "A-2", description: "Excellent" },
  { range: "71-80", min: 71, max: 80.999, grade: "B-1", description: "Very Good" },
  { range: "61-70", min: 61, max: 70.999, grade: "B-2", description: "Good" },
  { range: "51-60", min: 51, max: 60.999, grade: "C-1", description: "Fair" },
  { range: "41-50", min: 41, max: 50.999, grade: "C-2", description: "Average" },
  { range: "33-40", min: 33, max: 40.999, grade: "D", description: "Marginal" },
  { range: "00-33", min: 0, max: 32.999, grade: "E", description: "Needs Improvement" },
];

/**
 * Calculates grade from percentage (0-100)
 */
export function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 91) return "A-1";
  if (percentage >= 81) return "A-2";
  if (percentage >= 71) return "B-1";
  if (percentage >= 61) return "B-2";
  if (percentage >= 51) return "C-1";
  if (percentage >= 41) return "C-2";
  if (percentage >= 33) return "D";
  return "E";
}

/**
 * Calculate Term 1 Total: UT-1 + Half Yearly
 */
export function calculateTerm1Total(ut1: number | null | undefined, halfYearly: number | null | undefined): number {
  return (ut1 ?? 0) + (halfYearly ?? 0);
}

/**
 * Calculate Term 2 Total: UT-2 + Annual Exam
 */
export function calculateTerm2Total(ut2: number | null | undefined, annual: number | null | undefined): number {
  return (ut2 ?? 0) + (annual ?? 0);
}

/**
 * Calculate Grand Total: Term 1 + Term 2
 */
export function calculateGrandTotal(
  ut1: number | null | undefined,
  halfYearly: number | null | undefined,
  ut2: number | null | undefined,
  annual: number | null | undefined
): number {
  return calculateTerm1Total(ut1, halfYearly) + calculateTerm2Total(ut2, annual);
}

/**
 * Calculate Subject Grade based on obtained grand total vs subject max marks
 */
export function calculateSubjectGrade(
  grandTotal: number,
  maxMarks: number
): string {
  if (maxMarks <= 0) return "-";
  const percentage = (grandTotal / maxMarks) * 100;
  return getGradeFromPercentage(percentage);
}

/**
 * Calculate Overall Percentage
 */
export function calculateOverallPercentage(totalObtained: number, totalMax: number): number {
  if (totalMax <= 0) return 0;
  const pct = (totalObtained / totalMax) * 100;
  return Math.round(pct * 100) / 100; // 2 decimal places (e.g. 77.89%)
}

/**
 * Calculate Ranks for a list of students based on total marks
 */
export function calculateClassRanks(studentsWithTotals: { studentId: string; totalMarks: number }[]): Map<string, number> {
  const sorted = [...studentsWithTotals].sort((a, b) => b.totalMarks - a.totalMarks);
  const ranksMap = new Map<string, number>();
  
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalMarks < sorted[i - 1].totalMarks) {
      currentRank = i + 1;
    }
    ranksMap.set(sorted[i].studentId, currentRank);
  }
  
  return ranksMap;
}
