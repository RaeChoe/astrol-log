const SEOUL = {
  latitude: 37.5665,
  longitude: 126.978,

  /*
   * 서울특별시 대표 격자
   */
  nx: 60,
  ny: 127,

  label: "SEOUL, KOREA",
};

const BASE_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";

/*
 * 단기예보 발표시각
 */
const VILLAGE_FORECAST_TIMES = [2, 5, 8, 11, 14, 17, 20, 23];

export async function getWeatherData() {
  const apiKey = process.env.KMA_API_KEY;

  if (!apiKey) {
    throw new Error("KMA_API_KEY가 설정되지 않았습니다.");
  }

  const now = new Date();

  const currentBase = getUltraCurrentBaseTime(now);

  const forecastBase = getVillageForecastBaseTime(now);

  /*
   * =========================
   * 초단기실황
   * =========================
   */

  const currentUrl = createKmaUrl("getUltraSrtNcst", {
    serviceKey: apiKey,

    pageNo: "1",

    numOfRows: "100",

    dataType: "JSON",

    base_date: currentBase.date,

    base_time: currentBase.time,

    nx: String(SEOUL.nx),

    ny: String(SEOUL.ny),
  });

  /*
   * =========================
   * 단기예보
   * =========================
   *
   * 오늘 밤부터 다음날 새벽까지
   * 추천 관측시간 계산에 사용.
   */

  const forecastUrl = createKmaUrl("getVilageFcst", {
    serviceKey: apiKey,

    pageNo: "1",

    /*
     * 단기예보는 여러 날짜와
     * 시간의 카테고리가 함께 오므로
     * 넉넉하게 조회.
     */
    numOfRows: "1000",

    dataType: "JSON",

    base_date: forecastBase.date,

    base_time: forecastBase.time,

    nx: String(SEOUL.nx),

    ny: String(SEOUL.ny),
  });

  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(currentUrl, {
      next: {
        revalidate: 600,
      },
    }),

    fetch(forecastUrl, {
      next: {
        revalidate: 600,
      },
    }),
  ]);

  if (!currentResponse.ok) {
    const errorText = await currentResponse.text();

    throw new Error(`기상청 초단기실황 오류: ${currentResponse.status} ${errorText}`);
  }

  if (!forecastResponse.ok) {
    const errorText = await forecastResponse.text();

    throw new Error(`기상청 단기예보 오류: ${forecastResponse.status} ${errorText}`);
  }

  const [currentJson, forecastJson] = await Promise.all([
    currentResponse.json(),
    forecastResponse.json(),
  ]);

  validateKmaResponse(currentJson, "초단기실황");

  validateKmaResponse(forecastJson, "단기예보");

  const currentItems = getResponseItems(currentJson);

  const forecastItems = getResponseItems(forecastJson);

  const currentValues = parseCurrentWeather(currentItems);

  const hourly = parseForecastHours(forecastItems);

  /*
   * 현재 시간과 가장 가까운
   * 단기예보를 찾아
   * SKY / POP 등을 현재 정보에 합친다.
   */
  const nearestForecast = getNearestForecast(hourly, now);

  const skyCode = nearestForecast?.skyCode ?? null;

  const precipitationType =
    currentValues.precipitationType ?? nearestForecast?.precipitationType ?? 0;

  return {
    location: SEOUL,

    current: {
      temperature: currentValues.temperature,

      humidity: currentValues.humidity,

      windSpeed: currentValues.windSpeed,

      rainAmount: currentValues.rainAmount,

      precipitationType,

      precipitationProbability: nearestForecast?.precipitationProbability ?? 0,

      skyCode,

      condition: getWeatherCondition({
        skyCode,
        precipitationType,
      }),
    },

    hourly,
  };
}

/* ========================================
   URL
======================================== */

function createKmaUrl(endpoint, params) {
  const url = new URL(`${BASE_URL}/${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

/* ========================================
   RESPONSE
======================================== */

function validateKmaResponse(json, label) {
  const header = json?.response?.header;

  if (!header) {
    throw new Error(`기상청 ${label} 응답 형식이 올바르지 않습니다.`);
  }

  if (header.resultCode !== "00") {
    throw new Error(`기상청 ${label} 오류: ${header.resultCode} ${header.resultMsg}`);
  }
}

function getResponseItems(json) {
  const items = json?.response?.body?.items?.item;

  return Array.isArray(items) ? items : [];
}

/* ========================================
   CURRENT WEATHER
======================================== */

function parseCurrentWeather(items) {
  const values = {
    temperature: null,
    humidity: null,
    windSpeed: null,
    rainAmount: null,
    precipitationType: null,
  };

  items.forEach(item => {
    switch (item.category) {
      /*
       * 기온
       */
      case "T1H":
        values.temperature = toNumber(item.obsrValue);

        break;

      /*
       * 습도
       */
      case "REH":
        values.humidity = toNumber(item.obsrValue);

        break;

      /*
       * 풍속
       */
      case "WSD":
        values.windSpeed = toNumber(item.obsrValue);

        break;

      /*
       * 1시간 강수량
       */
      case "RN1":
        values.rainAmount = item.obsrValue ?? null;

        break;

      /*
       * 강수형태
       */
      case "PTY":
        values.precipitationType = toNumber(item.obsrValue);

        break;

      default:
        break;
    }
  });

  return values;
}

/* ========================================
   FORECAST
======================================== */

function parseForecastHours(items) {
  const groups = new Map();

  items.forEach(item => {
    const { fcstDate, fcstTime, category, fcstValue } = item;

    if (!fcstDate || !fcstTime) {
      return;
    }

    const key = `${fcstDate}-${fcstTime}`;

    if (!groups.has(key)) {
      groups.set(key, {
        date: fcstDate,

        time: fcstTime,

        temperature: null,

        skyCode: null,

        precipitationType: 0,

        precipitationProbability: 0,

        humidity: null,

        windSpeed: null,
      });
    }

    const forecast = groups.get(key);

    switch (category) {
      /*
       * 기온
       */
      case "TMP":
        forecast.temperature = toNumber(fcstValue);

        break;

      /*
       * 하늘상태
       * 1 맑음
       * 3 구름많음
       * 4 흐림
       */
      case "SKY":
        forecast.skyCode = toNumber(fcstValue);

        break;

      /*
       * 강수형태
       */
      case "PTY":
        forecast.precipitationType = toNumber(fcstValue) ?? 0;

        break;

      /*
       * 강수확률
       */
      case "POP":
        forecast.precipitationProbability = toNumber(fcstValue) ?? 0;

        break;

      /*
       * 습도
       */
      case "REH":
        forecast.humidity = toNumber(fcstValue);

        break;

      /*
       * 풍속
       */
      case "WSD":
        forecast.windSpeed = toNumber(fcstValue);

        break;

      default:
        break;
    }
  });

  return Array.from(groups.values())
    .map(forecast => ({
      ...forecast,

      timestamp: createKstTimestamp(forecast.date, forecast.time),
    }))
    .filter(forecast => Number.isFinite(forecast.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);
}

function getNearestForecast(hourly, now) {
  if (!hourly.length) {
    return null;
  }

  const nowTime = now.getTime();

  return hourly.reduce((nearest, forecast) => {
    if (!nearest) {
      return forecast;
    }

    const currentDistance = Math.abs(forecast.timestamp - nowTime);

    const nearestDistance = Math.abs(nearest.timestamp - nowTime);

    return currentDistance < nearestDistance ? forecast : nearest;
  }, null);
}

/* ========================================
   CONDITION
======================================== */

export function getWeatherCondition({ skyCode, precipitationType }) {
  /*
   * 강수형태가 있으면
   * SKY보다 우선.
   */
  switch (precipitationType) {
    case 1:
      return "비";

    case 2:
      return "비/눈";

    case 3:
      return "눈";

    case 4:
      return "소나기";

    case 5:
      return "빗방울";

    case 6:
      return "빗방울/눈날림";

    case 7:
      return "눈날림";

    default:
      break;
  }

  switch (skyCode) {
    case 1:
      return "맑음";

    case 3:
      return "구름많음";

    case 4:
      return "흐림";

    default:
      return "정보 없음";
  }
}

/* ========================================
   BASE TIME
======================================== */

/*
 * 초단기실황은 정시 기준 자료를
 * 약간의 지연 뒤 조회한다.
 *
 * 매시 40분 이전에는
 * 이전 시간 자료를 사용.
 */
function getUltraCurrentBaseTime(now) {
  const parts = getKstParts(now);

  let date = createPseudoKstDate(parts);

  let hour = parts.hour;

  if (parts.minute < 40) {
    hour -= 1;

    if (hour < 0) {
      date = new Date(date.getTime() - 24 * 60 * 60 * 1000);

      hour = 23;
    }
  }

  return {
    date: formatPseudoDate(date),

    time: `${String(hour).padStart(2, "0")}00`,
  };
}

/*
 * 단기예보 발표:
 * 02 / 05 / 08 / 11 / 14 / 17 / 20 / 23시
 *
 * 배포 직후 요청 실패를 줄이기 위해
 * 발표시각 + 15분 이후부터 사용.
 */
function getVillageForecastBaseTime(now) {
  const parts = getKstParts(now);

  let date = createPseudoKstDate(parts);

  const available = VILLAGE_FORECAST_TIMES.filter(
    hour => parts.hour > hour || (parts.hour === hour && parts.minute >= 15),
  );

  let baseHour;

  if (available.length) {
    baseHour = available[available.length - 1];
  } else {
    date = new Date(date.getTime() - 24 * 60 * 60 * 1000);

    baseHour = 23;
  }

  return {
    date: formatPseudoDate(date),

    time: `${String(baseHour).padStart(2, "0")}00`,
  };
}

/* ========================================
   KST DATE
======================================== */

function getKstParts(value) {
  const kst = new Date(value.getTime() + 9 * 60 * 60 * 1000);

  return {
    year: kst.getUTCFullYear(),

    month: kst.getUTCMonth() + 1,

    day: kst.getUTCDate(),

    hour: kst.getUTCHours(),

    minute: kst.getUTCMinutes(),
  };
}

/*
 * 시간대 변환 계산용 Date.
 * 값 자체를 KST 달력처럼 취급한다.
 */
function createPseudoKstDate(parts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0));
}

function formatPseudoDate(value) {
  return [
    value.getUTCFullYear(),

    String(value.getUTCMonth() + 1).padStart(2, "0"),

    String(value.getUTCDate()).padStart(2, "0"),
  ].join("");
}

function createKstTimestamp(date, time) {
  const year = date.slice(0, 4);

  const month = date.slice(4, 6);

  const day = date.slice(6, 8);

  const hour = time.slice(0, 2);

  const minute = time.slice(2, 4);

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+09:00`).getTime();
}

/* ========================================
   UTIL
======================================== */

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}
