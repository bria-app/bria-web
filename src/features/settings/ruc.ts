const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Explains what is wrong with a RUC, or returns null when it is valid: 11 digits, a SUNAT
 * prefix (10, 15, 17 or 20) and the check digit.
 */
export function rucProblem(ruc: string): string | null {
  const digits = ruc.replace(/\D/g, "");
  if (digits.length !== 11) return `El RUC tiene 11 dígitos (este tiene ${digits.length}).`;
  if (!/^(10|15|17|20)/.test(digits)) return "El RUC empieza con 10, 15, 17 o 20.";
  const sum = WEIGHTS.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
  const rest = 11 - (sum % 11);
  const check = rest === 10 ? 0 : rest === 11 ? 1 : rest;
  if (check !== Number(digits[10])) return "El último dígito no coincide con el de SUNAT. Revisa si hay un número cambiado.";
  return null;
}
