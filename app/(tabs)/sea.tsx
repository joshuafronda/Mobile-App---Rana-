import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ranaColors, ranaSpacing } from '@/src/theme/ranaTheme';

const SEA_TRANSPORTS = [
  {
    id: 'ferry',
    name: 'Ferry',
    icon: 'boat' as const,
    color: '#0284C7',
    description: 'Passenger ferries connecting major islands. Roll-on/roll-off (RORO) ferries also carry vehicles.',
    examples: ['Batangas → Mindoro', 'Manila → Cebu'],
  },
  {
    id: 'fastcraft',
    name: 'FastCraft',
    icon: 'speedometer-outline' as const,
    color: '#0EA5E9',
    description: 'High-speed catamarans for shorter travel times between nearby islands. More expensive than regular ferries.',
    examples: ['Cebu → Bohol (OceanJet)', 'Batangas → Puerto Galera'],
  },
  {
    id: 'bangka',
    name: 'Bangka / Pump Boat',
    icon: 'sailboat' as const,
    color: '#06B6D4',
    description: 'Small outrigger boats for island-hopping, snorkeling tours, and short coastal crossings. Common in tourist areas.',
    examples: ['Port → Island beach', 'Island hopping tour'],
  },
  {
    id: 'cruise',
    name: 'Cruise Ship',
    icon: 'wine-outline' as const,
    color: '#7C3AED',
    description: 'Luxury cruise ships for leisure travel. Limited routes in the Philippines but growing in popularity.',
    examples: ['Manila → Corregidor', 'International cruises'],
  },
];

const POPULAR_ROUTES = [
  { from: 'Batangas', to: 'Calapan, Mindoro', duration: '~1.5 hrs', type: 'FastCraft' },
  { from: 'Cebu', to: 'Tagbilaran, Bohol', duration: '~2 hrs', type: 'FastCraft' },
  { from: 'Manila', to: 'Cebu', duration: '~22 hrs', type: 'Ferry' },
  { from: 'Dumaguete', to: 'Siquijor', duration: '~45 min', type: 'FastCraft' },
  { from: 'Iloilo', to: 'Bacolod', duration: '~1 hr', type: 'FastCraft' },
  { from: 'Dapitan', to: 'Dumaguete', duration: '~4 hrs', type: 'Ferry' },
];

export default function SeaTransportScreen() {
  return (
    <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={ranaColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>🌊 Sea Transport</Text>
            <Text style={styles.headerSub}>Ferries and boat travel</Text>
          </View>
        </View>

        {/* Context */}
        <View style={styles.contextCard}>
          <Ionicons name="information-circle" size={18} color="#0284C7" />
          <Text style={styles.contextText}>
            Travel by water using ferries or boats. Ideal for island-to-island trips and coastal destinations across the Philippine archipelago.
          </Text>
        </View>

        {/* Transport Cards */}
        {SEA_TRANSPORTS.map((transport) => (
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

        {/* Popular Routes */}
        <Text style={styles.sectionTitle}>Popular Sea Routes</Text>
        {POPULAR_ROUTES.map((route, i) => (
          <View key={i} style={styles.routeCard}>
            <View style={styles.routeLeft}>
              <Text style={styles.routeFrom}>{route.from}</Text>
              <Ionicons name="arrow-forward" size={14} color="#0284C7" />
              <Text style={styles.routeTo}>{route.to}</Text>
            </View>
            <View style={styles.routeRight}>
              <View style={styles.routeTypeChip}>
                <Text style={styles.routeTypeText}>{route.type}</Text>
              </View>
              <Text style={styles.routeDuration}>{route.duration}</Text>
            </View>
          </View>
        ))}

        {/* Coming Soon */}
        <View style={styles.comingSoonCard}>
          <Ionicons name="construct-outline" size={32} color={ranaColors.muted} />
          <Text style={styles.comingSoonTitle}>More features coming soon!</Text>
          <Text style={styles.comingSoonText}>
            Ferry schedules, ticket booking, and real-time port updates are under development.
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
    backgroundColor: '#F0F9FF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
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
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  exampleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284C7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ranaColors.textPrimary,
    marginTop: 8,
    marginBottom: 12,
  },
  routeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8EEF9',
  },
  routeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  routeFrom: {
    fontSize: 13,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  routeTo: {
    fontSize: 13,
    fontWeight: '600',
    color: ranaColors.textSecondary,
  },
  routeRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  routeTypeChip: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  routeTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  routeDuration: {
    fontSize: 11,
    color: ranaColors.textSecondary,
    fontWeight: '600',
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
