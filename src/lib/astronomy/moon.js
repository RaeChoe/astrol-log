import * as SunCalc from "suncalc";

const DEFAULT_LOCATION = {
  latitude: 37.5665,
  longitude: 126.978,
};

const MOON_PHASES = [
  "삭",
  "초승달",
  "상현달",
  "차오르는 달",
  "보름달",
  "기우는 달",
  "하현달",
  "그믐달",
];

export function getAstronomyData(date = new Date(), location = DEFAULT_LOCATION) {
  const latitude = location?.latitude ?? DEFAULT_LOCATION.latitude;

  const longitude = location?.longitude ?? DEFAULT_LOCATION.longitude;

  const illumination = SunCalc.getMoonIllumination(date);

  const moonTimes = SunCalc.getMoonTimes(date, latitude, longitude);

  const sunTimes = SunCalc.getTimes(date, latitude, longitude);

  const phaseIndex = Math.round(illumination.phase * 8) % 8;

  return {
    moonPhase: MOON_PHASES[phaseIndex],

    moonIllumination: Math.round(illumination.fraction * 100),

    moonrise: formatTime(moonTimes.rise),

    moonset: formatTime(moonTimes.set),

    sunset: formatTime(sunTimes.sunset),

    sunrise: formatTime(sunTimes.sunrise),
  };
}

function formatTime(value) {
  if (!value || Number.isNaN(value.getTime?.())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",

    minute: "2-digit",

    hour12: false,

    timeZone: "Asia/Seoul",
  }).format(value);
}
