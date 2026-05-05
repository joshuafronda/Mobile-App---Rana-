import { Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, router, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { useLanguage } from '@/src/context/LanguageContext';
import { ranaColors } from '@/src/theme/ranaTheme';

// ── Layout constants ────────────────────────────────────────────────────────
const TAB_HEIGHT = 68;
const TAB_BOTTOM = 24;
const TAB_MARGIN = 16;
const FAB_SIZE = 56;

// ── Active-tab button wrapper — renders the blue indicator pill at the top ──
function TabButton(props: any) {
  const focused: boolean = props.accessibilityState?.selected ?? false;
  return (
    <Pressable
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      style={[props.style, styles.tabButton]}
    >
      {focused && <View style={styles.tabIndicator} />}
      <View style={[styles.tabContent, focused && styles.tabContentFocused]}>
        {props.children}
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const [fontsLoaded] = useFonts({ Inter_600SemiBold, Inter_700Bold });
  const labelFont = fontsLoaded ? 'Inter_600SemiBold' : undefined;
  const labelFontBold = fontsLoaded ? 'Inter_700Bold' : undefined;
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState('explore');
  const [travelExpanded, setTravelExpanded] = useState(false);
  const airAnim = useRef(new Animated.Value(0)).current;
  const landAnim = useRef(new Animated.Value(0)).current;
  const seaAnim = useRef(new Animated.Value(0)).current;

  const showRainbow = () => {
    setTravelExpanded(true);
    Animated.stagger(80, [
      Animated.spring(airAnim, { toValue: 1, useNativeDriver: true }),
      Animated.spring(landAnim, { toValue: 1, useNativeDriver: true }),
      Animated.spring(seaAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const hideRainbow = () => {
    Animated.stagger(50, [
      Animated.timing(seaAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(landAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(airAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => setTravelExpanded(false));
  };

  const toggleTravel = () => {
    if (travelExpanded) hideRainbow(); else showRainbow();
  };

  // Detect active tab based on pathname
  useEffect(() => {
    if (pathname.includes('/trips')) {
      setActiveSection('trips');
    } else if (pathname.includes('/profile')) {
      setActiveSection('profile');
    } else {
      setActiveSection('explore');
    }
  }, [pathname]);

  const fabRight = TAB_MARGIN;
  // Center the pill exactly in the screen, taking up a fixed reasonable width for 3 tabs
  const pillWidth = 280; 
  const pillLeft = (width - pillWidth) / 2; // Perfectly centered

  // FAB handler — routes to assistant with active section
  const handleFABPress = () => {
    router.push({
      pathname: '/assistant',
      params: { section: activeSection },
    });
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: ranaColors.primary,
          tabBarInactiveTintColor: ranaColors.textSecondary,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: labelFont,
            marginTop: 4,
          },
          tabBarStyle: [styles.tabBar, { width: pillWidth, left: pillLeft, marginLeft: 16 }],
          tabBarButton: (props) => <TabButton {...props} />,
        }}
        initialRouteName="explore"
      >
        <Tabs.Screen
          name="explore"
          options={{
            tabBarIcon: ({ color }) => <Ionicons size={22} name="map" color={color} />,
            tabBarLabel: ({ focused, color }) => (
              <Text style={[styles.tabLabel, { color, fontFamily: focused ? labelFontBold : labelFont }]}>
                {t.tabExplore}
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="trips"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              toggleTravel();
            },
          }}
          options={{
            tabBarIcon: ({ color }) => <Ionicons size={22} name="airplane" color={color} />,
            tabBarLabel: ({ focused, color }) => (
              <View style={styles.travelTabLabelWrap}>
                <Text style={[styles.tabLabel, { color, fontFamily: focused ? labelFontBold : labelFont }]}>
                  Travel
                </Text>
                <Ionicons
                  name={travelExpanded ? 'chevron-up' : 'chevron-down'}
                  size={10}
                  color={travelExpanded ? ranaColors.primary : ranaColors.textSecondary}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color }) => <Ionicons size={22} name="person-circle" color={color} />,
            tabBarLabel: ({ focused, color }) => (
              <Text style={[styles.tabLabel, { color, fontFamily: focused ? labelFontBold : labelFont }]}>
                {t.tabProfile}
              </Text>
            ),
          }}
        />
        {/* Hidden tab screens for Land & Sea transport */}
        <Tabs.Screen
          name="land"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="sea"
          options={{ href: null }}
        />
      </Tabs>

      {/* Floating Action Button (assistant) floating individually on the right side */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Travel Assistant"
        activeOpacity={0.8}
        style={[
          styles.fab,
          {
            bottom: TAB_BOTTOM + (TAB_HEIGHT - FAB_SIZE) / 2, // Centered vertically relative to the pill
            right: fabRight, // Exactly centered in the 'Gap' (3rd) slot
          },
        ]}
        onPress={handleFABPress}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Travel Rainbow — horizontal animated buttons above tab bar */}
      {travelExpanded && (
        <View style={[styles.rainbowRow, { bottom: TAB_BOTTOM + TAB_HEIGHT + 12, left: pillLeft, width: pillWidth }]}>
          <Animated.View style={{ transform: [{ scale: airAnim }, { translateY: airAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], opacity: airAnim }}>
            <TouchableOpacity
              style={styles.rainbowBtn}
              activeOpacity={0.85}
              onPress={() => { hideRainbow(); router.push('/(tabs)/trips'); }}
            >
              <Ionicons name="airplane" size={20} color={ranaColors.primary} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: landAnim }, { translateY: landAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], opacity: landAnim }}>
            <TouchableOpacity
              style={styles.rainbowBtn}
              activeOpacity={0.85}
              onPress={() => { hideRainbow(); router.push('/(tabs)/land'); }}
            >
              <Ionicons name="car-sport" size={20} color="#16A34A" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: seaAnim }, { translateY: seaAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], opacity: seaAnim }}>
            <TouchableOpacity
              style={styles.rainbowBtn}
              activeOpacity={0.85}
              onPress={() => { hideRainbow(); router.push('/(tabs)/sea'); }}
            >
              <Ionicons name="boat" size={20} color="#0284C7" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tabContentFocused: {
    backgroundColor: `${ranaColors.primary}1A`, // ~10% opacity for a clear transparent highlight
    opacity: 0.5, // 50% transparency for the selected button content
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: ranaColors.primary,
  },
  tabLabel: {
    fontSize: 11,
  },
  tabBar: {
    position: 'absolute',
    // left is now injected dynamically to ensure exact centering
    bottom: TAB_BOTTOM,
    height: TAB_HEIGHT,
    borderRadius: 36, // strictly pill-shaped
    borderTopWidth: 0,
    backgroundColor: '#FFFFFF',
    paddingBottom: 0, // override react navigation default bottom padding
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  fab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ranaColors.primary,
    // Slimmer border to fit elegantly inside the pill
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: ranaColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  // Travel tab label with chevron
  travelTabLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  // Rainbow — horizontal animated buttons above tab bar (matches tab bar pill style)
  rainbowRow: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  rainbowBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#E8EEF9',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    gap: 6,
  },
  rainbowBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
});
