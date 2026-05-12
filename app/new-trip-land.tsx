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

const LAND_ACCENT = '#F59E0B';

type LandCategory = 'Jeep' | 'Bus' | 'Train/LRT/MRT' | 'Motor' | 'Car/Taxi';

const LAND_OPTIONS: { type: LandCategory; icon: string; label: string }[] = [
  { type: 'Jeep',          icon: 'bus',          label: 'Jeepney'     },
  { type: 'Bus',           icon: 'bus-outline',  label: 'Bus'         },
  { type: 'Train/LRT/MRT', icon: 'train',        label: 'Train / Rail' },
  { type: 'Motor',         icon: 'bicycle',      label: 'Motorcycle'  },
  { type: 'Car/Taxi',      icon: 'car',          label: 'Car / Taxi'  },
];

const BUS_FARE_TYPES = ['Regular', 'Air-conditioned', 'Express / P2P'] as const;
const TRAIN_LINES    = ['LRT Line 1', 'LRT Line 2', 'MRT Line 3', 'PNR', 'Other'] as const;
const CAR_BOOKINGS   = ['Grab', 'InDrive', 'Regular Taxi', 'Personal Car'] as const;
const MOTOR_TYPES    = ['Tricycle', 'Habal-habal', 'Personal Motorcycle'] as const;

function formatPHP(v: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', maximumFractionDigits: 2,
  }).format(v);
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NewLandTripScreen() {
  const { addTrip, estimateFare } = useTravel();

  // shared fields
  const [title,         setTitle]         = useState('');
  const [status,        setStatus]        = useState<'planned' | 'confirmed' | 'completed' | 'cancelled'>('planned');
  const [startDate,     setStartDate]     = useState('');
  const [endDate,       setEndDate]       = useState('');
  const [description,   setDescription]   = useState('');
  const [transport,     setTransport]     = useState<LandCategory>('Bus');
  const [origin,        setOrigin]        = useState('');
  const [destination,   setDestination]   = useState('');
  const [country,       setCountry]       = useState('Philippines');
  const [distanceKm,    setDistanceKm]    = useState('');
  const [passengers,    setPassengers]    = useState('1');
  const [manualCost,    setManualCost]    = useState('');

  // land-specific
  const [busFareType,   setBusFareType]   = useState<typeof BUS_FARE_TYPES[number]>('Regular');
  const [busTerminal,   setBusTerminal]   = useState('');
  const [trainLine,     setTrainLine]     = useState<typeof TRAIN_LINES[number]>('LRT Line 1');
  const [carBooking,    setCarBooking]    = useState<typeof CAR_BOOKINGS[number]>('Grab');
  const [motorType,     setMotorType]     = useState<typeof MOTOR_TYPES[number]>('Tricycle');
  const [jeepRoute,     setJeepRoute]     = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
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

  function buildExtraDetails() {
    const parts: string[] = [];
    if (transport === 'Bus') {
      parts.push(`Fare type: ${busFareType}`);
      if (busTerminal) parts.push(`Terminal: ${busTerminal}`);
    } else if (transport === 'Train/LRT/MRT') {
      parts.push(`Line: ${trainLine}`);
    } else if (transport === 'Car/Taxi') {
      parts.push(`Booking: ${carBooking}`);
    } else if (transport === 'Motor') {
      parts.push(`Type: ${motorType}`);
    } else if (transport === 'Jeep') {
      if (jeepRoute) parts.push(`Route code: ${jeepRoute}`);
    }
    if (estimatedTime) parts.push(`Est. travel time: ${estimatedTime}`);
    if (description) parts.push(description);
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
      <Text style={styles.stepHeading}>What's the trip?</Text>
      <Text style={styles.stepSub}>Name your journey and set its status.</Text>

      <Text style={styles.label}>Trip Title</Text>
      <TextInput style={styles.input} placeholder="e.g. Baguio Bus Ride, LRT Daily Commute" placeholderTextColor={ranaColors.muted} value={title} onChangeText={setTitle} />

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
      <Text style={styles.stepSub}>Set travel dates and add any notes.</Text>

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
          <Ionicons name="calendar-outline" size={14} color={LAND_ACCENT} />
          <Text style={[styles.infoPillText, { color: LAND_ACCENT }]}>{durationDays} day{durationDays > 1 ? 's' : ''}</Text>
        </View>
      )}

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.multiline]} placeholder="e.g. Bus leaving Cubao at 9PM, book 2 days early..."
        placeholderTextColor={ranaColors.muted} value={description} onChangeText={setDescription}
        multiline numberOfLines={5} textAlignVertical="top" />
    </ScrollView>
  );

  const step3 = (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeading}>Route & Details</Text>
      <Text style={styles.stepSub}>Pick transport type and fill in route details.</Text>

      {/* Angkas-style map picker */}
      <TouchableOpacity style={styles.mapPickerBtn} onPress={() => setShowMapPicker(true)} activeOpacity={0.8}>
        <View style={styles.mapPickerInner}>
          <Ionicons name="map" size={22} color={LAND_ACCENT} />
          <View style={{ flex: 1 }}>
            <Text style={styles.mapPickerTitle}>Select on Map</Text>
            {origin && destination ? (
              <Text style={styles.mapPickerRoute} numberOfLines={1}>{origin}  →  {destination}</Text>
            ) : (
              <Text style={styles.mapPickerSub}>Tap to pick pickup & drop-off like Angkas</Text>
            )}
          </View>
          {origin && destination
            ? <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            : <Ionicons name="chevron-forward" size={18} color={ranaColors.muted} />}
        </View>
        {distanceKm ? (
          <View style={styles.mapPickerDistPill}>
            <Ionicons name="resize-outline" size={12} color={LAND_ACCENT} />
            <Text style={styles.mapPickerDistText}>{distanceKm} km</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Vehicle type */}
      <Text style={styles.label}>Vehicle Type</Text>
      <View style={styles.chipRow}>
        {LAND_OPTIONS.map((opt) => {
          const active = transport === opt.type;
          return (
            <TouchableOpacity key={opt.type} style={[styles.chip, active && styles.chipActive]}
              onPress={() => setTransport(opt.type)} activeOpacity={0.75}>
              <Ionicons name={opt.icon as any} size={13} color={active ? '#fff' : ranaColors.textSecondary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transport-specific fields */}
      {transport === 'Bus' && (
        <>
          <Text style={styles.label}>Fare Type</Text>
          <View style={styles.chipRow}>
            {BUS_FARE_TYPES.map((ft) => (
              <TouchableOpacity key={ft} style={[styles.chip, busFareType === ft && styles.chipActive]}
                onPress={() => setBusFareType(ft)} activeOpacity={0.75}>
                <Text style={[styles.chipText, busFareType === ft && styles.chipTextActive]}>{ft}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Bus Terminal (optional)</Text>
          <TextInput style={styles.input} placeholder="e.g. Cubao Bus Terminal, Victory Liner"
            placeholderTextColor={ranaColors.muted} value={busTerminal} onChangeText={setBusTerminal} />
        </>
      )}

      {transport === 'Train/LRT/MRT' && (
        <>
          <Text style={styles.label}>Train Line</Text>
          <View style={styles.chipRow}>
            {TRAIN_LINES.map((line) => (
              <TouchableOpacity key={line} style={[styles.chip, trainLine === line && styles.chipActive]}
                onPress={() => setTrainLine(line)} activeOpacity={0.75}>
                <Text style={[styles.chipText, trainLine === line && styles.chipTextActive]}>{line}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {transport === 'Car/Taxi' && (
        <>
          <Text style={styles.label}>Booking Method</Text>
          <View style={styles.chipRow}>
            {CAR_BOOKINGS.map((b) => (
              <TouchableOpacity key={b} style={[styles.chip, carBooking === b && styles.chipActive]}
                onPress={() => setCarBooking(b)} activeOpacity={0.75}>
                <Text style={[styles.chipText, carBooking === b && styles.chipTextActive]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {transport === 'Motor' && (
        <>
          <Text style={styles.label}>Motorcycle Type</Text>
          <View style={styles.chipRow}>
            {MOTOR_TYPES.map((mt) => (
              <TouchableOpacity key={mt} style={[styles.chip, motorType === mt && styles.chipActive]}
                onPress={() => setMotorType(mt)} activeOpacity={0.75}>
                <Text style={[styles.chipText, motorType === mt && styles.chipTextActive]}>{mt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {transport === 'Jeep' && (
        <>
          <Text style={styles.label}>Route Code (optional)</Text>
          <TextInput style={styles.input} placeholder="e.g. 18B, Quiapo–Cubao"
            placeholderTextColor={ranaColors.muted} value={jeepRoute} onChangeText={setJeepRoute} />
        </>
      )}

      {/* Common route fields */}
      <View style={styles.row}>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>From</Text>
          <TextInput style={styles.input} placeholder="e.g. Cubao, QC"
            placeholderTextColor={ranaColors.muted} value={origin} onChangeText={setOrigin} />
        </View>
        <View style={styles.halfWrap}>
          <Text style={styles.label}>To</Text>
          <TextInput style={styles.input} placeholder="e.g. Baguio City"
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
          <Text style={styles.label}>Passengers</Text>
          <TextInput style={styles.input} placeholder="1"
            placeholderTextColor={ranaColors.muted} value={passengers} onChangeText={setPassengers} keyboardType="number-pad" />
        </View>
      </View>

      <Text style={styles.label}>Est. Travel Time (optional)</Text>
      <TextInput style={styles.input} placeholder="e.g. 6 hours, 45 mins"
        placeholderTextColor={ranaColors.muted} value={estimatedTime} onChangeText={setEstimatedTime} />

      <Text style={styles.label}>Cost (PHP)</Text>
      <TextInput
        style={styles.input}
        placeholder={estimated > 0 ? `Auto-estimated: ${formatPHP(estimated)}` : 'e.g. 250'}
        placeholderTextColor={ranaColors.muted}
        value={manualCost}
        onChangeText={setManualCost}
        keyboardType="decimal-pad"
      />
      {manualCost.trim() === '' && estimated > 0 && (
        <View style={styles.infoPill}>
          <Ionicons name="calculator-outline" size={14} color={LAND_ACCENT} />
          <Text style={[styles.infoPillText, { color: LAND_ACCENT }]}>Auto-estimate: {formatPHP(estimated)}</Text>
        </View>
      )}
    </ScrollView>
  );

  const step4 = (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepHeading}>Review & Save</Text>
      <Text style={styles.stepSub}>Confirm your land trip details.</Text>

      <View style={styles.reviewCard}>
        <ReviewRow icon="bookmark-outline"  label="Title"     value={title || '—'} />
        <ReviewRow icon="flag-outline"      label="Status"    value={status} />
        <ReviewRow icon="calendar-outline"  label="Dates"     value={startDate && endDate ? `${startDate} to ${endDate}` : startDate || '—'} />
        {durationDays !== undefined && <ReviewRow icon="time-outline" label="Duration" value={`${durationDays} day${durationDays > 1 ? 's' : ''}`} />}
        <ReviewRow icon="navigate-outline"  label="Route"     value={origin && destination ? `${origin} → ${destination}` : '—'} />
        <ReviewRow icon="earth-outline"     label="Country"   value={country || '—'} />
        <ReviewRow icon="bus-outline"       label="Vehicle"   value={transport} />

        {transport === 'Bus' && <ReviewRow icon="car-outline" label="Fare Type" value={busFareType} />}
        {transport === 'Bus' && busTerminal ? <ReviewRow icon="business-outline" label="Terminal" value={busTerminal} /> : null}
        {transport === 'Train/LRT/MRT' && <ReviewRow icon="train" label="Line" value={trainLine} />}
        {transport === 'Car/Taxi' && <ReviewRow icon="phone-portrait-outline" label="Booking" value={carBooking} />}
        {transport === 'Motor' && <ReviewRow icon="bicycle" label="Type" value={motorType} />}
        {transport === 'Jeep' && jeepRoute ? <ReviewRow icon="swap-horizontal-outline" label="Route Code" value={jeepRoute} /> : null}
        {estimatedTime ? <ReviewRow icon="hourglass-outline" label="Travel Time" value={estimatedTime} /> : null}

        <ReviewRow icon="resize-outline"    label="Distance"  value={distance > 0 ? `${distance} km` : '—'} />
        <ReviewRow icon="people-outline"    label="Passengers" value={String(pax)} />
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
        <View style={[styles.estimateCard, { flex: 1, backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="cash-outline" size={18} color="#D97706" />
          <View>
            <Text style={[styles.estimateLabel, { color: '#92400E' }]}>Final Cost</Text>
            <Text style={[styles.estimateValue, { fontSize: 18, color: '#D97706' }]}>{formatPHP(finalCost)}</Text>
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backHeaderBtn}>
            <Ionicons name="chevron-back" size={22} color={ranaColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>New Land Trip</Text>
            <Text style={styles.headerSub}>Road & rail journeys</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <Stepper
          steps={[
            { title: 'Info',    content: step1 },
            { title: 'Dates',   content: step2 },
            { title: 'Route',   content: step3 },
            { title: 'Review',  content: step4 },
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
        accentColor={LAND_ACCENT}
        pickupLabel="From (Origin)"
        dropoffLabel="To (Destination)"
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
      <Ionicons name={icon as any} size={15} color={LAND_ACCENT} style={{ marginTop: 1 }} />
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
  chipActive: { backgroundColor: LAND_ACCENT, borderColor: LAND_ACCENT },
  chipText: { fontSize: 12, fontWeight: '600', color: ranaColors.textSecondary },
  chipTextActive: { color: '#fff' },
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: ranaRadius.pill,
    backgroundColor: '#FEF3C7', marginTop: 8,
  },
  infoPillText: { fontSize: 12, fontWeight: '700', color: LAND_ACCENT },
  mapPickerBtn: {
    backgroundColor: ranaColors.card, borderRadius: ranaRadius.lg,
    marginTop: 8, marginBottom: 4,
    borderWidth: 2, borderColor: '#FDE68A',
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
    backgroundColor: '#FEF3C7', borderTopWidth: 1, borderTopColor: '#FDE68A',
  },
  mapPickerDistText: { fontSize: 12, fontWeight: '700', color: LAND_ACCENT },
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
  estimateValue: { fontSize: 22, fontWeight: '800', color: ranaColors.primary },
  warnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12,
    borderRadius: ranaRadius.md, backgroundColor: '#FEF3C7',
  },
  warnText: { flex: 1, fontSize: 13, color: '#92400E' },
});
