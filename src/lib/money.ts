/** Money rules shared by the till and purchases (mirror of the backend's invoicing domain). */

/** Peru's IGV. */
export const IGV_RATE = 0.18;

/** Rounds to céntimos. */
export const round2 = (v: number): number => Math.round((v + Number.EPSILON) * 100) / 100;
