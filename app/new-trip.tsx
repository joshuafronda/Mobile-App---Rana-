import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTravel, type TransportCategory } from '@/src/context/TravelContext';
import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';
import Stepper from '@/src/components/Stepper';
import LeafletMap from '@/src/components/LeafletMap';

const TRANSPORT_OPTIONS: TransportCategory[] = [
  'Jeep', 'Bus', 'Train/LRT/MRT', 'Motor', 'Car/Taxi',
  'Local Airplane', 'International Airplane',
];
const TRANSPORT_ICONS: Record<TransportCategory, string> = {
  Jeep: 'bus',
  Bus: 'bus-outline',
  'Train/LRT/MRT': 'train',
  Motor: 'bicycle',
  'Car/Taxi': 'car',
  'Local Airplane': 'airplane',
  'International Airplane': 'airplane-outline',
};

function formatPHP(v: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', maximumFractionDigits: 2,
  }).format(v);
}

export default function NewTripScreen() {
  const { addTrip, estimateFare } = useTravel();

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'planned' | 'completed' | 'cancelled'>('planned');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [transport, setTransport] = useState<TransportCategory>('Jeep');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('Philippines');
  const [distanceKm, setDistanceKm] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [manualCost, setManualCost] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [budgetNotesRaw, setBudgetNotesRaw] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const locationWatcher = useRef<any>(null);

  const distance = parseFloat(distanceKm) || 0;
  const pax = parseInt(passengers, 10) || 1;
  const estimated = useMemo(
    () => distance > 0 ? estimateFare({ transportType: transport, distanceKm: distance, passengers: pax }) : 0,
    [distance, pax, transport, estimateFare]
  );
  const finalCost = manualCost.trim() && parseFloat(manualCost) > 0
    ? parseFloat(manualCost)
    : estimated;
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return undefined;
    return Math.max(1, Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
    ) + 1);
  }, [startDate, endDate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!mounted) return;
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        locationWatcher.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        );
      } catch {
        // location unavailable
      }
    })();
    return () => {
      mounted = false;
      locationWatcher.current?.remove();
    };
  }, []);

  function handleSave() {
    if (!origin.trim() || !destination.trim() || distance <= 0) return;
    addTrip({
      transportType: transport,
      origin: origin.trim(),
      destination: destination.trim(),
      distanceKm: distance,
      passengers: pax,
      totalCost: finalCost,
      country: country.trim() || 'Philippines',
      title: title.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      description: description || undefined,
      status,
      durationDays,
      budgetRange: budgetRange.trim() || undefined,
      budgetNotes: budgetNotesRaw.trim()
        ? budgetNotesRaw.split('\n').map(l => l.trim()).filter(Boolean)
        : undefined,
    });
    router.back();
  }

  const step1 = (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeading}>{"What's the trip?"}</Text>
      <Text style={styles.stepSub}>Give your trip a name and status.</Text>
      <Text style={styles.label}>Trip Title</Text>
      <TextInput style={styles.input} placeholder="e.g. Seoul Food and Cafe Week" placeholderTextColor={ranaColors.muted} value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Status</Text>
      <View style={styles.chipRow}>
        {(['planned', 'completed', 'cancelled'] as const).map((s) => (
          <TouchableOpacity key={s} style={[styles.chip, status === s && styles.chipActive]} onPress={() => setStatus(s)} activeOpacity={0.75}>
            <Ionicons name={s === 'planned' ? 'time-outline' : s === 'completed' ? 'checkmark-circle-outline' : 'close-circle-outline'} size={14} color={status === s ? '#fff' : ranaColors.textSecondary} />
            <Text style={[styles.chipText, status === s && styles.chipTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const step2 = (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeading}>When is it?</Text>
      <Text style={styles.stepSub}>Set your travel dates and add notes.</Text>
      <View style={styles.row}>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>Start Date</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={ranaColors.muted} value={startDate} onChangeText={setStartDate} />
        </View>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>End Date</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={ranaColors.muted} value={endDate} onChangeText={setEndDate} />
        </View>
      </View>
      {durationDays !== undefined && (
        <View style={styles.infoPill}>
          <Ionicons name="calendar-outline" size={14} color={ranaColors.primary} />
          <Text style={styles.infoPillText}>{durationDays} day{durationDays > 1 ? 's' : ''}</Text>
        </View>
      )}
      <Text style={styles.label}>Description / Notes</Text>
      <TextInput style={[styles.input, styles.multiline]} placeholder="City trip focused on neighborhoods, cafe stops..." placeholderTextColor={ranaColors.muted} value={description} onChangeText={setDescription} multiline numberOfLines={5} textAlignVertical="top" />
    </ScrollView>
  );

  const step3 = (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeading}>Where to?</Text>
      <Text style={styles.stepSub}>Pick transport, set your route, and tap the map.</Text>
      <View style={styles.mapWrap}>
        {coords ? (
          <LeafletMap
            lat={coords.lat}
            lng={coords.lng}
            zoom={14}
            style={{ borderRadius: ranaRadius.md }}
            onTap={async (lat, lng) => {
              // Reverse geocode via Nominatim to get a readable place name
              let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
              try {
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                  { headers: { 'Accept-Language': 'en', 'User-Agent': 'RANATravelApp/1.0' } }
                );
                const data = await res.json();
                if (data?.address) {
                  const a = data.address;
                  label = [a.road || a.suburb || a.neighbourhood, a.city || a.town || a.municipality || a.county, a.country]
                    .filter(Boolean).join(', ');
                }
              } catch {}
              if (!origin) setOrigin(label);
              else if (!destination) setDestination(label);
              else { setOrigin(''); setDestination(''); }
            }}
            onRoute={(distanceM) => {
              const km = (distanceM / 1000).toFixed(1);
              setDistanceKm(km);
            }}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="location-outline" size={28} color={ranaColors.muted} />
            <Text style={styles.mapPlaceholderText}>Getting your location...</Text>
          </View>
        )}
      </View>
      <Text style={styles.label}>Transport</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {TRANSPORT_OPTIONS.map((opt) => {
          const active = opt === transport;
          return (
            <TouchableOpacity key={opt} style={[styles.chip, active && styles.chipActive]} onPress={() => setTransport(opt)} activeOpacity={0.75}>
              <Ionicons name={TRANSPORT_ICONS[opt] as any} size={13} color={active ? '#fff' : ranaColors.textSecondary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.row}>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>From</Text>
          <TextInput style={styles.input} placeholder="e.g. Cubao, QC" placeholderTextColor={ranaColors.muted} value={origin} onChangeText={setOrigin} />
        </View>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>To</Text>
          <TextInput style={styles.input} placeholder="e.g. Seoul" placeholderTextColor={ranaColors.muted} value={destination} onChangeText={setDestination} />
        </View>
      </View>
      <Text style={styles.label}>Country</Text>
      <TextInput style={styles.input} placeholder="Philippines" placeholderTextColor={ranaColors.muted} value={country} onChangeText={setCountry} />
      <View style={styles.row}>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>Distance (km)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor={ranaColors.muted} value={distanceKm} onChangeText={setDistanceKm} keyboardType="decimal-pad" />
        </View>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>Passengers</Text>
          <TextInput style={styles.input} placeholder="1" placeholderTextColor={ranaColors.muted} value={passengers} onChangeText={setPassengers} keyboardType="number-pad" />
        </View>
      </View>

      <Text style={styles.label}>Actual / Planned Cost (PHP)</Text>
      <TextInput
        style={styles.input}
        placeholder={estimated > 0 ? `Auto-estimated: ${formatPHP(estimated)}` : 'e.g. 90000'}
        placeholderTextColor={ranaColors.muted}
        value={manualCost}
        onChangeText={setManualCost}
        keyboardType="decimal-pad"
      />
      {manualCost.trim() === '' && estimated > 0 && (
        <View style={styles.infoPill}>
          <Ionicons name="calculator-outline" size={14} color={ranaColors.primary} />
          <Text style={styles.infoPillText}>Auto-estimate: {formatPHP(estimated)}</Text>
        </View>
      )}

      <Text style={styles.label}>Budget Range</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. ₱90,000 – ₱180,000"
        placeholderTextColor={ranaColors.muted}
        value={budgetRange}
        onChangeText={setBudgetRange}
      />

      <Text style={styles.label}>Budget Notes (one per line)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder={'Cheaper flights (promo possible)\nFood + attractions reasonable'}
        placeholderTextColor={ranaColors.muted}
        value={budgetNotesRaw}
        onChangeText={setBudgetNotesRaw}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </ScrollView>
  );

  const step4 = (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeading}>Review & Save</Text>
      <Text style={styles.stepSub}>Double-check your trip details below.</Text>
      <View style={styles.reviewCard}>
        <ReviewRow icon="bookmark-outline" label="Title" value={title || '—'} />
        <ReviewRow icon="flag-outline" label="Status" value={status} />
        <ReviewRow icon="calendar-outline" label="Dates" value={startDate && endDate ? `${startDate} to ${endDate}` : startDate || '—'} />
        {durationDays !== undefined && <ReviewRow icon="time-outline" label="Duration" value={`${durationDays} day${durationDays > 1 ? 's' : ''}`} />}
        <ReviewRow icon="navigate-outline" label="Route" value={origin && destination ? `${origin} to ${destination}` : '—'} />
        <ReviewRow icon="earth-outline" label="Country" value={country || '—'} />
        <ReviewRow icon={TRANSPORT_ICONS[transport] as any} label="Transport" value={transport} />
        <ReviewRow icon="resize-outline" label="Distance" value={distance > 0 ? `${distance} km` : '—'} />
        <ReviewRow icon="people-outline" label="Passengers" value={String(pax)} />
        {description ? <ReviewRow icon="document-text-outline" label="Notes" value={description} /> : null}
        {budgetRange ? <ReviewRow icon="wallet-outline" label="Budget Range" value={budgetRange} /> : null}
      </View>
      <View style={styles.costRow}>
        {estimated > 0 && (
          <View style={[styles.estimateCard, { flex: 1 }]}>
            <Ionicons name="calculator-outline" size={18} color="#6B7280" />
            <View>
              <Text style={styles.estimateLabel}>Auto Estimate</Text>
              <Text style={[styles.estimateValue, { fontSize: 16, color: '#6B7280' }]}>{formatPHP(estimated)}</Text>
            </View>
          </View>
        )}
        <View style={[styles.estimateCard, { flex: 1, backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="cash-outline" size={18} color="#059669" />
          <View>
            <Text style={[styles.estimateLabel, { color: '#065F46' }]}>Final Cost</Text>
            <Text style={[styles.estimateValue, { fontSize: 18, color: '#059669' }]}>{formatPHP(finalCost)}</Text>
          </View>
        </View>
      </View>
      {(!origin.trim() || !destination.trim() || distance <= 0) && (
        <View style={styles.warnBanner}>
          <Ionicons name="warning-outline" size={15} color="#B45309" />
          <Text style={styles.warnText}>Fill in From, To, and Distance to save the trip.</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backHeaderBtn}>
            <Ionicons name="chevron-back" size={22} color={ranaColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Trip</Text>
          <View style={{ width: 36 }} />
        </View>
        <Stepper
          steps={[
            { title: 'Info', content: step1 },
            { title: 'Dates', content: step2 },
            { title: 'Route', content: step3 },
            { title: 'Review', content: step4 },
          ]}
          onComplete={handleSave}
          nextButtonText="Continue"
          backButtonText="Back"
          completeButtonText="Save Trip"
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function ReviewRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Ionicons name={icon as any} size={15} color={ranaColors.primary} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: ranaSpacing.md,
    paddingBottom: 4,
  },
  backHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: ranaRadius.sm,
    backgroundColor: ranaColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...ranaShadow.soft,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  stepScroll: { flex: 1 },
  stepContent: {
    paddingHorizontal: ranaSpacing.md,
    paddingBottom: 32,
  },
  stepHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: ranaColors.textPrimary,
    marginTop: 8,
  },
  stepSub: {
    fontSize: 13,
    color: ranaColors.textSecondary,
    marginBottom: 16,
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: ranaColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: ranaColors.card,
    borderRadius: ranaRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: ranaColors.textPrimary,
    ...ranaShadow.soft,
  },
  multiline: { height: 110 },
  row: { flexDirection: 'row', gap: ranaSpacing.xs },
  halfWrap: { flex: 1 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ranaRadius.pill,
    backgroundColor: ranaColors.card,
    borderWidth: 1.5,
    borderColor: '#C8D5EC',
  },
  chipActive: {
    backgroundColor: ranaColors.primary,
    borderColor: ranaColors.primary,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: ranaColors.textSecondary },
  chipTextActive: { color: '#fff' },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ranaRadius.pill,
    backgroundColor: '#E1EEFF',
    marginTop: 8,
  },
  infoPillText: { fontSize: 12, fontWeight: '700', color: ranaColors.primary },
  mapWrap: {
    height: 200,
    borderRadius: ranaRadius.md,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 4,
    ...ranaShadow.soft,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: ranaColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: { color: ranaColors.textSecondary, fontSize: 13 },
  reviewCard: {
    backgroundColor: ranaColors.card,
    borderRadius: ranaRadius.lg,
    padding: 16,
    gap: 12,
    marginTop: 8,
    ...ranaShadow.soft,
  },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: ranaColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reviewValue: { fontSize: 13, fontWeight: '600', color: ranaColors.textPrimary, marginTop: 1 },
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 16,
    borderRadius: ranaRadius.md,
    backgroundColor: '#E1EEFF',
    ...ranaShadow.soft,
  },
  costRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  estimateLabel: { fontSize: 12, color: ranaColors.textSecondary },
  estimateValue: { fontSize: 22, fontWeight: '800', color: ranaColors.primary },
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: ranaRadius.md,
    backgroundColor: '#FEF3C7',
  },
  warnText: { flex: 1, fontSize: 12, color: '#92400E', fontWeight: '600' },
});
