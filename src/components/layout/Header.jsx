import { createClient } from "@/lib/supabase/server";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;

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

    /*
     * Google OAuth 이미지처럼
     * 외부 URL이 아닌 경우
     * private Storage 경로로 판단.
     */
    if (
      profile?.avatar_url &&
      !profile.avatar_url.startsWith("http://") &&
      !profile.avatar_url.startsWith("https://")
    ) {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("profile-images")
        .createSignedUrl(profile.avatar_url, 60 * 60);

      if (signedUrlError) {
        console.error("헤더 프로필 이미지 URL 오류:", signedUrlError);
      }

      profile = {
        ...profile,

        avatar_url: signedUrlData?.signedUrl || null,
      };
    }
  }

  return <HeaderClient user={user} profile={profile} />;
}
