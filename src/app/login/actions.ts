"use server";

import { redirect } from "next/navigation";
import { checkCredentials, signIn, signOut } from "@/lib/session";

export async function signInAction(formData: FormData) {
  const uan = String(formData.get("uan") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!checkCredentials(uan, password)) {
    redirect(`/login?error=1&uan=${encodeURIComponent(uan)}`);
  }

  await signIn(uan);
  redirect("/portal");
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}
