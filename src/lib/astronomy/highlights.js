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

/*
 * 추천 시간으로 표시할
 * 최대 연속 시간.
 *
 * 30분 샘플 × 6 = 3시간
 */
const RECOMMENDED_WINDOW_SAMPLES = 6;

/*
 * 최소 추천 시간.
 *
 * 30분 샘플 × 3 = 1시간 30분
 */
const MIN_WINDOW_SAMPLES = 3;

/*
 * 가장 가까운 기상 예보가
 * 이 시간보다 멀면 사용하지 않는다.
 */
const MAX_FORECAST_DISTANCE_MS = 90 * 60 * 1000;

/* ========================================
   TONIGHT'S HIGHLIGHTS
======================================== */

export function getTonightHighlights({
  objects,

  latitude = DEFAULT_LOCATION.latitude,

  longitude = DEFAULT_LOCATION.longitude,

  moonIllumination = 0,

  forecastHours = [],

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

        forecastHours,
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

function analyzeObject({ object, observer, timeSamples, moonIllumination, forecastHours }) {
  if (!object?.external_id) {
    return null;
  }

  /*
   * 각 30분 샘플마다:
   *
   * - 태양 고도
   * - 천체 고도
   * - 달과의 각거리
   * - 시간별 기상
   *
   * 를 같이 계산한다.
   */
  const visibleSamples = timeSamples
    .map(date => {
      const sunAltitude = getSolarAltitude(date, observer);

      /*
       * 충분히 어둡지 않은 시간 제외.
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

      const forecast = findNearestForecast(date, forecastHours);

      const weatherPenalty = getHourlyWeatherPenalty(forecast);

      const moonSeparation = getMoonAngularSeparation({
        externalId: object.external_id,

        date,

        observer,
      });

      return {
        date,

        ...position,

        forecast,

        weatherPenalty,

        moonSeparation,
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
   * 단순히 가장 오래 떠 있는 시간을
   * 추천하는 것이 아니라
   *
   * 고도 + 날씨 + 달빛을 함께 고려해서
   * 가장 좋은 관측 시간대를 고른다.
   */
  const bestBlock = selectBestObservationWindow({
    blocks,

    object,

    moonIllumination,
  });

  if (!bestBlock?.length) {
    return null;
  }

  const maxAltitude = Math.max(...bestBlock.map(sample => sample.altitude));

  const peakSample = bestBlock.reduce(
    (best, sample) => (sample.altitude > best.altitude ? sample : best),
    bestBlock[0],
  );

  const durationHours = (bestBlock.length * SAMPLE_MINUTES) / 60;

  const averageWeatherPenalty = getAverage(bestBlock.map(sample => sample.weatherPenalty));

  const moonSeparations = bestBlock
    .map(sample => sample.moonSeparation)
    .filter(value => Number.isFinite(value));

  const averageMoonSeparation = moonSeparations.length ? getAverage(moonSeparations) : null;

  /*
   * 별점의 기반은 천문 조건.
   *
   * 날씨가 나쁘다고 모든 카드가
   * 1점이 되는 현상을 피하기 위해
   * 날씨는 rating이 아닌
   * 시간 선택 / 추천 순위에 반영한다.
   */
  const astronomyScore = calculateAstronomyScore({
    object,

    maxAltitude,

    durationHours,

    moonIllumination,

    moonSeparation: averageMoonSeparation,
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

  /*
   * 최종 추천 순위.
   *
   * 천체 조건을 중심으로 두되
   * 해당 시간대 날씨가 나쁘면
   * 추천 순위가 내려간다.
   */
  const weatherRankPenalty = averageWeatherPenalty * 0.16;

  const rankScore = astronomyScore * 10 + maxAltitude * 0.08 - weatherRankPenalty;

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

    weatherPenalty: Math.round(averageWeatherPenalty),

    moonSeparation: Number.isFinite(averageMoonSeparation)
      ? Math.round(averageMoonSeparation)
      : null,

    rankScore,
  };
}

/* ========================================
   BEST OBSERVATION WINDOW
======================================== */

function selectBestObservationWindow({ blocks, object, moonIllumination }) {
  let best = null;

  for (const block of blocks) {
    if (block.length < MIN_WINDOW_SAMPLES) {
      /*
       * 1시간 30분보다 짧더라도
       * 유일한 관측 가능 구간이면
       * 후보 자체는 남겨둔다.
       */
      const quality = calculateWindowQuality({
        samples: block,

        object,

        moonIllumination,
      });

      if (!best || quality > best.quality) {
        best = {
          samples: block,

          quality,
        };
      }

      continue;
    }

    /*
     * 최대 3시간짜리 창을 움직이면서
     * 가장 좋은 구간을 선택.
     */
    const windowSize = Math.min(RECOMMENDED_WINDOW_SAMPLES, block.length);

    for (let startIndex = 0; startIndex <= block.length - windowSize; startIndex += 1) {
      const samples = block.slice(startIndex, startIndex + windowSize);

      const quality = calculateWindowQuality({
        samples,

        object,

        moonIllumination,
      });

      if (!best || quality > best.quality) {
        best = {
          samples,

          quality,
        };
      }
    }
  }

  return best?.samples || null;
}

function calculateWindowQuality({ samples, object, moonIllumination }) {
  if (!samples.length) {
    return -Infinity;
  }

  const averageAltitude = getAverage(samples.map(sample => sample.altitude));

  const averageWeatherPenalty = getAverage(samples.map(sample => sample.weatherPenalty));

  const separations = samples
    .map(sample => sample.moonSeparation)
    .filter(value => Number.isFinite(value));

  const moonSeparation = separations.length ? getAverage(separations) : null;

  const moonPenalty = getMoonlightPenalty({
    object,

    moonIllumination,

    moonSeparation,
  });

  /*
   * 높을수록 좋은 값.
   *
   * 고도는 플러스,
   * 기상과 달빛은 마이너스.
   */
  return averageAltitude * 0.8 - averageWeatherPenalty * 0.7 - moonPenalty * 12;
}

/* ========================================
   HOURLY WEATHER
======================================== */

function findNearestForecast(date, forecastHours) {
  if (!forecastHours?.length) {
    return null;
  }

  const targetTime = date.getTime();

  let nearest = null;

  let nearestDistance = Infinity;

  for (const forecast of forecastHours) {
    if (!Number.isFinite(forecast?.timestamp)) {
      continue;
    }

    const distance = Math.abs(forecast.timestamp - targetTime);

    if (distance < nearestDistance) {
      nearest = forecast;

      nearestDistance = distance;
    }
  }

  /*
   * 너무 먼 시각의 예보를
   * 억지로 사용하지 않는다.
   */
  if (nearestDistance > MAX_FORECAST_DISTANCE_MS) {
    return null;
  }

  return nearest;
}

function getHourlyWeatherPenalty(forecast) {
  /*
   * 날씨 데이터가 없다고
   * 추천 자체를 불리하게 만들지는 않는다.
   */
  if (!forecast) {
    return 0;
  }

  let penalty = 0;

  /*
   * =========================
   * CLOUD
   * =========================
   *
   * KMA SKY
   * 1 = 맑음
   * 3 = 구름많음
   * 4 = 흐림
   */

  if (forecast.skyCode === 3) {
    penalty += 25;
  }

  if (forecast.skyCode === 4) {
    penalty += 60;
  }

  /*
   * =========================
   * PRECIPITATION
   * =========================
   */

  if (forecast.precipitationType && forecast.precipitationType !== 0) {
    penalty += 120;
  }

  const precipitationProbability = forecast.precipitationProbability ?? 0;

  penalty += precipitationProbability * 0.8;

  /*
   * =========================
   * WIND
   * =========================
   */

  const windSpeed = forecast.windSpeed ?? 0;

  if (windSpeed >= 14) {
    penalty += 45;
  } else if (windSpeed >= 8) {
    penalty += 22;
  } else if (windSpeed >= 5) {
    penalty += 8;
  }

  /*
   * =========================
   * HUMIDITY
   * =========================
   */

  const humidity = forecast.humidity ?? 0;

  if (humidity >= 95) {
    penalty += 35;
  } else if (humidity >= 90) {
    penalty += 25;
  } else if (humidity >= 80) {
    penalty += 12;
  }

  return penalty;
}

/* ========================================
   MOON ANGULAR SEPARATION
======================================== */

function getMoonAngularSeparation({ externalId, date, observer }) {
  /*
   * 달 자신은 각거리 패널티가 필요 없다.
   */
  if (externalId === "moon") {
    return null;
  }

  const objectCoordinates = getObjectEquatorialCoordinates(externalId, date, observer);

  if (!objectCoordinates) {
    return null;
  }

  let moon;

  try {
    moon = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, true);
  } catch {
    return null;
  }

  return calculateAngularSeparation(
    {
      ra: objectCoordinates.ra,

      dec: objectCoordinates.dec,
    },

    {
      ra: moon.ra,

      dec: moon.dec,
    },
  );
}

function getObjectEquatorialCoordinates(externalId, date, observer) {
  const solarBody = SOLAR_SYSTEM_BODIES[externalId];

  if (solarBody) {
    try {
      const equatorial = Astronomy.Equator(solarBody, date, observer, true, true);

      return {
        ra: equatorial.ra,

        dec: equatorial.dec,
      };
    } catch {
      return null;
    }
  }

  const fixed = FIXED_OBJECTS[externalId];

  if (!fixed) {
    return null;
  }

  return {
    ra: fixed.ra,

    dec: fixed.dec,
  };
}

function calculateAngularSeparation(first, second) {
  if (!first || !second) {
    return null;
  }

  /*
   * 적경은 hour 단위이므로
   * 15를 곱해 degree로 변환.
   */
  const ra1 = degreesToRadians(first.ra * 15);

  const ra2 = degreesToRadians(second.ra * 15);

  const dec1 = degreesToRadians(first.dec);

  const dec2 = degreesToRadians(second.dec);

  const cosine =
    Math.sin(dec1) * Math.sin(dec2) + Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2);

  /*
   * 부동소수점 오차로
   * acos 범위(-1 ~ 1)를
   * 살짝 벗어나는 경우 방지.
   */
  const clamped = Math.max(-1, Math.min(1, cosine));

  return radiansToDegrees(Math.acos(clamped));
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

export function getObjectPosition(
  externalId,

  date = new Date(),

  observer = createObserver(),
) {
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

function getSolarAltitude(
  date,

  observer = createObserver(),
) {
  const equatorial = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true);

  const horizon = Astronomy.Horizon(date, observer, equatorial.ra, equatorial.dec, "normal");

  return horizon.altitude;
}

/* ========================================
   ASTRONOMY SCORE
======================================== */

function calculateAstronomyScore({
  object,

  maxAltitude,

  durationHours,

  moonIllumination,

  moonSeparation,
}) {
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

  if (durationHours >= 3) {
    score += 2;
  } else if (durationHours >= 2) {
    score += 1.5;
  } else if (durationHours >= 1) {
    score += 1;
  }

  /*
   * =========================
   * MOONLIGHT
   * =========================
   *
   * 기존에는 달 조명률만 봤지만
   * 이제 실제 달과의 각거리까지 반영.
   */

  score -= getMoonlightPenalty({
    object,

    moonIllumination,

    moonSeparation,
  });

  return Math.max(0, score);
}

/* ========================================
   MOONLIGHT PENALTY
======================================== */

function getMoonlightPenalty({ object, moonIllumination, moonSeparation }) {
  /*
   * 달빛 영향을 크게 받는 대상.
   */
  const deepSky = ["galaxy", "nebula", "cluster"].includes(object?.type);

  if (!deepSky) {
    return 0;
  }

  let penalty = 0;

  /*
   * 달 자체 밝기.
   */
  if (moonIllumination >= 85) {
    penalty += 1.2;
  } else if (moonIllumination >= 70) {
    penalty += 0.9;
  } else if (moonIllumination >= 40) {
    penalty += 0.45;
  }

  /*
   * 달과 실제 각거리.
   *
   * 달과 가까울수록
   * 주변 하늘 배경이 밝아져
   * 은하/성운 같은 저표면밝기 천체에
   * 특히 불리하다.
   */
  if (Number.isFinite(moonSeparation) && moonIllumination >= 30) {
    if (moonSeparation < 20) {
      penalty += 2;
    } else if (moonSeparation < 35) {
      penalty += 1.25;
    } else if (moonSeparation < 60) {
      penalty += 0.55;
    }
  }

  /*
   * 은하 / 성운은 성단보다
   * 달빛에 좀 더 민감하게 처리.
   */
  if (["galaxy", "nebula"].includes(object.type) && moonIllumination >= 70) {
    penalty += 0.35;
  }

  return penalty;
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
   HELPERS
======================================== */

function getAverage(values) {
  const valid = values.filter(value => Number.isFinite(Number(value)));

  if (!valid.length) {
    return 0;
  }

  return valid.reduce((total, value) => total + Number(value), 0) / valid.length;
}

function degreesToRadians(value) {
  return value * (Math.PI / 180);
}

function radiansToDegrees(value) {
  return value * (180 / Math.PI);
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
