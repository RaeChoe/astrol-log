"use client";

import Link from "next/link";

import { useEffect, useRef, useState } from "react";

import LogoutButton from "./LogoutButton";

export default function ProfileDropdown({ user, profile, nickname, initial }) {
  const [open, setOpen] = useState(false);

  const [avatarFailed, setAvatarFailed] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /*
   * router.refresh 등으로
   * 새 avatar URL이 내려오면
   * 이전 이미지 실패 상태를 초기화.
   */
  useEffect(() => {
    setAvatarFailed(false);
  }, [profile?.avatar_url]);

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="profile-trigger"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${nickname} 프로필 메뉴`}
      >
        {profile?.avatar_url && !avatarFailed ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="header-avatar-image"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <span className="header-avatar">{initial}</span>
        )}
      </button>

      {open && (
        <div className="profile-menu" role="menu">
          <div className="profile-menu-user">
            <strong>{nickname}</strong>

            <span>{user.email}</span>
          </div>

          <div className="profile-menu-divider" />

          <Link
            href="/observatory"
            className="profile-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            My Observatory
          </Link>

          <Link
            href="/collection"
            className="profile-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            나의 천체 도감
          </Link>

          <div className="profile-menu-divider" />

          <LogoutButton />
        </div>
      )}
    </div>
  );
}
