/**
 * Devuelve los periodos académicos en los que se permite crear grupos/horarios o matrícula.
 * Solo año actual; el semestre disponible depende del mes:
 * - Semestre 1 (AÑO-1): enero a junio (meses 1-6)
 * - Semestre 2 (AÑO-2): julio a diciembre (meses 7-12)
 */
export function getAvailableAcademicPeriods(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  if (month >= 1 && month <= 6) {
    return [`${year}-1`];
  }
  // julio a diciembre
  return [`${year}-2`];
}
