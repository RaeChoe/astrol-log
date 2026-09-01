"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function FavoriteButton({
  userId,
  objectId,
  initialFavorite = false,
  initialLoadError = false,
}) {
  const router = useRouter();

  const [favorite, setFavorite] = useState(initialFavorite);

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const handleFavorite = async () => {
    if (loading || initialLoadError) {
      return;
    }

    if (!userId) {
      router.push(`/login?next=${encodeURIComponent(`/objects/${objectId}`)}`);

      return;
    }

    setLoading(true);

    setErrorMessage("");

    const supabase = createClient();

    /*
     * 관심 천체 해제
     */
    if (favorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("celestial_object_id", objectId);

      if (error) {
        console.error("관심 천체 삭제 오류:", error);

        setErrorMessage("관심 천체를 해제하지 못했습니다.");

        setLoading(false);

        return;
      }

      setFavorite(false);

      setLoading(false);

      router.refresh();

      return;
    }

    /*
     * 관심 천체 추가
     */

    const { error } = await supabase.from("favorites").insert({
      user_id: userId,

      celestial_object_id: objectId,
    });

    if (error) {
      console.error("관심 천체 추가 오류:", error);

      setErrorMessage("관심 천체를 추가하지 못했습니다.");

      setLoading(false);

      return;
    }

    setFavorite(true);

    setLoading(false);

    router.refresh();
  };

  return (
    <div className="object-favorite-area">
      <button
        type="button"
        className={favorite ? "object-favorite-button active" : "object-favorite-button"}
        onClick={handleFavorite}
        disabled={loading || initialLoadError}
        aria-pressed={favorite}
        aria-label={favorite ? "관심 천체에서 제거" : "관심 천체에 추가"}
      >
        <span className="object-favorite-icon" aria-hidden="true">
          {favorite ? "★" : "☆"}
        </span>

        <span>
          {initialLoadError
            ? "상태 확인 불가"
            : loading
              ? "처리 중..."
              : favorite
                ? "관심 천체"
                : "관심 천체 추가"}
        </span>
      </button>

      {initialLoadError && (
        <p className="object-favorite-error">
          관심 천체 상태를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.
        </p>
      )}

      {errorMessage && <p className="object-favorite-error">{errorMessage}</p>}
    </div>
  );
}
