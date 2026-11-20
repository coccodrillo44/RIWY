/** E-mail autorizzate ad accedere al pannello RIWY (sempre in minuscolo). */
export const ADMIN_EMAILS: readonly string[] = [
  "tfdlab.info@gmail.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
