export type Role = "mieszkaniec" | "ngo" | "gmina" | "ekspert" | "admin";

export const ROLES: { value: Role; label: string; email: string }[] = [
  { value: "mieszkaniec", label: "Mieszkaniec", email: "halina@demo.hubmi.pl" },
  { value: "ngo", label: "Organizacja", email: "anna.k@razem-blizej.demo" },
  { value: "gmina", label: "Gmina", email: "wojt@gmina-demo.pl" },
  { value: "ekspert", label: "Ekspert", email: "ekspert@demo.hubmi.pl" },
  { value: "admin", label: "ROPS / admin", email: "rops@demo.hubmi.pl" },
];

export function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Lax`;
}

export function currentRole(): Role {
  const value = readCookie("role");
  if (ROLES.some((role) => role.value === value)) return value as Role;
  return "mieszkaniec";
}
