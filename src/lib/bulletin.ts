export type BulletinTerm = { id: string; name: string };
export type BulletinGrade = { student_id: string; score: number; assessment_id: string };
export type BulletinAssessment = { id: string; term_id: string; max_score: number; class_subject_id?: string; assessment_kind?: "period" | "semester_exam"; coefficient?: number };

export type BulletinTotal = { points: number; maximum: number; percentage: number | null };

export function totalFor(studentId: string, termIds: string[], assessments: BulletinAssessment[], grades: BulletinGrade[], expectedMaximum = 0, kind?: "period" | "semester_exam"): BulletinTotal {
  const selected = assessments.filter((assessment) => termIds.includes(assessment.term_id) && (!kind || (assessment.assessment_kind ?? "period") === kind));
  const assessmentIds = new Set(selected.map((assessment) => assessment.id));
  const points = grades.filter((grade) => grade.student_id === studentId && assessmentIds.has(grade.assessment_id)).reduce((sum, grade) => { const assessment = selected.find((item) => item.id === grade.assessment_id); return sum + Number(grade.score) * Number(assessment?.coefficient ?? 1); }, 0);
  const maximum = Math.max(selected.reduce((sum, assessment) => sum + Number(assessment.max_score) * Number(assessment.coefficient ?? 1), 0), expectedMaximum);
  return { points, maximum, percentage: maximum ? (points * 100) / maximum : null };
}

export function periodNumber(name: string): number | null {
  const normalized = name.toLowerCase();
  if (normalized.includes("1") && (normalized.includes("péri") || normalized.includes("period"))) return 1;
  if (normalized.includes("2") && (normalized.includes("péri") || normalized.includes("period"))) return 2;
  if (normalized.includes("3") && (normalized.includes("péri") || normalized.includes("period"))) return 3;
  if (normalized.includes("4") && (normalized.includes("péri") || normalized.includes("period"))) return 4;
  return null;
}

export function formatPercentage(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(2)} %`;
}
