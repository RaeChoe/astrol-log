import * as Astronomy from "astronomy-engine";

const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_RANGE_DAYS = 7;

/*
 * =========================
 * EVENT PRIORITY
 * =========================
 *
 * 여러 이벤트가 같은 주에 겹칠 경우
 * 희귀하고 주목도가 높은 이벤트를
 * 우선적으로 보여준다.
 */

const PRIORITY = {
  eclipse: 100,
  transit: 95,
  opposition: 90,
  elongation: 80,
  peakMagnitude: 80,
  meteor: 70,
  lunarApsis: 50,
  season: 30,
  moonPhase: 10,
};

/* ========================================
   BODY NAMES
======================================== */

const BODY_NAMES = {
  Mercury: {
    ko: "수성",
    en: "MERCURY",
    visualKey: "mercury",
  },

  Venus: {
    ko: "금성",
    en: "VENUS",
    visualKey: "venus",
  },

  Mars: {
    ko: "화성",
    en: "MARS",
    visualKey: "mars",
  },

  Jupiter: {
    ko: "목성",
    en: "JUPITER",
    visualKey: "jupiter",
  },

  Saturn: {
    ko: "토성",
    en: "SATURN",
    visualKey: "saturn",
  },

  Uranus: {
    ko: "천왕성",
    en: "URANUS",
    visualKey: "uranus",
  },

  Neptune: {
    ko: "해왕성",
    en: "NEPTUNE",
    visualKey: "neptune",
  },
};

/* ========================================
   METEOR SHOWERS
======================================== */

/*
 * Astronomy Engine에서 직접 계산하지 않는
 * 대표적인 연례 유성우 극대일.
 *
 * 연도에 따라 실제 극대 시각은
 * 약간 달라질 수 있으므로
 * 대표 날짜 기반 안내로 사용한다.
 */

const METEOR_SHOWERS = [
  {
    id: "quadrantids",

    month: 1,
    day: 3,

    titleKo: "사분의자리 유성우 극대",

    titleEn: "QUADRANTIDS",

    description:
      "사분의자리 유성우가 극대에 가까워지는 시기입니다. 달빛이 적고 하늘이 맑은 곳에서는 새벽 시간대에 더 많은 유성을 기대할 수 있습니다.",
  },

  {
    id: "lyrids",

    month: 4,
    day: 22,

    titleKo: "거문고자리 유성우 극대",

    titleEn: "LYRIDS",

    description:
      "거문고자리 유성우의 활동이 가장 활발해지는 시기입니다. 도심을 벗어난 어두운 장소에서 맨눈으로 넓은 하늘을 보는 것이 좋습니다.",
  },

  {
    id: "eta-aquariids",

    month: 5,
    day: 6,

    titleKo: "에타 물병자리 유성우 극대",

    titleEn: "ETA AQUARIIDS",

    description:
      "에타 물병자리 유성우의 극대 무렵입니다. 북반구에서는 주로 새벽 동쪽 하늘에서 관측하기 좋습니다.",
  },

  {
    id: "delta-aquariids",

    month: 7,
    day: 30,

    titleKo: "남쪽 델타 물병자리 유성우 극대",

    titleEn: "SOUTHERN DELTA AQUARIIDS",

    description:
      "남쪽 델타 물병자리 유성우가 극대에 가까워지는 시기입니다. 자정 이후 남쪽 하늘을 중심으로 관측하기 좋습니다.",
  },

  {
    id: "perseids",

    month: 8,
    day: 12,

    titleKo: "페르세우스자리 유성우 극대",

    titleEn: "PERSEIDS",

    description:
      "대표적인 여름 유성우인 페르세우스자리 유성우의 극대 무렵입니다. 늦은 밤부터 새벽까지 넓은 하늘을 맨눈으로 관측하는 것이 좋습니다.",
  },

  {
    id: "orionids",

    month: 10,
    day: 21,

    titleKo: "오리온자리 유성우 극대",

    titleEn: "ORIONIDS",

    description:
      "오리온자리 유성우가 가장 활발해지는 시기입니다. 새벽 시간대 동남쪽에서 하늘 전체를 넓게 바라보는 방식이 좋습니다.",
  },

  {
    id: "leonids",

    month: 11,
    day: 17,

    titleKo: "사자자리 유성우 극대",

    titleEn: "LEONIDS",

    description:
      "사자자리 유성우가 극대에 가까워지는 시기입니다. 자정 이후부터 새벽 사이에 관측 조건이 좋아집니다.",
  },

  {
    id: "geminids",

    month: 12,
    day: 14,

    titleKo: "쌍둥이자리 유성우 극대",

    titleEn: "GEMINIDS",

    description:
      "연중 가장 활발한 유성우 중 하나인 쌍둥이자리 유성우의 극대 무렵입니다. 밤부터 새벽까지 비교적 긴 시간 관측할 수 있습니다.",
  },
];

/* ========================================
   MAIN PUBLIC FUNCTION
======================================== */

export function getWeeklyAstronomyEvents({
  now = new Date(),

  latitude = 37.5665,

  longitude = 126.978,

  rangeDays = DEFAULT_RANGE_DAYS,
} = {}) {
  const end = new Date(now.getTime() + rangeDays * DAY_MS);

  const observer = new Astronomy.Observer(latitude, longitude, 0);

  const events = [
    ...getMoonPhaseEvents(now, end),

    ...getLunarApsisEvents(now, end),

    ...getLunarEclipseEvents(now, end),

    ...getLocalSolarEclipseEvents(now, end, observer),

    ...getPlanetOppositionEvents(now, end),

    ...getInnerPlanetElongationEvents(now, end),

    ...getVenusPeakMagnitudeEvents(now, end),

    ...getTransitEvents(now, end),

    ...getSeasonEvents(now, end),

    ...getMeteorShowerEvents(now, end),
  ]
    .filter(Boolean)
    .filter(event => event.date >= now && event.date <= end);

  /*
   * 우선순위가 높은 이벤트 먼저.
   *
   * 같은 priority라면
   * 더 가까운 날짜 먼저.
   */
  return events.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    return a.date.getTime() - b.date.getTime();
  });
}

/*
 * 메인 카드 하나만 필요한 경우.
 */
export function getMainAstronomyEvent(options) {
  return getWeeklyAstronomyEvents(options)[0] || null;
}

/* ========================================
   MOON PHASES
======================================== */

function getMoonPhaseEvents(start, end) {
  const events = [];

  let quarter;

  try {
    quarter = Astronomy.SearchMoonQuarter(start);
  } catch {
    return [];
  }

  while (quarter && quarter.time.date <= end) {
    const event = createMoonPhaseEvent(quarter);

    if (event && event.date >= start) {
      events.push(event);
    }

    try {
      quarter = Astronomy.NextMoonQuarter(quarter);
    } catch {
      break;
    }
  }

  return events;
}

function createMoonPhaseEvent(quarter) {
  const common = {
    type: "moon-phase",

    badge: "MOON",

    visualKey: "moon",

    priority: PRIORITY.moonPhase,

    date: quarter.time.date,
  };

  switch (quarter.quarter) {
    case 0:
      return {
        ...common,

        titleKo: "삭",

        titleEn: "NEW MOON",

        description:
          "달이 태양과 거의 같은 방향에 놓이는 시기입니다. 달빛의 영향이 적어 은하와 성운 같은 어두운 천체를 관측하기 좋습니다.",
      };

    case 1:
      return {
        ...common,

        titleKo: "상현달",

        titleEn: "FIRST QUARTER MOON",

        description:
          "달의 절반이 밝게 보이는 시기입니다. 달의 명암 경계 부근에서 크레이터와 지형을 관측하기 좋습니다.",
      };

    case 2:
      return {
        ...common,

        titleKo: "보름달",

        titleEn: "FULL MOON",

        description:
          "달의 앞면이 거의 완전히 밝게 보이는 시기입니다. 달 전체는 밝지만 어두운 은하와 성운 관측에는 불리할 수 있습니다.",
      };

    case 3:
      return {
        ...common,

        titleKo: "하현달",

        titleEn: "THIRD QUARTER MOON",

        description:
          "달의 절반이 밝게 보이는 하현 시기입니다. 늦은 밤부터 새벽 사이에 달 표면을 관측하기 좋습니다.",
      };

    default:
      return null;
  }
}

/* ========================================
   LUNAR APSIS
======================================== */

function getLunarApsisEvents(start, end) {
  const events = [];

  let apsis;

  try {
    apsis = Astronomy.SearchLunarApsis(start);
  } catch {
    return [];
  }

  while (apsis && apsis.time.date <= end) {
    const isPerigee = apsis.kind === Astronomy.ApsisKind.Pericenter;

    events.push({
      type: "lunar-apsis",

      badge: "MOON",

      visualKey: "moon",

      priority: PRIORITY.lunarApsis,

      date: apsis.time.date,

      titleKo: isPerigee ? "달 근지점" : "달 원지점",

      titleEn: isPerigee ? "LUNAR PERIGEE" : "LUNAR APOGEE",

      description: isPerigee
        ? `달이 지구와 비교적 가까워지는 시기입니다. 지구 중심 기준 거리는 약 ${formatKilometers(
            apsis.dist_km,
          )}입니다.`
        : `달이 지구에서 비교적 멀어지는 시기입니다. 지구 중심 기준 거리는 약 ${formatKilometers(
            apsis.dist_km,
          )}입니다.`,
    });

    try {
      apsis = Astronomy.NextLunarApsis(apsis);
    } catch {
      break;
    }
  }

  return events;
}

/* ========================================
   LUNAR ECLIPSE
======================================== */

function getLunarEclipseEvents(start, end) {
  let eclipse;

  try {
    eclipse = Astronomy.SearchLunarEclipse(start);
  } catch {
    return [];
  }

  if (!eclipse || eclipse.peak.date > end) {
    return [];
  }

  const info = getLunarEclipseInfo(eclipse.kind);

  return [
    {
      type: "lunar-eclipse",

      badge: "ECLIPSE",

      visualKey: "moon",

      priority: PRIORITY.eclipse,

      date: eclipse.peak.date,

      titleKo: info.titleKo,

      titleEn: info.titleEn,

      description: info.description,
    },
  ];
}

function getLunarEclipseInfo(kind) {
  if (kind === Astronomy.EclipseKind.Total) {
    return {
      titleKo: "개기월식",

      titleEn: "TOTAL LUNAR ECLIPSE",

      description:
        "달 전체가 지구의 본그림자 안으로 들어가는 개기월식입니다. 월식이 진행되는 동안 달이 붉은색 계열로 보일 수 있습니다.",
    };
  }

  if (kind === Astronomy.EclipseKind.Partial) {
    return {
      titleKo: "부분월식",

      titleEn: "PARTIAL LUNAR ECLIPSE",

      description:
        "달의 일부가 지구의 본그림자 안으로 들어가는 부분월식입니다. 달 표면 일부가 눈에 띄게 어두워집니다.",
    };
  }

  return {
    titleKo: "반영월식",

    titleEn: "PENUMBRAL LUNAR ECLIPSE",

    description:
      "달이 지구의 반그림자를 통과하는 반영월식입니다. 밝기 변화가 비교적 미묘해 관측 조건에 따라 구분이 어려울 수 있습니다.",
  };
}

/* ========================================
   LOCAL SOLAR ECLIPSE
======================================== */

function getLocalSolarEclipseEvents(start, end, observer) {
  let eclipse;

  try {
    eclipse = Astronomy.SearchLocalSolarEclipse(start, observer);
  } catch {
    return [];
  }

  if (!eclipse || eclipse.peak.time.date > end) {
    return [];
  }

  if (eclipse.peak.altitude <= 0) {
    return [];
  }

  const info = getSolarEclipseInfo(eclipse.kind);

  return [
    {
      type: "solar-eclipse",

      badge: "ECLIPSE",

      /*
       * 현재 이미지 세트에는
       * 별도의 일식 이미지가 없으므로
       * 달 이미지를 사용.
       */
      visualKey: "moon",

      priority: PRIORITY.eclipse,

      date: eclipse.peak.time.date,

      titleKo: info.titleKo,

      titleEn: info.titleEn,

      description: info.description,
    },
  ];
}

function getSolarEclipseInfo(kind) {
  if (kind === Astronomy.EclipseKind.Total) {
    return {
      titleKo: "개기일식",

      titleEn: "TOTAL SOLAR ECLIPSE",

      description: "현재 위치에서 달이 태양을 완전히 가리는 개기일식을 관측할 수 있는 시기입니다.",
    };
  }

  if (kind === Astronomy.EclipseKind.Annular) {
    return {
      titleKo: "금환일식",

      titleEn: "ANNULAR SOLAR ECLIPSE",

      description:
        "현재 위치에서 달 주변으로 태양의 가장자리가 고리처럼 보이는 금환일식을 관측할 수 있는 시기입니다.",
    };
  }

  return {
    titleKo: "부분일식",

    titleEn: "PARTIAL SOLAR ECLIPSE",

    description: "현재 위치에서 달이 태양의 일부를 가리는 부분일식을 관측할 수 있는 시기입니다.",
  };
}

/* ========================================
   PLANET OPPOSITION
======================================== */

function getPlanetOppositionEvents(start, end) {
  const bodies = [
    Astronomy.Body.Mars,
    Astronomy.Body.Jupiter,
    Astronomy.Body.Saturn,
    Astronomy.Body.Uranus,
    Astronomy.Body.Neptune,
  ];

  return bodies
    .map(body => {
      let time;

      try {
        time = Astronomy.SearchRelativeLongitude(body, 0, start);
      } catch {
        return null;
      }

      if (!time || time.date > end) {
        return null;
      }

      const bodyInfo = BODY_NAMES[body];

      if (!bodyInfo) {
        return null;
      }

      return {
        type: "opposition",

        badge: "PLANET",

        visualKey: bodyInfo.visualKey,

        priority: PRIORITY.opposition,

        date: time.date,

        titleKo: `${bodyInfo.ko} 충`,

        titleEn: `${bodyInfo.en} OPPOSITION`,

        description: `${bodyInfo.ko}이 태양의 반대쪽 하늘에 위치하는 충 시기입니다. 평소보다 밤새 관측하기 좋고 밝게 보이는 시기입니다.`,
      };
    })
    .filter(Boolean);
}

/* ========================================
   MAXIMUM ELONGATION
======================================== */

function getInnerPlanetElongationEvents(start, end) {
  const bodies = [Astronomy.Body.Mercury, Astronomy.Body.Venus];

  return bodies
    .map(body => {
      let event;

      try {
        event = Astronomy.SearchMaxElongation(body, start);
      } catch {
        return null;
      }

      if (!event || event.time.date > end) {
        return null;
      }

      const bodyInfo = BODY_NAMES[body];

      if (!bodyInfo) {
        return null;
      }

      const visibility = getElongationVisibilityLabel(event.visibility);

      return {
        type: "elongation",

        badge: "PLANET",

        visualKey: bodyInfo.visualKey,

        priority: PRIORITY.elongation,

        date: event.time.date,

        titleKo: `${bodyInfo.ko} 최대이각`,

        titleEn: `${bodyInfo.en} MAXIMUM ELONGATION`,

        description: `${bodyInfo.ko}이 지구에서 볼 때 태양으로부터 가장 멀리 떨어져 보이는 시기입니다. ${visibility} 관측하기 좋으며 태양과의 각거리는 약 ${Math.round(
          event.elongation,
        )}°입니다.`,
      };
    })
    .filter(Boolean);
}

function getElongationVisibilityLabel(visibility) {
  const value = String(visibility || "").toLowerCase();

  if (value.includes("morning")) {
    return "해 뜨기 전 동쪽 하늘에서";
  }

  if (value.includes("evening")) {
    return "해가 진 뒤 서쪽 하늘에서";
  }

  return "태양이 지평선 아래에 있는 시간대에";
}

/* ========================================
   VENUS PEAK MAGNITUDE
======================================== */

function getVenusPeakMagnitudeEvents(start, end) {
  let event;

  try {
    event = Astronomy.SearchPeakMagnitude(Astronomy.Body.Venus, start);
  } catch {
    return [];
  }

  if (!event || event.time.date > end) {
    return [];
  }

  return [
    {
      type: "peak-magnitude",

      badge: "PLANET",

      visualKey: "venus",

      priority: PRIORITY.peakMagnitude,

      date: event.time.date,

      titleKo: "금성 최대광도",

      titleEn: "VENUS GREATEST BRILLIANCY",

      description: `금성이 지구에서 가장 밝게 보이는 시기입니다. 예상 겉보기 등급은 약 ${event.mag.toFixed(
        1,
      )}등급입니다.`,
    },
  ];
}

/* ========================================
   TRANSIT
======================================== */

function getTransitEvents(start, end) {
  const bodies = [Astronomy.Body.Mercury, Astronomy.Body.Venus];

  return bodies
    .map(body => {
      let transit;

      try {
        transit = Astronomy.SearchTransit(body, start);
      } catch {
        return null;
      }

      if (!transit || transit.peak.date > end) {
        return null;
      }

      const bodyInfo = BODY_NAMES[body];

      if (!bodyInfo) {
        return null;
      }

      return {
        type: "transit",

        badge: "TRANSIT",

        visualKey: bodyInfo.visualKey,

        priority: PRIORITY.transit,

        date: transit.peak.date,

        titleKo: `${bodyInfo.ko} 태양면 통과`,

        titleEn: `${bodyInfo.en} TRANSIT`,

        description: `${bodyInfo.ko}이 지구와 태양 사이를 지나며 태양 표면을 통과하는 드문 천문 현상입니다. 태양 관측에는 반드시 적절한 태양 필터가 필요합니다.`,
      };
    })
    .filter(Boolean);
}

/* ========================================
   SEASONS
======================================== */

function getSeasonEvents(start, end) {
  const years = new Set([start.getUTCFullYear(), end.getUTCFullYear()]);

  const events = [];

  years.forEach(year => {
    let seasons;

    try {
      seasons = Astronomy.Seasons(year);
    } catch {
      return;
    }

    const candidates = [
      {
        date: seasons.mar_equinox.date,

        titleKo: "춘분",

        titleEn: "MARCH EQUINOX",

        description:
          "태양이 천구의 적도를 북쪽으로 지나가는 시기입니다. 낮과 밤의 길이가 거의 같아집니다.",
      },

      {
        date: seasons.jun_solstice.date,

        titleKo: "하지",

        titleEn: "JUNE SOLSTICE",

        description: "북반구에서 태양의 고도가 가장 높고 낮의 길이가 가장 긴 무렵입니다.",
      },

      {
        date: seasons.sep_equinox.date,

        titleKo: "추분",

        titleEn: "SEPTEMBER EQUINOX",

        description:
          "태양이 천구의 적도를 남쪽으로 지나가는 시기입니다. 낮과 밤의 길이가 거의 같아집니다.",
      },

      {
        date: seasons.dec_solstice.date,

        titleKo: "동지",

        titleEn: "DECEMBER SOLSTICE",

        description: "북반구에서 태양의 고도가 가장 낮고 밤의 길이가 가장 긴 무렵입니다.",
      },
    ];

    candidates.forEach(event => {
      if (event.date >= start && event.date <= end) {
        events.push({
          type: "season",

          badge: "SEASON",

          visualKey: "night-sky",

          priority: PRIORITY.season,

          ...event,
        });
      }
    });
  });

  return events;
}

/* ========================================
   METEOR SHOWERS
======================================== */

function getMeteorShowerEvents(start, end) {
  const events = [];

  const startYear = start.getUTCFullYear();

  const endYear = end.getUTCFullYear();

  for (let year = startYear; year <= endYear; year += 1) {
    METEOR_SHOWERS.forEach(shower => {
      /*
       * 대표 극대일을
       * 한국 시간 00:00 기준으로 둔다.
       *
       * 정확한 극대 시각 계산 데이터가 아니라
       * 연례 안내 데이터.
       */
      const date = new Date(Date.UTC(year, shower.month - 1, shower.day, -9, 0, 0));

      if (date < start || date > end) {
        return;
      }

      events.push({
        type: "meteor-shower",

        badge: "METEOR",

        visualKey: "night-sky",

        priority: PRIORITY.meteor,

        date,

        titleKo: shower.titleKo,

        titleEn: shower.titleEn,

        description: shower.description,

        approximate: true,
      });
    });
  }

  return events;
}

/* ========================================
   DISPLAY
======================================== */

export function formatAstronomyEventDate(date, { approximate = false } = {}) {
  if (!date) {
    return "-";
  }

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",

    day: "numeric",

    hour: "2-digit",

    minute: "2-digit",

    hour12: false,

    timeZone: "Asia/Seoul",
  });

  const parts = formatter.formatToParts(date);

  const month = parts.find(part => part.type === "month")?.value;

  const day = parts.find(part => part.type === "day")?.value;

  const hour = parts.find(part => part.type === "hour")?.value;

  const minute = parts.find(part => part.type === "minute")?.value;

  if (approximate) {
    return `${month}월 ${day}일 전후`;
  }

  return `${month}월 ${day}일 · ${hour}:${minute}`;
}

/* ========================================
   HELPERS
======================================== */

function formatKilometers(value) {
  if (!Number.isFinite(Number(value))) {
    return "-";
  }

  return `${Math.round(Number(value)).toLocaleString("ko-KR")} km`;
}
