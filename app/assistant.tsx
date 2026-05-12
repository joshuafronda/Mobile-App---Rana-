import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';
import { useWeather } from '@/src/context/WeatherContext';

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
  const { weatherComment, weatherIcon, temperature, cityName, bestTripDays, alerts } = useWeather();

  // Build dynamic explore chips with best-day suggestions
  const exploreChips = activeSection === 'explore' && bestTripDays.length > 0
    ? [
        ...bestTripDays.slice(0, 2).map(
          (d) => `Plan trip ${d.label} — ${d.score}/100 travel score`
        ),
        ...context.chips.slice(0, 3),
      ]
    : context.chips;

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

        {/* Live weather comment bubble */}
        {activeSection === 'explore' && weatherComment ? (
          <View style={styles.weatherBubble}>
            <View style={styles.weatherBubbleIcon}>
              <Ionicons name={weatherIcon as any} size={18} color={ranaColors.primary} />
            </View>
            <View style={styles.weatherBubbleBody}>
              {cityName ? <Text style={styles.weatherBubbleCity}>{cityName}{temperature !== null && temperature !== undefined ? ` · ${Math.round(temperature)}°C` : ''}</Text> : null}
              <Text style={styles.weatherBubbleText}>{weatherComment}</Text>
            </View>
          </View>
        ) : null}

        {/* Weather alerts */}
        {activeSection === 'trips' && alerts.length > 0 ? (
          <View style={styles.alertBubble}>
            <Ionicons name="warning" size={16} color="#B45309" />
            <Text style={styles.alertText}>{alerts[0].event} — {alerts[0].description?.slice(0, 80)}…</Text>
          </View>
        ) : null}

        {/* ── Best Days to Travel (only in Explore Assistant) ── */}
        {activeSection === 'explore' && bestTripDays.length > 0 ? (
          <View style={styles.bestDaysSection}>
            <View style={styles.bestDaysHeaderRow}>
              <Ionicons name="sparkles" size={15} color={ranaColors.primary} />
              <Text style={styles.bestDaysTitle}>Best Days to Travel</Text>
              <Text style={styles.bestDaysSubtitle}> · next 8 days</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bestDaysRow}>
              {bestTripDays.slice(0, 5).map((day, i) => {
                const isTop = i === 0;
                const scoreColor = day.score >= 80 ? '#16A34A' : day.score >= 55 ? '#D97706' : '#DC2626';
                return (
                  <View key={day.dateISO} style={[styles.bestDayCard, isTop && styles.bestDayCardTop]}>
                    {isTop && (
                      <View style={styles.bestDayBestBadge}>
                        <Text style={styles.bestDayBestText}>BEST</Text>
                      </View>
                    )}
                    <Text style={[styles.bestDayLabel, isTop && { color: '#fff' }]}>{day.label}</Text>
                    <View style={styles.bestDayScoreRow}>
                      <Text style={[styles.bestDayScore, { color: isTop ? '#fff' : scoreColor }]}>{day.score}</Text>
                      <Text style={[styles.bestDayScoreUnit, isTop && { color: 'rgba(255,255,255,0.7)' }]}>/100</Text>
                    </View>
                    <Text style={[styles.bestDayDesc, isTop && { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={2}>{day.description}</Text>
                    <View style={styles.bestDayMetaRow}>
                      <Ionicons name="thermometer-outline" size={11} color={isTop ? 'rgba(255,255,255,0.75)' : ranaColors.textSecondary} />
                      <Text style={[styles.bestDayMeta, isTop && { color: 'rgba(255,255,255,0.75)' }]}>{day.minTemp}–{day.maxTemp}°C</Text>
                      <Ionicons name="rainy-outline" size={11} color={isTop ? 'rgba(255,255,255,0.75)' : ranaColors.textSecondary} style={{ marginLeft: 6 }} />
                      <Text style={[styles.bestDayMeta, isTop && { color: 'rgba(255,255,255,0.75)' }]}>{Math.round(day.pop * 100)}%</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.roleText}>{context.role}</Text>
          <Text style={styles.question}>{context.quickQuestion}</Text>
        </View>

        <Text style={styles.sectionTitle}>Try one</Text>
        <View style={styles.chipsWrap}>
          {(activeSection === 'explore' ? exploreChips : context.chips).map((chip) => (
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
  weatherBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EEF5FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C8DEFF',
  },
  weatherBubbleIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...ranaShadow.soft,
    flexShrink: 0,
  },
  weatherBubbleBody: {
    flex: 1,
  },
  weatherBubbleCity: {
    fontSize: 11,
    fontWeight: '700',
    color: ranaColors.primary,
    marginBottom: 2,
  },
  weatherBubbleText: {
    fontSize: 13,
    color: ranaColors.textPrimary,
    lineHeight: 19,
    fontWeight: '500',
  },
  alertBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 18,
  },

  // ── Best Days to Travel ──────────────────────────────────────────────────
  bestDaysSection: {
    marginBottom: 20,
  },
  bestDaysHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bestDaysTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ranaColors.textPrimary,
    marginLeft: 6,
  },
  bestDaysSubtitle: {
    fontSize: 13,
    color: ranaColors.textSecondary,
    fontWeight: '500',
  },
  bestDaysRow: {
    gap: 10,
    paddingBottom: 4,
  },
  bestDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    minWidth: 110,
    borderWidth: 1,
    borderColor: '#EEF3FF',
  },
  bestDayCardTop: {
    backgroundColor: '#1B2B59',
    borderColor: '#1B2B59',
  },
  bestDayBestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 6,
  },
  bestDayBestText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  bestDayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ranaColors.textPrimary,
    marginBottom: 6,
  },
  bestDayScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 4,
  },
  bestDayScore: {
    fontSize: 24,
    fontWeight: '900',
  },
  bestDayScoreUnit: {
    fontSize: 11,
    color: ranaColors.textSecondary,
    fontWeight: '600',
  },
  bestDayDesc: {
    fontSize: 10,
    color: ranaColors.textSecondary,
    lineHeight: 15,
    marginBottom: 6,
  },
  bestDayMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bestDayMeta: {
    fontSize: 10,
    color: ranaColors.textSecondary,
    fontWeight: '600',
  },
});
