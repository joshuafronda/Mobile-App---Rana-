/**
 * OpenWeatherMap One Call API 3.0 wrapper.
 *
 * SETUP: Replace OWM_API_KEY below with your real key from
 *        https://home.openweathermap.org/api_keys
 *        The One Call 3.0 endpoint is on the "One Call by Call" plan.
 *        Free tier: 1,000 calls/day.
 */

export const OWM_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY_HERE';

// ── Types ────────────────────────────────────────────────────────────────────

export type OWMWeatherCondition = {
  id: number;
  main: string;
  description: string;
  icon: string;
};

export type OWMCurrent = {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  weather: OWMWeatherCondition[];
};

export type OWMHourly = {
  dt: number;
  temp: number;
  feels_like: number;
  humidity: number;
  uvi: number;
  clouds: number;
  wind_speed: number;
  pop: number; // probability of precipitation 0–1
  weather: OWMWeatherCondition[];
};

export type OWMDaily = {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: {
    morn: number;
    day: number;
    eve: number;
    night: number;
    min: number;
    max: number;
  };
  feels_like: { morn: number; day: number; eve: number; night: number };
  humidity: number;
  wind_speed: number;
  clouds: number;
  pop: number;
  uvi: number;
  rain?: number;
  snow?: number;
  weather: OWMWeatherCondition[];
  summary?: string;
};

export type OWMAlert = {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
};

export type OWMOneCallResponse = {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: OWMCurrent;
  hourly: OWMHourly[];
  daily: OWMDaily[];
  alerts?: OWMAlert[];
};

// ── Score a daily forecast for travel quality (0-100) ───────────────────────

export function scoreTravelDay(day: OWMDaily): number {
  let score = 100;
  // Rain probability penalty
  score -= Math.round(day.pop * 40);
  // Cloud cover penalty
  score -= Math.round((day.clouds / 100) * 20);
  // UV index penalty if very high (>8)
  if (day.uvi > 8) score -= 15;
  // Wind penalty if strong (>10 m/s)
  if (day.wind_speed > 10) score -= 10;
  // Temperature comfort band 22–32°C
  const dayTemp = day.temp.day;
  if (dayTemp < 18 || dayTemp > 36) score -= 15;
  return Math.max(0, Math.min(100, score));
}

// ── Derive a human-readable weather comment ──────────────────────────────────

export function buildWeatherComment(current: OWMCurrent): string {
  const condition = current.weather[0]?.main ?? '';
  const temp = Math.round(current.temp);
  const humidity = current.humidity;
  const pop = current.uvi;

  if (condition === 'Thunderstorm') return `⚡ Heads-up! Thunderstorms nearby. Consider postponing outdoor plans.`;
  if (condition === 'Rain' || condition === 'Drizzle') return `🌧 It's ${temp}°C with rain outside. Great day to plan your next trip!`;
  if (condition === 'Snow') return `❄️ Snowy at ${temp}°C. Bundle up if you're heading out!`;
  if (condition === 'Mist' || condition === 'Fog') return `🌫 Foggy out there (${temp}°C). Visibility may be low — drive safe.`;
  if (condition === 'Clear' && temp >= 26) return `☀️ Beautiful sunny day at ${temp}°C. Perfect weather for an adventure!`;
  if (condition === 'Clear') return `✨ Clear skies at ${temp}°C. A great day to explore!`;
  if (condition === 'Clouds' && humidity > 75) return `☁️ Cloudy and humid at ${temp}°C. Good for a light trip — not too hot.`;
  if (condition === 'Clouds') return `⛅ Partly cloudy at ${temp}°C — comfortable travel weather.`;
  return `🌤 ${temp}°C outside. Check local conditions before heading out!`;
}

// ── API fetch ────────────────────────────────────────────────────────────────

export async function fetchOneCall(
  latitude: number,
  longitude: number
): Promise<OWMOneCallResponse | null> {
  if (OWM_API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY_HERE') {
    console.warn('[WeatherService] OWM_API_KEY not set. Using fallback data.');
    return null;
  }

  try {
    const url =
      `https://api.openweathermap.org/data/3.0/onecall` +
      `?lat=${latitude}&lon=${longitude}` +
      `&exclude=minutely` +
      `&units=metric` +
      `&appid=${OWM_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as OWMOneCallResponse;
  } catch {
    return null;
  }
}
