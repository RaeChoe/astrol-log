"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ObservationForm({ userId, objects = [], initialData = null }) {
  const router = useRouter();

  const isEdit = Boolean(initialData?.id);

  const [celestialObjectId, setCelestialObjectId] = useState(
    initialData?.celestial_object_id || "",
  );

  const [observedAt, setObservedAt] = useState(
    initialData?.observed_at
      ? toDatetimeLocal(initialData.observed_at)
      : toDatetimeLocal(new Date().toISOString()),
  );

  const [locationName, setLocationName] = useState(initialData?.location_name || "");

  const [equipment, setEquipment] = useState(initialData?.equipment || "");

  const [rating, setRating] = useState(initialData?.rating || 3);

  const [durationMinutes, setDurationMinutes] = useState(initialData?.duration_minutes || "");

  const [note, setNote] = useState(initialData?.note || "");

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async event => {
    event.preventDefault();

    if (loading) return;

    setErrorMessage("");

    if (!celestialObjectId) {
      setErrorMessage("관측한 천체를 선택해주세요.");

      return;
    }

    setLoading(true);

    const supabase = createClient();

    const payload = {
      celestial_object_id: celestialObjectId,

      observed_at: new Date(observedAt).toISOString(),

      location_name: locationName.trim() || null,

      equipment: equipment.trim() || null,

      rating: Number(rating),

      duration_minutes: durationMinutes ? Number(durationMinutes) : null,

      note: note.trim() || null,

      updated_at: new Date().toISOString(),
    };

    /*
     * 수정
     */
    if (isEdit) {
      const { error } = await supabase
        .from("observations")
        .update(payload)
        .eq("id", initialData.id)
        .eq("user_id", userId);

      if (error) {
        console.error("관측 기록 수정 오류:", error);

        setErrorMessage("관측 기록을 수정하지 못했습니다.");

        setLoading(false);

        return;
      }

      router.push(`/observations/${initialData.id}`);

      router.refresh();

      return;
    }

    /*
     * 신규 등록
     */
    const { data, error } = await supabase
      .from("observations")
      .insert({
        ...payload,
        user_id: userId,
      })
      .select("id")
      .single();

    if (error) {
      console.error("관측 기록 등록 오류:", error);

      setErrorMessage("관측 기록을 저장하지 못했습니다.");

      setLoading(false);

      return;
    }

    router.push(`/observations/${data.id}`);

    router.refresh();
  };

  return (
    <form className="observation-form" onSubmit={handleSubmit}>
      {errorMessage && <p className="auth-error">{errorMessage}</p>}

      {/* 천체 */}

      <div className="observation-field">
        <label htmlFor="observation-object">관측 천체</label>

        <select
          id="observation-object"
          value={celestialObjectId}
          onChange={event => setCelestialObjectId(event.target.value)}
          required
        >
          <option value="">천체를 선택하세요</option>

          {objects.map(object => (
            <option key={object.id} value={object.id}>
              {object.catalog_name ? `${object.catalog_name} · ` : ""}
              {object.name_ko || object.name_en}
            </option>
          ))}
        </select>
      </div>

      {/* 날짜 */}

      <div className="observation-field">
        <label htmlFor="observation-date">관측 일시</label>

        <input
          id="observation-date"
          type="datetime-local"
          value={observedAt}
          onChange={event => setObservedAt(event.target.value)}
          required
        />
      </div>

      {/* 장소 */}

      <div className="observation-field">
        <label htmlFor="observation-location">관측 장소</label>

        <input
          id="observation-location"
          type="text"
          value={locationName}
          onChange={event => setLocationName(event.target.value)}
          placeholder="예: 서울 한강공원"
          maxLength={100}
        />
      </div>

      {/* 장비 */}

      <div className="observation-field">
        <label htmlFor="observation-equipment">관측 장비</label>

        <input
          id="observation-equipment"
          type="text"
          value={equipment}
          onChange={event => setEquipment(event.target.value)}
          placeholder="예: Celestron NexStar 6SE"
          maxLength={150}
        />
      </div>

      {/* 관측 만족도 */}

      <div className="observation-field">
        <label>관측 만족도</label>

        <div className="observation-rating">
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              type="button"
              className={value <= rating ? "observation-star active" : "observation-star"}
              onClick={() => setRating(value)}
              aria-label={`${value}점`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* 관측 시간 */}

      <div className="observation-field">
        <label htmlFor="observation-duration">관측 시간</label>

        <div className="observation-duration-input">
          <input
            id="observation-duration"
            type="number"
            value={durationMinutes}
            onChange={event => setDurationMinutes(event.target.value)}
            min="1"
            max="1440"
            placeholder="60"
          />

          <span>분</span>
        </div>
      </div>

      {/* 메모 */}

      <div className="observation-field">
        <label htmlFor="observation-note">관측 기록</label>

        <textarea
          id="observation-note"
          value={note}
          onChange={event => setNote(event.target.value)}
          placeholder="오늘 관측에서 기억하고 싶은 순간을 기록해보세요."
          rows={8}
        />
      </div>

      <div className="observation-form-actions">
        <button type="button" className="button button-secondary" onClick={() => router.back()}>
          취소
        </button>

        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? "저장 중..." : isEdit ? "수정 완료" : "관측 기록 저장"}
        </button>
      </div>
    </form>
  );
}

function toDatetimeLocal(value) {
  const date = new Date(value);

  const offset = date.getTimezoneOffset();

  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}
