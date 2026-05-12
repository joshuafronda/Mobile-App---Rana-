import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TouchableOpacity, View, Modal, Dimensions, ScrollView, TextInput } from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTravel, type Trip } from '@/src/context/TravelContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';

function formatPHP(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value);
}

type ItineraryCategory = 'Transport' | 'Hotel' | 'Food' | 'Sightseeing';

type ItineraryItem = {
  id: string;
  dayIndex: number;
  time: string;
  category: ItineraryCategory;
  title: string;
  location: string;
  cost: number;
};

const CATEGORY_EMOJI: Record<ItineraryCategory, string> = {
  Transport: '',
  Hotel: '',
  Food: '',
  Sightseeing: '',
};

function dayShort(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function dayLong(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getTripDays(trip: Trip): Date[] {
  const start = trip.startDate ? new Date(trip.startDate) : new Date(trip.dateISO);
  const startAtMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  let dayCount = trip.durationDays ?? 1;
  if (trip.startDate && trip.endDate) {
    const end = new Date(trip.endDate);
    const endAtMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    dayCount = Math.max(1, Math.round((endAtMidnight.getTime() - startAtMidnight.getTime()) / 86400000) + 1);
  }

  return Array.from({ length: dayCount }, (_, index) => {
    const d = new Date(startAtMidnight);
    d.setDate(startAtMidnight.getDate() + index);
    return d;
  });
}

function createSeedItinerary(trip: Trip): ItineraryItem[] {
  return [
    {
      id: `${trip.id}-i1`,
      dayIndex: 0,
      time: '14:20',
      category: 'Transport',
      title: `${trip.transportType} transfer to ${trip.destination}`,
      location: `From ${trip.origin}`,
      cost: Math.max(0, Math.round(trip.totalCost * 0.12)),
    },
    {
      id: `${trip.id}-i2`,
      dayIndex: 0,
      time: '16:30',
      category: 'Hotel',
      title: `Check-in near ${trip.destination}`,
      location: `${trip.destination}`,
      cost: Math.max(0, Math.round(trip.totalCost * 0.55)),
    },
    {
      id: `${trip.id}-i3`,
      dayIndex: 0,
      time: '19:00',
      category: 'Food',
      title: `Dinner in ${trip.destination}`,
      location: `Local food spot`,
      cost: Math.max(0, Math.round(trip.totalCost * 0.08)),
    },
    {
      id: `${trip.id}-i4`,
      dayIndex: 0,
      time: '21:00',
      category: 'Sightseeing',
      title: `Night walk and photo stops`,
      location: `${trip.destination}`,
      cost: 0,
    },
  ];
}

export default function MyTripsScreen() {
  const { trips, photos } = useTravel();
  const { t } = useLanguage();
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [itineraryByTrip, setItineraryByTrip] = useState<Record<string, ItineraryItem[]>>({});
  const [addFormVisible, setAddFormVisible] = useState(false);
  const [memoriesVisible, setMemoriesVisible] = useState(false);
  const [dayImages, setDayImages] = useState<Record<string, Record<number, string[]>>>({});
  const [formTime, setFormTime] = useState('10:00');
  const [formCategory, setFormCategory] = useState<ItineraryCategory>('Sightseeing');
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCost, setFormCost] = useState('0');

  const SAMPLE_GALLERY = [
    'https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0',
    'https://images.unsplash.com/photo-1755569309049-98410b94f66d?q=80&w=772&auto=format&fit=crop&ixlib=rb-4.1.0',
    'https://images.unsplash.com/photo-1755497595318-7e5e3523854f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0',
  ];

  const totalKm = trips.reduce((sum, trip) => sum + trip.distanceKm, 0);
  const countriesVisited = new Set(trips.map((trip) => trip.country.toLowerCase())).size;
  const totalSpent = trips.reduce((sum, trip) => sum + trip.totalCost, 0);
  const avgCost = trips.length > 0 ? Math.round(totalSpent / trips.length) : 0;
  const completedCount = trips.filter(t => t.status === 'completed').length;
  const confirmedCount = trips.filter(t => t.status === 'confirmed').length;
  const plannedCount = trips.filter(t => t.status !== 'completed' && t.status !== 'confirmed' && t.status !== 'cancelled').length;
  const cancelledCount = trips.filter(t => t.status === 'cancelled').length;
  const localFlights = trips.filter(t => t.transportType === 'Local Airplane').length;
  const intlFlights = trips.filter(t => t.transportType === 'International Airplane').length;
  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  );

  const tripDays = useMemo(() => (activeTrip ? getTripDays(activeTrip) : []), [activeTrip]);
  const activeItems = useMemo(() => {
    if (!activeTrip) return [];
    return (itineraryByTrip[activeTrip.id] ?? []).filter((item) => item.dayIndex === activeDayIndex);
  }, [activeDayIndex, activeTrip, itineraryByTrip]);
  const activeDayTotal = activeItems.reduce((sum, item) => sum + item.cost, 0);

  const openTripDetail = (trip: Trip) => {
    setActiveTrip(trip);
    setActiveDayIndex(0);
    setItineraryByTrip((prev) => {
      if (prev[trip.id]) return prev;
      return { ...prev, [trip.id]: createSeedItinerary(trip) };
    });
    setDetailVisible(true);
  };

  const removeItineraryItem = (tripId: string, itemId: string) => {
    setItineraryByTrip((prev) => ({
      ...prev,
      [tripId]: (prev[tripId] ?? []).filter((item) => item.id !== itemId),
    }));
  };

  const openAddForm = () => {
    setFormTime('10:00');
    setFormCategory('Sightseeing');
    setFormTitle('');
    setFormLocation('');
    setFormCost('0');
    setAddFormVisible(true);
  };

  const submitAddForm = () => {
    if (!activeTrip) return;
    if (!formTitle.trim()) return;

    const costValue = Number.parseFloat(formCost);
    const newItem: ItineraryItem = {
      id: `${activeTrip.id}-${Date.now()}`,
      dayIndex: activeDayIndex,
      time: formTime.trim() || '10:00',
      category: formCategory,
      title: formTitle.trim(),
      location: formLocation.trim() || activeTrip.destination,
      cost: Number.isFinite(costValue) && costValue > 0 ? costValue : 0,
    };

    setItineraryByTrip((prev) => ({
      ...prev,
      [activeTrip.id]: [...(prev[activeTrip.id] ?? []), newItem],
    }));
    setAddFormVisible(false);
  };

  const pickDayImage = async (tripId: string, dayIndex: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setDayImages((prev) => ({
        ...prev,
        [tripId]: {
          ...(prev[tripId] ?? {}),
          [dayIndex]: [...((prev[tripId] ?? {})[dayIndex] ?? []), ...uris],
        },
      }));
    }
  };

  const removeDayImage = (tripId: string, dayIndex: number, imgIndex: number) => {
    setDayImages((prev) => {
      const current = prev[tripId]?.[dayIndex] ?? [];
      const updated = current.filter((_, i) => i !== imgIndex);
      return {
        ...prev,
        [tripId]: {
          ...(prev[tripId] ?? {}),
          [dayIndex]: updated,
        },
      };
    });
  };

  const tripRangeText = (trip: Trip) => {
    const days = getTripDays(trip);
    if (days.length === 0) return '';
    const start = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = days[days.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  return (
    <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.container}>
      {/* Floating "New Trip" button — top right */}
      <TouchableOpacity
        style={styles.newTripBtn}
        onPress={() => router.push('/new-trip')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={16} color="#fff" />
        <Text style={styles.newTripBtnText}>{t.newTrip}</Text>
      </TouchableOpacity>

      <FlatList
        data={sortedTrips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>{t.myTrips}</Text>
            <Text style={styles.subtitle}>{t.myTripsSubtitle}</Text>

            {/* Dashboard card */}
            <View style={styles.dashCard}>
              <Text style={styles.dashTitle}>Overview</Text>

              {/* 4-metric row */}
              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <View style={[styles.metricIcon, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="speedometer-outline" size={13} color="#0284C7" />
                  </View>
                  <Text style={styles.metricVal}>{totalKm.toFixed(0)}</Text>
                  <Text style={styles.metricLbl}>km</Text>
                </View>
                <View style={styles.metricSep} />
                <View style={styles.metricItem}>
                  <View style={[styles.metricIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="airplane-outline" size={13} color="#2563EB" />
                  </View>
                  <Text style={styles.metricVal}>{trips.length}</Text>
                  <Text style={styles.metricLbl}>trips</Text>
                </View>
                <View style={styles.metricSep} />
                <View style={styles.metricItem}>
                  <View style={[styles.metricIcon, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="globe-outline" size={13} color="#16A34A" />
                  </View>
                  <Text style={styles.metricVal}>{countriesVisited}</Text>
                  <Text style={styles.metricLbl}>countries</Text>
                </View>
                <View style={styles.metricSep} />
                <View style={styles.metricItem}>
                  <View style={[styles.metricIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="checkmark-done-outline" size={13} color="#2563EB" />
                  </View>
                  <Text style={styles.metricVal}>{completedCount}</Text>
                  <Text style={styles.metricLbl}>done</Text>
                </View>
              </View>

              {/* Spend band */}
              <View style={styles.spendBand}>
                <View>
                  <Text style={styles.spendLbl}>{t.totalSpend}</Text>
                  <Text style={styles.spendVal}>{formatPHP(totalSpent)}</Text>
                </View>
                {avgCost > 0 && (
                  <View style={styles.spendAvgWrap}>
                    <Text style={styles.spendAvgLbl}>avg / trip</Text>
                    <Text style={styles.spendAvgVal}>{formatPHP(avgCost)}</Text>
                  </View>
                )}
              </View>

              {/* Trip status breakdown */}
              {trips.length > 0 && (
                <>
                  <View style={styles.dashDiv} />
                  <Text style={styles.dashSubhead}>Trip Status</Text>
                  {[
                    { label: 'Completed', count: completedCount, color: '#16A34A' },
                    { label: 'Confirmed', count: confirmedCount, color: '#2563EB' },
                    { label: 'Planned', count: plannedCount, color: '#D97706' },
                    { label: 'Cancelled', count: cancelledCount, color: '#DC2626' },
                  ].filter(s => s.count > 0).map((s, i) => (
                    <View key={i} style={styles.barRow}>
                      <Text style={styles.barLbl}>{s.label}</Text>
                      <View style={styles.barTrack}>
                        <View style={{ flex: s.count / trips.length, backgroundColor: s.color, height: 6, borderRadius: 3 }} />
                        <View style={{ flex: Math.max(0, 1 - s.count / trips.length) }} />
                      </View>
                      <Text style={styles.barCnt}>{s.count}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Flight type breakdown */}
              {(localFlights > 0 || intlFlights > 0) && (
                <>
                  <View style={styles.dashDiv} />
                  <Text style={styles.dashSubhead}>By Flight Type</Text>
                  {[
                    { label: 'Domestic', count: localFlights, color: ranaColors.primary },
                    { label: "Int'l", count: intlFlights, color: '#0284C7' },
                  ].filter(s => s.count > 0).map((s, i) => (
                    <View key={i} style={styles.barRow}>
                      <Text style={styles.barLbl}>{s.label}</Text>
                      <View style={styles.barTrack}>
                        <View style={{ flex: s.count / trips.length, backgroundColor: s.color, height: 6, borderRadius: 3 }} />
                        <View style={{ flex: Math.max(0, 1 - s.count / trips.length) }} />
                      </View>
                      <Text style={styles.barCnt}>{s.count}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Scheduled Trips</Text>
              <TouchableOpacity
                style={styles.memoriesBtn}
                onPress={() => setMemoriesVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="time-outline" size={13} color="#fff" />
                <Text style={styles.memoriesBtnText}>Memories</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const completed = item.status === 'completed';
          const durationDays = item.durationDays ?? getTripDays(item).length;

          const statusLabel =
            item.status === 'confirmed' ? 'Confirmed'
            : item.status === 'draft' ? 'Draft'
            : item.status === 'completed' ? 'Completed'
            : item.status === 'cancelled' ? 'Cancelled'
            : 'Planned';
          const statusBadgeStyle =
            item.status === 'completed' ? styles.badgeCompleted
            : item.status === 'confirmed' ? styles.badgeConfirmed
            : item.status === 'draft' ? styles.badgeDraft
            : item.status === 'cancelled' ? styles.badgeCancelled
            : styles.badgePlanned;
          const statusTextColor =
            item.status === 'completed' ? '#16A34A'
            : item.status === 'confirmed' ? '#2563EB'
            : item.status === 'draft' ? '#6B7280'
            : item.status === 'cancelled' ? '#DC2626'
            : '#D97706';

          return (
            <Pressable
              style={({ pressed }) => [styles.tripCard, pressed && { opacity: 0.9 }]}
              onPress={() => openTripDetail(item)}
            >
              <View style={styles.cardInner}>
                {/* Transport type + status badge */}
                <View style={styles.tripHeader}>
                  <View style={styles.transportWrap}>
                    <View style={[styles.transportIconCircle, { backgroundColor: ranaColors.primary }]}>
                      <Ionicons name="navigate" size={11} color="#fff" />
                    </View>
                    <Text style={styles.transport}>{item.transportType}</Text>
                  </View>
                  <View style={[styles.badge, statusBadgeStyle]}>
                    <Text style={[styles.badgeText, { color: statusTextColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Trip title */}
                {item.title ? (
                  <Text style={styles.tripTitle}>{item.title}</Text>
                ) : null}

                {/* Route */}
                <Text style={styles.route}>
                  {item.origin}{'  →  '}{item.destination}
                </Text>

                {/* Date range + duration */}
                <Text style={styles.projectMetaLine}>
                  {tripRangeText(item)} · {durationDays} Day{durationDays > 1 ? 's' : ''}
                </Text>

                {/* Stats chips */}
                <View style={styles.statsChipRow}>
                  <View style={styles.statsChip}>
                    <Ionicons name="speedometer-outline" size={10} color={ranaColors.textSecondary} />
                    <Text style={styles.statsChipText}>{item.distanceKm.toFixed(0)} km</Text>
                  </View>
                  <View style={styles.statsChip}>
                    <Ionicons name="people-outline" size={10} color={ranaColors.textSecondary} />
                    <Text style={styles.statsChipText}>{item.passengers} pax</Text>
                  </View>
                  <View style={styles.statsChip}>
                    <Ionicons name="flag-outline" size={10} color={ranaColors.textSecondary} />
                    <Text style={styles.statsChipText}>{item.country}</Text>
                  </View>
                </View>

                {/* Estimated Travel Budget */}
                {item.budgetRange ? (
                  <View style={styles.budgetSection}>
                    <View style={styles.budgetDivider} />
                    <View style={styles.budgetHeader}>
                      <Ionicons name="wallet-outline" size={12} color="#0EA5E9" />
                      <Text style={styles.budgetLabel}>Estimated Travel Budget</Text>
                    </View>
                    <Text style={styles.budgetRange}>{item.budgetRange}</Text>
                    {(item.budgetNotes ?? []).map((note, i) => (
                      <View key={i} style={styles.budgetNoteRow}>
                        <Text style={styles.budgetNoteDot}>•</Text>
                        <Text style={styles.budgetNoteText}>{note}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Photo compilation strip — all day photos combined */}
                {(() => {
                  const allPhotos = Object.values(dayImages[item.id] ?? {}).flat();
                  if (allPhotos.length === 0) return null;
                  return (
                    <View style={styles.cardThumbSection}>
                      <View style={styles.cardThumbDivider} />
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 6 }}
                      >
                        {allPhotos.slice(0, 8).map((uri, idx) => (
                          <TouchableOpacity
                            key={idx}
                            activeOpacity={0.85}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              setGalleryImages(allPhotos);
                              setGalleryVisible(true);
                            }}
                          >
                            <Image source={{ uri }} style={styles.cardThumbImage} />
                          </TouchableOpacity>
                        ))}
                        {allPhotos.length > 8 && (
                          <View style={styles.cardThumbMore}>
                            <Text style={styles.cardThumbMoreText}>+{allPhotos.length - 8}</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  );
                })()}

                {/* Footer: date · cost · track · chevron */}
                <View style={styles.footerRow}>
                  <Text style={styles.date}>
                    {new Date(item.dateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <View style={styles.footerRight}>
                    <Text style={styles.cost}>{formatPHP(item.totalCost)}</Text>
                    <TouchableOpacity
                      style={styles.trackBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        router.push({
                          pathname: '/map-view',
                          params: {
                            origin: item.origin,
                            destination: item.destination,
                            transport: item.transportType,
                            title: item.title ?? '',
                            distanceKm: String(item.distanceKm),
                            totalCost: String(item.totalCost),
                          },
                        });
                      }}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="map-outline" size={13} color={ranaColors.primary} />
                      <Text style={styles.trackBtnText}>Track</Text>
                    </TouchableOpacity>
                    <Ionicons name="chevron-forward" size={15} color="#C5D0E4" />
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {/* Gallery Viewer (pinch/zoom/fullscreen) */}
      <ImageViewing
        images={galleryImages.map((u) => ({ uri: u }))}
        imageIndex={0}
        visible={galleryVisible}
        onRequestClose={() => setGalleryVisible(false)}
      />

      <Modal
        visible={detailVisible}
        animationType="slide"
        onRequestClose={() => {
          setAddFormVisible(false);
          setDetailVisible(false);
        }}
      >
        <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.modalRoot}>
          {activeTrip && (
            <>
              <View style={styles.detailHeaderRow}>
                <TouchableOpacity
                  style={styles.detailBackBtn}
                  onPress={() => {
                    setAddFormVisible(false);
                    setDetailVisible(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons name="arrow-back" size={20} color={ranaColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.detailHeaderTitle}>My Trips</Text>
                <View style={{ width: 36 }} />
              </View>

              <View style={styles.detailBody}>
              <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.detailRouteTitle}>{activeTrip.title?.trim() || activeTrip.destination}</Text>

                <Text style={styles.detailSubline}>
                  {tripRangeText(activeTrip)} · {tripDays.length} Day{tripDays.length > 1 ? 's' : ''} · {activeTrip.transportType}
                </Text>

                <View style={styles.detailStatsRow}>
                  <View style={styles.detailStatCard}>
                    <Text style={styles.detailStatValue}>{tripDays.length} Days</Text>
                  </View>
                  <View style={styles.detailStatCard}>
                    <Text style={styles.detailStatValue}>{activeTrip.passengers} Travelers</Text>
                  </View>
                  <View style={styles.detailStatCard}>
                    <Text style={styles.detailStatValue}>{formatPHP(activeTrip.totalCost)} budget</Text>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabRow}>
                  {tripDays.map((day, index) => {
                    const isActive = index === activeDayIndex;
                    return (
                      <TouchableOpacity
                        key={`${activeTrip.id}-day-${index}`}
                        style={[styles.dayChip, isActive && styles.dayChipActive]}
                        onPress={() => setActiveDayIndex(index)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.dayChipTop, isActive && styles.dayChipTopActive]}>{`D${index + 1}`}</Text>
                        <Text style={[styles.dayChipBottom, isActive && styles.dayChipBottomActive]}>{dayShort(day)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {tripDays[activeDayIndex] && (
                  <View style={styles.dayHeaderBlock}>
                    <View style={styles.dayHeaderTitleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dayHeaderTitle}>{`Day ${activeDayIndex + 1} - ${activeDayIndex === 0 ? 'Arrival Day' : 'Plan'}`}</Text>
                        <Text style={styles.dayHeaderDate}>{dayLong(tripDays[activeDayIndex])}</Text>
                      </View>
                      <View style={styles.dayPhotoBtnRow}>
                        <TouchableOpacity
                          style={styles.dayPhotoBtn}
                          onPress={() => activeTrip && pickDayImage(activeTrip.id, activeDayIndex)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="camera-outline" size={15} color={ranaColors.primary} />
                          <Text style={styles.dayPhotoBtnText}>Add photo</Text>
                        </TouchableOpacity>
                        {activeTrip && (dayImages[activeTrip.id]?.[activeDayIndex]?.length ?? 0) > 0 && (
                          <TouchableOpacity
                            style={styles.dayAlbumBtn}
                            onPress={() => {
                              setGalleryImages(dayImages[activeTrip!.id][activeDayIndex]);
                              setGalleryVisible(true);
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="images-outline" size={15} color="#fff" />
                            <Text style={styles.dayAlbumBtnText}>
                              {dayImages[activeTrip.id][activeDayIndex].length}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* Per-day photo strip */}
                {activeTrip && (dayImages[activeTrip.id]?.[activeDayIndex]?.length ?? 0) > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.dayThumbRow}
                    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                  >
                    {dayImages[activeTrip.id][activeDayIndex].map((uri, idx) => (
                      <View key={idx} style={styles.dayThumbWrap}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => {
                            setGalleryImages(dayImages[activeTrip!.id][activeDayIndex]);
                            setGalleryVisible(true);
                          }}
                        >
                          <Image source={{ uri }} style={styles.dayThumbImage} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.dayThumbRemove}
                          onPress={() => removeDayImage(activeTrip!.id, activeDayIndex, idx)}
                          hitSlop={6}
                        >
                          <Ionicons name="close" size={13} color="#1F2937" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.dayThumbAdd}
                      onPress={() => activeTrip && pickDayImage(activeTrip.id, activeDayIndex)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={20} color={ranaColors.primary} />
                    </TouchableOpacity>
                  </ScrollView>
                )}

                <TouchableOpacity
                  style={styles.addRowBtn}
                  onPress={openAddForm}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addRowBtnText}>Add activity</Text>
                </TouchableOpacity>

                {activeItems.length === 0 ? (
                  <Text style={styles.noItemsText}>No activities yet for this day.</Text>
                ) : (
                  activeItems.map((entry) => (
                    <View key={entry.id} style={styles.timelineCard}>
                      <View style={styles.timelineTopRow}>
                        <Text style={styles.timelineTime}>{entry.time}</Text>
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => activeTrip && removeItineraryItem(activeTrip.id, entry.id)}
                          hitSlop={10}
                        >
                          <Ionicons name="close" size={16} color="#8B95AA" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.timelineType}>{entry.category}</Text>
                      <Text style={styles.timelineTitle}>{entry.title}</Text>
                      <Text style={styles.timelineLocation}>{`${entry.location}`}</Text>
                      <Text style={styles.timelineCost}>{entry.cost > 0 ? formatPHP(entry.cost) : 'Free'}</Text>
                    </View>
                  ))
                )}

                <View style={styles.dayTotalRow}>
                  <Text style={styles.dayTotalLabel}>{`Day ${activeDayIndex + 1} total`}</Text>
                  <Text style={styles.dayTotalValue}>{formatPHP(activeDayTotal)}</Text>
                </View>
              </ScrollView>

              {/* Add Activity overlay — lives INSIDE the detail Modal to avoid iOS modal-stacking bug */}
              {addFormVisible && (
                <View style={styles.inTripModalOverlay}>
                  <ScrollView
                    contentContainerStyle={styles.formScrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.formCardModal}>
                      <View style={styles.formHeaderRow}>
                        <Text style={styles.formTitle}>Add Activity</Text>
                        <TouchableOpacity onPress={() => setAddFormVisible(false)} style={styles.formCloseBtn}>
                          <Ionicons name="close" size={18} color={ranaColors.textSecondary} />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.formLabel}>Time</Text>
                      <TextInput
                        value={formTime}
                        onChangeText={setFormTime}
                        placeholder="HH:MM"
                        placeholderTextColor={ranaColors.textSecondary}
                        style={styles.formInput}
                      />

                      <Text style={styles.formLabel}>Category</Text>
                      <View style={styles.formCategoryRow}>
                        {(['Transport', 'Hotel', 'Food', 'Sightseeing'] as ItineraryCategory[]).map((cat) => {
                          const active = formCategory === cat;
                          return (
                            <TouchableOpacity
                              key={cat}
                              style={[styles.formCategoryChip, active && styles.formCategoryChipActive]}
                              onPress={() => setFormCategory(cat)}
                              activeOpacity={0.75}
                            >
                              <Text style={[styles.formCategoryText, active && styles.formCategoryTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={styles.formLabel}>Title</Text>
                      <TextInput
                        value={formTitle}
                        onChangeText={setFormTitle}
                        placeholder="Activity title"
                        placeholderTextColor={ranaColors.textSecondary}
                        style={styles.formInput}
                      />

                      <Text style={styles.formLabel}>Location</Text>
                      <TextInput
                        value={formLocation}
                        onChangeText={setFormLocation}
                        placeholder="Where is it?"
                        placeholderTextColor={ranaColors.textSecondary}
                        style={styles.formInput}
                      />

                      <Text style={styles.formLabel}>Cost (PHP)</Text>
                      <TextInput
                        value={formCost}
                        onChangeText={setFormCost}
                        placeholder="0"
                        placeholderTextColor={ranaColors.textSecondary}
                        style={styles.formInput}
                        keyboardType="decimal-pad"
                      />

                      <TouchableOpacity
                        style={[styles.formSaveBtn, !formTitle.trim() && styles.formSaveBtnDisabled]}
                        onPress={submitAddForm}
                        activeOpacity={0.85}
                        disabled={!formTitle.trim()}
                      >
                        <Text style={styles.formSaveBtnText}>Save Activity</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              )}
              </View>
              {/* Gallery viewer inside the detail modal so it renders on top */}
              <ImageViewing
                images={galleryImages.map((u) => ({ uri: u }))}
                imageIndex={0}
                visible={galleryVisible}
                onRequestClose={() => setGalleryVisible(false)}
              />
            </>
          )}
        </LinearGradient>
      </Modal>

      {/* Memories Modal — full trip history */}
      <Modal
        visible={memoriesVisible}
        animationType="slide"
        onRequestClose={() => setMemoriesVisible(false)}
      >
        <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.modalRoot}>
          <View style={styles.detailHeaderRow}>
            <TouchableOpacity
              style={styles.detailBackBtn}
              onPress={() => setMemoriesVisible(false)}
              activeOpacity={0.75}
            >
              <Ionicons name="arrow-back" size={20} color={ranaColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle}>Memories</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={styles.memoriesContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.memoriesSubtitle}>All your past trips in one place</Text>
            {sortedTrips.filter(t => t.status === 'completed').length === 0 ? (
              <Text style={styles.noItemsText}>No completed trips yet.</Text>
            ) : (
              sortedTrips.filter(trip => trip.status === 'completed').map((trip) => (
                <Pressable
                  key={trip.id}
                  style={({ pressed }) => [styles.memoryCard, pressed && { opacity: 0.85 }]}
                  onPress={() => {
                    setMemoriesVisible(false);
                    openTripDetail(trip);
                  }}
                >
                  <View style={styles.memoryCardHeader}>
                    <View style={[styles.summaryIconWrap, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="airplane-outline" size={14} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.memoryRoute}>{trip.origin} → {trip.destination}</Text>
                      <Text style={styles.memoryMeta}>{tripRangeText(trip)} · {trip.durationDays ?? getTripDays(trip).length} Days</Text>
                    </View>
                    <View style={styles.memoryCardRight}>
                      <Text style={styles.memoryCost}>{formatPHP(trip.totalCost)}</Text>
                      <Ionicons name="chevron-forward" size={14} color="#C5D0E4" />
                    </View>
                  </View>
                  <View style={styles.memoryChipRow}>
                    <View style={styles.statsChip}>
                      <Ionicons name="speedometer-outline" size={10} color={ranaColors.textSecondary} />
                      <Text style={styles.statsChipText}>{trip.distanceKm.toFixed(0)} km</Text>
                    </View>
                    <View style={styles.statsChip}>
                      <Ionicons name="people-outline" size={10} color={ranaColors.textSecondary} />
                      <Text style={styles.statsChipText}>{trip.passengers} pax</Text>
                    </View>
                    <View style={styles.statsChip}>
                      <Ionicons name="flag-outline" size={10} color={ranaColors.textSecondary} />
                      <Text style={styles.statsChipText}>{trip.country}</Text>
                    </View>
                  </View>
                  {/* Compiled photo strip from all days */}
                  {(() => {
                    const allPhotos = Object.values(dayImages[trip.id] ?? {}).flat();
                    if (allPhotos.length === 0) return (
                      <Text style={styles.memoryNoPhotos}>No photos yet — open the trip to add day photos.</Text>
                    );
                    return (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memoryThumbRow} contentContainerStyle={{ gap: 6 }}>
                        {allPhotos.slice(0, 10).map((uri, idx) => (
                          <TouchableOpacity
                            key={idx}
                            activeOpacity={0.85}
                            onPress={() => {
                              setGalleryImages(allPhotos);
                              setGalleryVisible(true);
                            }}
                          >
                            <Image source={{ uri }} style={styles.thumbImage} />
                          </TouchableOpacity>
                        ))}
                        {allPhotos.length > 10 && (
                          <View style={styles.thumbMore}>
                            <Text style={styles.thumbMoreText}>+{allPhotos.length - 10}</Text>
                          </View>
                        )}
                      </ScrollView>
                    );
                  })()}
                </Pressable>
              ))
            )}
          </ScrollView>
        </LinearGradient>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 56,
    paddingHorizontal: ranaSpacing.md,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  subtitle: {
    marginTop: ranaSpacing.xs,
    marginBottom: ranaSpacing.sm,
    fontSize: 14,
    color: ranaColors.textSecondary,
  },
  // Dashboard
  dashCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#E8EEF9', ...ranaShadow.soft,
  },
  dashTitle: {
    fontSize: 12, fontWeight: '700', color: ranaColors.textSecondary,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 14,
  },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metricItem: { flex: 1, alignItems: 'center', gap: 4 },
  metricSep: { width: 1, height: 38, backgroundColor: '#E8EEF9' },
  metricIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metricVal: { fontSize: 18, fontWeight: '800', color: ranaColors.textPrimary, lineHeight: 22 },
  metricLbl: { fontSize: 10, fontWeight: '600', color: ranaColors.textSecondary },
  spendBand: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E1EEFF', borderRadius: 12, padding: 12, marginBottom: 2,
  },
  spendLbl: { fontSize: 11, color: ranaColors.textSecondary, fontWeight: '600' },
  spendVal: { fontSize: 20, fontWeight: '800', color: ranaColors.textPrimary, marginTop: 2 },
  spendAvgWrap: { alignItems: 'flex-end' },
  spendAvgLbl: { fontSize: 10, color: ranaColors.textSecondary },
  spendAvgVal: { fontSize: 13, fontWeight: '700', color: ranaColors.primary },
  dashDiv: { height: 1, backgroundColor: '#E8EEF9', marginVertical: 12 },
  dashSubhead: { fontSize: 12, fontWeight: '700', color: ranaColors.textSecondary, marginBottom: 8, letterSpacing: 0.3 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  barLbl: { fontSize: 11, color: ranaColors.textPrimary, fontWeight: '600', width: 80 },
  barTrack: { flex: 1, height: 6, backgroundColor: '#F0F4FF', borderRadius: 3, flexDirection: 'row', overflow: 'hidden' },
  barCnt: { fontSize: 11, fontWeight: '700', color: ranaColors.textSecondary, width: 16, textAlign: 'right' },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ranaSpacing.xs,
    marginBottom: ranaSpacing.xs,
  },
  summaryCard: {
    flexGrow: 1,
    minWidth: 120,
    backgroundColor: ranaColors.card,
    borderRadius: ranaRadius.md,
    padding: 12,
    ...ranaShadow.soft,
  },
  summaryCardWide: {
    width: '100%',
  },
  summaryLabel: {
    color: ranaColors.textSecondary,
    fontSize: 12,
  },
  summaryValue: {
    marginTop: 4,
    color: ranaColors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
  },
  totalSpendCard: {
    marginBottom: ranaSpacing.sm,
    borderRadius: ranaRadius.md,
    padding: 12,
    backgroundColor: '#E1EEFF',
    ...ranaShadow.soft,
  },
  totalSpendLabel: {
    fontSize: 12,
    color: ranaColors.textSecondary,
  },
  totalSpendValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  newTripBtn: {
    position: 'absolute',
    top: 52,
    right: ranaSpacing.md,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: ranaRadius.pill,
    backgroundColor: ranaColors.primary,
    ...ranaShadow.card,
  },
  newTripBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ranaColors.textPrimary,
    marginBottom: ranaSpacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ranaSpacing.xs,
  },
  memoriesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ranaColors.primary,
    borderRadius: ranaRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  memoriesBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  memoriesContent: {
    paddingHorizontal: ranaSpacing.md,
    paddingBottom: 48,
    paddingTop: 4,
  },
  memoriesSubtitle: {
    fontSize: 13,
    color: ranaColors.textSecondary,
    marginBottom: 14,
  },
  memoryCard: {
    backgroundColor: ranaColors.card,
    borderRadius: ranaRadius.lg,
    padding: 12,
    marginBottom: ranaSpacing.xs,
    ...ranaShadow.soft,
  },
  memoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memoryRoute: {
    fontSize: 14,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  memoryMeta: {
    fontSize: 11,
    color: ranaColors.textSecondary,
    marginTop: 1,
  },
  memoryCost: {
    fontSize: 13,
    fontWeight: '800',
    color: ranaColors.primary,
  },
  memoryChipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  memoryThumbRow: {
    marginTop: 10,
  },
  memoryNoPhotos: {
    marginTop: 8,
    fontSize: 11,
    color: ranaColors.textSecondary,
    fontStyle: 'italic',
  },
  thumbImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  thumbMore: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#E1EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: ranaColors.primary,
  },
  cardThumbSection: {
    marginTop: 8,
  },
  cardThumbDivider: {
    height: 1,
    backgroundColor: '#DDE9F5',
    marginBottom: 8,
  },
  cardThumbImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  cardThumbMore: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#E1EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardThumbMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: ranaColors.primary,
  },
  tripCard: {
    backgroundColor: ranaColors.card,
    borderRadius: ranaRadius.lg,
    marginBottom: ranaSpacing.xs,
    overflow: 'hidden',
    flexDirection: 'row',
    ...ranaShadow.soft,
  },
  cardInner: {
    flex: 1,
    padding: 12,
    backgroundColor: '#EEF5FF',
  },
  transportIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  statsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5FB',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statsChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: ranaColors.textSecondary,
  },
  budgetSection: {
    marginTop: 10,
  },
  budgetDivider: {
    height: 1,
    backgroundColor: '#DDE9F5',
    marginBottom: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0EA5E9',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  budgetRange: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 5,
  },
  budgetNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 2,
  },
  budgetNoteDot: {
    fontSize: 11,
    color: ranaColors.textSecondary,
    lineHeight: 17,
  },
  budgetNoteText: {
    fontSize: 11,
    color: ranaColors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  summaryIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectMetaLine: {
    marginTop: 3,
    marginBottom: 3,
    color: ranaColors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transportWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transport: {
    color: ranaColors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  badge: {
    borderRadius: ranaRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeCompleted: {
    backgroundColor: '#E6F7EF',
  },
  badgePlanned: {
    backgroundColor: '#FFF4E5',
  },
  badgeConfirmed: {
    backgroundColor: '#EFF6FF',
  },
  badgeDraft: {
    backgroundColor: '#F3F4F6',
  },
  badgeCancelled: {
    backgroundColor: '#FEF2F2',
  },
  tripTitle: {
    color: ranaColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  route: {
    color: ranaColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    color: ranaColors.textSecondary,
    fontSize: 12,
  },
  footerRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: ranaColors.textSecondary,
    fontSize: 11,
  },
  cost: {
    color: ranaColors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ranaRadius.pill,
    backgroundColor: '#E1EEFF',
    borderWidth: 1,
    borderColor: '#C8D5EC',
  },
  trackBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: ranaColors.primary,
  },
  eyeBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: ranaColors.card,
    borderRadius: ranaRadius.lg,
    paddingVertical: 12,
    paddingBottom: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ranaSpacing.md,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  modalClose: {
    padding: 6,
    borderRadius: 8,
  },
  modalRoot: {
    flex: 1,
  },
  detailHeaderRow: {
    paddingTop: 56,
    paddingHorizontal: ranaSpacing.md,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ranaColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...ranaShadow.soft,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  detailContent: {
    paddingHorizontal: ranaSpacing.md,
    paddingBottom: 48,
  },
  detailBody: {
    flex: 1,
    position: 'relative',
  },
  detailRouteTitle: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  detailSubline: {
    marginTop: 6,
    marginBottom: 12,
    color: ranaColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  detailStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  detailStatCard: {
    flex: 1,
    backgroundColor: ranaColors.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    ...ranaShadow.soft,
  },
  detailStatValue: {
    fontSize: 12,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  dayTabRow: {
    gap: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },
  dayChip: {
    width: 56,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: ranaColors.card,
    ...ranaShadow.soft,
  },
  dayChipActive: {
    backgroundColor: ranaColors.primary,
  },
  dayChipTop: {
    fontSize: 12,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  dayChipTopActive: {
    color: '#fff',
  },
  dayChipBottom: {
    fontSize: 11,
    color: ranaColors.textSecondary,
    marginTop: 2,
  },
  dayChipBottomActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  dayHeaderBlock: {
    marginTop: 4,
    marginBottom: 8,
  },
  dayHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  dayHeaderDate: {
    marginTop: 3,
    fontSize: 13,
    color: ranaColors.textSecondary,
  },
  dayPhotoBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ranaRadius.pill,
    borderWidth: 1,
    borderColor: ranaColors.primary,
  },
  dayPhotoBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: ranaColors.primary,
  },
  dayAlbumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ranaRadius.pill,
    backgroundColor: ranaColors.primary,
  },
  dayAlbumBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  dayThumbRow: {
    marginBottom: 10,
  },
  dayThumbWrap: {
    position: 'relative',
  },
  dayThumbRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 10,
  },
  dayThumbImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  dayThumbAdd: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ranaColors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRowBtn: {
    marginTop: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ranaColors.primary,
    borderRadius: ranaRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addRowBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  noItemsText: {
    fontSize: 13,
    color: ranaColors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  timelineCard: {
    backgroundColor: ranaColors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    ...ranaShadow.soft,
  },
  timelineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 15,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  removeBtn: {
    padding: 4,
  },
  timelineType: {
    fontSize: 12,
    fontWeight: '700',
    color: ranaColors.textSecondary,
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ranaColors.textPrimary,
    marginBottom: 2,
  },
  timelineLocation: {
    fontSize: 12,
    color: ranaColors.textSecondary,
    marginBottom: 6,
  },
  timelineCost: {
    fontSize: 13,
    fontWeight: '800',
    color: ranaColors.primary,
  },
  dayTotalRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D8E3F6',
    paddingTop: 10,
  },
  dayTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  dayTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: ranaColors.primary,
  },
  inTripModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9,16,30,0.45)',
    justifyContent: 'center',
    paddingHorizontal: ranaSpacing.md,
  },
  formCardModal: {
    backgroundColor: ranaColors.card,
    borderRadius: ranaRadius.lg,
    padding: 14,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  formCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF3FD',
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ranaColors.textSecondary,
    marginTop: 10,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D5E0F3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: ranaColors.textPrimary,
    backgroundColor: '#FAFCFF',
  },
  formCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  formCategoryChip: {
    backgroundColor: '#EEF3FD',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  formCategoryChipActive: {
    backgroundColor: ranaColors.primary,
  },
  formCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: ranaColors.textSecondary,
  },
  formCategoryTextActive: {
    color: '#fff',
  },
  formSaveBtn: {
    marginTop: 14,
    backgroundColor: ranaColors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  formSaveBtnDisabled: {
    opacity: 0.55,
  },
  formSaveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  formScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: ranaSpacing.md,
    paddingVertical: 24,
  },
});
