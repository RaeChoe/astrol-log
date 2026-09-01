import Link from "next/link";

import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { getCelestialThumbnail } from "@/lib/celestial/images";

import ObservatoryProfileForm from "@/components/observatory/ObservatoryProfileForm";
import SafeImage from "@/components/common/SafeImage";

export const metadata = {
  title: "My Observatory | AstroLog",
};

const EQUIPMENT_LABELS = {
  naked_eye: "맨눈",
  binoculars: "쌍안경",
  telescope: "망원경",
  camera: "카메라",
};

const MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

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

  const profileLoadError = Boolean(profileResult.error);

  const observationsLoadError = Boolean(observationsResult.error);

  const favoritesLoadError = Boolean(favoritesResult.error);

  const objectsLoadError = Boolean(objectsResult.error);

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
   * MONTHLY STATISTICS
   * =========================
   */

  const now = new Date();

  const currentYear = Number(
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",

      timeZone: "Asia/Seoul",
    }).format(now),
  );

  const currentMonth =
    Number(
      new Intl.DateTimeFormat("en-US", {
        month: "numeric",

        timeZone: "Asia/Seoul",
      }).format(now),
    ) - 1;

  const monthlyObservations = createMonthlyStatistics({
    observations,

    year: currentYear,

    lastMonth: currentMonth,
  });

  const maxMonthlyCount = Math.max(
    ...monthlyObservations.map(month => month.count),

    4,
  );

  const busiestMonth = [...monthlyObservations].sort((a, b) => b.count - a.count)[0];

  /*
   * =========================
   * RECENT OBSERVATIONS
   * =========================
   */

  const recentObservations = await Promise.all(
    observations.slice(0, 3).map(async observation => {
      const images = [...(observation.observation_images || [])].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
      );

      const representative = images[0];

      let observationImage = null;

      /*
       * 사용자가 업로드한 관측 사진은
       * private bucket이므로 signed URL 생성.
       */
      if (representative?.image_url) {
        const { data, error } = await supabase.storage.from("observation-images").createSignedUrl(
          representative.image_url,

          60 * 60,
        );

        if (error) {
          console.error("Observatory 관측 사진 URL 오류:", error);
        }

        observationImage = data?.signedUrl || null;
      }

      /*
       * 직접 촬영 사진이 없다면
       * 천체의 카드용 thumbnail 사용.
       */
      return {
        ...observation,

        thumbnail: observationImage || getCelestialThumbnail(observation.celestial_objects),
      };
    }),
  );

  const nickname = profile?.nickname || getEmailNickname(user.email);

  return (
    <main className="observatory-page">
      {/* PROFILE */}

      <section className="container observatory-profile-section">
        <ObservatoryProfileForm
          userId={user.id}
          initialNickname={nickname}
          initialAvatarUrl={avatarUrl}
        />

        <div className="observatory-profile-subinfo">
          <span>{user.email}</span>

          {profile?.created_at && <span>Joined {formatJoinedDate(profile.created_at)}</span>}

          <span>
            {observedObjects}
            개의 천체 관측
          </span>
        </div>

        {(profileLoadError || observationsLoadError || favoritesLoadError || objectsLoadError) && (
          <div className="observatory-data-warnings" role="status">
            {profileLoadError && (
              <p className="data-inline-warning">
                프로필 일부 정보를 불러오지 못해 기본 정보로 표시하고 있습니다.
              </p>
            )}

            {observationsLoadError && (
              <p className="data-inline-warning">
                관측 기록을 불러오지 못해 관측 통계와 최근 기록이 정확하지 않을 수 있습니다.
              </p>
            )}

            {favoritesLoadError && (
              <p className="data-inline-warning">
                관심 천체를 불러오지 못했습니다. 잠시 후 다시 확인해주세요.
              </p>
            )}

            {objectsLoadError && (
              <p className="data-inline-warning">
                전체 천체 수를 불러오지 못해 도감 진행률이 정확하지 않을 수 있습니다.
              </p>
            )}
          </div>
        )}
      </section>

      {/* STATISTICS */}

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

        {/* COLLECTION PROGRESS */}

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
            <span>
              {observedObjects}
              개의 천체를 관측했습니다.
            </span>

            <Link href="/collection">도감 보기 →</Link>
          </div>
        </div>
      </section>

      {/* MONTHLY OBSERVATIONS */}

      <section className="container observatory-chart-section">
        <div className="observatory-section-header">
          <div>
            <span className="section-label">OBSERVATION ACTIVITY</span>

            <h2 className="heading-ko">월별 관측 기록</h2>
          </div>

          <span className="observatory-chart-year">{currentYear}</span>
        </div>

        <div className="observatory-chart-card">
          <div className="observatory-chart-top">
            <div>
              <span>{currentYear} OBSERVATIONS</span>

              <strong>
                {totalObservations}

                <small>회</small>
              </strong>
            </div>

            {busiestMonth?.count > 0 && (
              <p>
                가장 많이 관측한 달
                <strong>
                  {busiestMonth.label}· {busiestMonth.count}회
                </strong>
              </p>
            )}
          </div>

          <div className="observatory-month-chart">
            {monthlyObservations.map(month => {
              const percentage =
                month.count > 0
                  ? Math.max(
                      (month.count / maxMonthlyCount) * 100,

                      8,
                    )
                  : 0;

              return (
                <div
                  key={month.month}
                  className={
                    month.month === currentMonth
                      ? "observatory-month-item current"
                      : "observatory-month-item"
                  }
                >
                  <div className="observatory-month-bar-area">
                    <div
                      className="observatory-month-bar-stack"
                      style={{
                        height: month.count > 0 ? `${percentage}%` : "4px",
                      }}
                    >
                      {month.count > 0 && (
                        <span className="observatory-month-count">{month.count}</span>
                      )}

                      <div
                        className={
                          month.count > 0 ? "observatory-month-bar active" : "observatory-month-bar"
                        }
                      />
                    </div>
                  </div>

                  <span className="observatory-month-label">{month.label}</span>
                </div>
              );
            })}
          </div>

          {!totalObservations && (
            <p className="observatory-chart-empty">아직 올해의 관측 기록이 없습니다.</p>
          )}
        </div>
      </section>

      {/* LIBRARY */}

      <section className="container observatory-library-section">
        {/* RECENT OBSERVATIONS */}

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

        {/* FAVORITES */}

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
        <SafeImage
          src={observation.thumbnail}
          fallbackSrc="/images/home/hero.png"
          alt={object?.name_ko || object?.name_en || "관측 천체"}
        />
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
        <SafeImage
          src={getCelestialThumbnail(object)}
          fallbackSrc="/images/home/hero.png"
          alt={object.name_ko || object.name_en || "관심 천체"}
        />
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

  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  const { data, error } = await supabase.storage.from("profile-images").createSignedUrl(
    avatarUrl,

    60 * 60,
  );

  if (error) {
    console.error("프로필 이미지 URL 생성 오류:", error);

    return "";
  }

  return data?.signedUrl || "";
}

/* ========================================
   MONTHLY STATISTICS
======================================== */

function createMonthlyStatistics({ observations, year, lastMonth }) {
  const months = Array.from(
    {
      length: lastMonth + 1,
    },

    (_, month) => ({
      month,

      label: MONTH_LABELS[month],

      count: 0,
    }),
  );

  observations.forEach(observation => {
    if (!observation.observed_at) {
      return;
    }

    const date = new Date(observation.observed_at);

    const parts = new Intl.DateTimeFormat("en-US", {
      year: "numeric",

      month: "numeric",

      timeZone: "Asia/Seoul",
    }).formatToParts(date);

    const observationYear = Number(parts.find(part => part.type === "year")?.value);

    const observationMonth = Number(parts.find(part => part.type === "month")?.value) - 1;

    if (observationYear !== year) {
      return;
    }

    if (!months[observationMonth]) {
      return;
    }

    months[observationMonth].count += 1;
  });

  return months;
}

/* ========================================
   HELPERS
======================================== */

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

  const parts = new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",

    day: "2-digit",

    timeZone: "Asia/Seoul",
  }).formatToParts(new Date(value));

  const month = parts.find(part => part.type === "month")?.value;

  const day = parts.find(part => part.type === "day")?.value;

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
