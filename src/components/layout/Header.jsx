import { createClient } from "@/lib/supabase/server";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const supabase = await createClient();

  /*
   * 현재 로그인 사용자 조회
   *
   * getUser():
   * - Supabase Auth 서버에 사용자 정보를 확인
   * - 로그인 상태 확인에 사용
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;

  /*
   * 로그인된 사용자가 있을 경우 profiles 조회
   *
   * profiles 테이블은 auth.users와 user_id로 연결되어 있음.
   * Header에서는 닉네임과 프로필 이미지만 필요하므로
   * 필요한 컬럼만 조회.
   */
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("nickname, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("프로필 조회 오류:", error);
    }

    profile = data;
  }

  return <HeaderClient user={user} profile={profile} />;
}
