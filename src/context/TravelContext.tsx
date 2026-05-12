import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiGetTrips, apiCreateTrip, apiUpdateTrip, apiDeleteTrip } from '@/src/services/apiService';

export type TransportCategory =
  | 'Jeep'
  | 'Bus'
  | 'Train/LRT/MRT'
  | 'Motor'
  | 'Car/Taxi'
  | 'Local Airplane'
  | 'International Airplane'
  | 'Ferry'
  | 'FastCraft'
  | 'Bangka'
  | 'Cruise';

export type Trip = {
  id: string;
  transportType: TransportCategory;
  origin: string;
  destination: string;
  distanceKm: number;
  passengers: number;
  dateISO: string;
  totalCost: number;
  country: string;
  // optional metadata
  title?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  durationDays?: number;
  status?: 'planned' | 'confirmed' | 'draft' | 'completed' | 'cancelled';
  description?: string;
  action?: string;
  budgetRange?: string;
  budgetNotes?: string[];
};

export type PhotoEntry = {
  id: string;
  uri: string;
  locationName: string;
  transportType: TransportCategory;
  createdAtISO: string;
};

type EstimateInput = {
  transportType: TransportCategory;
  distanceKm: number;
  passengers: number;
};

type TravelContextValue = {
  trips: Trip[];
  photos: PhotoEntry[];
  addTrip: (trip: Omit<Trip, 'id' | 'dateISO'>) => void | Promise<void>;
  deleteTrip: (tripId: string) => void | Promise<void>;
  updateTrip: (tripId: string, updates: Partial<Omit<Trip, 'id'>>) => void | Promise<void>;
  addPhoto: (photo: Omit<PhotoEntry, 'id' | 'createdAtISO'>) => void;
  deletePhoto: (photoId: string) => void;
  estimateFare: (input: EstimateInput) => number;
};

export const TRIP_BASE_FARES: Record<
  TransportCategory,
  { minKm: number; baseFare: number; extraPerKm: number }
> = {
  Jeep: { minKm: 4, baseFare: 13, extraPerKm: 2.2 },
  Bus: { minKm: 5, baseFare: 15, extraPerKm: 2.65 },
  'Train/LRT/MRT': { minKm: 3, baseFare: 15, extraPerKm: 1.8 },
  Motor: { minKm: 1, baseFare: 40, extraPerKm: 7 },
  'Car/Taxi': { minKm: 1, baseFare: 45, extraPerKm: 13.5 },
  'Local Airplane': { minKm: 1, baseFare: 1200, extraPerKm: 4.8 },
  'International Airplane': { minKm: 1, baseFare: 3200, extraPerKm: 8.9 },
  Ferry: { minKm: 10, baseFare: 200, extraPerKm: 3.5 },
  FastCraft: { minKm: 10, baseFare: 350, extraPerKm: 5.5 },
  Bangka: { minKm: 1, baseFare: 80, extraPerKm: 15 },
  Cruise: { minKm: 100, baseFare: 5000, extraPerKm: 2.5 },
};

const initialTrips: Trip[] = [
  {
    id: 'trip-1',
    title: 'Bora Bora Luxury Escape',
    transportType: 'International Airplane',
    origin: 'Manila',
    destination: 'Bora Bora',
    distanceKm: 8700,
    passengers: 2,
    dateISO: new Date('2026-07-10').toISOString(),
    startDate: '2026-07-10',
    endDate: '2026-07-15',
    totalCost: 161200,
    country: 'French Polynesia',
    status: 'planned',
    description: 'Relaxation trip with lagoon tours, snorkeling, and overwater villa stay.',
    budgetRange: '₱250,000 – ₱500,000+',
    budgetNotes: ['Flights: very expensive (multiple connections)', 'Stay: luxury resorts dominate', '👉 Premium / honeymoon-level'],
  },
  {
    id: 'trip-2',
    title: 'Maldives Island Getaway',
    transportType: 'International Airplane',
    origin: 'Manila',
    destination: 'Maldives',
    distanceKm: 5800,
    passengers: 3,
    dateISO: new Date('2026-11-05').toISOString(),
    startDate: '2026-11-05',
    endDate: '2026-11-10',
    totalCost: 164400,
    country: 'Maldives',
    status: 'confirmed',
    description: 'Island hopping with a mix of budget island stay and resort experience.',
    budgetRange: '₱180,000 – ₱400,000',
    budgetNotes: ['Resorts + seaplane transfers', 'Can be cheaper with guesthouses (₱120k+)'],
  },
  {
    id: 'trip-3',
    title: 'Banff Nature Exploration',
    transportType: 'International Airplane',
    origin: 'Manila',
    destination: 'Banff National Park',
    distanceKm: 10500,
    passengers: 4,
    dateISO: new Date('2026-09-12').toISOString(),
    startDate: '2026-09-12',
    endDate: '2026-09-18',
    totalCost: 386600,
    country: 'Canada',
    status: 'planned',
    description: 'Road trip through lakes, mountains, and national parks.',
    budgetRange: '₱120,000 – ₱220,000',
    budgetNotes: ['Flights to Canada = biggest cost', 'Car rental + park tours'],
  },
  {
    id: 'trip-4',
    title: 'Amazon Jungle Adventure',
    transportType: 'International Airplane',
    origin: 'Manila',
    destination: 'Amazon Rainforest',
    distanceKm: 17000,
    passengers: 2,
    dateISO: new Date('2026-08-20').toISOString(),
    startDate: '2026-08-20',
    endDate: '2026-08-27',
    totalCost: 308800,
    country: 'Brazil',
    status: 'draft',
    description: 'Guided rainforest tour with wildlife exploration and river cruise.',
    budgetRange: '₱180,000 – ₱300,000',
    budgetNotes: ['Long-haul flights', 'Guided jungle tours required'],
  },
  {
    id: 'trip-5',
    title: 'Rome Historical Tour',
    transportType: 'International Airplane',
    origin: 'Manila',
    destination: 'Rome',
    distanceKm: 10300,
    passengers: 2,
    dateISO: new Date('2026-10-01').toISOString(),
    startDate: '2026-10-01',
    endDate: '2026-10-07',
    totalCost: 189700,
    country: 'Italy',
    status: 'confirmed',
    description: 'Visit ancient landmarks, museums, and cultural sites.',
    budgetRange: '₱90,000 – ₱180,000',
    budgetNotes: ['Cheaper flights (promo possible)', 'Food + attractions reasonable'],
  },
  {
    id: 'trip-6',
    title: 'Machu Picchu Expedition',
    transportType: 'International Airplane',
    origin: 'Manila',
    destination: 'Machu Picchu',
    distanceKm: 17500,
    passengers: 3,
    dateISO: new Date('2026-09-25').toISOString(),
    startDate: '2026-09-25',
    endDate: '2026-10-02',
    totalCost: 476500,
    country: 'Peru',
    status: 'planned',
    description: 'Trekking and guided exploration of the Inca citadel.',
    budgetRange: '₱150,000 – ₱280,000',
    budgetNotes: ['Flights + train + entrance fees', 'Tour packages common'],
  },
  {
    id: 'trip-7',
    title: 'Queenstown Adventure Week',
    transportType: 'International Airplane',
    origin: 'Manila',
    destination: 'Queenstown',
    distanceKm: 8300,
    passengers: 5,
    dateISO: new Date('2026-12-01').toISOString(),
    startDate: '2026-12-01',
    endDate: '2026-12-07',
    totalCost: 385200,
    country: 'New Zealand',
    status: 'confirmed',
    description: 'Bungee jumping, skydiving, and outdoor adventure activities.',
    budgetRange: '₱130,000 – ₱250,000',
    budgetNotes: ['Activities (bungee, skydiving) are pricey', 'Flights moderate'],
  },
  {
    id: 'trip-8',
    title: 'Patagonia Hiking Journey',
    transportType: 'International Airplane',
    origin: 'Manila',
    destination: 'Patagonia',
    distanceKm: 18000,
    passengers: 4,
    dateISO: new Date('2026-11-15').toISOString(),
    startDate: '2026-11-15',
    endDate: '2026-11-25',
    totalCost: 653600,
    country: 'Argentina / Chile',
    status: 'draft',
    description: 'Multi-day hiking with glacier views and camping experience.',
    budgetRange: '₱180,000 – ₱320,000',
    budgetNotes: ['Remote area → transport costs high', 'Hiking tours + gear'],
  },
  {
    id: 'trip-9',
    title: 'Paris Landmark Experience',
    transportType: 'International Airplane',
    origin: 'Manila',
    destination: 'Eiffel Tower',
    distanceKm: 10700,
    passengers: 2,
    dateISO: new Date('2026-10-15').toISOString(),
    startDate: '2026-10-15',
    endDate: '2026-10-20',
    totalCost: 196900,
    country: 'France',
    status: 'confirmed',
    description: 'City tour including museums, cafes, and iconic landmarks.',
    budgetRange: '₱100,000 – ₱200,000',
    budgetNotes: ['Paris can be expensive, but manageable', 'Budget stays available'],
  },
  {
    id: 'trip-10',
    title: 'Great Wall Cultural Trip',
    transportType: 'International Airplane',
    origin: 'Manila',
    destination: 'Great Wall of China',
    distanceKm: 2900,
    passengers: 6,
    dateISO: new Date('2026-04-05').toISOString(),
    startDate: '2026-04-05',
    endDate: '2026-04-10',
    totalCost: 174000,
    country: 'China',
    status: 'completed',
    description: 'Cultural exploration with guided tour of historical sites.',
    budgetRange: '₱60,000 – ₱120,000',
    budgetNotes: ['One of the cheapest in the list', 'Flights from PH are relatively affordable'],
  },
];

const TravelContext = createContext<TravelContextValue | undefined>(undefined);
const TRIPS_CACHE_KEY = 'rana_ph_trips_cache_v2';
const PHOTOS_STORAGE_KEY = 'rana_ph_photos_v1';

function computeSingleFare(transportType: TransportCategory, distanceKm: number): number {
  const config = TRIP_BASE_FARES[transportType];
  const normalizedDistance = Math.max(0, distanceKm);
  const extraDistance = Math.max(0, normalizedDistance - config.minKm);
  return config.baseFare + extraDistance * config.extraPerKm;
}

export function TravelProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  // Load trips: try API first, fall back to local cache, then seed data
  useEffect(() => {
    let mounted = true;

    const loadTrips = async () => {
      try {
        const apiTrips = await apiGetTrips();
        if (!mounted) return;
        if (Array.isArray(apiTrips)) {
          setTrips(apiTrips);
          await AsyncStorage.setItem(TRIPS_CACHE_KEY, JSON.stringify(apiTrips)).catch(() => {});
          return;
        }
      } catch {
        // API unavailable — fall through to cache
      }

      // Fallback: local cache
      try {
        const cached = await AsyncStorage.getItem(TRIPS_CACHE_KEY);
        if (!mounted) return;
        if (cached) {
          const parsed = JSON.parse(cached) as Trip[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTrips(parsed);
            return;
          }
        }
      } catch {
        // cache unreadable
      }

      // Last resort: seed data (offline demo)
      if (mounted) setTrips(initialTrips);
    };

    loadTrips();

    // Load photos from local storage (photos stay local for now)
    AsyncStorage.getItem(PHOTOS_STORAGE_KEY)
      .then((raw) => {
        if (raw && mounted) {
          const parsed = JSON.parse(raw) as PhotoEntry[];
          if (Array.isArray(parsed)) setPhotos(parsed);
        }
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photos)).catch(() => {});
  }, [photos]);

  const value = useMemo<TravelContextValue>(() => {
    return {
      trips,
      photos,
      addTrip: async (tripInput) => {
        // Optimistic local add
        const localTrip: Trip = {
          ...tripInput,
          id: `trip-${Date.now()}`,
          dateISO: new Date().toISOString(),
        };
        setTrips((prev) => [localTrip, ...prev]);
        // Sync to API
        try {
          const saved = await apiCreateTrip(tripInput);
          setTrips((prev) => prev.map((t) => (t.id === localTrip.id ? saved : t)));
          AsyncStorage.setItem(TRIPS_CACHE_KEY, JSON.stringify([saved])).catch(() => {});
        } catch {
          // API unavailable — keep local entry
        }
      },
      deleteTrip: async (tripId) => {
        setTrips((prev) => prev.filter((t) => t.id !== tripId));
        try {
          await apiDeleteTrip(tripId);
        } catch {
          // ignore — already removed locally
        }
      },
      updateTrip: async (tripId, updates) => {
        setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, ...updates } : t)));
        try {
          const current = trips.find((t) => t.id === tripId);
          if (current) await apiUpdateTrip(tripId, { ...current, ...updates });
        } catch {
          // ignore — already updated locally
        }
      },
      addPhoto: (photoInput) => {
        const nextPhoto: PhotoEntry = {
          ...photoInput,
          id: `photo-${Date.now()}`,
          createdAtISO: new Date().toISOString(),
        };
        setPhotos((prev) => [nextPhoto, ...prev]);
      },
      deletePhoto: (photoId) => {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      },
      estimateFare: ({ transportType, distanceKm, passengers }) => {
        const pax = Math.max(1, passengers);
        const farePerPassenger = computeSingleFare(transportType, distanceKm);
        return farePerPassenger * pax;
      },
    };
  }, [photos, trips]);

  return <TravelContext.Provider value={value}>{children}</TravelContext.Provider>;
}

export function useTravel() {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravel must be used within TravelProvider');
  }
  return context;
}
