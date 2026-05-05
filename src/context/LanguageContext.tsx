import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Supported languages ───────────────────────────────────────────────────────
export interface Language {
  code: string;
  label: string;       // English name
  nativeName: string;  // Name in native script
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en',  label: 'English',  nativeName: 'English',         flag: '🇬🇧' },
  { code: 'fil', label: 'Filipino', nativeName: 'Filipino',        flag: '🇵🇭' },
  { code: 'ceb', label: 'Cebuano',  nativeName: 'Binisaya',        flag: '🇵🇭' },
  { code: 'ilo', label: 'Ilocano',  nativeName: 'Ilocano',         flag: '🇵🇭' },
];

// ── Translation keys ──────────────────────────────────────────────────────────
export interface Translations {
  // App-wide
  appName: string;
  tagline: string;
  // Explore
  hi: string;
  greetingBodyKm: string;   // "You've travelled {n} km this month."
  greetingBodyWhere: string; // "Where to next?"
  tripsThisMonth: string;
  totalSpending: string;
  weather: string;
  travelActivity: string;
  discoverDestinations: string;
  discoverSubtitle: string;
  readMore: string;
  showLess: string;
  // Trips
  myTrips: string;
  myTripsSubtitle: string;
  totalKmTraveled: string;
  totalTrips: string;
  countriesVisited: string;
  totalSpend: string;
  tripHistory: string;
  newTrip: string;
  completed: string;
  planned: string;
  noTrips: string;
  // Profile
  settings: string;
  language: string;
  travelerProfile: string;
  // Tab labels
  tabExplore: string;
  tabTrips: string;
  tabProfile: string;
}

// ── Translation table ─────────────────────────────────────────────────────────
const translations: Record<string, Translations> = {
  en: {
    appName:             'Rana PH',
    tagline:             'Your Travel Buddy',
    hi:                  'Hi',
    greetingBodyKm:      "You've travelled {km} km this month.",
    greetingBodyWhere:   'Where to next?',
    tripsThisMonth:      'Trips this month',
    totalSpending:       'Total spending',
    weather:             'Weather',
    travelActivity:      'Travel activity',
    discoverDestinations:'Discover destinations',
    discoverSubtitle:    'Ideas for your next Philippine adventure',
    readMore:            'Read more ↓',
    showLess:            'Show less ↑',
    myTrips:             'My Trips',
    myTripsSubtitle:     'Track every route and memory in one place.',
    totalKmTraveled:     'Total km traveled',
    totalTrips:          'Total trips',
    countriesVisited:    'Countries visited',
    totalSpend:          'Total spending',
    tripHistory:         'Trip history',
    newTrip:             'New Trip',
    completed:           'Completed',
    planned:             'Planned',
    noTrips:             'No trips yet. Tap + New Trip to start!',
    settings:            'Settings',
    language:            'Language',
    travelerProfile:     'Rana traveler profile',
    tabExplore:          'Explore',
    tabTrips:            'Trips',
    tabProfile:          'Profile',
  },

  fil: {
    appName:             'Rana PH',
    tagline:             'Ang Iyong Kasama sa Biyahe',
    hi:                  'Kumusta',
    greetingBodyKm:      'Naglakbay ka ng {km} km ngayong buwan.',
    greetingBodyWhere:   'Saan ka pupunta?',
    tripsThisMonth:      'Biyahe ngayong buwan',
    totalSpending:       'Kabuuang gastos',
    weather:             'Panahon',
    travelActivity:      'Aktibidad sa biyahe',
    discoverDestinations:'Tuklasin ang mga destinasyon',
    discoverSubtitle:    'Mga ideya para sa iyong susunod na pakikipagsapalaran',
    readMore:            'Basahin pa ↓',
    showLess:            'Itago ↑',
    myTrips:             'Mga Biyahe Ko',
    myTripsSubtitle:     'Subaybayan ang bawat ruta at alaala.',
    totalKmTraveled:     'Kabuuang km na nalakbay',
    totalTrips:          'Kabuuang biyahe',
    countriesVisited:    'Mga bansang binisita',
    totalSpend:          'Kabuuang gastos',
    tripHistory:         'Kasaysayan ng biyahe',
    newTrip:             'Bagong Biyahe',
    completed:           'Tapos na',
    planned:             'Nakaplanong',
    noTrips:             'Wala pang biyahe. I-tap ang + Bagong Biyahe para magsimula!',
    settings:            'Mga Setting',
    language:            'Wika',
    travelerProfile:     'Rana PH manlalakbay',
    tabExplore:          'Tuklasin',
    tabTrips:            'Biyahe',
    tabProfile:          'Profile',
  },

  ceb: {
    appName:             'Rana PH',
    tagline:             'Ang Imong Kauban sa Pagbyahe',
    hi:                  'Kumusta',
    greetingBodyKm:      'Nakabyahe ka og {km} km niining bulana.',
    greetingBodyWhere:   'Asa ka moadto?',
    tripsThisMonth:      'Mga byahe niining bulana',
    totalSpending:       'Kinatibuk-ang gastos',
    weather:             'Panahon',
    travelActivity:      'Kalihokan sa pagbyahe',
    discoverDestinations:'Susihon ang mga destinasyon',
    discoverSubtitle:    'Mga ideya alang sa imong sunod nga pakikipagsapalaran',
    readMore:            'Basaha pa ↓',
    showLess:            'Tago-on ↑',
    myTrips:             'Akong mga Byahe',
    myTripsSubtitle:     'Susiha ang matag ruta ug handumanan.',
    totalKmTraveled:     'Kinatibuk-ang km nga nalakwan',
    totalTrips:          'Kinatibuk-ang byahe',
    countriesVisited:    'Mga nasud nga gibisita',
    totalSpend:          'Kinatibuk-ang gastos',
    tripHistory:         'Kasaysayan sa byahe',
    newTrip:             'Bag-ong Byahe',
    completed:           'Nahuman',
    planned:             'Giplanong',
    noTrips:             'Wala pay byahe. I-tap ang + Bag-ong Byahe aron magsugod!',
    settings:            'Mga Setting',
    language:            'Pinulongan',
    travelerProfile:     'Rana PH manlalakbay',
    tabExplore:          'Susihon',
    tabTrips:            'Byahe',
    tabProfile:          'Profile',
  },

  ilo: {
    appName:             'Rana PH',
    tagline:             'Ti Katrabahom iti Biyahe',
    hi:                  'Kumusta',
    greetingBodyKm:      'Naglakad kayo ti {km} km iti daytoy a bulan.',
    greetingBodyWhere:   'Sadino ti maayanmo?',
    tripsThisMonth:      'Biyahe iti daytoy a bulan',
    totalSpending:       'Dagup a gastos',
    weather:             'Tiempo',
    travelActivity:      'Aramid iti biyahe',
    discoverDestinations:'Masarakan dagiti destihnasyon',
    discoverSubtitle:    'Dagiti ideya para iti sumaganad a biyahem',
    readMore:            'Basaen pay ↓',
    showLess:            'Lyawanen ↑',
    myTrips:             'Dagiti Biyahek',
    myTripsSubtitle:     'Subaybayan ti tunggal ruta ken alaala.',
    totalKmTraveled:     'Dagup a km a nabitbitay',
    totalTrips:          'Dagup a biyahe',
    countriesVisited:    'Dagiti nalbas a pagilian',
    totalSpend:          'Dagup a gastos',
    tripHistory:         'Pakasaritaan ti biyahe',
    newTrip:             'Baro a Biyahe',
    completed:           'Nakompleto',
    planned:             'Naplanoan',
    noTrips:             'Awan pay biyahe. I-tap ti + Baro a Biyahe tapno magsugod!',
    settings:            'Dagiti Setting',
    language:            'Pagsasao',
    travelerProfile:     'Rana PH mamiahe',
    tabExplore:          'Masarakan',
    tabTrips:            'Biyahe',
    tabProfile:          'Profile',
  },
};

// ── Context ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = '@rana_language';

interface LanguageContextValue {
  langCode: string;
  t: Translations;
  setLanguage: (code: string) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  langCode: 'en',
  t: translations.en,
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [langCode, setLangCode] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && translations[saved]) setLangCode(saved);
    });
  }, []);

  const setLanguage = (code: string) => {
    if (!translations[code]) return;
    setLangCode(code);
    AsyncStorage.setItem(STORAGE_KEY, code);
  };

  return (
    <LanguageContext.Provider value={{ langCode, t: translations[langCode], setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
