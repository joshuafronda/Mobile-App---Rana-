import React, { useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTravel, type TransportCategory } from '@/src/context/TravelContext';
import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';
import Stepper from '@/src/components/Stepper';
import RoutePickerModal from '@/src/components/RoutePickerModal';

// ── Constants ─────────────────────────────────────────────────────────────────

const SEA_ACCENT = '#0284C7';

type SeaCategory = 'Ferry' | 'FastCraft' | 'Bangka' | 'Cruise';

const SEA_OPTIONS: { type: SeaCategory; icon: string; label: string; color: string }[] = [
  { type: 'Ferry',     icon: 'boat',              label: 'Ferry',           color: '#0284C7' },
  { type: 'FastCraft', icon: 'speedometer-outline', label: 'FastCraft',     color: '#0EA5E9' },
  { type: 'Bangka',    icon: 'sailboat',           label: 'Bangka / Pump Boat', color: '#06B6D4' },
  { type: 'Cruise',    icon: 'wine-outline',       label: 'Cruise Ship',   color: '#7C3AED' },
];

const FERRY_FARE_CLASSES   = ['Economy', 'Tourist', 'First Class', 'Cabin', 'Suite'] as const;
const FASTCRAFT_FARE_CLASSES = ['Economy', 'Business'] as const;
const CRUISE_FARE_CLASSES  = ['Interior', 'Ocean View', 'Balcony', 'Suite'] as const;

function formatPHP(v: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', maximumFractionDigits: 2,
  }).format(v);
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NewSeaTripScreen() {
  const { addTrip, estimateFare } = useTravel();

  // shared fields
  const [title,         setTitle]         = useState('');
  const [status,        setStatus]        = useState<'planned' | 'confirmed' | 'completed' | 'cancelled'>('planned');
  const [startDate,     setStartDate]     = useState('');
  const [endDate,       setEndDate]       = useState('');
  const [description,   setDescription]   = useState('');
  const [transport,     setTransport]     = useState<SeaCategory>('Ferry');
  const [origin,        setOrigin]        = useState('');
  const [destination,   setDestination]   = useState('');
  const [country,       setCountry]       = useState('Philippines');
  const [distanceKm,    setDistanceKm]    = useState('');
  const [passengers,    setPassengers]    = useState('1');
  const [manualCost,    setManualCost]    = useState('');

  // sea-specific
  const [vesselName,    setVesselName]    = useState('');
  const [shipCompany,   setShipCompany]   = useState('');
  const [fareClass,     setFareClass]     = useState('Economy');
  const [departureTime, setDepartureTime] = useState('');
  const [travelHours,   setTravelHours]   = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);

  const distance = parseFloat(distanceKm) || 0;
  const pax = parseInt(passengers, 10) || 1;

  const estimated = useMemo(
    () => distance > 0
      ? estimateFare({ transportType: transport as TransportCategory, distanceKm: distance, passengers: pax })
      : 0,
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

  function getFareOptions() {
    if (transport === 'Ferry') return FERRY_FARE_CLASSES;
    if (transport === 'FastCraft') return FASTCRAFT_FARE_CLASSES;
    if (transport === 'Cruise') return CRUISE_FARE_CLASSES;
    return null; // Bangka has no class
  }

  function buildExtraDetails() {
    const parts: string[] = [];
    if (vesselName)    parts.push(`Vessel: ${vesselName}`);
    if (shipCompany)   parts.push(`Company: ${shipCompany}`);
    if (fareClass && transport !== 'Bangka') parts.push(`Class: ${fareClass}`);
    if (departureTime) parts.push(`Departure: ${departureTime}`);
    if (travelHours)   parts.push(`Travel time: ${travelHours} hrs`);
    if (description)   parts.push(description);
    return parts.join(' | ') || undefined;
  }

  function handleSave() {
    if (!origin.trim() || !destination.trim() || distance <= 0) return;
    addTrip({
      transportType: transport as TransportCategory,
      origin: origin.trim(),
      destination: destination.trim(),
      distanceKm: distance,
      passengers: pax,
      totalCost: finalCost,
      country: country.trim() || 'Philippines',
      title: title.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      description: buildExtraDetails(),
      status,
      durationDays,
    });
    router.back();
  }

  // ── Steps ──────────────────────────────────────────────────────────────────

  const step1 = (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeading}>What's the voyage?</Text>
      <Text style={styles.stepSub}>Name the trip and set its status.</Text>

      <Text style={styles.label}>Trip Title</Text>
      <TextInput style={styles.input} placeholder="e.g. Cebu to Bohol FastCraft, Bangka Island Hop"
        placeholderTextColor={ranaColors.muted} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Status</Text>
      <View style={styles.chipRow}>
        {(['planned', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
          <TouchableOpacity key={s} style={[styles.chip, status === s && styles.chipActive]}
            onPress={() => setStatus(s)} activeOpacity={0.75}>
            <Ionicons
              name={s === 'planned' ? 'time-outline' : s === 'confirmed' ? 'checkmark-outline'
                : s === 'completed' ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={14} color={status === s ? '#fff' : ranaColors.textSecondary}
            />
            <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const step2 = (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeading}>When is it?</Text>
      <Text style={styles.stepSub}>Set departure dates and add notes.</Text>

      <View style={styles.row}>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>Start Date</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD"
            placeholderTextColor={ranaColors.muted} value={startDate} onChangeText={setStartDate} />
        </View>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>End Date</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD"
            placeholderTextColor={ranaColors.muted} value={endDate} onChangeText={setEndDate} />
        </View>
      </View>

      {durationDays !== undefined && (
        <View style={styles.infoPill}>
          <Ionicons name="calendar-outline" size={14} color={SEA_ACCENT} />
          <Text style={styles.infoPillText}>{durationDays} day{durationDays > 1 ? 's' : ''}</Text>
        </View>
      )}

      <Text style={styles.label}>Departure Time</Text>
      <TextInput style={styles.input} placeholder="e.g. 08:00 AM, overnight"
        placeholderTextColor={ranaColors.muted} value={departureTime} onChangeText={setDepartureTime} />

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.multiline]}
        placeholder="e.g. Book at least 3 days in advance, bring seasickness meds..."
        placeholderTextColor={ranaColors.muted} value={description} onChangeText={setDescription}
        multiline numberOfLines={5} textAlignVertical="top" />
    </ScrollView>
  );

  const step3 = (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeading}>Vessel & Route</Text>
      <Text style={styles.stepSub}>Select vessel type and fill in route details.</Text>

      {/* Angkas-style map picker */}
      <TouchableOpacity style={styles.mapPickerBtn} onPress={() => setShowMapPicker(true)} activeOpacity={0.8}>
        <View style={styles.mapPickerInner}>
          <Ionicons name="map" size={22} color={SEA_ACCENT} />
          <View style={{ flex: 1 }}>
            <Text style={styles.mapPickerTitle}>Select on Map</Text>
            {origin && destination ? (
              <Text style={styles.mapPickerRoute} numberOfLines={1}>{origin}  →  {destination}</Text>
            ) : (
              <Text style={styles.mapPickerSub}>Tap to pick port of origin & destination</Text>
            )}
          </View>
          {origin && destination
            ? <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            : <Ionicons name="chevron-forward" size={18} color={ranaColors.muted} />}
        </View>
        {distanceKm ? (
          <View style={styles.mapPickerDistPill}>
            <Ionicons name="resize-outline" size={12} color={SEA_ACCENT} />
            <Text style={styles.mapPickerDistText}>{distanceKm} km</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Vessel type */}}
      <Text style={styles.label}>Vessel Type</Text>
      <View style={styles.chipRow}>
        {SEA_OPTIONS.map((opt) => {
          const active = transport === opt.type;
          return (
            <TouchableOpacity key={opt.type}
              style={[styles.chip, active && { backgroundColor: opt.color, borderColor: opt.color }]}
              onPress={() => { setTransport(opt.type); setFareClass('Economy'); }} activeOpacity={0.75}>
              <Ionicons name={opt.icon as any} size={13} color={active ? '#fff' : ranaColors.textSecondary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Fare class (not for Bangka) */}
      {getFareOptions() && (
        <>
          <Text style={styles.label}>Fare Class</Text>
          <View style={styles.chipRow}>
            {(getFareOptions() as readonly string[]).map((fc) => (
              <TouchableOpacity key={fc} style={[styles.chip, fareClass === fc && styles.chipActive]}
                onPress={() => setFareClass(fc)} activeOpacity={0.75}>
                <Text style={[styles.chipText, fareClass === fc && styles.chipTextActive]}>{fc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Vessel / Company */}
      <View style={styles.row}>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>Vessel / Ship Name</Text>
          <TextInput style={styles.input} placeholder="e.g. MV Superferry 14"
            placeholderTextColor={ranaColors.muted} value={vesselName} onChangeText={setVesselName} />
        </View>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>Shipping Company</Text>
          <TextInput style={styles.input} placeholder="e.g. 2GO, OceanJet"
            placeholderTextColor={ranaColors.muted} value={shipCompany} onChangeText={setShipCompany} />
        </View>
      </View>

      {/* Route */}
      <View style={styles.row}>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>Port of Origin</Text>
          <TextInput style={styles.input} placeholder="e.g. Batangas Port"
            placeholderTextColor={ranaColors.muted} value={origin} onChangeText={setOrigin} />
        </View>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>Port of Destination</Text>
          <TextInput style={styles.input} placeholder="e.g. Calapan Port"
            placeholderTextColor={ranaColors.muted} value={destination} onChangeText={setDestination} />
        </View>
      </View>

      <Text style={styles.label}>Country</Text>
      <TextInput style={styles.input} placeholder="Philippines"
        placeholderTextColor={ranaColors.muted} value={country} onChangeText={setCountry} />

      <View style={styles.row}>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>Distance (km)</Text>
          <TextInput style={styles.input} placeholder="0"
            placeholderTextColor={ranaColors.muted} value={distanceKm} onChangeText={setDistanceKm} keyboardType="decimal-pad" />
        </View>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>Travel Time (hrs)</Text>
          <TextInput style={styles.input} placeholder="e.g. 1.5"
            placeholderTextColor={ranaColors.muted} value={travelHours} onChangeText={setTravelHours} keyboardType="decimal-pad" />
        </View>
      </View>

      <Text style={styles.label}>Passengers</Text>
      <TextInput style={styles.input} placeholder="1"
        placeholderTextColor={ranaColors.muted} value={passengers} onChangeText={setPassengers} keyboardType="number-pad" />

      <Text style={styles.label}>Cost (PHP)</Text>
      <TextInput
        style={styles.input}
        placeholder={estimated > 0 ? `Auto-estimated: ${formatPHP(estimated)}` : 'e.g. 850'}
        placeholderTextColor={ranaColors.muted}
        value={manualCost}
        onChangeText={setManualCost}
        keyboardType="decimal-pad"
      />
      {manualCost.trim() === '' && estimated > 0 && (
        <View style={styles.infoPill}>
          <Ionicons name="calculator-outline" size={14} color={SEA_ACCENT} />
          <Text style={styles.infoPillText}>Auto-estimate: {formatPHP(estimated)}</Text>
        </View>
      )}
    </ScrollView>
  );

  const step4 = (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeading}>Review & Save</Text>
      <Text style={styles.stepSub}>Confirm your sea trip details.</Text>

      <View style={styles.reviewCard}>
        <ReviewRow icon="bookmark-outline"    label="Title"        value={title || '—'} />
        <ReviewRow icon="flag-outline"        label="Status"       value={status} />
        <ReviewRow icon="calendar-outline"    label="Dates"        value={startDate && endDate ? `${startDate} to ${endDate}` : startDate || '—'} />
        {durationDays !== undefined && <ReviewRow icon="time-outline" label="Duration" value={`${durationDays} day${durationDays > 1 ? 's' : ''}`} />}
        <ReviewRow icon="boat-outline"        label="Vessel Type"  value={transport} />
        {vesselName    ? <ReviewRow icon="business-outline"   label="Vessel Name"     value={vesselName}    /> : null}
        {shipCompany   ? <ReviewRow icon="storefront-outline" label="Company"         value={shipCompany}   /> : null}
        {transport !== 'Bangka' && <ReviewRow icon="star-outline" label="Fare Class" value={fareClass} />}
        <ReviewRow icon="navigate-outline"    label="Route"        value={origin && destination ? `${origin} → ${destination}` : '—'} />
        <ReviewRow icon="earth-outline"       label="Country"      value={country || '—'} />
        {departureTime ? <ReviewRow icon="alarm-outline"   label="Departure"    value={departureTime} /> : null}
        {travelHours   ? <ReviewRow icon="hourglass-outline" label="Travel Time" value={`${travelHours} hrs`} /> : null}
        <ReviewRow icon="resize-outline"      label="Distance"     value={distance > 0 ? `${distance} km` : '—'} />
        <ReviewRow icon="people-outline"      label="Passengers"   value={String(pax)} />
        {description ? <ReviewRow icon="document-text-outline" label="Notes" value={description} /> : null}
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
        <View style={[styles.estimateCard, { flex: 1, backgroundColor: '#E0F2FE' }]}>
          <Ionicons name="cash-outline" size={18} color={SEA_ACCENT} />
          <View>
            <Text style={[styles.estimateLabel, { color: '#0C4A6E' }]}>Final Cost</Text>
            <Text style={[styles.estimateValue, { fontSize: 18, color: SEA_ACCENT }]}>{formatPHP(finalCost)}</Text>
          </View>
        </View>
      </View>

      {(!origin.trim() || !destination.trim() || distance <= 0) && (
        <View style={styles.warnBanner}>
          <Ionicons name="warning-outline" size={15} color="#0C4A6E" />
          <Text style={styles.warnText}>Fill in Port of Origin, Destination, and Distance to save.</Text>
        </View>
      )}
    </ScrollView>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backHeaderBtn}>
            <Ionicons name="chevron-back" size={22} color={ranaColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>New Sea Trip</Text>
            <Text style={styles.headerSub}>Ferries, boats & cruises</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <Stepper
          steps={[
            { title: 'Info',   content: step1 },
            { title: 'Dates',  content: step2 },
            { title: 'Vessel', content: step3 },
            { title: 'Review', content: step4 },
          ]}
          onComplete={handleSave}
          nextButtonText="Continue"
          backButtonText="Back"
          completeButtonText="Save Trip"
          canAdvance={(s) => {
            if (s === 2 && (!origin.trim() || !destination.trim() || distance <= 0)) return false;
            return true;
          }}
        />
      </KeyboardAvoidingView>
      <RoutePickerModal
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        accentColor={SEA_ACCENT}
        pickupLabel="Port of Origin"
        dropoffLabel="Port of Destination"
        onConfirm={(r) => {
          setOrigin(r.origin);
          setDestination(r.destination);
          setDistanceKm(r.distanceKm.toFixed(1));
        }}
      />
    </LinearGradient>
  );
}

function ReviewRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Ionicons name={icon as any} size={15} color={SEA_ACCENT} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue}>{value}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: ranaSpacing.md, paddingBottom: 4,
  },
  backHeaderBtn: {
    width: 36, height: 36, borderRadius: ranaRadius.sm, backgroundColor: ranaColors.card,
    alignItems: 'center', justifyContent: 'center', ...ranaShadow.soft,
  },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: ranaColors.textPrimary },
  headerSub: { fontSize: 11, color: ranaColors.textSecondary, marginTop: 1 },
  stepScroll: { flex: 1 },
  stepContent: { paddingHorizontal: ranaSpacing.md, paddingBottom: 32 },
  stepHeading: { fontSize: 22, fontWeight: '800', color: ranaColors.textPrimary, marginTop: 8 },
  stepSub: { fontSize: 13, color: ranaColors.textSecondary, marginBottom: 16, marginTop: 4 },
  label: {
    fontSize: 11, fontWeight: '700', color: ranaColors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6,
  },
  input: {
    backgroundColor: ranaColors.card, borderRadius: ranaRadius.md,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: ranaColors.textPrimary,
    ...ranaShadow.soft,
  },
  multiline: { height: 110 },
  row: { flexDirection: 'row', gap: ranaSpacing.xs },
  halfWrap: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: ranaRadius.pill,
    backgroundColor: ranaColors.card, borderWidth: 1.5, borderColor: '#C8D5EC',
  },
  chipActive: { backgroundColor: SEA_ACCENT, borderColor: SEA_ACCENT },
  chipText: { fontSize: 12, fontWeight: '600', color: ranaColors.textSecondary },
  chipTextActive: { color: '#fff' },
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: ranaRadius.pill,
    backgroundColor: '#E0F2FE', marginTop: 8,
  },
  infoPillText: { fontSize: 12, fontWeight: '700', color: SEA_ACCENT },
  mapPickerBtn: {
    backgroundColor: ranaColors.card, borderRadius: ranaRadius.lg,
    marginTop: 8, marginBottom: 4,
    borderWidth: 2, borderColor: '#BAE6FD',
    ...ranaShadow.soft, overflow: 'hidden',
  },
  mapPickerInner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
  },
  mapPickerTitle: { fontSize: 15, fontWeight: '700', color: ranaColors.textPrimary },
  mapPickerSub: { fontSize: 12, color: ranaColors.muted, marginTop: 2 },
  mapPickerRoute: { fontSize: 12, color: ranaColors.textSecondary, marginTop: 2, fontWeight: '600' },
  mapPickerDistPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#E0F2FE', borderTopWidth: 1, borderTopColor: '#BAE6FD',
  },
  mapPickerDistText: { fontSize: 12, fontWeight: '700', color: SEA_ACCENT },
  reviewCard: {
    backgroundColor: ranaColors.card, borderRadius: ranaRadius.lg,
    padding: 16, gap: 12, marginTop: 8, ...ranaShadow.soft,
  },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reviewLabel: {
    fontSize: 10, fontWeight: '700', color: ranaColors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  reviewValue: { fontSize: 13, fontWeight: '600', color: ranaColors.textPrimary, marginTop: 1 },
  costRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  estimateCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    borderRadius: ranaRadius.md, backgroundColor: '#E1EEFF', ...ranaShadow.soft,
  },
  estimateLabel: { fontSize: 12, color: ranaColors.textSecondary },
  estimateValue: { fontSize: 22, fontWeight: '800', color: SEA_ACCENT },
  warnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12,
    borderRadius: ranaRadius.md, backgroundColor: '#E0F2FE',
  },
  warnText: { flex: 1, fontSize: 13, color: '#0C4A6E' },
});
