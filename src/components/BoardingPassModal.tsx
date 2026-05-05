import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    Pressable,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
    cancelAnimation,
    Easing,
    interpolate,
    runOnJS,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGrad } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

import HeadLogo from '@/assets/images/head.svg';
import type { Trip } from '@/src/context/TravelContext';
import { ranaColors, ranaRadius, ranaShadow } from '@/src/theme/ranaTheme';

const SCREEN_W = Dimensions.get('window').width;
const PASS_W = SCREEN_W - 48;
const PASS_H = 520;

// ── Helpers ──────────────────────────────────────────────────────────────────
function iata(city: string) {
  return city.slice(0, 3).toUpperCase();
}

function ticketCode(trip: Trip) {
  return `TK-${trip.id.replace(/[^0-9a-z]/gi, '').slice(-6).toUpperCase() || '000001'}`;
}

function formatCountdown(targetISO: string): string {
  const diff = new Date(targetISO).getTime() - Date.now();
  if (diff <= 0) return 'BOARDING NOW';
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

// Animated plane that travels along the SVG path
function FlightPathAnimation({ origin, destination }: { origin: string; destination: string }) {
  const AnimatedPath = Animated.createAnimatedComponent(Path);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) });
    return () => cancelAnimation(progress);
  }, []);

  // Simple curved path
  const startX = 30;
  const endX = PASS_W - 30;
  const midX = (startX + endX) / 2;
  const curveY = -28;
  const pathD = `M ${startX} 0 Q ${midX} ${curveY} ${endX} 0`;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(progress.value, [0, 1], [600, 0]);
    return { strokeDashoffset };
  });

  const planeLeftStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, 1], [startX - 8, endX - 8]),
    opacity: progress.value > 0.05 ? 1 : 0,
  }));

  return (
    <View style={flightStyles.container}>
      <Svg width={PASS_W - 60} height={50} viewBox={`0 0 ${PASS_W - 60} 50`}>
        <Defs>
          <SvgLinearGrad id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4A90E2" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#4A90E2" />
          </SvgLinearGrad>
        </Defs>
        {/* Background faint line */}
        <Path d={pathD} stroke="rgba(74,144,226,0.15)" strokeWidth={2} fill="none" />
        {/* Animated progress line */}
        <AnimatedPath
          d={pathD}
          stroke="url(#routeGrad)"
          strokeWidth={2.5}
          fill="none"
          strokeDasharray={600}
          animatedProps={animatedProps}
        />
      </Svg>
      {/* Plane icon */}
      <Animated.View style={[flightStyles.plane, planeLeftStyle]}>
        <Ionicons name="airplane" size={14} color="#4A90E2" />
      </Animated.View>
      {/* City labels */}
      <View style={flightStyles.labels}>
        <Text style={flightStyles.cityLabel}>{origin}</Text>
        <Text style={flightStyles.cityLabel}>{destination}</Text>
      </View>
    </View>
  );
}

const flightStyles = StyleSheet.create({
  container: { position: 'relative', height: 70, marginTop: 8, marginBottom: 4 },
  plane: { position: 'absolute', top: -4, zIndex: 5 },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginTop: 4,
  },
  cityLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
});

// Generate shareable trip data for QR code
function generateTripQRData(trip: Trip): string {
  const tripData = {
    id: trip.id,
    origin: trip.origin,
    destination: trip.destination,
    country: trip.country,
    transportType: trip.transportType,
    passengers: trip.passengers,
    totalCost: trip.totalCost,
    budgetRange: trip.budgetRange,
    distanceKm: trip.distanceKm,
    startDate: trip.startDate,
    endDate: trip.endDate,
    status: trip.status,
    app: 'RANA-Travel',
    version: '1.0',
  };
  return JSON.stringify(tripData);
}

function formatPHP(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Main Boarding Pass Modal ────────────────────────────────────────────────
type BoardingPassModalProps = {
  visible: boolean;
  trip: Trip | null;
  onClose: () => void;
};

export default function BoardingPassModal({ visible, trip, onClose }: BoardingPassModalProps) {
  const flipProgress = useSharedValue(0); // 0 = front, 1 = back
  const [showBack, setShowBack] = React.useState(false);
  const [countdown, setCountdown] = React.useState('');
  const pulseScale = useSharedValue(1);

  // Countdown timer
  useEffect(() => {
    if (!visible || !trip) return;
    const update = () => {
      const target = trip.startDate ?? trip.dateISO;
      setCountdown(formatCountdown(target));
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [visible, trip]);

  // Pulse animation for gate countdown
  useEffect(() => {
    if (!visible) return;
    pulseScale.value = withRepeat(
      withTiming(1.06, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulseScale);
  }, [visible]);

  // Reset flip when modal opens
  useEffect(() => {
    if (visible) {
      flipProgress.value = 0;
      setShowBack(false);
    }
  }, [visible]);

  const handleFlip = () => {
    if (showBack) {
      flipProgress.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (finished) runOnJS(setShowBack)(false);
      });
    } else {
      flipProgress.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (finished) runOnJS(setShowBack)(true);
      });
    }
  };

  // Ref for capturing the boarding pass as image
  const passRef = useRef<View>(null);
  // Ref for capturing just the QR code
  const qrRef = useRef<View>(null);

  // Save boarding pass as image to gallery
  const saveAsImage = async () => {
    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save photos to your gallery.');
        return;
      }

      // Capture just the QR code (no buttons)
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
        fileName: `qr-code-${trip?.id || 'trip'}`,
      });

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('RANA Travel', asset, false);

      Alert.alert('Saved!', 'QR code saved to your gallery.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save QR code. Please try again.');
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 0.5, 1], [0, 90, 180]);
    const opacity = interpolate(flipProgress.value, [0, 0.45, 0.55, 1], [1, 0, 0, 0]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 0.5, 1], [180, 270, 360]);
    const opacity = interpolate(flipProgress.value, [0, 0.45, 0.55, 1], [0, 0, 1, 1]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!trip) return null;

  const code = ticketCode(trip);
  const originIata = iata(trip.origin);
  const destIata = iata(trip.destination);
  const dateStr = new Date(trip.startDate ?? trip.dateISO).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = trip.startDate?.includes('T')
    ? new Date(trip.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '10:00';
  const isBoarding = countdown === 'BOARDING NOW';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        {/* Wrap boarding pass in ref View for image capture */}
        <View ref={passRef} collapsable={false}>
          <View style={styles.passContainer}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.75}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>

            {/* ─── FRONT ─── */}
            <Animated.View style={[styles.passCard, frontAnimatedStyle]} pointerEvents={showBack ? 'none' : 'auto'}>
            {/* Header gradient */}
            <LinearGradient
              colors={['#0B1D45', '#1B3A7F', '#2E5BBF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.passHeader}
            >
              {/* Decorative circles */}
              <View style={[styles.decorCircle, { top: -30, left: -30, width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.06)' }]} />
              <View style={[styles.decorCircle, { bottom: -20, right: -20, width: 60, height: 60, backgroundColor: 'rgba(0,0,0,0.12)' }]} />

              {/* Airline row */}
              <View style={styles.airlineRow}>
                <Text style={styles.airlineName}>RANA TRAVEL</Text>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>{trip.status?.toUpperCase() ?? 'ECONOMY'}</Text>
                </View>
              </View>

              {/* Flight path animation */}
              <FlightPathAnimation origin={trip.origin} destination={trip.destination} />

              {/* Route IATA codes */}
              <View style={styles.routeRow}>
                <View style={styles.routeAirport}>
                  <Text style={styles.iataCode}>{originIata}</Text>
                  <Text style={styles.cityName}>{trip.origin}</Text>
                </View>
                <View style={styles.routeAirportRight}>
                  <Text style={styles.iataCode}>{destIata}</Text>
                  <Text style={styles.cityName}>{trip.destination}</Text>
                </View>
              </View>

              {/* Time row */}
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{timeLabel}</Text>
                <Text style={styles.flightCode}>{code}</Text>
                <Text style={styles.timeText}>{trip.endDate ? new Date(trip.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</Text>
              </View>
            </LinearGradient>

            {/* Tear perforation */}
            <View style={styles.tearRow}>
              <View style={[styles.halfCircle, styles.halfCircleLeft, { backgroundColor: '#0B1D45' }]} />
              <View style={styles.dashedLineContainer}>
                {Array.from({ length: 22 }).map((_, i) => (
                  <View key={i} style={styles.dash} />
                ))}
              </View>
              <View style={[styles.halfCircle, styles.halfCircleRight, { backgroundColor: '#0B1D45' }]} />
            </View>

            {/* Details section */}
            <View style={styles.passDetails}>
              {/* Gate countdown - glassmorphic */}
              <Animated.View style={[styles.gateCard, pulseStyle]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.08)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.gateGradient}
                >
                  <Text style={styles.gateLabel}>GATE COUNTDOWN</Text>
                  <Text style={[styles.gateValue, isBoarding && styles.gateValueBoarding]}>{countdown}</Text>
                </LinearGradient>
              </Animated.View>

              {/* Detail grid */}
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{dateStr}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Country</Text>
                  <Text style={styles.detailValue}>{trip.country}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Transport</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{trip.transportType}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Passengers</Text>
                  <Text style={styles.detailValue}>{trip.passengers}</Text>
                </View>
              </View>

              {/* Flip hint */}
              <TouchableOpacity style={styles.flipHint} onPress={handleFlip} activeOpacity={0.75}>
                <Ionicons name="sync-outline" size={14} color={ranaColors.primary} />
                <Text style={styles.flipHintText}>Tap to reveal QR code</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ─── BACK (QR CODE) ─── */}
          <Animated.View style={[styles.passCard, styles.passCardBack, backAnimatedStyle]} pointerEvents={showBack ? 'auto' : 'none'}>
            <LinearGradient
              colors={['#0B1D45', '#1B3A7F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.passHeaderBack}
            >
              <Text style={styles.airlineNameBack}>RANA TRAVEL</Text>
              <Text style={styles.backTitle}>BOARDING PASS</Text>
              <Text style={styles.backRoute}>{trip.origin} → {trip.destination}</Text>
              <Text style={styles.backCode}>{code}</Text>
            </LinearGradient>

            {/* Tear */}
            <View style={styles.tearRow}>
              <View style={[styles.halfCircle, styles.halfCircleLeft, { backgroundColor: '#0B1D45' }]} />
              <View style={styles.dashedLineContainer}>
                {Array.from({ length: 22 }).map((_, i) => (
                  <View key={i} style={styles.dash} />
                ))}
              </View>
              <View style={[styles.halfCircle, styles.halfCircleRight, { backgroundColor: '#0B1D45' }]} />
            </View>

            <View style={styles.passDetailsBack}>
              {/* QR Code with actual trip data - wrapped for capture */}
              <View ref={qrRef} collapsable={false} style={styles.qrCaptureWrapper}>
                <View style={styles.qrBrandingCard}>
                  <Text style={styles.qrBrandName}>RANA TRAVEL</Text>
                  <View style={styles.qrWithLogo}>
                    <QRCode
                      value={generateTripQRData(trip)}
                      size={140}
                      color="#1B2B59"
                      backgroundColor="#FFFFFF"
                    />
                    {/* Logo overlay - Head SVG */}
                    <View style={styles.qrLogoOverlay}>
                      <HeadLogo width={28} height={28} />
                    </View>
                  </View>
                  <Text style={styles.qrBrandSub}>Scan to view trip</Text>
                </View>
              </View>

              {/* Budget Info */}
              <View style={styles.budgetRow}>
                <View style={styles.budgetItem}>
                  <Text style={styles.budgetLabel}>Total Cost</Text>
                  <Text style={styles.budgetValue}>{formatPHP(trip.totalCost)}</Text>
                </View>
                {trip.budgetRange && (
                  <View style={styles.budgetItem}>
                    <Text style={styles.budgetLabel}>Budget Range</Text>
                    <Text style={styles.budgetValue}>{trip.budgetRange}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.qrLabel}>Scan to view trip details</Text>
              <Text style={styles.qrSublabel}>{dateStr} · {timeLabel} · {trip.passengers} pax</Text>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={saveAsImage}
                  activeOpacity={0.75}
                >
                  <Ionicons name="download-outline" size={16} color={ranaColors.primary} />
                  <Text style={styles.saveBtnText}>Save as Image</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() => {
                    Share.share({
                      message: `Check out my trip from ${trip.origin} to ${trip.destination}!\nBudget: ${formatPHP(trip.totalCost)}\nScan my boarding pass QR code to see more details.`,
                      title: `Trip to ${trip.destination}`,
                    });
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons name="share-outline" size={16} color="#fff" />
                  <Text style={styles.shareBtnText}>Share Trip</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.flipHint} onPress={handleFlip} activeOpacity={0.75}>
                <Ionicons name="sync-outline" size={14} color={ranaColors.primary} />
                <Text style={styles.flipHintText}>Flip back</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9,16,30,0.7)',
  },
  closeBtn: {
    position: 'absolute',
    top: -16,
    right: -8,
    zIndex: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(27,43,89,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passContainer: {
    width: PASS_W,
    height: PASS_H,
    position: 'relative',
  },
  passCard: {
    position: 'absolute',
    width: PASS_W,
    height: PASS_H,
    borderRadius: ranaRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    backfaceVisibility: 'hidden',
  },
  passCardBack: {
    backfaceVisibility: 'hidden',
  },
  passHeader: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  passHeaderBack: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  airlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  airlineName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
  },
  airlineNameBack: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  classBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: ranaRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  classBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  routeAirport: {
    alignItems: 'flex-start',
  },
  routeAirportRight: {
    alignItems: 'flex-end',
  },
  iataCode: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 34,
  },
  cityName: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginTop: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  flightCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4A90E2',
    letterSpacing: 1,
  },
  // Tear perforation
  tearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    position: 'relative',
    zIndex: 5,
  },
  halfCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    zIndex: 6,
  },
  halfCircleLeft: { left: -10 },
  halfCircleRight: { right: -10 },
  dashedLineContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginHorizontal: 10,
  },
  dash: {
    width: 4,
    height: 1,
    backgroundColor: '#C5D0E4',
  },
  // Details
  passDetails: {
    padding: 16,
    flex: 1,
  },
  passDetailsBack: {
    padding: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Glassmorphic gate card
  gateCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  gateGradient: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(27,43,89,0.06)',
  },
  gateLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: ranaColors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  gateValue: {
    fontSize: 22,
    fontWeight: '900',
    color: ranaColors.primary,
  },
  gateValueBoarding: {
    color: '#16A34A',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailItem: {
    width: '47%',
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    padding: 8,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: ranaColors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 6,
  },
  flipHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: ranaColors.primary,
  },
  // Back side
  backTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    marginTop: 2,
  },
  backRoute: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  backCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4A90E2',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: ranaColors.textPrimary,
    marginTop: 12,
  },
  qrSublabel: {
    fontSize: 10,
    color: ranaColors.textSecondary,
    marginTop: 2,
  },
  // New QR and Budget Styles
  qrCaptureWrapper: {
    // Wrapper for capturing QR code with branding
    padding: 12,
  },
  qrBrandingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...ranaShadow.card,
  },
  qrWithLogo: {
    position: 'relative',
    width: 140,
    height: 140,
  },
  qrLogoOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -18 }],
    width: 36,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 2,
  },
  qrBrandName: {
    fontSize: 14,
    fontWeight: '900',
    color: ranaColors.primary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  qrBrandSub: {
    fontSize: 11,
    fontWeight: '600',
    color: ranaColors.textSecondary,
    marginTop: 12,
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    ...ranaShadow.soft,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  budgetItem: {
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: ranaColors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  budgetValue: {
    fontSize: 13,
    fontWeight: '800',
    color: ranaColors.primary,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ranaColors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...ranaShadow.soft,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  // Action buttons row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D5E0F3',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: ranaColors.primary,
  },
});
