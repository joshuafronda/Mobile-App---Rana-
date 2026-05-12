import { Trip } from '@/src/context/TravelContext';

// Set EXPO_PUBLIC_API_URL in your .env file to your computer's local IP
// e.g. EXPO_PUBLIC_API_URL=http://192.168.1.17:3000/api
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${options?.method ?? 'GET'} ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

// ── Trips ────────────────────────────────────────────────────────────────────

export function apiGetTrips(): Promise<Trip[]> {
  return request<Trip[]>('/trips');
}

export function apiCreateTrip(trip: Omit<Trip, 'id' | 'dateISO'>): Promise<Trip> {
  return request<Trip>('/trips', {
    method: 'POST',
    body: JSON.stringify(trip),
  });
}

export function apiUpdateTrip(id: string, updates: Partial<Omit<Trip, 'id'>>): Promise<Trip> {
  return request<Trip>(`/trips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export function apiDeleteTrip(id: string): Promise<void> {
  return request<void>(`/trips/${id}`, { method: 'DELETE' });
}

// ── Itinerary ─────────────────────────────────────────────────────────────────

export interface ItineraryItemAPI {
  id: string;
  tripId: string;
  dayIndex: number;
  time: string;
  category: string;
  title: string;
  location: string;
  cost: number;
}

export function apiGetItinerary(tripId: string): Promise<ItineraryItemAPI[]> {
  return request<ItineraryItemAPI[]>(`/itinerary?tripId=${encodeURIComponent(tripId)}`);
}

export function apiCreateItineraryItem(
  item: Omit<ItineraryItemAPI, 'id'>
): Promise<ItineraryItemAPI> {
  return request<ItineraryItemAPI>('/itinerary', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export function apiDeleteItineraryItem(id: string): Promise<void> {
  return request<void>(`/itinerary/${id}`, { method: 'DELETE' });
}
