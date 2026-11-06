/** Peruvian RUC validation (SUNAT módulo 11), mirroring the backend's suppliers.domain.ruc. */

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
const PREFIXES = ["10", "15", "17", "20"];

function rucCheckDigit(firstTen: string): number {
  const sum = WEIGHTS.reduce((acc, w, i) => acc + Number(firstTen[i]) * w, 0);
  const digit = 11 - (sum % 11);
  return digit === 10 ? 0 : digit === 11 ? 1 : digit;
}

/** A message that says what to fix, or null when the RUC is valid. */
export function rucError(ruc: string): string | null {
  if (ruc.length === 0) return "Escribe el RUC del proveedor.";
  if (!/^\d+$/.test(ruc)) return "El RUC solo lleva números.";
  if (ruc.length !== 11) return `El RUC tiene 11 dígitos (llevas ${ruc.length}).`;
  if (!PREFIXES.includes(ruc.slice(0, 2))) return "El RUC empieza con 10, 15, 17 o 20.";
  if (rucCheckDigit(ruc.slice(0, 10)) !== Number(ruc[10])) return "El último dígito no cuadra: revisa que esté bien copiado.";
  return null;
}

export function rucKind(ruc: string): string {
  switch (ruc.slice(0, 2)) {
    case "10":
      return "Persona natural";
    case "20":
      return "Empresa";
    case "15":
    case "17":
      return "Otro contribuyente";
    default:
      return "";
  }
}
