"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EQUIPMENT_OPTIONS = [
  {
    value: "naked_eye",
    label: "맨눈",
  },
  {
    value: "binoculars",
    label: "쌍안경",
  },
  {
    value: "telescope",
    label: "망원경",
  },
  {
    value: "camera",
    label: "카메라",
  },
];

const FALLBACK_IMAGES = {
  moon: "/images/home/moon.png",
  saturn: "/images/home/saturn.png",
  m31: "/images/home/m31.png",
};

export default function ObservationForm({
  userId,
  objects = [],
  initialData = null,
  initialImages = [],
}) {
  const router = useRouter();

  const isEdit = Boolean(initialData?.id);

  const [celestialObjectId, setCelestialObjectId] = useState(
    initialData?.celestial_object_id || "",
  );

  const initialObservedValue = initialData?.observed_at || new Date().toISOString();

  const [observedDate, setObservedDate] = useState(toLocalDate(initialObservedValue));

  const [observedTime, setObservedTime] = useState(toLocalTime(initialObservedValue));

  const [locationName, setLocationName] = useState(initialData?.location_name || "");

  const [equipment, setEquipment] = useState(initialData?.equipment || "");

  const [equipmentDetail, setEquipmentDetail] = useState(initialData?.equipment_detail || "");

  const [rating, setRating] = useState(initialData?.rating || 3);

  const [durationMinutes, setDurationMinutes] = useState(initialData?.duration_minutes || "");

  const [note, setNote] = useState(initialData?.note || "");

  const [existingImages, setExistingImages] = useState(initialImages);

  const [newImages, setNewImages] = useState([]);

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  /*
   * 현재 선택된 천체
   *
   * select 값을 기준으로 실제 celestial object를 찾아
   * 관측 대상 카드에 바로 반영한다.
   */
  const selectedObject = useMemo(() => {
    return objects.find(object => String(object.id) === String(celestialObjectId)) || null;
  }, [objects, celestialObjectId]);

  /*
   * 새로 추가한 사진의 브라우저 미리보기
   */
  const newImagePreviews = useMemo(() => {
    return newImages.map(file => ({
      file,

      url: URL.createObjectURL(file),
    }));
  }, [newImages]);

  const totalImageCount = existingImages.length + newImages.length;

  const handleEquipmentChange = event => {
    const nextEquipment = event.target.value;

    setEquipment(nextEquipment);

    /*
     * 맨눈은 상세 장비가 존재하지 않으므로
     * 기존 값 초기화
     */
    if (nextEquipment === "naked_eye") {
      setEquipmentDetail("");
    }
  };

  const handleImageChange = event => {
    const files = Array.from(event.target.files || []);

    setErrorMessage("");

    if (!files.length) {
      return;
    }

    const availableCount = MAX_IMAGES - totalImageCount;

    if (availableCount <= 0) {
      setErrorMessage(`관측 사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);

      event.target.value = "";

      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setErrorMessage("JPG, PNG, WEBP 이미지만 첨부할 수 있습니다.");

        event.target.value = "";

        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setErrorMessage("사진 한 장의 크기는 5MB 이하여야 합니다.");

        event.target.value = "";

        return;
      }

      validFiles.push(file);
    }

    if (validFiles.length > availableCount) {
      setErrorMessage(`관측 사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
    }

    setNewImages(prev => [...prev, ...validFiles.slice(0, availableCount)]);

    event.target.value = "";
  };

  const removeNewImage = index => {
    setNewImages(prev => prev.filter((_, imageIndex) => imageIndex !== index));
  };

  const removeExistingImage = imageId => {
    setExistingImages(prev => prev.filter(image => image.id !== imageId));
  };

  const handleSubmit = async event => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setErrorMessage("");

    if (!celestialObjectId) {
      setErrorMessage("관측한 천체를 선택해주세요.");

      return;
    }

    if (!observedDate || !observedTime) {
      setErrorMessage("관측 날짜와 시간을 입력해주세요.");

      return;
    }

    if (!locationName.trim()) {
      setErrorMessage("관측 장소를 입력해주세요.");

      return;
    }

    if (!equipment) {
      setErrorMessage("관측 장비를 선택해주세요.");

      return;
    }

    setLoading(true);

    const supabase = createClient();

    const payload = {
      celestial_object_id: Number(celestialObjectId),

      observed_at: new Date(`${observedDate}T${observedTime}`).toISOString(),

      location_name: locationName.trim(),

      equipment,

      equipment_detail: equipment === "naked_eye" ? null : equipmentDetail.trim() || null,

      rating: Number(rating),

      duration_minutes: durationMinutes ? Number(durationMinutes) : null,

      note: note.trim() || null,
    };

    /*
     * ============================
     * UPDATE
     * ============================
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

      /*
       * 기존 이미지 중
       * 사용자가 제거한 이미지
       */
      const deletedImages = initialImages.filter(
        initialImage => !existingImages.some(currentImage => currentImage.id === initialImage.id),
      );

      const deleteResult = await deleteObservationImages({
        supabase,

        images: deletedImages,
      });

      if (!deleteResult.success) {
        setErrorMessage("관측 기록은 수정되었지만 일부 사진을 삭제하지 못했습니다.");

        setLoading(false);

        return;
      }

      /*
       * 새 이미지 추가
       */
      const uploadResult = await uploadObservationImages({
        supabase,

        userId,

        observationId: initialData.id,

        files: newImages,

        startOrder: existingImages.length,
      });

      if (!uploadResult.success) {
        setErrorMessage(uploadResult.message);

        setLoading(false);

        return;
      }

      router.push(`/observations/${initialData.id}`);

      router.refresh();

      return;
    }

    /*
     * ============================
     * CREATE
     * ============================
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

    /*
     * observation을 먼저 생성해서
     * id를 확보한 뒤 이미지 저장
     */
    const uploadResult = await uploadObservationImages({
      supabase,

      userId,

      observationId: data.id,

      files: newImages,

      startOrder: 0,
    });

    if (!uploadResult.success) {
      setErrorMessage(`${uploadResult.message} 관측 기록 자체는 저장되었습니다.`);

      setLoading(false);

      return;
    }

    router.push(`/observations/${data.id}`);

    router.refresh();
  };

  return (
    <form className="observation-form" onSubmit={handleSubmit}>
      {errorMessage && <p className="auth-error">{errorMessage}</p>}

      {/* =========================
          관측 대상
      ========================= */}

      {selectedObject && (
        <section className="observation-target-card">
          <div className="observation-target-image">
            <img
              src={getObjectImage(selectedObject)}
              alt={selectedObject.name_ko || selectedObject.name_en}
            />
          </div>

          <div className="observation-target-content">
            <span className="observation-target-label">관측 대상</span>

            <strong>{getObjectTitle(selectedObject)}</strong>

            {selectedObject.name_ko && <p>{selectedObject.name_ko}</p>}
          </div>
        </section>
      )}

      {/* =========================
          천체 선택
      ========================= */}

      <div className="observation-field">
        <label htmlFor="observation-object">
          관측 천체
          <RequiredMark />
        </label>

        <select
          id="observation-object"
          value={celestialObjectId}
          onChange={event => setCelestialObjectId(event.target.value)}
          required
        >
          <option value="">천체를 선택하세요</option>

          {objects.map(object => (
            <option key={object.id} value={object.id}>
              {getObjectTitle(object)}

              {object.name_ko ? ` · ${object.name_ko}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* =========================
          관측 일시
      ========================= */}

      <div className="observation-field">
        <label>
          관측 일시
          <RequiredMark />
        </label>

        <div className="observation-datetime-grid">
          <div className="observation-datetime-item">
            <span className="observation-sub-label">날짜</span>

            <input
              id="observation-date"
              type="date"
              value={observedDate}
              onChange={event => setObservedDate(event.target.value)}
              required
            />
          </div>

          <div className="observation-datetime-item">
            <span className="observation-sub-label">시간</span>

            <input
              id="observation-time"
              type="time"
              value={observedTime}
              onChange={event => setObservedTime(event.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* =========================
          장소
      ========================= */}

      <div className="observation-field">
        <label htmlFor="observation-location">
          관측 장소
          <RequiredMark />
        </label>

        <input
          id="observation-location"
          type="text"
          value={locationName}
          onChange={event => setLocationName(event.target.value)}
          placeholder="예: 서울 천문대"
          maxLength={150}
          required
        />
      </div>

      {/* =========================
          관측 장비
      ========================= */}

      <div className="observation-field">
        <label htmlFor="observation-equipment">
          관측 장비
          <RequiredMark />
        </label>

        <select
          id="observation-equipment"
          value={equipment}
          onChange={handleEquipmentChange}
          required
        >
          <option value="">관측 장비를 선택하세요</option>

          {EQUIPMENT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {equipment && equipment !== "naked_eye" && (
        <div className="observation-field">
          <label htmlFor="observation-equipment-detail">상세 장비</label>

          <input
            id="observation-equipment-detail"
            type="text"
            value={equipmentDetail}
            onChange={event => setEquipmentDetail(event.target.value)}
            placeholder={getEquipmentPlaceholder(equipment)}
            maxLength={150}
          />

          <span className="observation-field-help">
            모델명이나 렌즈, 배율 등 상세 정보를 자유롭게 기록할 수 있습니다.
          </span>
        </div>
      )}

      {/* =========================
          만족도
      ========================= */}

      <div className="observation-field">
        <label>
          관측 만족도
          <RequiredMark />
        </label>

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

      {/* =========================
          관측 시간
      ========================= */}

      <div className="observation-field">
        <label htmlFor="observation-duration">관측 시간</label>

        <div className="observation-duration-input">
          <input
            id="observation-duration"
            type="number"
            value={durationMinutes}
            onChange={event => setDurationMinutes(event.target.value)}
            min="0"
            max="1440"
            placeholder="60"
          />

          <span>분</span>
        </div>
      </div>

      {/* =========================
          사진
      ========================= */}

      <div className="observation-field">
        <div className="observation-image-label-row">
          <label htmlFor="observation-images">관측 사진</label>

          <span>
            {totalImageCount} / {MAX_IMAGES}
          </span>
        </div>

        <label
          htmlFor="observation-images"
          className={
            totalImageCount >= MAX_IMAGES
              ? "observation-image-upload disabled"
              : "observation-image-upload"
          }
        >
          <span className="observation-image-upload-icon">＋</span>

          <strong>관측 사진 추가</strong>

          <p>JPG, PNG, WEBP · 최대 5MB · 최대 5장</p>
        </label>

        <input
          id="observation-images"
          className="observation-image-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={totalImageCount >= MAX_IMAGES}
          onChange={handleImageChange}
        />

        {(existingImages.length > 0 || newImagePreviews.length > 0) && (
          <div className="observation-image-preview-grid">
            {existingImages.map(image => (
              <ImagePreview
                key={`existing-${image.id}`}
                src={image.previewUrl}
                onRemove={() => removeExistingImage(image.id)}
              />
            ))}

            {newImagePreviews.map((image, index) => (
              <ImagePreview
                key={`new-${image.file.name}-${index}`}
                src={image.url}
                onRemove={() => removeNewImage(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* =========================
          메모
      ========================= */}

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

      {/* =========================
          Actions
      ========================= */}

      <div className="observation-form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => router.back()}
          disabled={loading}
        >
          취소
        </button>

        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? "저장 중..." : isEdit ? "수정 완료" : "관측 기록 저장"}
        </button>
      </div>
    </form>
  );
}

function RequiredMark() {
  return (
    <span className="observation-required" aria-hidden="true">
      *
    </span>
  );
}

function ImagePreview({ src, onRemove }) {
  return (
    <div className="observation-image-preview">
      <img src={src} alt="관측 사진 미리보기" />

      <button type="button" onClick={onRemove} aria-label="사진 삭제">
        ×
      </button>
    </div>
  );
}

function getObjectImage(object) {
  return object?.image_url || FALLBACK_IMAGES[object?.external_id] || "/images/home/hero.png";
}

function getObjectTitle(object) {
  if (!object) {
    return "";
  }

  /*
   * catalog_name과 name_en이 같은 경우
   * Jupiter · Jupiter처럼 중복되지 않게 한다.
   */
  if (
    object.catalog_name &&
    object.name_en &&
    object.catalog_name.toLowerCase() !== object.name_en.toLowerCase()
  ) {
    return `${object.catalog_name} · ${object.name_en}`;
  }

  return object.name_en || object.catalog_name || object.name_ko || "Unknown Object";
}

function getEquipmentPlaceholder(equipment) {
  switch (equipment) {
    case "binoculars":
      return "예: Nikon Action EX 10×50";

    case "telescope":
      return "예: Celestron NexStar 6SE";

    case "camera":
      return "예: Sony A7 IV + 200mm";

    default:
      return "상세 장비를 입력하세요";
  }
}

async function uploadObservationImages({ supabase, userId, observationId, files, startOrder = 0 }) {
  if (!files.length) {
    return {
      success: true,
    };
  }

  const uploaded = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

      const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const storagePath = `${userId}/${observationId}/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from("observation-images")
        .upload(storagePath, file, {
          cacheControl: "3600",

          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      uploaded.push({
        path: storagePath,

        sort_order: startOrder + index,
      });
    }

    const { error: dbError } = await supabase.from("observation_images").insert(
      uploaded.map(image => ({
        observation_id: observationId,

        image_url: image.path,

        sort_order: image.sort_order,
      })),
    );

    if (dbError) {
      throw dbError;
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("관측 이미지 업로드 오류:", error);

    if (uploaded.length) {
      await supabase.storage.from("observation-images").remove(uploaded.map(image => image.path));
    }

    return {
      success: false,

      message: "관측 사진을 저장하지 못했습니다.",
    };
  }
}

async function deleteObservationImages({ supabase, images }) {
  if (!images.length) {
    return {
      success: true,
    };
  }

  try {
    const paths = images.map(image => image.image_url);

    const ids = images.map(image => image.id);

    const { error: storageError } = await supabase.storage.from("observation-images").remove(paths);

    if (storageError) {
      throw storageError;
    }

    const { error: dbError } = await supabase.from("observation_images").delete().in("id", ids);

    if (dbError) {
      throw dbError;
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("관측 이미지 삭제 오류:", error);

    return {
      success: false,
    };
  }
}

function toLocalDate(value) {
  const date = new Date(value);

  const offset = date.getTimezoneOffset();

  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 10);
}

function toLocalTime(value) {
  const date = new Date(value);

  const offset = date.getTimezoneOffset();

  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(11, 16);
}
