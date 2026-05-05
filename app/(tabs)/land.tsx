import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ranaColors, ranaSpacing } from '@/src/theme/ranaTheme';

const LAND_TRANSPORTS = [
  {
    id: 'jeep',
    name: 'Jeepney',
    icon: 'bus' as const,
    color: '#F59E0B',
    description: 'The iconic Philippine jeepney — the most popular and affordable way to get around cities and towns.',
    examples: ['Home → Market', 'City proper → Suburbs'],
  },
  {
    id: 'bus',
    name: 'Bus',
    icon: 'bus-outline' as const,
    color: '#16A34A',
    description: 'Long-distance and provincial travel. Air-conditioned and regular buses connect major cities and provinces.',
    examples: ['Manila → Baguio', 'Cebu City → Bantayan'],
  },
  {
    id: 'car',
    name: 'Car / Taxi',
    icon: 'car-sport' as const,
    color: '#6366F1',
    description: 'Private cars and taxis for convenient door-to-door travel. Ride-hailing apps like Grab are widely available.',
    examples: ['Grab: Home → Mall', 'Taxi: Hotel → Airport'],
  },
  {
    id: 'motorcycle',
    name: 'Motorcycle',
    icon: 'bicycle' as const,
    color: '#EF4444',
    description: 'Motorcycle taxis (habal-habal) and tricycles for short trips, especially in rural areas and narrow roads.',
    examples: ['Tricycle: Village → Main road', 'Habal-habal: Town → Falls'],
  },
  {
    id: 'train',
    name: 'Train (LRT/MRT)',
    icon: 'train' as const,
    color: '#0EA5E9',
    description: 'Metro rail transit in Metro Manila. LRT Line 1 & 2 and MRT Line 3 cover major city routes.',
    examples: ['LRT: Baclaran → Monumento', 'MRT: North Ave → Taft'],
  },
];

export default function LandTransportScreen() {
  return (
    <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={ranaColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>🚗 Land Transport</Text>
            <Text style={styles.headerSub}>Road and rail transportation</Text>
          </View>
        </View>

        {/* Context */}
        <View style={styles.contextCard}>
          <Ionicons name="information-circle" size={18} color={ranaColors.primary} />
          <Text style={styles.contextText}>
            Everyday transportation on roads and railways. Includes short and long-distance travel within cities or provinces.
          </Text>
        </View>

        {/* Transport Cards */}
        {LAND_TRANSPORTS.map((transport) => (
          <View key={transport.id} style={styles.transportCard}>
            <View style={[styles.transportIconWrap, { backgroundColor: `${transport.color}15` }]}>
              <Ionicons name={transport.icon} size={28} color={transport.color} />
            </View>
            <View style={styles.transportInfo}>
              <Text style={styles.transportName}>{transport.name}</Text>
              <Text style={styles.transportDesc}>{transport.description}</Text>
              <View style={styles.examplesRow}>
                {transport.examples.map((ex, i) => (
                  <View key={i} style={styles.exampleChip}>
                    <Text style={styles.exampleText}>{ex}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}

        {/* Coming Soon */}
        <View style={styles.comingSoonCard}>
          <Ionicons name="construct-outline" size={32} color={ranaColors.muted} />
          <Text style={styles.comingSoonTitle}>More features coming soon!</Text>
          <Text style={styles.comingSoonText}>
            Fare calculator, route planner, and real-time schedules are under development.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingTop: 56,
    paddingHorizontal: ranaSpacing.md,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EEF9',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  headerSub: {
    fontSize: 13,
    color: ranaColors.textSecondary,
    marginTop: 2,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  contextText: {
    flex: 1,
    fontSize: 13,
    color: ranaColors.textSecondary,
    lineHeight: 19,
  },
  transportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EEF9',
  },
  transportIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportInfo: {
    flex: 1,
    gap: 4,
  },
  transportName: {
    fontSize: 15,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  transportDesc: {
    fontSize: 12,
    color: ranaColors.textSecondary,
    lineHeight: 17,
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  exampleChip: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  exampleText: {
    fontSize: 10,
    fontWeight: '600',
    color: ranaColors.primary,
  },
  comingSoonCard: {
    alignItems: 'center',
    backgroundColor: '#FAFCFF',
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8EEF9',
    gap: 8,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  comingSoonText: {
    fontSize: 13,
    color: ranaColors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
