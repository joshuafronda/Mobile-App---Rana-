import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  fetchOneCall,
  buildWeatherComment,
  scoreTravelDay,
  type OWMCurrent,
  type OWMDaily,
  type OWMAlert,
} from '@/src/services/weatherService';
import { type Ionicons } from '@expo/vector-icons';

// ── Types ────────────────────────────────────────────────────────────────────

export type BestTripDay = {
  dateISO: string;      // 'YYYY-MM-DD'
  label: string;        // e.g. 'Fri, May 8'
  score: number;        // 0–100
  maxTemp: number;
  minTemp: number;
  pop: number;          // precipitation probability 0–1
  description: string;  // e.g. 'Clear sky'
  icon: string;         // OWM icon code
};

export type WeatherContextValue = {
  // Current weather
  cityName: string;
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  weatherIcon: keyof typeof Ionicons.glyphMap;
  weatherMain: string;
  weatherDescription: string;
  uvi: number | null;
  windSpeed: number | null;
  // Assistant comment
  weatherComment: string;
  // 8-day forecast ranked by travel quality
  bestTripDays: BestTripDay[];
  // Raw daily data for explore display
  dailyForecast: OWMDaily[];
  // Alerts
  alerts: OWMAlert[];
  // Meta
  loading: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
};

// ── OWM weather-code → Ionicons mapping ─────────────────────────────────────

function owmMainToIcon(main: string): keyof typeof Ionicons.glyphMap {
  switch (main) {
    case 'Clear': return 'sunny';
    case 'Clouds': return 'partly-sunny';
    case 'Rain': return 'rainy';
    case 'Drizzle': return 'rainy-outline';
    case 'Thunderstorm': return 'thunderstorm';
    case 'Snow': return 'snow';
    case 'Mist':
    case 'Fog':
    case 'Haze': return 'cloud-outline';
    default: return 'partly-sunny';
  }
}

// ── Open-Meteo fallback (no API key needed) ──────────────────────────────────

async function fetchOpenMeteoFallback(latitude: number, longitude: number) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,weathercode,relativehumidity_2m,apparent_temperature,windspeed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max,uv_index_max` +
      `&timezone=auto&forecast_days=8`
    );
    if (!res.ok) return null;
    return await res.json() as any;
  } catch {
    return null;
  }
}

function openMeteoCodeToMain(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Clouds';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain';
  if (code <= 95) return 'Thunderstorm';
  return 'Clouds';
}

function openMeteoCodeToDesc(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Light drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snowfall';
  if (code <= 82) return 'Rain showers';
  if (code <= 95) return 'Thunderstorm';
  return 'Cloudy';
}

// ── Context ──────────────────────────────────────────────────────────────────

const WeatherContext = createContext<WeatherContextValue>({
  cityName: 'Loading...',
  temperature: null,
  feelsLike: null,
  humidity: null,
  weatherIcon: 'partly-sunny',
  weatherMain: '',
  weatherDescription: '',
  uvi: null,
  windSpeed: null,
  weatherComment: '',
  bestTripDays: [],
  dailyForecast: [],
  alerts: [],
  loading: true,
  lastUpdated: null,
  refresh: () => {},
});

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [cityName, setCityName] = useState('Locating...');
  const [temperature, setTemperature] = useState<number | null>(null);
  const [feelsLike, setFeelsLike] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [weatherIcon, setWeatherIcon] = useState<keyof typeof Ionicons.glyphMap>('partly-sunny');
  const [weatherMain, setWeatherMain] = useState('');
  const [weatherDescription, setWeatherDescription] = useState('');
  const [uvi, setUvi] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [weatherComment, setWeatherComment] = useState('');
  const [bestTripDays, setBestTripDays] = useState<BestTripDay[]>([]);
  const [dailyForecast, setDailyForecast] = useState<OWMDaily[]>([]);
  const [alerts, setAlerts] = useState<OWMAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          if (mounted) setCityName('Quezon City');
          return;
        }

        const pos = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = pos.coords;

        // Reverse geocode for city name
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        const p = places[0];
        const city = p?.city || p?.district || p?.subregion || 'Current location';
        if (mounted) setCityName(city);

        // Try OWM One Call 3.0 first
        const owmData = await fetchOneCall(latitude, longitude);

        if (owmData && mounted) {
          // ── Current weather ──
          const cur = owmData.current;
          const main = cur.weather[0]?.main ?? '';
          setTemperature(Math.round(cur.temp));
          setFeelsLike(Math.round(cur.feels_like));
          setHumidity(cur.humidity);
          setUvi(cur.uvi);
          setWindSpeed(cur.wind_speed);
          setWeatherMain(main);
          setWeatherDescription(cur.weather[0]?.description ?? '');
          setWeatherIcon(owmMainToIcon(main));
          setWeatherComment(buildWeatherComment(cur));
          setAlerts(owmData.alerts ?? []);
          setDailyForecast(owmData.daily);

          // ── Best trip days (next 8 days, sorted by score) ──
          const scored: BestTripDay[] = owmData.daily.map((day) => {
            const d = new Date(day.dt * 1000);
            const score = scoreTravelDay(day);
            return {
              dateISO: d.toISOString().split('T')[0],
              label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
              score,
              maxTemp: Math.round(day.temp.max),
              minTemp: Math.round(day.temp.min),
              pop: day.pop,
              description: day.weather[0]?.description ?? '',
              icon: day.weather[0]?.icon ?? '',
            };
          });
          scored.sort((a, b) => b.score - a.score);
          setBestTripDays(scored);
        } else {
          // ── Fallback: open-meteo (free, no key) ──
          const meteo = await fetchOpenMeteoFallback(latitude, longitude);
          if (meteo && mounted) {
            const code = meteo.current?.weathercode ?? 0;
            const main = openMeteoCodeToMain(code);
            const temp = Math.round(meteo.current?.temperature_2m ?? 29);
            const hum = meteo.current?.relativehumidity_2m ?? 70;
            const fl = Math.round(meteo.current?.apparent_temperature ?? temp);
            const ws = meteo.current?.windspeed_10m ?? 0;

            setTemperature(temp);
            setFeelsLike(fl);
            setHumidity(hum);
            setWeatherMain(main);
            setWeatherDescription(openMeteoCodeToDesc(code));
            setWeatherIcon(owmMainToIcon(main));
            setWindSpeed(ws);

            // Build a minimal fake OWMCurrent for comment generator
            const fakeCurrent = {
              temp, humidity: hum, uvi: 0,
              weather: [{ id: 0, main, description: openMeteoCodeToDesc(code), icon: '' }],
            } as any;
            setWeatherComment(buildWeatherComment(fakeCurrent));

            // Build best trip days from open-meteo daily
            const dates: string[] = meteo.daily?.time ?? [];
            const maxTemps: number[] = meteo.daily?.temperature_2m_max ?? [];
            const minTemps: number[] = meteo.daily?.temperature_2m_min ?? [];
            const pops: number[] = meteo.daily?.precipitation_probability_max ?? [];
            const codes: number[] = meteo.daily?.weathercode ?? [];
            const uvs: number[] = meteo.daily?.uv_index_max ?? [];
            const winds: number[] = meteo.daily?.windspeed_10m_max ?? [];

            const scored: BestTripDay[] = dates.map((iso: string, i: number) => {
              const pop = (pops[i] ?? 0) / 100;
              const clouds = codes[i] >= 1 && codes[i] <= 3 ? 40 : codes[i] > 3 ? 70 : 5;
              const fakeDay = {
                pop,
                clouds,
                uvi: uvs[i] ?? 0,
                wind_speed: winds[i] ?? 0,
                temp: { day: (maxTemps[i] + minTemps[i]) / 2, max: maxTemps[i], min: minTemps[i], morn: 0, eve: 0, night: 0 },
                weather: [{ id: 0, main: openMeteoCodeToMain(codes[i] ?? 0), description: openMeteoCodeToDesc(codes[i] ?? 0), icon: '' }],
              } as any;
              const score = scoreTravelDay(fakeDay);
              const d = new Date(iso);
              return {
                dateISO: iso,
                label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                score,
                maxTemp: Math.round(maxTemps[i] ?? 30),
                minTemp: Math.round(minTemps[i] ?? 24),
                pop,
                description: openMeteoCodeToDesc(codes[i] ?? 0),
                icon: '',
              };
            });
            scored.sort((a, b) => b.score - a.score);
            setBestTripDays(scored);
          }
        }

        setLastUpdated(new Date());
      } catch {
        if (mounted) setCityName('Quezon City');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 10 * 60 * 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, [tick]);

  const refresh = () => setTick((t) => t + 1);

  return (
    <WeatherContext.Provider
      value={{
        cityName, temperature, feelsLike, humidity, weatherIcon, weatherMain,
        weatherDescription, uvi, windSpeed, weatherComment, bestTripDays,
        dailyForecast, alerts, loading, lastUpdated, refresh,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  return useContext(WeatherContext);
}
