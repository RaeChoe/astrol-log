import * as Astronomy from "astronomy-engine";

const DEFAULT_LOCATION = {
  latitude: 37.5665,
  longitude: 126.978,
};

function createObserver({
  latitude = DEFAULT_LOCATION.latitude,

  longitude = DEFAULT_LOCATION.longitude,
} = {}) {
  return new Astronomy.Observer(latitude, longitude, 0);
}

/*
 * J2000 기준 고정 천체 좌표
 *
 * ra  = 적경(hours)
 * dec = 적위(degrees)
 */
const FIXED_OBJECTS = {
  /* =========================
     STARS
  ========================= */

  sirius: {
    ra: 6.7525,
    dec: -16.7161,
  },

  betelgeuse: {
    ra: 5.9195,
    dec: 7.4071,
  },

  rigel: {
    ra: 5.2423,
    dec: -8.2016,
  },

  aldebaran: {
    ra: 4.5987,
    dec: 16.5093,
  },

  capella: {
    ra: 5.2782,
    dec: 45.998,
  },

  procyon: {
    ra: 7.655,
    dec: 5.225,
  },

  regulus: {
    ra: 10.1395,
    dec: 11.9672,
  },

  arcturus: {
    ra: 14.261,
    dec: 19.1825,
  },

  spica: {
    ra: 13.4199,
    dec: -11.1614,
  },

  vega: {
    ra: 18.6156,
    dec: 38.7837,
  },

  altair: {
    ra: 19.8464,
    dec: 8.8683,
  },

  deneb: {
    ra: 20.6905,
    dec: 45.2803,
  },

  antares: {
    ra: 16.4901,
    dec: -26.432,
  },

  polaris: {
    ra: 2.5303,
    dec: 89.2641,
  },

  /* =========================
     GALAXIES
  ========================= */

  m31: {
    ra: 0.7123,
    dec: 41.2692,
  },

  m33: {
    ra: 1.5641,
    dec: 30.6602,
  },

  m51: {
    ra: 13.498,
    dec: 47.1952,
  },

  m81: {
    ra: 9.9259,
    dec: 69.0653,
  },

  m82: {
    ra: 9.9313,
    dec: 69.6797,
  },

  /* =========================
     NEBULAE
  ========================= */

  m1: {
    ra: 5.5756,
    dec: 22.0145,
  },

  m8: {
    ra: 18.0615,
    dec: -24.3867,
  },

  m20: {
    ra: 18.0408,
    dec: -23.0297,
  },

  m27: {
    ra: 19.9934,
    dec: 22.721,
  },

  m42: {
    ra: 5.591,
    dec: -5.3911,
  },

  m57: {
    ra: 18.8931,
    dec: 33.0285,
  },

  /* =========================
     CLUSTERS
  ========================= */

  m13: {
    ra: 16.6949,
    dec: 36.4613,
  },

  m35: {
    ra: 6.151,
    dec: 24.333,
  },

  m36: {
    ra: 5.6049,
    dec: 34.14,
  },

  m37: {
    ra: 5.8715,
    dec: 32.553,
  },

  m38: {
    ra: 5.478,
    dec: 35.855,
  },

  m44: {
    ra: 8.67,
    dec: 19.667,
  },

  m45: {
    ra: 3.79,
    dec: 24.117,
  },
};

/*
 * 태양계 천체는 시간에 따라
 * 실제 위치가 계속 변하므로
 * Astronomy Engine으로 계산.
 */
const SOLAR_SYSTEM_BODIES = {
  moon: Astronomy.Body.Moon,

  mercury: Astronomy.Body.Mercury,

  venus: Astronomy.Body.Venus,

  mars: Astronomy.Body.Mars,

  jupiter: Astronomy.Body.Jupiter,

  saturn: Astronomy.Body.Saturn,

  uranus: Astronomy.Body.Uranus,

  neptune: Astronomy.Body.Neptune,
};

const TYPE_LABELS = {
  moon: "Planetary Satellite",

  planet: "Planet",

  star: "Star",

  cluster: "Star Cluster",

  nebula: "Nebula",

  galaxy: "Galaxy",
};

const SAMPLE_MINUTES = 30;

/*
 * 관측 추천 최소 고도.
 */
const MIN_ALTITUDE = 20;

/*
 * 태양 고도 -12° 이하부터
 * 실질적인 밤하늘 관측 후보로 본다.
 */
const MAX_SUN_ALTITUDE = -12;

/* ========================================
   TONIGHT'S HIGHLIGHTS
======================================== */

export function getTonightHighlights({
  objects,

  latitude = DEFAULT_LOCATION.latitude,

  longitude = DEFAULT_LOCATION.longitude,

  moonIllumination = 0,

  now = new Date(),
}) {
  if (!objects?.length) {
    return [];
  }

  const observer = createObserver({
    latitude,
    longitude,
  });

  const timeSamples = createTonightSamples(now);

  if (!timeSamples.length) {
    return [];
  }

  const candidates = objects
    .map(object =>
      analyzeObject({
        object,
        observer,
        timeSamples,
        moonIllumination,
      }),
    )
    .filter(Boolean)
    .sort((a, b) => b.rankScore - a.rankScore);

  /*
   * 같은 종류만 3개 연속으로
   * 추천되는 것을 조금 방지.
   */
  return selectDiverseHighlights(candidates, 3);
}

/* ========================================
   OBJECT ANALYSIS
======================================== */

function analyzeObject({ object, observer, timeSamples, moonIllumination }) {
  if (!object?.external_id) {
    return null;
  }

  const visibleSamples = timeSamples
    .map(date => {
      const sunAltitude = getSolarAltitude(date, observer);

      /*
       * 아직 하늘이 충분히
       * 어둡지 않은 시간 제외.
       */
      if (sunAltitude > MAX_SUN_ALTITUDE) {
        return null;
      }

      const position = getObjectPosition(object.external_id, date, observer);

      if (!position) {
        return null;
      }

      /*
       * 너무 낮은 천체 제외.
       */
      if (position.altitude < MIN_ALTITUDE) {
        return null;
      }

      return {
        date,

        ...position,
      };
    })
    .filter(Boolean);

  if (!visibleSamples.length) {
    return null;
  }

  const blocks = createContinuousBlocks(visibleSamples);

  if (!blocks.length) {
    return null;
  }

  /*
   * 가장 오래 연속으로
   * 관측 가능한 구간 선택.
   */
  const bestBlock = [...blocks].sort((a, b) => b.length - a.length)[0];

  const maxAltitude = Math.max(...bestBlock.map(sample => sample.altitude));

  const peakSample = bestBlock.reduce(
    (best, sample) => (sample.altitude > best.altitude ? sample : best),
    bestBlock[0],
  );

  const durationHours = (bestBlock.length * SAMPLE_MINUTES) / 60;

  const astronomyScore = calculateAstronomyScore({
    object,
    maxAltitude,
    durationHours,
    moonIllumination,
  });

  const rating = calculateDisplayRating({
    astronomyScore,
  });

  const startTime = formatKstTime(bestBlock[0].date);

  const endTime = formatKstTime(
    addMinutes(
      bestBlock[bestBlock.length - 1].date,

      SAMPLE_MINUTES,
    ),
  );

  return {
    ...object,

    typeLabel: TYPE_LABELS[object.type] || object.type || "Object",

    rating,

    astronomyScore,

    maxAltitude: Math.round(maxAltitude),

    peakAltitude: Math.round(peakSample.altitude),

    peakDirection: getDirectionLabel(peakSample.azimuth),

    startTime,

    endTime,

    timeLabel: `${startTime} — ${endTime}`,

    rankScore: astronomyScore * 10 + maxAltitude * 0.08,
  };
}

/* ========================================
   CURRENT OBJECT OBSERVATION
======================================== */

/*
 * Object Detail에서 사용할
 * 현재 위치 / 현재 시각 기준
 * 천체 관측 정보.
 */
export function getCurrentObjectObservation({
  externalId,

  latitude = DEFAULT_LOCATION.latitude,

  longitude = DEFAULT_LOCATION.longitude,

  now = new Date(),
}) {
  if (!externalId) {
    return null;
  }

  const observer = createObserver({
    latitude,
    longitude,
  });

  const position = getObjectPosition(externalId, now, observer);

  if (!position) {
    return null;
  }

  const sunAltitude = getSolarAltitude(now, observer);

  return {
    altitude: position.altitude,

    altitudeLabel: `${Math.round(position.altitude)}°`,

    azimuth: position.azimuth,

    azimuthLabel: `${Math.round(position.azimuth)}°`,

    direction: getDirectionLabel(position.azimuth),

    sunAltitude,
  };
}

/* ========================================
   POSITION
======================================== */

export function getObjectPosition(externalId, date = new Date(), observer = createObserver()) {
  const solarBody = SOLAR_SYSTEM_BODIES[externalId];

  /*
   * =========================
   * MOON / PLANETS
   * =========================
   */

  if (solarBody) {
    const equatorial = Astronomy.Equator(solarBody, date, observer, true, true);

    const horizon = Astronomy.Horizon(date, observer, equatorial.ra, equatorial.dec, "normal");

    return {
      altitude: horizon.altitude,

      azimuth: horizon.azimuth,
    };
  }

  /*
   * =========================
   * FIXED OBJECTS
   * =========================
   *
   * 별 / 성운 / 성단 / 은하
   */

  const fixed = FIXED_OBJECTS[externalId];

  if (!fixed) {
    return null;
  }

  const horizon = Astronomy.Horizon(date, observer, fixed.ra, fixed.dec, "normal");

  return {
    altitude: horizon.altitude,

    azimuth: horizon.azimuth,
  };
}

/* ========================================
   SUN POSITION
======================================== */

function getSolarAltitude(date, observer = createObserver()) {
  const equatorial = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true);

  const horizon = Astronomy.Horizon(date, observer, equatorial.ra, equatorial.dec, "normal");

  return horizon.altitude;
}

/* ========================================
   ASTRONOMY SCORE
======================================== */

function calculateAstronomyScore({ object, maxAltitude, durationHours, moonIllumination }) {
  let score = 0;

  /*
   * =========================
   * ALTITUDE
   * =========================
   */

  if (maxAltitude >= 70) {
    score += 5;
  } else if (maxAltitude >= 55) {
    score += 4;
  } else if (maxAltitude >= 40) {
    score += 3;
  } else if (maxAltitude >= 30) {
    score += 2;
  } else {
    score += 1;
  }

  /*
   * =========================
   * MAGNITUDE
   * =========================
   *
   * 숫자가 작을수록 밝다.
   */

  const magnitude = Number(object.magnitude);

  if (Number.isFinite(magnitude)) {
    if (magnitude <= 0) {
      score += 3;
    } else if (magnitude <= 2) {
      score += 2.5;
    } else if (magnitude <= 4) {
      score += 2;
    } else if (magnitude <= 6) {
      score += 1;
    }
  }

  /*
   * =========================
   * OBSERVATION DURATION
   * =========================
   */

  if (durationHours >= 5) {
    score += 2;
  } else if (durationHours >= 3) {
    score += 1.5;
  } else if (durationHours >= 1.5) {
    score += 1;
  }

  /*
   * =========================
   * MOONLIGHT PENALTY
   * =========================
   */

  if (moonIllumination >= 70 && ["galaxy", "nebula", "cluster"].includes(object.type)) {
    score -= 1.5;
  } else if (moonIllumination >= 40 && ["galaxy", "nebula"].includes(object.type)) {
    score -= 0.75;
  }

  return Math.max(0, score);
}

/* ========================================
   DISPLAY RATING
======================================== */

/*
 * 별점은 날씨가 아니라
 * 천체 자체의 오늘 밤 관측 추천도.
 */
function calculateDisplayRating({ astronomyScore }) {
  if (astronomyScore >= 8) {
    return 5;
  }

  if (astronomyScore >= 6) {
    return 4;
  }

  if (astronomyScore >= 4) {
    return 3;
  }

  if (astronomyScore >= 2) {
    return 2;
  }

  return 1;
}

/* ========================================
   DIVERSITY
======================================== */

function selectDiverseHighlights(candidates, limit) {
  const selected = [];

  const typeCounts = new Map();

  /*
   * 같은 type은
   * 최대 2개까지.
   */
  for (const candidate of candidates) {
    const count = typeCounts.get(candidate.type) || 0;

    if (count >= 2) {
      continue;
    }

    selected.push(candidate);

    typeCounts.set(candidate.type, count + 1);

    if (selected.length >= limit) {
      return selected;
    }
  }

  /*
   * 후보가 부족하면
   * type 제한 없이 채움.
   */
  for (const candidate of candidates) {
    const alreadySelected = selected.some(item => item.id === candidate.id);

    if (alreadySelected) {
      continue;
    }

    selected.push(candidate);

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

/* ========================================
   TONIGHT TIME SAMPLES
======================================== */

function createTonightSamples(now) {
  const { year, month, day, hour } = getKstParts(now);

  let start;

  let end;

  /*
   * 새벽 0~5시는
   * 전날 밤의 연장으로 본다.
   */
  if (hour < 6) {
    start = new Date(now.getTime());

    end = createKstDate({
      year,
      month,
      day,
      hour: 6,
    });
  } else {
    /*
     * 18시 이전이면
     * 오늘 18시부터.
     */
    const evening = createKstDate({
      year,
      month,
      day,
      hour: 18,
    });

    start = now > evening ? now : evening;

    /*
     * 다음날 06시까지.
     */
    end = new Date(Date.UTC(year, month - 1, day + 1, 6 - 9, 0, 0));
  }

  if (start >= end) {
    return [];
  }

  const roundedStart = roundUpToInterval(start, SAMPLE_MINUTES);

  const samples = [];

  for (
    let time = roundedStart.getTime();
    time <= end.getTime();
    time += SAMPLE_MINUTES * 60 * 1000
  ) {
    samples.push(new Date(time));
  }

  return samples;
}

/* ========================================
   CONTINUOUS BLOCKS
======================================== */

function createContinuousBlocks(samples) {
  if (!samples.length) {
    return [];
  }

  const blocks = [];

  let current = [samples[0]];

  const expectedGap = SAMPLE_MINUTES * 60 * 1000;

  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];

    const next = samples[index];

    if (next.date.getTime() - previous.date.getTime() === expectedGap) {
      current.push(next);
    } else {
      blocks.push(current);

      current = [next];
    }
  }

  blocks.push(current);

  return blocks;
}

/* ========================================
   DIRECTION
======================================== */

export function getDirectionLabel(azimuth) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

  const index = Math.round(azimuth / 45) % 8;

  return directions[index];
}

/* ========================================
   FORMATTERS
======================================== */

function formatKstTime(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",

    minute: "2-digit",

    hour12: false,

    timeZone: "Asia/Seoul",
  }).format(date);
}

function getKstParts(value) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",

    month: "numeric",

    day: "numeric",

    hour: "numeric",

    hourCycle: "h23",

    timeZone: "Asia/Seoul",
  });

  const parts = formatter.formatToParts(value);

  return {
    year: Number(parts.find(item => item.type === "year")?.value),

    month: Number(parts.find(item => item.type === "month")?.value),

    day: Number(parts.find(item => item.type === "day")?.value),

    hour: Number(parts.find(item => item.type === "hour")?.value),
  };
}

function createKstDate({ year, month, day, hour, minute = 0 }) {
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0));
}

function roundUpToInterval(date, minutes) {
  const interval = minutes * 60 * 1000;

  return new Date(Math.ceil(date.getTime() / interval) * interval);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}
