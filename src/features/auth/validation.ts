/** Client-side checks for the sign-in and sign-up forms. Messages are shown under each field. */

const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** SUNAT RUC: 11 digits starting with 10 (person), 15, 17 or 20 (company). */
const RUC_PATTERN = /^(10|15|17|20)\d{9}$/;
const LETTER = /[A-Za-zÁÉÍÓÚáéíóúÑñ]/;

/** Shape check only (something@domain.tld); the API has the last word. */
export const isEmail = (email: string) => EMAIL_PATTERN.test(email.trim());

export function emailError(email: string): string | null {
  if (!email.trim()) return "Escribe tu correo.";
  return isEmail(email) ? null : "Revisa el correo: falta la @ o el dominio.";
}

export function rucError(ruc: string): string | null {
  if (!ruc) return "Escribe el RUC de tu negocio.";
  if (ruc.length !== 11) return `El RUC tiene 11 dígitos (llevas ${ruc.length}).`;
  return RUC_PATTERN.test(ruc) ? null : "El RUC empieza con 10, 15, 17 o 20.";
}

export function newPasswordError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (!LETTER.test(password) || !/\d/.test(password)) return "Combina letras y números.";
  return null;
}

/** 0 = empty, 1 weak, 2 fair, 3 strong. Purely a visual aid; the rule above is what blocks. */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (/\d/.test(password) && LETTER.test(password)) score++;
  if (password.length >= 12 || /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9]/.test(password)) score++;
  return Math.max(1, score) as 1 | 2 | 3;
}
