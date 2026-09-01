import { getAstronomyData } from "@/lib/astronomy/moon";

import { getWeatherData } from "@/lib/astronomy/weather";

const DEFAULT_LOCATION = {
  latitude: 37.5665,
  longitude: 126.978,
  label: "SEOUL, KOREA",
  source: "default",
};

export async function getTodaySkyData(location = DEFAULT_LOCATION) {
  const now = new Date();

  const observerLocation = {
    latitude: location?.latitude ?? DEFAULT_LOCATION.latitude,

    longitude: location?.longitude ?? DEFAULT_LOCATION.longitude,

    label: location?.label ?? DEFAULT_LOCATION.label,

    source: location?.source ?? DEFAULT_LOCATION.source,
  };

  try {
    const [weather, astronomy] = await Promise.all([
      getWeatherData({
        latitude: observerLocation.latitude,

        longitude: observerLocation.longitude,

        label: observerLocation.label,
      }),

      Promise.resolve(
        getAstronomyData(now, {
          latitude: observerLocation.latitude,

          longitude: observerLocation.longitude,
        }),
      ),
    ]);

    const observationCondition = calculateObservationCondition(weather.current);

    const recommendation = getRecommendedTime({
      forecastHours: weather.hourly,

      now,
    });

    return {
      source: "live",

      location: weather.location.label,

      locationSource: observerLocation.source,

      latitude: observerLocation.latitude,

      longitude: observerLocation.longitude,

      date: formatDate(now),

      /*
       * Tonight's Highlights에서도
       * 시간별 날씨를 사용할 수 있도록 전달.
       */
      forecastHours: weather.hourly || [],

      ...weather.current,

      ...astronomy,

      observationCondition,

      recommendation,
    };
  } catch (error) {
    console.error("Today 데이터 조회 오류:", {
      message: error?.message,

      stack: error?.stack,
    });

    /*
     * 날씨 API가 실패하더라도
     * 천문 데이터는 현재 위치 기준으로 유지.
     */
    const astronomy = getAstronomyData(now, {
      latitude: observerLocation.latitude,

      longitude: observerLocation.longitude,
    });

    return {
      source: "fallback",

      location: observerLocation.label,

      locationSource: observerLocation.source,

      latitude: observerLocation.latitude,

      longitude: observerLocation.longitude,

      date: formatDate(now),

      forecastHours: [],

      temperature: null,

      humidity: null,

      windSpeed: null,

      rainAmount: null,

      precipitationType: null,

      precipitationProbability: null,

      skyCode: null,

      condition: "정보 없음",

      ...astronomy,

      observationCondition: {
        score: 0,

        label: "정보 없음",
      },

      recommendation: {
        available: false,

        start: "-",

        end: "-",

        label: "정보 없음",
      },
    };
  }
}

/* ========================================
   OBSERVATION CONDITION
======================================== */

function calculateObservationCondition(weather) {
  let score = 5;

  /*
   * 하늘 상태
   *
   * SKY
   * 1 = 맑음
   * 3 = 구름많음
   * 4 = 흐림
   */

  if (weather.skyCode === 3) {
    score -= 1;
  }

  if (weather.skyCode === 4) {
    score -= 3;
  }

  /*
   * 강수
   */

  if (weather.precipitationType && weather.precipitationType !== 0) {
    score -= 3;
  }

  const precipitationProbability = weather.precipitationProbability ?? 0;

  if (precipitationProbability >= 70) {
    score -= 2;
  } else if (precipitationProbability >= 40) {
    score -= 1;
  }

  /*
   * 바람
   */

  const windSpeed = weather.windSpeed ?? 0;

  if (windSpeed >= 14) {
    score -= 2;
  } else if (windSpeed >= 8) {
    score -= 1;
  }

  /*
   * 습도
   */

  const humidity = weather.humidity ?? 0;

  if (humidity >= 90) {
    score -= 1;
  }

  score = Math.max(1, Math.min(5, score));

  return {
    score,

    label: getConditionLabel(score),
  };
}

function getConditionLabel(score) {
  if (score >= 5) {
    return "매우 좋음";
  }

  if (score >= 4) {
    return "좋음";
  }

  if (score >= 3) {
    return "보통";
  }

  if (score >= 2) {
    return "나쁨";
  }

  return "매우 나쁨";
}

/* ========================================
   RECOMMENDED TIME
======================================== */

function getRecommendedTime({ forecastHours, now }) {
  if (!forecastHours?.length) {
    return {
      available: false,

      start: "-",

      end: "-",

      label: "추천 시간 없음",
    };
  }

  const nowTime = now.getTime();

  /*
   * 현재 이후 야간 시간만 사용.
   *
   * 18:00 ~ 05:59
   */

  const nighttime = forecastHours.filter(forecast => {
    if (forecast.timestamp < nowTime) {
      return false;
    }

    const hour = Number(forecast.time.slice(0, 2));

    return hour >= 18 || hour <= 5;
  });

  if (nighttime.length < 3) {
    return {
      available: false,

      start: "-",

      end: "-",

      label: "추천 시간 없음",
    };
  }

  let bestWindow = null;

  /*
   * 3시간 연속 구간 비교
   */

  for (let index = 0; index <= nighttime.length - 3; index += 1) {
    const window = nighttime.slice(index, index + 3);

    const isContinuous = window.every((forecast, windowIndex) => {
      if (windowIndex === 0) {
        return true;
      }

      const previous = window[windowIndex - 1];

      return forecast.timestamp - previous.timestamp === 60 * 60 * 1000;
    });

    if (!isContinuous) {
      continue;
    }

    /*
     * 비 / 눈 제외
     */

    const hasPrecipitation = window.some(
      forecast => forecast.precipitationType && forecast.precipitationType !== 0,
    );

    if (hasPrecipitation) {
      continue;
    }

    /*
     * 모두 흐림 제외
     */

    const allCloudy = window.every(forecast => forecast.skyCode === 4);

    if (allCloudy) {
      continue;
    }

    /*
     * 평균 강수 확률
     */

    const averagePrecipitationProbability =
      window.reduce((total, forecast) => total + (forecast.precipitationProbability ?? 0), 0) /
      window.length;

    if (averagePrecipitationProbability >= 60) {
      continue;
    }

    const penalty = window.reduce((total, forecast) => total + getForecastPenalty(forecast), 0);

    if (!bestWindow || penalty < bestWindow.penalty) {
      bestWindow = {
        penalty,

        window,
      };
    }
  }

  if (!bestWindow) {
    return {
      available: false,

      start: "-",

      end: "-",

      label: "오늘은 관측 비추천",
    };
  }

  if (bestWindow.penalty >= 170) {
    return {
      available: false,

      start: "-",

      end: "-",

      label: "오늘은 관측 비추천",
    };
  }

  const first = bestWindow.window[0];

  const last = bestWindow.window[bestWindow.window.length - 1];

  return {
    available: true,

    start: formatForecastTime(first),

    end: addHour(formatForecastTime(last)),

    label: "추천 시간",
  };
}

/* ========================================
   FORECAST PENALTY
======================================== */

function getForecastPenalty(forecast) {
  let penalty = 0;

  if (forecast.skyCode === 3) {
    penalty += 25;
  }

  if (forecast.skyCode === 4) {
    penalty += 60;
  }

  if (forecast.precipitationType && forecast.precipitationType !== 0) {
    penalty += 120;
  }

  penalty += forecast.precipitationProbability ?? 0;

  penalty += (forecast.windSpeed ?? 0) * 3;

  const humidity = forecast.humidity ?? 0;

  if (humidity >= 90) {
    penalty += 25;
  } else if (humidity >= 80) {
    penalty += 12;
  }

  return penalty;
}

/* ========================================
   FORMATTERS
======================================== */

function formatForecastTime(forecast) {
  if (!forecast?.time) {
    return "-";
  }

  return `${forecast.time.slice(0, 2)}:00`;
}

function addHour(value) {
  if (value === "-") {
    return "-";
  }

  const hour = Number(value.slice(0, 2));

  return `${String((hour + 1) % 24).padStart(2, "0")}:00`;
}

function formatDate(value) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",

    month: "2-digit",

    day: "2-digit",

    timeZone: "Asia/Seoul",
  }).formatToParts(value);

  const year = parts.find(item => item.type === "year")?.value;

  const month = parts.find(item => item.type === "month")?.value;

  const day = parts.find(item => item.type === "day")?.value;

  return `${year}.${month}.${day}`;
}
