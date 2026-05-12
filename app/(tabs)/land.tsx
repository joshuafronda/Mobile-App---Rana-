import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTravel, type Trip } from '@/src/context/TravelContext';
import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';

// ── Constants ─────────────────────────────────────────────────────────────────

const LAND_CATEGORIES = ['Jeep', 'Bus', 'Train/LRT/MRT', 'Motor', 'Car/Taxi'] as const;

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
  const { trips } = useTravel();

  const landTrips = useMemo(
    () => [...trips]
      .filter((t) => (LAND_CATEGORIES as readonly string[]).includes(t.transportType))
      .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()),
    [trips]
  );

  const [detailVisible, setDetailVisible] = useState(false);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [itineraryByTrip, setItineraryByTrip] = useState<Record<string, ItineraryItem[]>>({});
  const [addFormVisible, setAddFormVisible] = useState(false);
  const [dayImages, setDayImages] = useState<Record<string, Record<number, string[]>>>({});
  const [formTime, setFormTime] = useState('10:00');
  const [formCategory, setFormCategory] = useState<ItineraryCategory>('Transport');
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCost, setFormCost] = useState('0');

  const tripDays = useMemo(() => (activeTrip ? getTripDays(activeTrip) : []), [activeTrip]);
  const activeItems = useMemo(() => {
    if (!activeTrip) return [];
    return (itineraryByTrip[activeTrip.id] ?? []).filter((item) => item.dayIndex === activeDayIndex);
  }, [activeDayIndex, activeTrip, itineraryByTrip]);
  const activeDayTotal = activeItems.reduce((sum, item) => sum + item.cost, 0);
  const totalKm = landTrips.reduce((s, t) => s + t.distanceKm, 0);
  const totalSpent = landTrips.reduce((s, t) => s + t.totalCost, 0);
  const avgCost = landTrips.length > 0 ? Math.round(totalSpent / landTrips.length) : 0;
  const totalTravelers = landTrips.reduce((s, t) => s + t.passengers, 0);
  const completedCount = landTrips.filter(t => t.status === 'completed').length;
  const confirmedCount = landTrips.filter(t => t.status === 'confirmed').length;
  const plannedCount = landTrips.filter(t => t.status !== 'completed' && t.status !== 'confirmed' && t.status !== 'cancelled').length;
  const cancelledCount = landTrips.filter(t => t.status === 'cancelled').length;
  const typeBreakdown = (LAND_CATEGORIES as readonly string[])
    .map(cat => ({ type: cat, count: landTrips.filter(t => t.transportType === cat).length }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxTypeCount = Math.max(...typeBreakdown.map(x => x.count), 1);

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
    setFormTime('10:00'); setFormCategory('Transport'); setFormTitle('');
    setFormLocation(''); setFormCost('0'); setAddFormVisible(true);
  };

  const submitAddForm = () => {
    if (!activeTrip || !formTitle.trim()) return;
    const costValue = parseFloat(formCost);
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
        [tripId]: { ...(prev[tripId] ?? {}), [dayIndex]: [...((prev[tripId] ?? {})[dayIndex] ?? []), ...uris] },
      }));
    }
  };

  const removeDayImage = (tripId: string, dayIndex: number, imgIndex: number) => {
    setDayImages((prev) => {
      const updated = (prev[tripId]?.[dayIndex] ?? []).filter((_, i) => i !== imgIndex);
      return { ...prev, [tripId]: { ...(prev[tripId] ?? {}), [dayIndex]: updated } };
    });
  };

  return (
    <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.container}>
      <TouchableOpacity
        style={styles.newTripBtn}
        onPress={() => router.push('/new-trip-land')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={16} color="#fff" />
        <Text style={styles.newTripBtnText}>New Land Trip</Text>
      </TouchableOpacity>

      <FlatList
        data={landTrips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Page Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerTitle}>Land Transport</Text>
                <Text style={styles.headerSub}>Road and rail journeys</Text>
              </View>
            </View>

            {/* Dashboard Card */}
            <View style={styles.dashCard}>
              <Text style={styles.dashTitle}>Overview</Text>

              {/* 4-metric row */}
              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <View style={[styles.metricIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="speedometer-outline" size={13} color="#D97706" />
                  </View>
                  <Text style={styles.metricVal}>{totalKm.toFixed(0)}</Text>
                  <Text style={styles.metricLbl}>km</Text>
                </View>
                <View style={styles.metricSep} />
                <View style={styles.metricItem}>
                  <View style={[styles.metricIcon, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="bus-outline" size={13} color="#16A34A" />
                  </View>
                  <Text style={styles.metricVal}>{landTrips.length}</Text>
                  <Text style={styles.metricLbl}>trips</Text>
                </View>
                <View style={styles.metricSep} />
                <View style={styles.metricItem}>
                  <View style={[styles.metricIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="checkmark-done-outline" size={13} color="#2563EB" />
                  </View>
                  <Text style={styles.metricVal}>{completedCount}</Text>
                  <Text style={styles.metricLbl}>done</Text>
                </View>
                <View style={styles.metricSep} />
                <View style={styles.metricItem}>
                  <View style={[styles.metricIcon, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="people-outline" size={13} color="#7C3AED" />
                  </View>
                  <Text style={styles.metricVal}>{totalTravelers}</Text>
                  <Text style={styles.metricLbl}>travelers</Text>
                </View>
              </View>

              {/* Spend band */}
              <View style={styles.spendBand}>
                <View>
                  <Text style={styles.spendLbl}>Total Expenditure</Text>
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
              {landTrips.length > 0 && (
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
                        <View style={{ flex: s.count / landTrips.length, backgroundColor: s.color, height: 6, borderRadius: 3 }} />
                        <View style={{ flex: Math.max(0, 1 - s.count / landTrips.length) }} />
                      </View>
                      <Text style={styles.barCnt}>{s.count}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Vehicle type breakdown */}
              {typeBreakdown.length > 0 && (
                <>
                  <View style={styles.dashDiv} />
                  <Text style={styles.dashSubhead}>By Vehicle Type</Text>
                  {typeBreakdown.map((item, i) => (
                    <View key={i} style={styles.barRow}>
                      <Text style={styles.barLbl}>{item.type}</Text>
                      <View style={styles.barTrack}>
                        <View style={{ flex: item.count / maxTypeCount, backgroundColor: '#F59E0B', height: 6, borderRadius: 3 }} />
                        <View style={{ flex: Math.max(0, 1 - item.count / maxTypeCount) }} />
                      </View>
                      <Text style={styles.barCnt}>{item.count}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>

            {/* Transport types reference */}
            <Text style={styles.sectionTitle}>Transport Types</Text>
            {LAND_TRANSPORTS.map((transport) => (
              <View key={transport.id} style={styles.transportCard}>
                <View style={[styles.transportIconWrap, { backgroundColor: `${transport.color}15` }]}>
                  <Ionicons name={transport.icon} size={26} color={transport.color} />
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

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>My Trips</Text>

            {landTrips.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="bus-outline" size={28} color={ranaColors.muted} />
                </View>
                <Text style={styles.emptyTitle}>No land trips yet</Text>
                <Text style={styles.emptyText}>Tap "New Land Trip" above to log your first road journey.</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const durationDays = item.durationDays ?? getTripDays(item).length;
          const statusColor = item.status === 'completed' ? '#16A34A'
            : item.status === 'confirmed' ? '#2563EB'
            : item.status === 'cancelled' ? '#DC2626' : '#D97706';
          const statusLabel = item.status === 'completed' ? 'Completed'
            : item.status === 'confirmed' ? 'Confirmed'
            : item.status === 'cancelled' ? 'Cancelled'
            : item.status === 'draft' ? 'Draft' : 'Planned';
          const allPhotos = Object.values(dayImages[item.id] ?? {}).flat();

          return (
            <Pressable
              style={({ pressed }) => [styles.tripCard, pressed && { opacity: 0.9 }]}
              onPress={() => openTripDetail(item)}
            >
              <View style={styles.cardInner}>
                <View style={styles.tripHeader}>
                  <View style={styles.transportWrap}>
                    <View style={[styles.transportIconCircle, { backgroundColor: '#F59E0B' }]}>
                      <Ionicons name="bus" size={11} color="#fff" />
                    </View>
                    <Text style={styles.transport}>{item.transportType}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: `${statusColor}18` }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>
                {item.title ? <Text style={styles.tripTitle}>{item.title}</Text> : null}
                <Text style={styles.route}>{item.origin}{'  →  '}{item.destination}</Text>
                <Text style={styles.metaLine}>{tripRangeText(item)} · {durationDays} Day{durationDays > 1 ? 's' : ''}</Text>
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
                {allPhotos.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                    {allPhotos.slice(0, 6).map((uri, idx) => (
                      <Image key={idx} source={{ uri }} style={styles.cardThumbImage} />
                    ))}
                  </ScrollView>
                )}
                <View style={styles.footerRow}>
                  <Text style={styles.date}>{new Date(item.dateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
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
                      <Ionicons name="map-outline" size={13} color="#D97706" />
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

      {/* Trip Detail Modal */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        onRequestClose={() => { setAddFormVisible(false); setDetailVisible(false); }}
      >
        <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.modalRoot}>
          {activeTrip && (
            <>
              <View style={styles.detailHeaderRow}>
                <TouchableOpacity style={styles.detailBackBtn}
                  onPress={() => { setAddFormVisible(false); setDetailVisible(false); }} activeOpacity={0.75}>
                  <Ionicons name="arrow-back" size={20} color={ranaColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.detailHeaderTitle}>Land Trip</Text>
                <View style={{ width: 36 }} />
              </View>

              <View style={styles.detailBody}>
                <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.detailRouteTitle}>{activeTrip.title?.trim() || activeTrip.destination}</Text>
                  <Text style={styles.detailSubline}>{tripRangeText(activeTrip)} · {tripDays.length} Day{tripDays.length > 1 ? 's' : ''} · {activeTrip.transportType}</Text>

                  <View style={styles.detailStatsRow}>
                    <View style={styles.detailStatCard}><Text style={styles.detailStatValue}>{tripDays.length} Days</Text></View>
                    <View style={styles.detailStatCard}><Text style={styles.detailStatValue}>{activeTrip.passengers} Travelers</Text></View>
                    <View style={styles.detailStatCard}><Text style={styles.detailStatValue}>{formatPHP(activeTrip.totalCost)}</Text></View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabRow}>
                    {tripDays.map((day, index) => {
                      const isActive = index === activeDayIndex;
                      return (
                        <TouchableOpacity key={`${activeTrip.id}-day-${index}`}
                          style={[styles.dayChip, isActive && styles.dayChipActive]}
                          onPress={() => setActiveDayIndex(index)} activeOpacity={0.75}>
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
                          <Text style={styles.dayHeaderTitle}>{`Day ${activeDayIndex + 1} - ${activeDayIndex === 0 ? 'Departure' : 'Journey'}`}</Text>
                          <Text style={styles.dayHeaderDate}>{dayLong(tripDays[activeDayIndex])}</Text>
                        </View>
                        <TouchableOpacity style={styles.dayPhotoBtn}
                          onPress={() => pickDayImage(activeTrip.id, activeDayIndex)} activeOpacity={0.8}>
                          <Ionicons name="camera-outline" size={15} color={ranaColors.primary} />
                          <Text style={styles.dayPhotoBtnText}>Add photo</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {(dayImages[activeTrip.id]?.[activeDayIndex]?.length ?? 0) > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                      style={styles.dayThumbRow} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                      {dayImages[activeTrip.id][activeDayIndex].map((uri, idx) => (
                        <View key={idx} style={styles.dayThumbWrap}>
                          <Image source={{ uri }} style={styles.dayThumbImage} />
                          <TouchableOpacity style={styles.dayThumbRemove}
                            onPress={() => removeDayImage(activeTrip.id, activeDayIndex, idx)} hitSlop={6}>
                            <Ionicons name="close" size={13} color="#1F2937" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity style={styles.dayThumbAdd}
                        onPress={() => pickDayImage(activeTrip.id, activeDayIndex)} activeOpacity={0.8}>
                        <Ionicons name="add" size={20} color={ranaColors.primary} />
                      </TouchableOpacity>
                    </ScrollView>
                  )}

                  <TouchableOpacity style={styles.addRowBtn} onPress={openAddForm} activeOpacity={0.85}>
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
                          <TouchableOpacity style={styles.removeBtn}
                            onPress={() => removeItineraryItem(activeTrip.id, entry.id)} hitSlop={10}>
                            <Ionicons name="close" size={16} color="#8B95AA" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.timelineType}>{entry.category}</Text>
                        <Text style={styles.timelineTitle}>{entry.title}</Text>
                        <Text style={styles.timelineLocation}>{entry.location}</Text>
                        <Text style={styles.timelineCost}>{entry.cost > 0 ? formatPHP(entry.cost) : 'Free'}</Text>
                      </View>
                    ))
                  )}

                  <View style={styles.dayTotalRow}>
                    <Text style={styles.dayTotalLabel}>{`Day ${activeDayIndex + 1} total`}</Text>
                    <Text style={styles.dayTotalValue}>{formatPHP(activeDayTotal)}</Text>
                  </View>
                </ScrollView>

                {addFormVisible && (
                  <View style={styles.inTripModalOverlay}>
                    <ScrollView contentContainerStyle={styles.formScrollContent}
                      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                      <View style={styles.formCardModal}>
                        <View style={styles.formHeaderRow}>
                          <Text style={styles.formTitle}>Add Activity</Text>
                          <TouchableOpacity onPress={() => setAddFormVisible(false)} style={styles.formCloseBtn}>
                            <Ionicons name="close" size={18} color={ranaColors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.formLabel}>Time</Text>
                        <TextInput value={formTime} onChangeText={setFormTime} placeholder="HH:MM"
                          placeholderTextColor={ranaColors.textSecondary} style={styles.formInput} />
                        <Text style={styles.formLabel}>Category</Text>
                        <View style={styles.formCategoryRow}>
                          {(['Transport', 'Hotel', 'Food', 'Sightseeing'] as ItineraryCategory[]).map((cat) => (
                            <TouchableOpacity key={cat}
                              style={[styles.formCategoryChip, formCategory === cat && styles.formCategoryChipActive]}
                              onPress={() => setFormCategory(cat)} activeOpacity={0.75}>
                              <Text style={[styles.formCategoryText, formCategory === cat && styles.formCategoryTextActive]}>
                                {cat}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <Text style={styles.formLabel}>Title</Text>
                        <TextInput value={formTitle} onChangeText={setFormTitle} placeholder="Activity title"
                          placeholderTextColor={ranaColors.textSecondary} style={styles.formInput} />
                        <Text style={styles.formLabel}>Location</Text>
                        <TextInput value={formLocation} onChangeText={setFormLocation} placeholder="Where is it?"
                          placeholderTextColor={ranaColors.textSecondary} style={styles.formInput} />
                        <Text style={styles.formLabel}>Cost (PHP)</Text>
                        <TextInput value={formCost} onChangeText={setFormCost} placeholder="0"
                          placeholderTextColor={ranaColors.textSecondary} style={styles.formInput}
                          keyboardType="decimal-pad" />
                        <TouchableOpacity
                          style={[styles.formSaveBtn, !formTitle.trim() && styles.formSaveBtnDisabled]}
                          onPress={submitAddForm} activeOpacity={0.85} disabled={!formTitle.trim()}>
                          <Text style={styles.formSaveBtnText}>Save Activity</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            </>
          )}
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

// ── Helpers defined after component ──────────────────────────────────────────

type ItineraryCategory = 'Transport' | 'Hotel' | 'Food' | 'Sightseeing';
type ItineraryItem = { id: string; dayIndex: number; time: string; category: ItineraryCategory; title: string; location: string; cost: number; };
const CATEGORY_EMOJI: Record<ItineraryCategory, string> = { Transport: '🚗', Hotel: '🏨', Food: '🍜', Sightseeing: '📍' };

function formatPHP(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value);
}
function dayShort(date: Date) { return date.toLocaleDateString('en-US', { weekday: 'short' }); }
function dayLong(date: Date) { return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
function getTripDays(trip: Trip): Date[] {
  const start = trip.startDate ? new Date(trip.startDate) : new Date(trip.dateISO);
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  let dayCount = trip.durationDays ?? 1;
  if (trip.startDate && trip.endDate) {
    const e = new Date(trip.endDate);
    const em = new Date(e.getFullYear(), e.getMonth(), e.getDate());
    dayCount = Math.max(1, Math.round((em.getTime() - s.getTime()) / 86400000) + 1);
  }
  return Array.from({ length: dayCount }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
}
function createSeedItinerary(trip: Trip): ItineraryItem[] {
  return [
    { id: `${trip.id}-i1`, dayIndex: 0, time: '08:00', category: 'Transport', title: `${trip.transportType} to ${trip.destination}`, location: `From ${trip.origin}`, cost: Math.round(trip.totalCost * 0.3) },
    { id: `${trip.id}-i2`, dayIndex: 0, time: '12:00', category: 'Food', title: `Lunch in ${trip.destination}`, location: trip.destination, cost: Math.round(trip.totalCost * 0.1) },
  ];
}
function tripRangeText(trip: Trip): string {
  const days = getTripDays(trip);
  if (!days.length) return '';
  const s = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = days[days.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${s} – ${e}`;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingTop: 56, paddingHorizontal: ranaSpacing.md, paddingBottom: 120 },
  newTripBtn: {
    position: 'absolute', top: 52, right: ranaSpacing.md, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: ranaRadius.pill,
    backgroundColor: '#F59E0B', ...ranaShadow.card,
  },
  newTripBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8EEF9',
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: ranaColors.textPrimary },
  headerSub: { fontSize: 13, color: ranaColors.textSecondary, marginTop: 2 },
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
    backgroundColor: '#F0F4FF', borderRadius: 12, padding: 12, marginBottom: 2,
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
  emptyIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
  contextCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#EFF6FF', padding: 14, borderRadius: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  contextText: { flex: 1, fontSize: 13, color: ranaColors.textSecondary, lineHeight: 19 },
  transportCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 16, gap: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#E8EEF9',
  },
  transportIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  transportInfo: { flex: 1, gap: 4 },
  transportName: { fontSize: 15, fontWeight: '800', color: ranaColors.textPrimary },
  transportDesc: { fontSize: 12, color: ranaColors.textSecondary, lineHeight: 17 },
  examplesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  exampleChip: { backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  exampleText: { fontSize: 10, fontWeight: '600', color: '#B45309' },
  divider: { height: 1, backgroundColor: '#E8EEF9', marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: ranaColors.textPrimary, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#E8EEF9', ...ranaShadow.soft,
  },
  statValue: { fontSize: 14, fontWeight: '800', color: ranaColors.textPrimary },
  statLabel: { fontSize: 10, color: ranaColors.textSecondary, textAlign: 'center' },
  emptyState: {
    alignItems: 'center', padding: 32, gap: 8,
    backgroundColor: '#FAFCFF', borderRadius: 20, borderWidth: 1, borderColor: '#E8EEF9', marginTop: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: ranaColors.textPrimary },
  emptyText: { fontSize: 13, color: ranaColors.textSecondary, textAlign: 'center' },
  tripCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#E8EEF9', ...ranaShadow.soft,
  },
  cardInner: { padding: 16 },
  tripHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  transportWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  transportIconCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  transport: { fontSize: 12, fontWeight: '600', color: ranaColors.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  tripTitle: { fontSize: 15, fontWeight: '800', color: ranaColors.textPrimary, marginBottom: 2 },
  route: { fontSize: 14, fontWeight: '700', color: ranaColors.textPrimary, marginBottom: 4 },
  metaLine: { fontSize: 12, color: ranaColors.textSecondary, marginBottom: 8 },
  statsChipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  statsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F3F7FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  statsChipText: { fontSize: 10, color: ranaColors.textSecondary, fontWeight: '600' },
  cardThumbImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#F0F0F0' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  date: { fontSize: 11, color: ranaColors.textSecondary },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: ranaRadius.pill,
    backgroundColor: '#FEF3C7',
    borderWidth: 1, borderColor: '#FDE68A',
  },
  trackBtnText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  cost: { fontSize: 14, fontWeight: '800', color: ranaColors.primary },
  modalRoot: { flex: 1 },
  detailHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: ranaSpacing.md, paddingBottom: 12,
  },
  detailBackBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8EEF9',
  },
  detailHeaderTitle: { fontSize: 16, fontWeight: '800', color: ranaColors.textPrimary },
  detailBody: { flex: 1 },
  detailContent: { paddingHorizontal: ranaSpacing.md, paddingBottom: 80 },
  detailRouteTitle: { fontSize: 22, fontWeight: '800', color: ranaColors.textPrimary, marginBottom: 4 },
  detailSubline: { fontSize: 13, color: ranaColors.textSecondary, marginBottom: 14 },
  detailStatsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  detailStatCard: { flex: 1, backgroundColor: '#F3F7FF', borderRadius: 12, padding: 10 },
  detailStatValue: { fontSize: 13, fontWeight: '700', color: ranaColors.textPrimary },
  dayTabRow: { gap: 8, paddingBottom: 4, paddingTop: 4, marginBottom: 14 },
  dayChip: { minWidth: 44, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, alignItems: 'center', backgroundColor: '#F3F7FF' },
  dayChipActive: { backgroundColor: ranaColors.primary },
  dayChipTop: { fontSize: 11, fontWeight: '800', color: ranaColors.textSecondary },
  dayChipTopActive: { color: '#fff' },
  dayChipBottom: { fontSize: 10, color: ranaColors.muted },
  dayChipBottomActive: { color: '#ffffffAA' },
  dayHeaderBlock: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#E8EEF9',
  },
  dayHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayHeaderTitle: { fontSize: 15, fontWeight: '800', color: ranaColors.textPrimary },
  dayHeaderDate: { fontSize: 12, color: ranaColors.textSecondary, marginTop: 2 },
  dayPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  dayPhotoBtnText: { fontSize: 12, fontWeight: '600', color: ranaColors.primary },
  dayThumbRow: { marginBottom: 12 },
  dayThumbWrap: { position: 'relative' },
  dayThumbImage: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#F0F0F0' },
  dayThumbRemove: {
    position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E8EEF9',
  },
  dayThumbAdd: {
    width: 72, height: 72, borderRadius: 12, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: `${ranaColors.primary}40`, borderStyle: 'dashed',
  },
  addRowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F59E0B',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  addRowBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  noItemsText: { fontSize: 13, color: ranaColors.textSecondary, fontStyle: 'italic', marginBottom: 16 },
  timelineCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#E8EEF9', ...ranaShadow.soft,
  },
  timelineTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  timelineTime: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  removeBtn: { padding: 2 },
  timelineType: { fontSize: 11, color: ranaColors.textSecondary, marginBottom: 2 },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: ranaColors.textPrimary },
  timelineLocation: { fontSize: 12, color: ranaColors.textSecondary, marginTop: 2 },
  timelineCost: { fontSize: 12, fontWeight: '700', color: ranaColors.primary, marginTop: 4 },
  dayTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: '#E8EEF9',
  },
  dayTotalLabel: { fontSize: 13, color: ranaColors.textSecondary, fontWeight: '600' },
  dayTotalValue: { fontSize: 16, fontWeight: '800', color: ranaColors.primary },
  inTripModalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 20, justifyContent: 'center',
  },
  formScrollContent: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  formCardModal: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, ...ranaShadow.card },
  formHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  formTitle: { fontSize: 17, fontWeight: '800', color: ranaColors.textPrimary },
  formCloseBtn: { padding: 4 },
  formLabel: { fontSize: 12, fontWeight: '700', color: ranaColors.textSecondary, marginBottom: 6, marginTop: 10 },
  formInput: {
    backgroundColor: '#F3F7FF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: ranaColors.textPrimary, borderWidth: 1, borderColor: '#E8EEF9',
  },
  formCategoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formCategoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F3F7FF', borderWidth: 1, borderColor: '#E8EEF9' },
  formCategoryChipActive: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  formCategoryText: { fontSize: 12, fontWeight: '600', color: ranaColors.textSecondary },
  formCategoryTextActive: { color: '#B45309' },
  formSaveBtn: { backgroundColor: '#F59E0B', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 16 },
  formSaveBtnDisabled: { opacity: 0.4 },
  formSaveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
