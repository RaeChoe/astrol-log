// 공통 서버용 로그인 체크 함수
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser(nextPath = "/") {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = encodeURIComponent(nextPath);

    redirect(`/login?next=${next}`);
  }

  return user;
}
