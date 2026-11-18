/** E-mail autorizzate ad accedere al pannello RIWY (sempre in minuscolo). */
export const ADMIN_EMAILS: readonly string[] = [
  "b.fattorusso7@gmail.com",
  "federico.toni2004@gmail.com",
  "ddalebast73@gmail.com",
  "speedberard@gmail.com",
  "federicotoni04.peggy@gmail.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
