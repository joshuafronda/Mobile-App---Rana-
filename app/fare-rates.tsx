import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { TRIP_BASE_FARES, TransportCategory } from '@/src/context/TravelContext';
import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';

type RateItem = {
  type: TransportCategory;
  label: string;
};

const RATE_ITEMS: RateItem[] = [
  { type: 'Local Airplane', label: 'Local Airplane Ticket' },
  { type: 'International Airplane', label: 'International Airplane Ticket' },
  { type: 'Bus', label: 'Bus' },
  { type: 'Jeep', label: 'Jeep' },
  { type: 'Car/Taxi', label: 'Car / Taxi' },
  { type: 'Motor', label: 'Motor' },
  { type: 'Train/LRT/MRT', label: 'Train / LRT / MRT' },
];

function formatPHP(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value);
}

export default function FareRatesScreen() {
  return (
    <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Current Transport Prices</Text>
        <Text style={styles.subtitle}>
          Base fare and per-kilometer rates used by the fare estimator.
        </Text>

        {RATE_ITEMS.map((item) => {
          const rate = TRIP_BASE_FARES[item.type];
          return (
            <View key={item.type} style={styles.card}>
              <Text style={styles.transport}>{item.label}</Text>
              <Text style={styles.line}>Base fare: {formatPHP(rate.baseFare)}</Text>
              <Text style={styles.line}>Included distance: first {rate.minKm} km</Text>
              <Text style={styles.perKm}>Per kilometer after {rate.minKm} km: {formatPHP(rate.extraPerKm)} / km</Text>
            </View>
          );
        })}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Note</Text>
          <Text style={styles.noteText}>
            These are the current app fare rates for estimation. You can connect a live fare API later for dynamic updates.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: ranaSpacing.md,
    paddingBottom: ranaSpacing.xl,
    gap: ranaSpacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: ranaSpacing.xs,
    fontSize: 14,
    lineHeight: 20,
    color: ranaColors.textSecondary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ranaRadius.lg,
    padding: ranaSpacing.md,
    ...ranaShadow.soft,
  },
  transport: {
    fontSize: 17,
    fontWeight: '700',
    color: ranaColors.textPrimary,
    marginBottom: 8,
  },
  line: {
    fontSize: 14,
    color: ranaColors.textSecondary,
    marginBottom: 4,
  },
  perKm: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: ranaColors.primary,
  },
  noteCard: {
    marginTop: ranaSpacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: ranaRadius.md,
    padding: ranaSpacing.md,
    ...ranaShadow.soft,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ranaColors.textPrimary,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 19,
    color: ranaColors.textSecondary,
  },
});
