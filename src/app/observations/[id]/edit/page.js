import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

export default async function EditObservationPage({ params }) {
  const { id } = await params;

  const user = await requireUser(`/observations/${id}/edit`);

  const supabase = await createClient();

  const { data: observation } = await supabase
    .from("observations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!observation) {
    notFound();
  }

  return <main>{/* 수정 폼 */}</main>;
}
