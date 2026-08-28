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
      "이 관측 기록을 삭제할까요?\n삭제된 기록은 복구할 수 없습니다.",
    );

    if (!confirmed) return;

    setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");

      return;
    }

    const { error } = await supabase
      .from("observations")
      .delete()
      .eq("id", observationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("관측 기록 삭제 오류:", error);

      alert("관측 기록을 삭제하지 못했습니다.");

      setLoading(false);

      return;
    }

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
