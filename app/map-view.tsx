import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import LeafletMap from '@/src/components/LeafletMap';
import { ranaColors } from '@/src/theme/ranaTheme';

export default function MapViewScreen() {
  const { origin, destination } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<{from: {lat: number, lng: number}, to: {lat: number, lng: number}} | null>(null);

  useEffect(() => {
    async function loadCoordinates() {
      try {
        if (!origin || !destination) {
          setLoading(false);
          return;
        }

        const originStr = Array.isArray(origin) ? origin[0] : origin;
        const destStr = Array.isArray(destination) ? destination[0] : destination;

        const originCoords = await Location.geocodeAsync(originStr);
        const destCoords = await Location.geocodeAsync(destStr);

        if (originCoords.length > 0 && destCoords.length > 0) {
          setPoints({
            from: { lat: originCoords[0].latitude, lng: originCoords[0].longitude },
            to: { lat: destCoords[0].latitude, lng: destCoords[0].longitude }
          });
        }
      } catch (err) {
        console.error('Failed to geocode:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCoordinates();
  }, [origin, destination]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={ranaColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{origin} ➔ {destination}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ranaColors.primary} />
          <Text style={styles.loadingText}>Locating route...</Text>
        </View>
      ) : points ? (
        <LeafletMap 
          lat={points.from.lat} 
          lng={points.from.lng} 
          zoom={5} 
          initialFrom={points.from}
          initialTo={points.to}
        />
      ) : (
        <View style={styles.center}>
          <Ionicons name="map-outline" size={48} color={ranaColors.textSecondary} />
          <Text style={styles.errorText}>Could not find coordinates for the given locations.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: ranaColors.textSecondary,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    color: ranaColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
