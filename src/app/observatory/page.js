import Link from "next/link";

import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

import ObservatoryProfileForm from "@/components/observatory/ObservatoryProfileForm";

export const metadata = {
  title: "My Observatory | AstroLog",
};

const EQUIPMENT_LABELS = {
  naked_eye: "맨눈",
  binoculars: "쌍안경",
  telescope: "망원경",
  camera: "카메라",
};

const FALLBACK_IMAGES = {
  moon: "/images/home/moon.png",
  saturn: "/images/home/saturn.png",
  m31: "/images/home/m31.png",
};

export default async function ObservatoryPage() {
  const user = await requireUser("/observatory");

  const supabase = await createClient();

  /*
   * 프로필 / 관측 기록 / 관심 천체 / 전체 천체를
   * 서로 독립적으로 동시에 조회한다.
   */
  const [profileResult, observationsResult, favoritesResult, objectsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        `
        nickname,
        avatar_url,
        created_at
      `,
      )
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("observations")
      .select(
        `
        id,
        celestial_object_id,
        observed_at,
        location_name,
        equipment,
        rating,
        duration_minutes,
        note,

        celestial_objects (
          id,
          catalog_name,
          name_en,
          name_ko,
          type,
          image_url,
          external_id
        ),

        observation_images (
          id,
          image_url,
          sort_order
        )
      `,
      )
      .eq("user_id", user.id)
      .order("observed_at", {
        ascending: false,
      }),

    supabase
      .from("favorites")
      .select(
        `
        id,
        celestial_object_id,
        created_at,

        celestial_objects (
          id,
          catalog_name,
          name_en,
          name_ko,
          type,
          image_url,
          external_id
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      }),

    supabase.from("celestial_objects").select("id"),
  ]);

  /*
   * =========================
   * ERROR CHECK
   * =========================
   */

  if (profileResult.error) {
    console.error("Observatory 프로필 조회 오류:", profileResult.error);
  }

  if (observationsResult.error) {
    console.error("Observatory 관측 기록 조회 오류:", observationsResult.error);
  }

  if (favoritesResult.error) {
    console.error("Observatory 관심 천체 조회 오류:", favoritesResult.error);
  }

  if (objectsResult.error) {
    console.error("Observatory 전체 천체 조회 오류:", objectsResult.error);
  }

  /*
   * =========================
   * DATA
   * =========================
   */

  const profile = profileResult.data;

  const observations = observationsResult.data || [];

  const favorites = favoritesResult.data || [];

  const totalObjects = objectsResult.data?.length || 0;

  /*
   * =========================
   * PROFILE AVATAR
   * =========================
   */

  const avatarUrl = await resolveProfileAvatar({
    supabase,

    avatarUrl: profile?.avatar_url,
  });

  /*
   * =========================
   * STATISTICS
   * =========================
   */

  const totalObservations = observations.length;

  /*
   * 같은 천체를 여러 번 관측하더라도
   * 고유 천체 수는 1개로 계산.
   */
  const observedObjectIds = new Set(
    observations.map(observation => observation.celestial_object_id),
  );

  const observedObjects = observedObjectIds.size;

  const favoriteCount = favorites.length;

  const totalMinutes = observations.reduce(
    (total, observation) => total + (observation.duration_minutes || 0),
    0,
  );

  const ratingObservations = observations.filter(observation => observation.rating);

  const averageRating = ratingObservations.length
    ? ratingObservations.reduce((total, observation) => total + observation.rating, 0) /
      ratingObservations.length
    : 0;

  const collectionProgress =
    totalObjects > 0 ? Math.round((observedObjects / totalObjects) * 100) : 0;

  /*
   * =========================
   * RECENT OBSERVATIONS
   * =========================
   *
   * 최근 3개 기록만 My Observatory에 표시.
   */

  const recentObservations = await Promise.all(
    observations.slice(0, 3).map(async observation => {
      const images = [...(observation.observation_images || [])].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
      );

      const representative = images[0];

      let observationImage = null;

      /*
       * 관측 사진은 private bucket이므로
       * signed URL을 생성한다.
       */
      if (representative?.image_url) {
        const { data, error } = await supabase.storage
          .from("observation-images")
          .createSignedUrl(representative.image_url, 60 * 60);

        if (error) {
          console.error("Observatory 관측 사진 URL 오류:", error);
        }

        observationImage = data?.signedUrl || null;
      }

      return {
        ...observation,

        thumbnail: observationImage || getObjectImage(observation.celestial_objects),
      };
    }),
  );

  const nickname = profile?.nickname || getEmailNickname(user.email);

  return (
    <main className="observatory-page">
      {/* =========================
          PROFILE
      ========================= */}

      <section className="container observatory-profile-section">
        <ObservatoryProfileForm
          userId={user.id}
          initialNickname={nickname}
          initialAvatarUrl={avatarUrl}
        />

        <div className="observatory-profile-subinfo">
          <span>{user.email}</span>

          {profile?.created_at && <span>Joined {formatJoinedDate(profile.created_at)}</span>}

          <span>{observedObjects}개의 천체 관측</span>
        </div>
      </section>

      {/* =========================
          STATISTICS
      ========================= */}

      <section className="container observatory-section">
        <div className="observatory-section-header">
          <div>
            <span className="section-label">OBSERVATION SUMMARY</span>

            <h2 className="heading-ko">나의 관측 통계</h2>
          </div>
        </div>

        <div className="observatory-stat-grid">
          <StatCard label="TOTAL OBSERVATIONS" value={totalObservations} unit="회" />

          <StatCard
            label="OBJECTS OBSERVED"
            value={observedObjects}
            unit={totalObjects ? `/ ${totalObjects}` : "개"}
          />

          <StatCard label="FAVORITES" value={favoriteCount} unit="개" />

          <StatCard label="OBSERVING TIME" value={formatDuration(totalMinutes)} />

          <StatCard
            label="AVERAGE RATING"
            value={ratingObservations.length ? averageRating.toFixed(1) : "-"}
            unit={ratingObservations.length ? "/ 5" : ""}
          />
        </div>

        {/* =========================
            COLLECTION PROGRESS
        ========================= */}

        <div className="observatory-progress-card">
          <div className="observatory-progress-heading">
            <div>
              <span>COLLECTION PROGRESS</span>

              <strong>천체 도감 진행률</strong>
            </div>

            <strong>{collectionProgress}%</strong>
          </div>

          <div className="observatory-progress-track">
            <div
              className="observatory-progress-bar"
              style={{
                width: `${collectionProgress}%`,
              }}
            />
          </div>

          <div className="observatory-progress-footer">
            <span>{observedObjects}개의 천체를 관측했습니다.</span>

            <Link href="/collection">도감 보기 →</Link>
          </div>
        </div>
      </section>

      {/* =========================
          LIBRARY
      ========================= */}

      <section className="container observatory-library-section">
        {/* =========================
            RECENT OBSERVATIONS
        ========================= */}

        <div className="observatory-library-column">
          <div className="observatory-library-heading">
            <div>
              <span className="section-label">RECENT OBSERVATIONS</span>

              <h2 className="heading-ko">최근 관측 기록</h2>
            </div>

            <Link href="/observations" className="section-link">
              전체 보기 →
            </Link>
          </div>

          {recentObservations.length ? (
            <div className="observatory-compact-list">
              {recentObservations.map(observation => (
                <RecentObservationItem key={observation.id} observation={observation} />
              ))}
            </div>
          ) : (
            <EmptyCard
              title="아직 관측 기록이 없습니다."
              description="첫 번째 밤하늘 관측을 기록해보세요."
              href="/observations/new"
              action="관측 기록하기"
            />
          )}
        </div>

        {/* =========================
            FAVORITES
        ========================= */}

        <div className="observatory-library-column">
          <div className="observatory-library-heading">
            <div>
              <span className="section-label">FAVORITE OBJECTS</span>

              <h2 className="heading-ko">관심 천체</h2>
            </div>

            <Link href="/explore" className="section-link">
              탐색하기 →
            </Link>
          </div>

          {favorites.length ? (
            <div className="observatory-compact-list">
              {favorites.slice(0, 4).map(favorite => (
                <FavoriteObjectItem key={favorite.id} object={favorite.celestial_objects} />
              ))}
            </div>
          ) : (
            <EmptyCard
              title="아직 관심 천체가 없습니다."
              description="관심 있는 천체를 저장하고 다음 관측 대상을 모아보세요."
              href="/explore"
              action="Explore 열기"
            />
          )}
        </div>
      </section>
    </main>
  );
}

/* ========================================
   STAT CARD
======================================== */

function StatCard({ label, value, unit }) {
  return (
    <article className="observatory-stat-card">
      <span>{label}</span>

      <p>
        <strong>{value}</strong>

        {unit && <span>{unit}</span>}
      </p>
    </article>
  );
}

/* ========================================
   RECENT OBSERVATION ITEM
======================================== */

function RecentObservationItem({ observation }) {
  const object = observation.celestial_objects;

  return (
    <Link href={`/observations/${observation.id}`} className="observatory-compact-item">
      <div className="observatory-compact-image">
        <img src={observation.thumbnail} alt={object?.name_ko || object?.name_en || "관측 천체"} />
      </div>

      <div className="observatory-compact-content">
        <strong className="display-en">{getObjectName(object)}</strong>

        <span>{object?.name_ko}</span>

        <div className="observatory-compact-meta">
          {observation.location_name && <span>{observation.location_name}</span>}

          {observation.equipment && (
            <span>{EQUIPMENT_LABELS[observation.equipment] || observation.equipment}</span>
          )}
        </div>
      </div>

      <time dateTime={observation.observed_at}>{formatCompactDate(observation.observed_at)}</time>
    </Link>
  );
}

/* ========================================
   FAVORITE OBJECT ITEM
======================================== */

function FavoriteObjectItem({ object }) {
  if (!object) {
    return null;
  }

  return (
    <Link href={`/objects/${object.id}`} className="observatory-compact-item">
      <div className="observatory-compact-image">
        <img src={getObjectImage(object)} alt={object.name_ko || object.name_en} />
      </div>

      <div className="observatory-compact-content">
        <strong className="display-en">{getObjectName(object)}</strong>

        <span>{object.name_ko}</span>
      </div>

      <span className="observatory-compact-favorite" aria-label="관심 천체">
        ★
      </span>
    </Link>
  );
}

/* ========================================
   EMPTY CARD
======================================== */

function EmptyCard({ title, description, href, action }) {
  return (
    <div className="observatory-empty-card">
      <span>✦</span>

      <div>
        <strong>{title}</strong>

        <p>{description}</p>
      </div>

      <Link href={href} className="section-link">
        {action} →
      </Link>
    </div>
  );
}

/* ========================================
   PROFILE AVATAR
======================================== */

async function resolveProfileAvatar({ supabase, avatarUrl }) {
  if (!avatarUrl) {
    return "";
  }

  /*
   * Google OAuth 프로필 이미지처럼
   * 외부 URL이면 그대로 사용.
   */
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  /*
   * 직접 업로드한 이미지는
   * private profile-images bucket에 있으므로
   * signed URL 생성.
   */
  const { data, error } = await supabase.storage
    .from("profile-images")
    .createSignedUrl(avatarUrl, 60 * 60);

  if (error) {
    console.error("프로필 이미지 URL 생성 오류:", error);

    return "";
  }

  return data?.signedUrl || "";
}

/* ========================================
   HELPERS
======================================== */

function getObjectImage(object) {
  return object?.image_url || FALLBACK_IMAGES[object?.external_id] || "/images/home/hero.png";
}

function getObjectName(object) {
  if (!object) {
    return "Unknown";
  }

  return object.catalog_name || object.name_en || object.name_ko || "Unknown";
}

function formatCompactDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${month}.${day}`;
}

function formatJoinedDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatDuration(minutes) {
  if (!minutes) {
    return "0분";
  }

  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);

  const remainder = minutes % 60;

  if (!remainder) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${remainder}분`;
}

function getEmailNickname(email = "") {
  return email.split("@")[0] || "Stargazer";
}
