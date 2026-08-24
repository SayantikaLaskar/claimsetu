import { cookies } from "next/headers";
import { MEMBERS } from "@/lib/data/members";
import type { MemberProfile } from "@/lib/engine/types";

/**
 * Mock session.
 *
 * A cookie holding a UAN, and nothing else. There is no password hashing here
 * because there are no passwords worth hashing — every credential in this
 * prototype is printed on the sign-in screen. Keeping that obvious in the code
 * matters more than making it look like real auth: anyone reading this should be
 * unable to mistake it for something that protects anything.
 */

const COOKIE = "claimsetu_uan";

export async function signIn(uan: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, uan, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function currentUan(): Promise<string | null> {
  const jar = await cookies();
  const uan = jar.get(COOKIE)?.value;
  return uan && MEMBERS[uan] ? uan : null;
}

export async function currentMember(): Promise<MemberProfile | null> {
  const uan = await currentUan();
  return uan ? MEMBERS[uan] : null;
}

/** Credentials, printed on the sign-in page because that is the point. */
export const MOCK_CREDENTIALS: Record<string, { password: string }> = {
  "900000000001": { password: "ramesh@2026" },
  "900000000002": { password: "sunita@2026" },
  "900000000003": { password: "irfan@2026" },
  "900000000004": { password: "ganesh@2026" },
  "900000000005": { password: "lakshmi@2026" },
};

export function checkCredentials(uan: string, password: string): boolean {
  return MOCK_CREDENTIALS[uan]?.password === password;
}
