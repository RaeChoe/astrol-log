"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const MAX_AVATAR_SIZE = 3 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ObservatoryProfileForm({ userId, initialNickname, initialAvatarUrl }) {
  const router = useRouter();

  const fileInputRef = useRef(null);

  const previewObjectUrlRef = useRef("");

  const [nickname, setNickname] = useState(initialNickname || "");

  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl || "");

  const [avatarFile, setAvatarFile] = useState(null);

  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  /*
   * router.refresh() 이후
   * 서버에서 변경된 프로필 값이 내려오면
   * 편집 중이 아닐 때 로컬 상태도 동기화.
   */
  useEffect(() => {
    if (!editing) {
      setNickname(initialNickname || "");

      if (!avatarFile) {
        setAvatarPreview(initialAvatarUrl || "");
      }
    }
  }, [initialNickname, initialAvatarUrl, editing, avatarFile]);

  /*
   * Object URL 메모리 정리.
   */
  useEffect(() => {
    return () => {
      revokePreviewObjectUrl(previewObjectUrlRef);
    };
  }, []);

  const handleAvatarButton = () => {
    if (!editing || loading) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleAvatarChange = event => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setErrorMessage("");

    setSuccessMessage("");

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setErrorMessage("JPG, PNG, WEBP 이미지만 사용할 수 있습니다.");

      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setErrorMessage("프로필 이미지는 3MB 이하여야 합니다.");

      return;
    }

    revokePreviewObjectUrl(previewObjectUrlRef);

    setAvatarFile(file);

    const previewUrl = URL.createObjectURL(file);

    previewObjectUrlRef.current = previewUrl;

    setAvatarPreview(previewUrl);
  };

  const handleCancel = () => {
    if (loading) {
      return;
    }

    revokePreviewObjectUrl(previewObjectUrlRef);

    setNickname(initialNickname || "");

    setAvatarPreview(initialAvatarUrl || "");

    setAvatarFile(null);

    setEditing(false);

    setErrorMessage("");

    setSuccessMessage("");
  };

  const handleSave = async event => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setErrorMessage("");

    setSuccessMessage("");

    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      setErrorMessage("닉네임을 입력해주세요.");

      return;
    }

    if (trimmedNickname.length > 20) {
      setErrorMessage("닉네임은 20자 이하로 입력해주세요.");

      return;
    }

    setLoading(true);

    const supabase = createClient();

    let nextAvatarPath = null;

    /*
     * 새 프로필 사진 저장.
     */
    if (avatarFile) {
      const extension = getFileExtension(avatarFile);

      const storagePath = `${userId}/avatar.${extension}`;

      const { error: uploadError } = await supabase.storage.from("profile-images").upload(
        storagePath,

        avatarFile,

        {
          upsert: true,

          cacheControl: "3600",
        },
      );

      if (uploadError) {
        console.error("프로필 이미지 업로드 오류:", uploadError);

        setErrorMessage("프로필 이미지를 저장하지 못했습니다.");

        setLoading(false);

        return;
      }

      nextAvatarPath = storagePath;
    }

    const updatePayload = {
      nickname: trimmedNickname,
    };

    if (nextAvatarPath) {
      updatePayload.avatar_url = nextAvatarPath;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("user_id", userId);

    if (profileError) {
      console.error("프로필 수정 오류:", profileError);

      setErrorMessage("프로필을 수정하지 못했습니다.");

      setLoading(false);

      return;
    }

    revokePreviewObjectUrl(previewObjectUrlRef);

    setLoading(false);

    setEditing(false);

    setAvatarFile(null);

    setSuccessMessage("프로필이 수정되었습니다.");

    router.refresh();
  };

  /*
   * signed URL 만료 / 잘못된 파일 /
   * 브라우저가 미리보기를 불러오지 못하는 경우
   * 깨진 이미지 대신 이니셜로 fallback.
   */
  const handleAvatarPreviewError = () => {
    revokePreviewObjectUrl(previewObjectUrlRef);

    if (avatarFile) {
      setErrorMessage("선택한 프로필 이미지를 미리볼 수 없습니다.");

      setAvatarFile(null);
    }

    setAvatarPreview("");
  };

  return (
    <form className="observatory-profile-form" onSubmit={handleSave}>
      <div className="observatory-profile-avatar-area">
        <div className="observatory-avatar-wrapper">
          <button
            type="button"
            className={
              editing ? "observatory-profile-avatar editable" : "observatory-profile-avatar"
            }
            onClick={handleAvatarButton}
            disabled={!editing || loading}
            aria-label={editing ? "프로필 이미지 변경" : "프로필 이미지"}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="" onError={handleAvatarPreviewError} />
            ) : (
              <span>{getInitial(nickname || initialNickname)}</span>
            )}
          </button>

          {editing && (
            <span className="observatory-avatar-edit-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M8.5 6.5 9.8 4.5h4.4l1.3 2H19a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />

                <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="observatory-avatar-input"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarChange}
        />

        {editing && <p className="observatory-avatar-help">JPG, PNG, WEBP · 최대 3MB</p>}
      </div>

      <div className="observatory-profile-info">
        {editing ? (
          <div className="observatory-profile-field">
            <label htmlFor="observatory-nickname">닉네임</label>

            <input
              id="observatory-nickname"
              type="text"
              value={nickname}
              onChange={event => setNickname(event.target.value)}
              maxLength={20}
              placeholder="닉네임"
            />

            <span>{nickname.length} / 20</span>
          </div>
        ) : (
          <>
            <span className="section-label">MY OBSERVATORY</span>

            <h1 className="heading-ko">
              {initialNickname}
              님의 관측소
            </h1>

            <p>밤하늘에서 발견한 순간들과 수집한 천체를 한곳에서 확인하세요.</p>
          </>
        )}

        {errorMessage && <p className="observatory-profile-error">{errorMessage}</p>}

        {successMessage && <p className="observatory-profile-success">{successMessage}</p>}
      </div>

      <div className="observatory-profile-actions">
        {editing ? (
          <>
            <button
              type="button"
              className="button button-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              취소
            </button>

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? "저장 중..." : "저장"}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setEditing(true);

              setSuccessMessage("");
            }}
          >
            프로필 수정
          </button>
        )}
      </div>
    </form>
  );
}

function getInitial(value = "") {
  return value.trim().charAt(0) || "★";
}

function getFileExtension(file) {
  switch (file.type) {
    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      return "jpg";
  }
}

function revokePreviewObjectUrl(previewObjectUrlRef) {
  if (!previewObjectUrlRef.current) {
    return;
  }

  URL.revokeObjectURL(previewObjectUrlRef.current);

  previewObjectUrlRef.current = "";
}
