"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMembershipRequest(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { error } = await supabase.from("membership_requests").insert({
    profile_id: user.id,
    mensaje: (formData.get("mensaje") as string) ?? "",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile", "layout");
  redirect("/profile");
}
