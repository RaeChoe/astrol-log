"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteObservationButton({ observationId }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (loading) return;

    const confirmed = window.confirm(
      "이 관측 기록을 삭제할까요?\n첨부한 관측 사진도 함께 삭제되며 복구할 수 없습니다.",
    );

    if (!confirmed) return;

    setLoading(true);

    const supabase = createClient();

    /*
     * 1. 현재 로그인 사용자 확인
     */
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("사용자 확인 오류:", userError);

      router.push(`/login?next=/observations/${observationId}`);

      return;
    }

    /*
     * 2. 삭제 전에 Storage path 확보
     *
     * observations가 삭제되면
     * observation_images row도 cascade로 사라지므로
     * 반드시 먼저 image_url을 가져온다.
     */
    const { data: images, error: imageFetchError } = await supabase
      .from("observation_images")
      .select("id, image_url")
      .eq("observation_id", observationId);

    if (imageFetchError) {
      console.error("관측 이미지 조회 오류:", imageFetchError);

      alert("관측 사진 정보를 불러오지 못했습니다.");

      setLoading(false);

      return;
    }

    /*
     * 3. 관측 기록 삭제
     *
     * user_id까지 조건에 포함해서
     * 본인의 관측 기록만 삭제 가능.
     *
     * observation_images DB row는
     * FK ON DELETE CASCADE로 자동 삭제됨.
     */
    const { error: deleteError } = await supabase
      .from("observations")
      .delete()
      .eq("id", observationId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("관측 기록 삭제 오류:", deleteError);

      alert("관측 기록을 삭제하지 못했습니다.");

      setLoading(false);

      return;
    }

    /*
     * 4. Storage 실제 파일 삭제
     *
     * DB 기록을 먼저 정상 삭제한 뒤
     * Storage 파일을 정리한다.
     *
     * Storage 삭제에 실패해도
     * 사용자 관측 기록 삭제 자체는 성공한 상태.
     */
    const storagePaths = (images || []).map(image => image.image_url).filter(Boolean);

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("observation-images")
        .remove(storagePaths);

      if (storageError) {
        /*
         * 사용자 기록은 이미 정상 삭제됨.
         * Storage에 orphan file만 남는 상황이므로
         * 사용자에게 삭제 실패로 보이게 하지는 않고
         * 개발 콘솔에 기록.
         */
        console.error("Storage 관측 사진 정리 오류:", storageError);
      }
    }

    /*
     * 5. 목록으로 이동
     */
    router.push("/observations");
    router.refresh();
  };

  return (
    <button
      type="button"
      className="observation-delete-button"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}
