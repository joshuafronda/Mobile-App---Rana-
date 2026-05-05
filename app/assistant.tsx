import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';

type Section = 'explore' | 'trips' | 'profile';

const CONTENT: Record<Section, {
  title: string;
  subtitle: string;
  role: string;
  chips: string[];
  quickQuestion: string;
}> = {
  explore: {
    title: 'Explore Assistant',
    subtitle: 'Discovery mode',
    role: 'I can suggest places, activities, and travel ideas based on your vibe and budget.',
    chips: [
      'Beach destinations under ₱10k',
      '3-day nature getaway',
      'Best places this month',
      'Food trip spots near Manila',
      'Hidden gems in the Philippines',
    ],
    quickQuestion: 'What kind of trip are you in the mood for?',
  },
  trips: {
    title: 'Trips Assistant',
    subtitle: 'Trip planner mode',
    role: 'I can help with itinerary planning, scheduling, packing, weather checks, and booking reminders.',
    chips: [
      'Build a 4-day itinerary',
      'Create a packing list',
      'Check weather for my trip',
      'Optimize route and schedule',
      'Trip prep checklist',
    ],
    quickQuestion: 'Which upcoming trip should I help you plan?',
  },
  profile: {
    title: 'Profile Assistant',
    subtitle: 'Support mode',
    role: 'I can help with account settings, preferences, language, and travel history personalization.',
    chips: [
      'Update my preferences',
      'Change language settings',
      'Review my travel history',
      'Improve recommendations',
      'Help with account support',
    ],
    quickQuestion: 'What would you like to update in your profile?',
  },
};

function normalizeSection(value: string | string[] | undefined): Section {
  const first = Array.isArray(value) ? value[0] : value;
  if (first === 'trips' || first === 'profile') return first;
  return 'explore';
}

export default function AssistantScreen() {
  const { section } = useLocalSearchParams<{ section?: string | string[] }>();
  const activeSection = normalizeSection(section);
  const context = CONTENT[activeSection];

  return (
    <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{context.title}</Text>
            <Text style={styles.subtitle}>{context.subtitle}</Text>
          </View>
          <View style={styles.iconWrap}>
            <Ionicons name="chatbubble-ellipses" size={22} color={ranaColors.primary} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.roleText}>{context.role}</Text>
          <Text style={styles.question}>{context.quickQuestion}</Text>
        </View>

        <Text style={styles.sectionTitle}>Try one</Text>
        <View style={styles.chipsWrap}>
          {context.chips.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={styles.chip}
              activeOpacity={0.8}
              onPress={() => {}}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={16} color="#fff" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: ranaSpacing.md,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ranaSpacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: ranaColors.textSecondary,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...ranaShadow.soft,
  },
  card: {
    marginTop: ranaSpacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: ranaRadius.lg,
    padding: ranaSpacing.md,
    ...ranaShadow.card,
  },
  roleText: {
    fontSize: 14,
    lineHeight: 21,
    color: ranaColors.textPrimary,
  },
  question: {
    marginTop: ranaSpacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: ranaColors.primary,
  },
  sectionTitle: {
    marginTop: ranaSpacing.lg,
    marginBottom: ranaSpacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderColor: ranaColors.accent,
    borderWidth: 1,
    borderRadius: ranaRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...ranaShadow.soft,
  },
  chipText: {
    fontSize: 12,
    color: ranaColors.textPrimary,
    fontWeight: '600',
  },
  backBtn: {
    marginTop: ranaSpacing.lg,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: ranaRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: ranaColors.primary,
    ...ranaShadow.soft,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
