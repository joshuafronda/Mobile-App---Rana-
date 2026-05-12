import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';

import * as Location from 'expo-location';

import { router } from 'expo-router';

import { useEffect, useRef, useState } from 'react';

import { Dimensions, ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';



import HeadLogo from '@/assets/images/head.svg';

import BoardingPassModal from '@/src/components/BoardingPassModal';

import { StaggeredFadeIn } from '@/src/components/StaggeredFadeIn';

import TextType from '@/src/components/TextType';

import { useLanguage } from '@/src/context/LanguageContext';

import { useTravel, type Trip } from '@/src/context/TravelContext';
import { useWeather } from '@/src/context/WeatherContext';
import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';



const SCREEN_WIDTH = Dimensions.get('window').width;

const CARD_WIDTH = SCREEN_WIDTH - ranaSpacing.md * 2;

const CAROUSEL_CARD_W = SCREEN_WIDTH - ranaSpacing.md * 2;

const UPCOMING_CAROUSEL_ITEM_W = SCREEN_WIDTH - ranaSpacing.md * 2 - 28;

const UPCOMING_SNAP_FEEL: 'tight' | 'loose' = 'tight';

const UPCOMING_SCROLL_ANIMATION_MS = UPCOMING_SNAP_FEEL === 'tight' ? 320 : 680;



// Ã¢â€â‚¬Ã¢â€â‚¬ Destination data Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

interface Destination {

  id: string;

  name: string;

  location: string;

  description: string;

  bestMonths: string;

  tag: string;

  tagColor: string;

  // Unsplash source Ã¢â‚¬â€ free to use, loads over the network

  imageUri: string;

  transport: string;

  estimatedBudget: string;

}



const DESTINATIONS: Destination[] = [

  // 🏖️ Beach

  {

    id: '1',

    name: 'Bora Bora',

    location: 'French Polynesia',

    description:

      'Iconic overwater bungalows, crystal-clear lagoons, and lush volcanic peaks. A luxury-heavy destination where even budget options feel premium.',

    bestMonths: 'May – Oct',

    tag: 'Beach',

    tagColor: '#4A90E2',

    imageUri: 'https://images.unsplash.com/photo-1501615965209-5deb4f44c8a4?w=800&q=80',

    transport: 'Flight',

    estimatedBudget: '$300 – $1,000+ / day',

  },

  {

    id: '2',

    name: 'Maldives',

    location: 'South Asia',

    description:

      'Turquoise atolls, coral reefs, and private island resorts. Wide range from affordable local islands to ultra-luxury overwater villas.',

    bestMonths: 'Nov – Apr',

    tag: 'Beach',

    tagColor: '#4A90E2',

    imageUri: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',

    transport: 'Flight + Speedboat',

    estimatedBudget: '$150 – $800 / day',

  },

  // 🌿 Nature

  {

    id: '3',

    name: 'Banff National Park',

    location: 'Alberta, Canada',

    description:

      'Emerald lakes, glaciers, and the Canadian Rockies. World-class hiking and skiing with costs covering lodging, food, and park fees.',

    bestMonths: 'Jun – Sep',

    tag: 'Nature',

    tagColor: '#1F9D74',

    imageUri: 'https://images.unsplash.com/photo-1609881543302-1bef3d0f19e6?w=800&q=80',

    transport: 'Car / Bus',

    estimatedBudget: '$100 – $300 / day',

  },

  {

    id: '4',

    name: 'Amazon Rainforest',

    location: 'Brazil / Peru',

    description:

      'The lungs of the Earth. Guided jungle tours, wildlife spotting, and river expeditions — mostly bundled packages that simplify budgeting.',

    bestMonths: 'Jun – Nov',

    tag: 'Nature',

    tagColor: '#1F9D74',

    imageUri: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80',

    transport: 'Flight + Boat',

    estimatedBudget: '$150 – $400 / day',

  },

  // 🏛️ History

  {

    id: '5',

    name: 'Rome',

    location: 'Italy',

    description:

      'The Eternal City — the Colosseum, Vatican, and centuries of history on every street. Flexible budget from hostels to boutique hotels.',

    bestMonths: 'Apr – Jun, Sep – Oct',

    tag: 'History',

    tagColor: '#7B5EA7',

    imageUri: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=800&q=80',

    transport: 'Flight + Metro',

    estimatedBudget: '$80 – $250 / day',

  },

  {

    id: '6',

    name: 'Machu Picchu',

    location: 'Cusco, Peru',

    description:

      'The lost Incan citadel perched high in the Andes. Tours, entrance permits, and transport are included in most packages.',

    bestMonths: 'May – Oct',

    tag: 'History',

    tagColor: '#7B5EA7',

    imageUri: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80',

    transport: 'Flight + Train',

    estimatedBudget: '$100 – $300 / day',

  },

  // 🧗 Adventure

  {

    id: '7',

    name: 'Queenstown',

    location: 'New Zealand',

    description:

      'The adventure capital of the world — bungee jumping, skydiving, jet boating, and skiing. Activities are the main cost driver here.',

    bestMonths: 'Dec – Feb, Jun – Aug',

    tag: 'Adventure',

    tagColor: '#D0534A',

    imageUri: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80',

    transport: 'Flight + Car',

    estimatedBudget: '$120 – $350 / day',

  },

  {

    id: '8',

    name: 'Patagonia',

    location: 'Argentina / Chile',

    description:

      'Dramatic glaciers, jagged peaks, and untouched wilderness at the tip of South America. Self-guided hiking keeps costs manageable.',

    bestMonths: 'Nov – Mar',

    tag: 'Adventure',

    tagColor: '#D0534A',

    imageUri: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',

    transport: 'Flight + Bus',

    estimatedBudget: '$80 – $250 / day',

  },

  // 🗼 Landmark

  {

    id: '9',

    name: 'Eiffel Tower',

    location: 'Paris, France',

    description:

      'The iron lady of Paris and one of the world\'s most recognizable landmarks. Accommodation is the primary expense in the City of Light.',

    bestMonths: 'Apr – Jun, Sep – Nov',

    tag: 'Landmark',

    tagColor: '#E39A2D',

    imageUri: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&q=80',

    transport: 'Flight + Metro',

    estimatedBudget: '$120 – $300 / day',

  },

  {

    id: '10',

    name: 'Great Wall of China',

    location: 'Beijing, China',

    description:

      'Stretching over 13,000 miles, the Great Wall is one of history\'s greatest engineering feats — and one of the most budget-friendly major landmarks.',

    bestMonths: 'Apr – May, Sep – Oct',

    tag: 'Landmark',

    tagColor: '#E39A2D',

    imageUri: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80',

    transport: 'Flight + Bus',

    estimatedBudget: '$50 – $150 / day',

  },

];



// Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function formatPHP(value: number) {

  return new Intl.NumberFormat('en-PH', {

    style: 'currency',

    currency: 'PHP',

    maximumFractionDigits: 0,

  }).format(value);

}



function dayIntensity(dayTrips: number) {

  if (dayTrips === 0) return '#E7EFFC';

  if (dayTrips === 1) return '#CDE0FA';

  if (dayTrips === 2) return '#95BFF2';

  return ranaColors.primary;

}



// Ã¢â€â‚¬Ã¢â€â‚¬ Destination card Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function DestinationCard({ dest, index }: { dest: Destination; index: number }) {

  const [expanded, setExpanded] = useState(false);

  const { t } = useLanguage();



  return (

    <StaggeredFadeIn index={index} style={styles.destCard}>

      <TouchableOpacity activeOpacity={0.92} onPress={() => setExpanded((v) => !v)}>

        {/* Hero image */}

        <ImageBackground

          source={{ uri: dest.imageUri }}

          style={styles.destImage}

          imageStyle={{ borderRadius: ranaRadius.lg }}

        >

          <LinearGradient

            colors={['transparent', 'rgba(20,30,50,0.72)']}

            style={styles.destImageOverlay}

          >

            {/* Tag */}

            <View style={[styles.destTag, { backgroundColor: dest.tagColor }]}>

              <Text style={styles.destTagText}>{dest.tag}</Text>

            </View>



            {/* Name + location on image */}

            <View style={styles.destImageBottom}>

              <Text style={styles.destNameOnImage}>{dest.name}</Text>

              <View style={styles.destLocationRow}>

                <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.85)" />

                <Text style={styles.destLocationText}>{dest.location}</Text>

              </View>

            </View>

          </LinearGradient>

        </ImageBackground>



        {/* Info row */}

        <View style={styles.destInfoRow}>

          <View style={styles.destInfoChip}>

            <Ionicons name="calendar-outline" size={13} color={ranaColors.primary} />

            <Text style={styles.destInfoChipText}>{dest.bestMonths}</Text>

          </View>

          <View style={styles.destInfoChip}>

            <Ionicons name="navigate-outline" size={13} color={ranaColors.primary} />

            <Text style={styles.destInfoChipText}>{dest.transport}</Text>

          </View>

          <View style={styles.destInfoChip}>

            <Ionicons name="wallet-outline" size={13} color={ranaColors.primary} />

            <Text style={styles.destInfoChipText}>{dest.estimatedBudget}</Text>

          </View>

        </View>



        {/* Description Ã¢â‚¬â€ collapsed by default */}

        {expanded && (

          <Text style={styles.destDescription}>{dest.description}</Text>

        )}



        <View style={styles.destExpandRow}>

          <Text style={styles.destExpandHint}>

            {expanded ? t.showLess : t.readMore}

          </Text>

        </View>

      </TouchableOpacity>

    </StaggeredFadeIn>

  );

}



// Ã¢â€â‚¬Ã¢â€â‚¬ Main screen Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export default function ExploreScreen() {

  const { trips } = useTravel();

  const { t } = useLanguage();

  // -- Weather from shared context (OWM / open-meteo fallback) --
  useWeather();

  const [activeFilter, setActiveFilter] = useState<string>('All');

  const [boardingPassVisible, setBoardingPassVisible] = useState(false);

  const [boardingPassTrip, setBoardingPassTrip] = useState<Trip | null>(null);

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [filterTempMonth, setFilterTempMonth] = useState(calendarMonth.getMonth());
  const [filterTempYear, setFilterTempYear] = useState(calendarMonth.getFullYear());

  const carouselProgress = useSharedValue<number>(0);

  const carouselRef = useRef<ICarouselInstance>(null);



  const startOfMonth = new Date();

  startOfMonth.setDate(1);

  startOfMonth.setHours(0, 0, 0, 0);



  const thisMonthTrips = trips.filter((trip) => new Date(trip.dateISO) >= startOfMonth);

  const totalMonthSpend = thisMonthTrips.reduce((sum, trip) => sum + trip.totalCost, 0);

  const totalMonthKm = thisMonthTrips.reduce((sum, trip) => sum + trip.distanceKm, 0);



  const dayCountMap = new Map<number, number>();

  thisMonthTrips.forEach((trip) => {

    const day = new Date(trip.dateISO).getDate();

    dayCountMap.set(day, (dayCountMap.get(day) ?? 0) + 1);

  });

  // Calendar grid generation for modal
  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startingDayOfWeek = firstDay.getDay();
    // Convert Sunday (0) to 6, so Monday is 0, Tuesday is 1, etc.
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days: (number | null)[] = [];
    
    // Add leading empty cells (before day 1)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month (1 to daysInMonth)
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    // Add trailing empty cells to complete grid to 6 rows (42 cells total)
    const totalCells = 42; // 6 weeks × 7 days
    while (days.length < totalCells) {
      days.push(null);
    }

    // Convert flat array to 2D array (weeks)
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  };

  const getTripsForDate = (day: number) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return trips.filter(t => t.dateISO.startsWith(dateStr));
  };

  const handleFilterApply = () => {
    setCalendarMonth(new Date(filterTempYear, filterTempMonth, 1));
    setSelectedCalendarDate(null);
    setDateFilterVisible(false);
  };

  const handleFilterReset = () => {
    const today = new Date();
    setFilterTempMonth(today.getMonth());
    setFilterTempYear(today.getFullYear());
  };

  const handleFilterCurrentMonth = () => {
    const today = new Date();
    setFilterTempMonth(today.getMonth());
    setFilterTempYear(today.getFullYear());
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const YEAR_RANGE = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  const calendarWeeks = generateCalendarDays();



  const today = new Date();

  const calendarDates = Array.from({ length: 21 }, (_, i) => {

    const d = new Date();

    d.setDate(today.getDate() - 7 + i); // 7 past days, today, 13 future days

    return d;

  });



  const heatCells = Array.from({ length: 30 }, (_, index) => ({

    day: index + 1,

    color: dayIntensity(dayCountMap.get(index + 1) ?? 0),

  }));



  const FILTERS = ['All', 'Beach', 'Nature', 'History', 'Adventure', 'Landmark'];

  const filteredDests =

    activeFilter === 'All'

      ? DESTINATIONS

      : DESTINATIONS.filter((d) => d.tag === activeFilter);

  const plannedTrips = trips

    .filter((trip) => trip.status === 'planned')

    .sort((a, b) => {

      const aTime = a.startDate ? new Date(a.startDate).getTime() : new Date(a.dateISO).getTime();

      const bTime = b.startDate ? new Date(b.startDate).getTime() : new Date(b.dateISO).getTime();

      return aTime - bTime;

    });

  const tripsToDisplay: import('@/src/context/TravelContext').Trip[] = plannedTrips.length > 0 ? plannedTrips : [

    { id: 'mock1', title: 'Bora Bora Luxury Escape', origin: 'Manila', destination: 'Bora Bora', transportType: 'International Airplane', dateISO: '2026-07-10T00:00:00Z', startDate: '2026-07-10', endDate: '2026-07-15', distanceKm: 8700, passengers: 2, totalCost: 0, country: 'French Polynesia', status: 'planned', budgetRange: '?250,000 � ?500,000+', budgetNotes: ['Flights: very expensive (multiple connections)', 'Stay: luxury resorts dominate', '?? This is premium / honeymoon-level'] },

    { id: 'mock2', title: 'Maldives Island Getaway', origin: 'Manila', destination: 'Maldives', transportType: 'International Airplane', dateISO: '2026-11-05T00:00:00Z', startDate: '2026-11-05', endDate: '2026-11-10', distanceKm: 5800, passengers: 3, totalCost: 0, country: 'Maldives', status: 'planned', budgetRange: '?180,000 � ?400,000', budgetNotes: ['Resorts + seaplane transfers', 'Can be cheaper with guesthouses (?120k+)'] },

    { id: 'mock3', title: 'Banff Nature Exploration', origin: 'Manila', destination: 'Banff National Park', transportType: 'International Airplane', dateISO: '2026-09-12T00:00:00Z', startDate: '2026-09-12', endDate: '2026-09-18', distanceKm: 10500, passengers: 4, totalCost: 0, country: 'Canada', status: 'planned', budgetRange: '?120,000 � ?220,000', budgetNotes: ['Flights to Canada = biggest cost', 'Car rental + park tours'] },

    { id: 'mock4', title: 'Amazon Jungle Adventure', origin: 'Manila', destination: 'Amazon Rainforest', transportType: 'International Airplane', dateISO: '2026-08-20T00:00:00Z', startDate: '2026-08-20', endDate: '2026-08-27', distanceKm: 17000, passengers: 2, totalCost: 0, country: 'Brazil', status: 'planned', budgetRange: '?180,000 � ?300,000', budgetNotes: ['Long-haul flights', 'Guided jungle tours required'] },

    { id: 'mock5', title: 'Rome Historical Tour', origin: 'Manila', destination: 'Rome', transportType: 'International Airplane', dateISO: '2026-10-01T00:00:00Z', startDate: '2026-10-01', endDate: '2026-10-07', distanceKm: 10300, passengers: 2, totalCost: 0, country: 'Italy', status: 'planned', budgetRange: '?90,000 � ?180,000', budgetNotes: ['Cheaper flights (promo possible)', 'Food + attractions reasonable'] },

    { id: 'mock6', title: 'Machu Picchu Expedition', origin: 'Manila', destination: 'Machu Picchu', transportType: 'International Airplane', dateISO: '2026-09-25T00:00:00Z', startDate: '2026-09-25', endDate: '2026-10-02', distanceKm: 17500, passengers: 3, totalCost: 0, country: 'Peru', status: 'planned', budgetRange: '?150,000 � ?280,000', budgetNotes: ['Flights + train + entrance fees', 'Tour packages common'] },

    { id: 'mock7', title: 'Queenstown Adventure Week', origin: 'Manila', destination: 'Queenstown', transportType: 'International Airplane', dateISO: '2026-12-01T00:00:00Z', startDate: '2026-12-01', endDate: '2026-12-07', distanceKm: 8300, passengers: 5, totalCost: 0, country: 'New Zealand', status: 'planned', budgetRange: '?130,000 � ?250,000', budgetNotes: ['Activities (bungee, skydiving) are pricey', 'Flights moderate'] },

    { id: 'mock8', title: 'Patagonia Hiking Journey', origin: 'Manila', destination: 'Patagonia', transportType: 'International Airplane', dateISO: '2026-11-15T00:00:00Z', startDate: '2026-11-15', endDate: '2026-11-25', distanceKm: 18000, passengers: 4, totalCost: 0, country: 'Argentina / Chile', status: 'planned', budgetRange: '?180,000 � ?320,000', budgetNotes: ['Remote area ? transport costs high', 'Hiking tours + gear'] },

    { id: 'mock9', title: 'Paris Landmark Experience', origin: 'Manila', destination: 'Eiffel Tower', transportType: 'International Airplane', dateISO: '2026-10-15T00:00:00Z', startDate: '2026-10-15', endDate: '2026-10-20', distanceKm: 10700, passengers: 2, totalCost: 0, country: 'France', status: 'planned', budgetRange: '?100,000 � ?200,000', budgetNotes: ['Paris can be expensive, but manageable', 'Budget stays available'] },

    { id: 'mock10', title: 'Great Wall Cultural Trip', origin: 'Manila', destination: 'Great Wall of China', transportType: 'International Airplane', dateISO: '2026-04-05T00:00:00Z', startDate: '2026-04-05', endDate: '2026-04-10', distanceKm: 2900, passengers: 6, totalCost: 0, country: 'China', status: 'planned', budgetRange: '?60,000 � ?120,000', budgetNotes: ['One of the cheapest in the list', 'Flights from PH are relatively affordable'] },

  ];

  const isPlanned = plannedTrips.length > 0;



  // Only show Jan â†’ current month of this year

  const heatmapMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    .slice(0, new Date().getMonth() + 1);



  // Heatmap grid covers Jan 1 of this year â†’ today

  const heatJan1 = new Date(new Date().getFullYear(), 0, 1);

  const heatToday = new Date();

  heatToday.setHours(0, 0, 0, 0);

  const heatDayCount = Math.floor((heatToday.getTime() - heatJan1.getTime()) / 86400000) + 1;

  const HEAT_ROWS = 5;

  const HEAT_COLS = Math.ceil(heatDayCount / HEAT_ROWS);







  return (

    <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.container}>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>



        {/* Top Welcome Banner */}

        <StaggeredFadeIn index={0} style={styles.topWelcomeBar}>

          <View style={styles.topWelcomeRow}>

            <TextType

              texts={["Welcome in Rana!"]}

              typingSpeed={75}

              pauseDuration={1200}

              showCursor

              cursorCharacter="|"

              textStyle={styles.topWelcomeTitle}

            />

            <TouchableOpacity style={styles.calendarBtn} onPress={() => setCalendarVisible(true)} activeOpacity={0.8}>

              <Ionicons name="calendar-outline" size={18} color={ranaColors.primary} />

              <Text style={styles.calendarBtnText}>Calendar</Text>

            </TouchableOpacity>

          </View>

        </StaggeredFadeIn>



        {/* Hero Banner */}

        <StaggeredFadeIn index={1} style={styles.heroBannerCard}>

          <LinearGradient

            colors={['#1B2B59', '#2E4A8F']}

            start={{ x: 0, y: 0 }}

            end={{ x: 1, y: 1 }}

            style={styles.heroBannerGradient}

          >

            {/* Left text */}

            <View style={styles.heroBannerLeft}>

              <View style={styles.heroBannerBadge}>

                <Ionicons name="airplane" size={10} color="#fff" />

                <Text style={styles.heroBannerBadgeText}>TRAVELER</Text>

              </View>

              <Text style={styles.heroBannerName}>Hi, Joshua!</Text>

              <Text style={styles.heroBannerWelcome}>

                Welcome to <Text style={{ color: '#7EB3FF', fontWeight: '700' }}>Rana</Text> � your smart travel planner.

              </Text>

      

            </View>



            {/* Right logo */}

            <View style={styles.heroBannerLogoWrap}>

              <HeadLogo width={72} height={72} />

            </View>

          </LinearGradient>

        </StaggeredFadeIn>

        {/* Planned Upcoming Trips */}
        <StaggeredFadeIn index={1} style={styles.upcomingSection}>

          <Text style={styles.sectionHeaderTitle}>Planned Trips</Text>

          <Text style={styles.sectionHeaderDesc}>Your upcoming adventures � swipe to explore each trip.</Text>

          <View style={styles.upcomingCarouselWrap}>

                <View style={styles.upcomingCarouselViewport}>

                  <Carousel

                    ref={carouselRef}

                    width={UPCOMING_CAROUSEL_ITEM_W}

                    height={240}

                    loop={false}

                    mode="parallax"

                    modeConfig={{

                      parallaxScrollingScale: 0.95,

                      parallaxAdjacentItemScale: 0.72,

                      parallaxScrollingOffset: 88,

                    }}

                    pagingEnabled

                    snapEnabled

                    scrollAnimationDuration={UPCOMING_SCROLL_ANIMATION_MS}

                    data={tripsToDisplay}

                    onProgressChange={carouselProgress}

                    style={styles.upcomingCarouselScroll}

                    renderItem={({ item: trip, animationValue }) => {

                    const overlayStyle = useAnimatedStyle(() => {

                      const opacity = interpolate(

                        animationValue.value,

                        [-1, 0, 1],

                        [0.7, 0, 0.7],

                        Extrapolation.CLAMP

                      );

                      return { opacity };

                    });



                    const displayDate = trip.startDate ? trip.startDate : trip.dateISO;

                    const d = new Date(displayDate);

                    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                    const endStr = trip.endDate

                      ? new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                      : null;

                    const ticketTitle = trip.title?.trim() || `${trip.origin} to ${trip.destination}`;

                    const ticketCode = `TK-${trip.id.replace(/[^0-9a-z]/gi, '').slice(-6).toUpperCase() || '000001'}`;

                    const timeLabel = trip.startDate?.includes('T')

                      ? new Date(trip.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

                      : '--:--';

                    return (

                      <TouchableOpacity

                        activeOpacity={0.88}

                        style={styles.upcomingBigCard}

                        onPress={() => { setBoardingPassTrip(trip); setBoardingPassVisible(true); }}

                      >

                        {/* ─── TICKET TOP (HEADER) ─── */}

                        <LinearGradient

                          colors={['#0E2A66', '#1B3A7F']}

                          start={{ x: 0, y: 0 }}

                          end={{ x: 1, y: 1 }}

                          style={styles.ticketHeaderGradient}

                        >

                          {/* Decorative circles */}

                          <View style={[styles.decorCircleTL, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

                          <View style={[styles.decorCircleBR, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />



                          {/* Airline & Status Row */}

                          <View style={styles.ticketHeaderRow}>

                            <Text style={styles.ticketAirlineName}>RANA TRAVEL</Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>

                              <TouchableOpacity

                                style={styles.mapIconButton}

                                onPress={() => router.push(`/map-view?origin=${encodeURIComponent(trip.origin)}&destination=${encodeURIComponent(trip.destination)}`)}

                              >

                                <Ionicons name="map" size={12} color="#fff" />

                                <Text style={styles.mapIconText}>MAP</Text>

                              </TouchableOpacity>

                              <View style={styles.ticketClassBadge}>

                                <Text style={styles.ticketClassBadgeText}>{isPlanned ? 'PLANNED' : 'PREVIEW'}</Text>

                              </View>

                            </View>

                          </View>



                          {/* Route Display */}

                          <View style={styles.ticketRouteRow}>

                            <View style={styles.ticketRouteAirport}>

                              <Text style={styles.ticketIataCode}>{trip.origin.slice(0, 3).toUpperCase()}</Text>

                              <Text style={styles.ticketCityName}>{trip.origin}</Text>

                            </View>



                            <View style={styles.ticketFlightPath}>

                              <View style={styles.ticketFlightLine}>

                                <View style={styles.ticketLineDot} />

                                <View style={styles.ticketLineBar} />

                                <Ionicons name="airplane" size={16} color="#fff" />

                                <View style={styles.ticketLineBar} />

                                <View style={styles.ticketLineDot} />

                              </View>

                              <Text style={styles.ticketDuration} numberOfLines={1}>{trip.transportType}</Text>

                            </View>



                            <View style={[styles.ticketRouteAirport, { alignItems: 'flex-end' }]}>

                              <Text style={styles.ticketIataCode}>{trip.destination.slice(0, 3).toUpperCase()}</Text>

                              <Text style={styles.ticketCityName}>{trip.destination}</Text>

                            </View>

                          </View>



                          {/* Time Row */}

                          <View style={styles.ticketTimeRow}>

                            <Text style={styles.ticketTimeText}>{timeLabel}</Text>

                            <Text style={styles.ticketFlightCode}>{ticketCode}</Text>

                            <Text style={styles.ticketTimeText}>{endStr ? endStr : 'TBD'}</Text>

                          </View>

                        </LinearGradient>



                        {/* ─── TEAR DIVIDER ─── */}

                        <View style={styles.ticketTearRow}>

                          <View style={[styles.ticketHalfCircle, styles.ticketHalfCircleLeft, { backgroundColor: '#FFFFFF' }]} />

                          <View style={styles.ticketDashedLineContainer}>

                            {Array.from({ length: 18 }).map((_, i) => (

                              <View key={i} style={styles.ticketDash} />

                            ))}

                          </View>

                          <View style={[styles.ticketHalfCircle, styles.ticketHalfCircleRight, { backgroundColor: '#FFFFFF' }]} />

                        </View>



                        {/* ─── TICKET BOTTOM (DETAILS) ─── */}

                        <View style={styles.ticketCardBottom}>

                          <Text style={styles.ticketTripTitle}>{ticketTitle}</Text>



                          {/* Details Grid */}

                          <View style={styles.ticketDetailsGrid}>

                            <View style={styles.ticketDetailItem}>

                              <Text style={styles.ticketDetailLabel}>Date</Text>

                              <Text style={styles.ticketDetailValue}>{dateStr}</Text>

                            </View>

                            <View style={styles.ticketDetailItem}>

                              <Text style={styles.ticketDetailLabel}>Country</Text>

                              <Text style={styles.ticketDetailValue}>{trip.country}</Text>

                            </View>

                            <View style={styles.ticketDetailItem}>

                              <Text style={styles.ticketDetailLabel}>Transport</Text>

                              <Text style={styles.ticketDetailValue} numberOfLines={1}>{trip.transportType}</Text>

                            </View>

                            <View style={styles.ticketDetailItem}>

                              <Text style={styles.ticketDetailLabel}>Cost</Text>

                              <Text style={[styles.ticketDetailValue, { color: ranaColors.primary, fontWeight: '900' }]}>

                                {trip.totalCost > 0 ? `₱${(trip.totalCost / 1000).toFixed(1)}k` : 'TBD'}

                              </Text>

                            </View>

                          </View>



                          {/* Estimated Budget Section */}

                          {trip.budgetRange ? (

                            <View style={styles.ticketBudgetSection}>

                              <View style={styles.ticketBudgetHeader}>

                                <Ionicons name="wallet-outline" size={11} color="#0EA5E9" />

                                <Text style={styles.ticketBudgetLabel}>ESTIMATED TRAVEL BUDGET</Text>

                              </View>

                              <Text style={styles.ticketBudgetRange}>{trip.budgetRange}</Text>

                              {(trip.budgetNotes ?? []).map((note, i) => (

                                <View key={i} style={styles.ticketBudgetNoteRow}>

                                  <Text style={styles.ticketBudgetDot}>�</Text>

                                  <Text style={styles.ticketBudgetNoteText}>{note}</Text>

                                </View>

                              ))}

                            </View>

                          ) : null}



                          {/* Barcode-like visual & Status */}

                          <View style={styles.ticketBarcodeRow}>

                            <View style={styles.ticketBarcodeContainer}>

                              {Array.from({ length: 20 }).map((_, i) => (

                                <View

                                  key={i}

                                  style={[

                                    styles.ticketBarcodeLine,

                                    {

                                      height: [14, 22, 18, 24, 16, 20, 12, 26][i % 8],

                                      backgroundColor: i % 3 === 0 ? ranaColors.primary : '#E0E8F5',

                                    },

                                  ]}

                                />

                              ))}

                            </View>

                            <View style={[styles.ticketStatusBadge, { borderColor: ranaColors.primary }]}>

                              <View style={[styles.ticketStatusDot, { backgroundColor: ranaColors.primary }]} />

                              <Text style={[styles.ticketStatusTextSmall, { color: ranaColors.primary }]}>

                                {isPlanned ? 'PLANNED' : 'READY'}

                              </Text>

                            </View>

                          </View>

                        </View>

                        {/* Overlay for adjacent slides so they look faded/blurred out */}

                        <Animated.View style={[styles.cardBlurOverlay, overlayStyle]} pointerEvents="none" />

                      </TouchableOpacity>

                    );

                    }}

                  />

                </View>

              </View>

        </StaggeredFadeIn>



        {/* Destination Target */}

        <StaggeredFadeIn index={2} style={styles.destinationHeader}>

          <Text style={styles.destinationTitle}>Explore Destinations</Text>

        </StaggeredFadeIn>



        {/* Filter chips */}

        <ScrollView

          horizontal

          showsHorizontalScrollIndicator={false}

          contentContainerStyle={styles.filterRow}

        >

          {FILTERS.map((f) => {

            const active = f === activeFilter;

            return (

              <TouchableOpacity

                key={f}

                style={[styles.filterChip, active && styles.filterChipActive]}

                onPress={() => setActiveFilter(f)}

                activeOpacity={0.75}

              >

                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>

                  {f}

                </Text>

              </TouchableOpacity>

            );

          })}

        </ScrollView>



        {/* Destination cards */}

        {filteredDests.map((dest, i) => (

          <DestinationCard key={dest.id} dest={dest} index={i + 4} />

        ))}



      </ScrollView>



      {/* 3D Boarding Pass Modal */}

      <BoardingPassModal

        visible={boardingPassVisible}

        trip={boardingPassTrip}

        onClose={() => setBoardingPassVisible(false)}

      />

      {/* Trip Calendar Modal */}

      <Modal visible={calendarVisible} animationType="slide" transparent onRequestClose={() => setCalendarVisible(false)}>

        <View style={styles.calendarOverlay}>

          <View style={styles.calendarModal}>

            {/* 1. TOP HEADER */}

            <View style={styles.calendarTopHeader}>

              <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.calendarHeaderBtn}>

                <Ionicons name="chevron-down" size={28} color={ranaColors.textPrimary} />

              </TouchableOpacity>

              <Text style={styles.calendarHeaderTitle}>Trip Planner</Text>

              <View style={styles.calendarHeaderSpacer} />

            </View>

            {/* 2. MONTH & YEAR NAVIGATION */}

            <View style={styles.calendarNavBar}>

              <TouchableOpacity 

                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}

                style={styles.calendarMonthNavBtn}

              >

                <Ionicons name="chevron-back" size={20} color={ranaColors.primary} />

              </TouchableOpacity>

              <View style={styles.calendarMonthDisplay}>

                <Text style={styles.calendarMonthText}>

                  {calendarMonth.toLocaleDateString('en-US', { month: 'short' })}

                </Text>

                <Text style={styles.calendarYearText}>

                  {calendarMonth.getFullYear()}

                </Text>

              </View>

              <TouchableOpacity

                onPress={() => {
                  setFilterTempMonth(calendarMonth.getMonth());
                  setFilterTempYear(calendarMonth.getFullYear());
                  setDateFilterVisible(true);
                }}

                style={styles.calendarFilterBtn}

              >

                <Ionicons name="options" size={18} color={ranaColors.primary} />

              </TouchableOpacity>

              <TouchableOpacity 

                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}

                style={styles.calendarMonthNavBtn}

              >

                <Ionicons name="chevron-forward" size={20} color={ranaColors.primary} />

              </TouchableOpacity>

            </View>

            {/* SCROLLABLE CONTENT AREA: Grid + Summary + Activities */}

            <ScrollView 

              style={styles.calendarContentScroll}

              contentContainerStyle={styles.calendarContentContainer}

              showsVerticalScrollIndicator={false}

            >

              {/* 3. CALENDAR GRID (FIXED HEIGHT) */}

              <View style={styles.calendarGridSection}>

                <View style={styles.calendarWeekdayHeader}>

                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (

                    <View key={idx} style={styles.calendarWeekdayCell}>

                      <Text style={styles.calendarWeekdayLabel}>{day}</Text>

                    </View>

                  ))}

                </View>

                <View style={styles.calendarDaysGrid}>

                  {calendarWeeks.map((week, weekIndex) => (

                    <View key={weekIndex} style={styles.calendarGridWeek}>

                      {week.map((day, dayIndex) => {

                        if (!day) return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.calendarGridDayEmpty} />;

                        const dateObj = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);

                        const tripsOnDay = getTripsForDate(day);

                        const isSelected = selectedCalendarDate?.toDateString() === dateObj.toDateString();

                        const isToday = new Date().toDateString() === dateObj.toDateString();

                        const hasTrips = tripsOnDay.length > 0;

                        return (

                          <TouchableOpacity 

                            key={`day-${weekIndex}-${dayIndex}`}

                            style={[

                              styles.calendarGridDay,

                              hasTrips && styles.calendarGridDayHasTrips,

                              isToday && styles.calendarGridDayToday,

                              isSelected && styles.calendarGridDaySelected,

                            ]}

                            onPress={() => setSelectedCalendarDate(dateObj)}

                          >

                            <Text style={[

                              styles.calendarGridDayNum,

                              (isToday || hasTrips) && styles.calendarGridDayNumActive,

                              isSelected && styles.calendarGridDayNumSelected,

                            ]}>

                              {day}

                            </Text>

                          </TouchableOpacity>

                        );

                      })}

                    </View>

                  ))}

                </View>

              </View>

              {/* 4. SELECTED DAY SUMMARY + TRIPS (Direct flow, no dead space) */}

              {selectedCalendarDate ? (

                <>

                  <View style={styles.calendarDaySummary}>

                    <Text style={styles.calendarDayLabel}>

                      {selectedCalendarDate.toLocaleDateString('en-US', { weekday: 'long' })}

                    </Text>

                    <Text style={styles.calendarDayDate}>

                      {selectedCalendarDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}

                    </Text>

                  </View>

                  {/* 5. TRIP LIST */}

                  <View style={styles.calendarDayActivitiesContainer}>

                    {getTripsForDate(selectedCalendarDate.getDate()).length > 0 ? (

                      getTripsForDate(selectedCalendarDate.getDate()).map((trip, idx) => (

                        <View key={idx} style={styles.calendarActivityCard}>

                          <View style={styles.calendarActivityIcon}>

                            <Ionicons name="airplane" size={16} color={ranaColors.primary} />

                          </View>

                          <View style={styles.calendarActivityBody}>

                            <Text style={styles.calendarActivityTitle}>

                              {trip.title || `${trip.origin} → ${trip.destination}`}

                            </Text>

                            <Text style={styles.calendarActivityLocation}>

                              {trip.origin} to {trip.destination}

                            </Text>

                            {trip.startDate && (

                              <Text style={styles.calendarActivityTime}>

                                {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}

                              </Text>

                            )}

                          </View>

                          <View style={styles.calendarActivityActions}>

                            <Ionicons name="chevron-forward" size={18} color={ranaColors.textSecondary} />

                          </View>

                        </View>

                      ))

                    ) : (

                      <View style={styles.calendarNoTripsState}>

                        <Ionicons name="calendar-outline" size={40} color={ranaColors.muted} />

                        <Text style={styles.calendarNoTripsText}>No trips scheduled</Text>

                      </View>

                    )}

                  </View>

                </>

              ) : (

                <View style={styles.calendarSelectPrompt}>

                  <Ionicons name="hand-left-outline" size={48} color={ranaColors.muted} />

                  <Text style={styles.calendarSelectPromptText}>Tap a date to view trips</Text>

                </View>

              )}

            </ScrollView>

            {/* DATE FILTER MODAL OVERLAY */}

            {dateFilterVisible && (

              <View style={styles.dateFilterOverlay}>

                <View style={styles.dateFilterPanel}>

                  {/* Header */}

                  <View style={styles.dateFilterHeader}>

                    <Text style={styles.dateFilterTitle}>Select Month & Year</Text>

                    <TouchableOpacity onPress={() => setDateFilterVisible(false)}>

                      <Ionicons name="close" size={24} color={ranaColors.textPrimary} />

                    </TouchableOpacity>

                  </View>

                  {/* Quick Actions */}

                  <View style={styles.dateFilterQuickActions}>

                    <TouchableOpacity 

                      style={styles.dateFilterQuickBtn}

                      onPress={handleFilterCurrentMonth}

                    >

                      <Text style={styles.dateFilterQuickBtnText}>Current Month</Text>

                    </TouchableOpacity>

                    <TouchableOpacity 

                      style={styles.dateFilterQuickBtn}

                      onPress={handleFilterReset}

                    >

                      <Text style={styles.dateFilterQuickBtnText}>Reset</Text>

                    </TouchableOpacity>

                  </View>

                  {/* Month Grid */}

                  <View style={styles.dateFilterSection}>

                    <Text style={styles.dateFilterSectionLabel}>Month</Text>

                    <View style={styles.dateFilterMonthGrid}>

                      {monthNames.map((month, idx) => (

                        <TouchableOpacity

                          key={idx}

                          style={[

                            styles.dateFilterMonthBtn,

                            filterTempMonth === idx && styles.dateFilterMonthBtnActive,

                          ]}

                          onPress={() => setFilterTempMonth(idx)}

                        >

                          <Text style={[

                            styles.dateFilterMonthBtnText,

                            filterTempMonth === idx && styles.dateFilterMonthBtnTextActive,

                          ]}>

                            {month.slice(0, 3)}

                          </Text>

                        </TouchableOpacity>

                      ))}

                    </View>

                  </View>

                  {/* Year List */}

                  <View style={styles.dateFilterSection}>

                    <Text style={styles.dateFilterSectionLabel}>Year</Text>

                    <ScrollView

                      horizontal

                      showsHorizontalScrollIndicator={false}

                      contentContainerStyle={styles.dateFilterYearScroll}

                    >

                      {YEAR_RANGE.map((year) => (

                        <TouchableOpacity

                          key={year}

                          style={[

                            styles.dateFilterYearBtn,

                            filterTempYear === year && styles.dateFilterYearBtnActive,

                          ]}

                          onPress={() => setFilterTempYear(year)}

                        >

                          <Text style={[

                            styles.dateFilterYearBtnText,

                            filterTempYear === year && styles.dateFilterYearBtnTextActive,

                          ]}>

                            {year}

                          </Text>

                        </TouchableOpacity>

                      ))}

                    </ScrollView>

                  </View>

                  {/* Action Buttons */}

                  <View style={styles.dateFilterActions}>

                    <TouchableOpacity

                      style={styles.dateFilterCancelBtn}

                      onPress={() => setDateFilterVisible(false)}

                    >

                      <Text style={styles.dateFilterCancelBtnText}>Cancel</Text>

                    </TouchableOpacity>

                    <TouchableOpacity

                      style={styles.dateFilterConfirmBtn}

                      onPress={handleFilterApply}

                    >

                      <Text style={styles.dateFilterConfirmBtnText}>Apply</Text>

                    </TouchableOpacity>

                  </View>

                </View>

              </View>

            )}

          </View>

        </View>

      </Modal>

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



  // â€”â€” Dashboard Header â€”â€”

  dashboardHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderRadius: 24,

    padding: 16,

    ...ranaShadow.card,

    marginTop: -15,

    marginBottom: 20,

  },

  heatmapMainContainer: {

    flex: 1,

    marginRight: 16,

  },

  heatmapMonthsRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    marginBottom: 8,

    paddingRight: 4,

  },

  heatmapMonthText: {

    fontSize: 10,

    color: ranaColors.textSecondary,

    fontWeight: '500',

  },

  heatmapGrid: {

    gap: 4,

  },

  heatmapDotRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

  },

  heatmapDot: {

    width: 6,

    height: 6,

    borderRadius: 3,

  },

  compactWeatherCard: {

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FAFAFA',

    paddingVertical: 12,

    paddingHorizontal: 16,

    borderRadius: 16,

    minWidth: 80,

  },

  weatherIconWrap: {

    marginBottom: 4,

  },

  compactWeatherTemp: {

    fontSize: 20,

    fontWeight: '800',

    color: ranaColors.textPrimary,

  },

  weatherHumidityRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 2,

    marginTop: 2,

  },

  compactWeatherHumidity: {

    fontSize: 11,

    color: ranaColors.textSecondary,

    fontWeight: '600',

  },

  compactWeatherLoc: {

    fontSize: 10,

    color: ranaColors.textSecondary,

    marginTop: 2,

  },





  // -- Elevated Header Card --

  headerCard: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: ranaColors.card,

    borderRadius: 24,

    paddingVertical: 18,

    paddingHorizontal: 20,

    marginBottom: 20,

    shadowColor: '#1B2B59',

    shadowOpacity: 0.08,

    shadowRadius: 12,

    shadowOffset: { width: 0, height: 4 },

    elevation: 3,

  },

  headerTextBlock: {

    flex: 1,

  },

  headerGradient: {

    borderRadius: 20,

    overflow: 'hidden',

    width: '100%',

  },

  headerInner: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: ranaSpacing.md,

    paddingVertical: 12,

  },

  heroLeft: {

    width: 64,

    height: 64,

    borderRadius: 16,

    overflow: 'hidden',

    marginRight: 12,

  },

  heroMascot: {

    width: 64,

    height: 64,

    borderRadius: 16,

    overflow: 'hidden',

    backgroundColor: 'transparent',

  },

  heroSvgClip: {

    width: 72,

    height: 72,

    borderRadius: 18,

    overflow: 'hidden',

    backgroundColor: '#FFFFFF',

  },

  heroPlaceholder: {

    width: 64,

    height: 64,

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

    opacity: 0.9,

  },



  // -- Hero Banner --

  heroBannerCard: {

    borderRadius: 24,

    marginBottom: 32,

    overflow: 'hidden',

    shadowColor: '#1B2B59',

    shadowOpacity: 0.28,

    shadowRadius: 18,

    shadowOffset: { width: 0, height: 6 },

    elevation: 7,

  },

  heroBannerGradient: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 20,

    paddingVertical: 20,

  },

  heroBannerLeft: {

    flex: 1,

    paddingRight: 12,

  },

  heroBannerLogoWrap: {

    width: 80,

    height: 80,

    borderRadius: 40,

    backgroundColor: 'rgba(255,255,255,0.12)',

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',

    borderWidth: 1.5,

    borderColor: 'rgba(255,255,255,0.25)',

  },

  heroBannerBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,

    backgroundColor: 'rgba(255,255,255,0.15)',

    alignSelf: 'flex-start',

    paddingHorizontal: 10,

    paddingVertical: 4,

    borderRadius: 20,

    marginBottom: 12,

  },

  heroBannerBadgeText: {

    fontSize: 10,

    fontWeight: '700',

    color: '#fff',

    letterSpacing: 1,

  },

  heroBannerName: {

    fontSize: 24,

    fontWeight: '800',

    color: '#fff',

    marginBottom: 2,

  },

  heroBannerSub: {

    fontSize: 13,

    color: 'rgba(255,255,255,0.72)',

    lineHeight: 20,

  },

  heroBannerWelcome: {

    fontSize: 11,

    color: 'rgba(255,255,255,0.55)',

    marginBottom: 4,

    lineHeight: 16,

  },

  heroBannerHighlight: {

    color: '#fff',

    fontWeight: '700',

  },

  heroBannerTagline: {

    fontSize: 11,

    color: 'rgba(255,255,255,0.45)',

    marginTop: 6,

    fontStyle: 'italic',

    letterSpacing: 0.3,

  },



  headerGreetingLarge: {

    fontSize: 18,

    fontWeight: '800',

    color: ranaColors.textPrimary,

    marginBottom: 4,

  },

  headerGreetingSub: {

    fontSize: 13,

    color: ranaColors.textSecondary,

    lineHeight: 18,

  },

  newTripButton: {

    backgroundColor: ranaColors.primary,

    paddingHorizontal: 12,

    paddingVertical: 8,

    borderRadius: 16,

    marginLeft: 12,

  },

  newTripText: {

    color: '#FFFFFF',

    fontWeight: '700',

  },

  headerGreeting: {

    fontSize: 16,

    fontWeight: '700',

    color: ranaColors.textPrimary,

    letterSpacing: -0.3,

    marginBottom: 5,

  },

  headerSubline: {

    fontSize: 13,

    color: ranaColors.textSecondary,

    lineHeight: 19,

  },

  headerHighlight: {

    color: ranaColors.primary,

    fontWeight: '700',

  },

  headerWelcomeButton: {

    backgroundColor: ranaColors.primary,

    paddingHorizontal: 12,

    paddingVertical: 6,

    borderRadius: 16,

    marginLeft: 8,

    justifyContent: 'center',

    alignItems: 'center',

  },

  headerWelcomeText: {

    color: '#FFFFFF',

    fontWeight: '700',

    fontSize: 12,

  },

  topWelcomeBar: {

    backgroundColor: 'transparent',

    paddingHorizontal: ranaSpacing.md,

    paddingVertical: 8,

    marginBottom: 8,

  },

  topWelcomeTitle: {

    fontSize: 18,

    fontWeight: '800',

    color: ranaColors.primary,

  },

  topWelcomeRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },

  headerNotifWrap: {

    position: 'relative',

    marginLeft: 8,

    padding: 4,

  },

  headerNotifDot: {

    position: 'absolute',

    top: 4,

    right: 4,

    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: '#E05C5C',

    zIndex: 1,

    borderWidth: 1.5,

    borderColor: ranaColors.card,

  },



  // -- Upcoming Trips --

  upcomingSection: {

    marginBottom: 24,

  },

  sectionHeaderTitle: {

    fontSize: 18,

    fontWeight: '800',

    color: ranaColors.textPrimary,

    marginBottom: 4,

  },

  sectionHeaderDesc: {

    fontSize: 13,

    color: ranaColors.textSecondary,

    marginBottom: 12,

  },

  upcomingCarouselWrap: {

    marginHorizontal: -ranaSpacing.md,

    paddingVertical: 6,

  },

  upcomingCarouselViewport: {

    position: 'relative',

  },

  upcomingCarouselScroll: {

    width: SCREEN_WIDTH,

    overflow: 'visible',

    alignItems: 'center',

    justifyContent: 'center',

  },

  upcomingBigCard: {

    backgroundColor: '#FFFFFF',

    borderRadius: 24,

    width: UPCOMING_CAROUSEL_ITEM_W,

    overflow: 'hidden',

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 12 },

    shadowOpacity: 0.28,

    shadowRadius: 20,

    elevation: 12,

  },

  cardBlurOverlay: {

    ...StyleSheet.absoluteFillObject,

    backgroundColor: 'rgba(255,255,255,0.7)',

    borderRadius: 24,

  },

  ticketHeaderGradient: {

    paddingHorizontal: 18,

    paddingTop: 16,

    paddingBottom: 20,

    overflow: 'hidden',

  },

  decorCircleTL: {

    position: 'absolute',

    top: -50,

    left: -50,

    width: 110,

    height: 110,

    borderRadius: 55,

  },

  decorCircleBR: {

    position: 'absolute',

    bottom: -45,

    right: -45,

    width: 90,

    height: 90,

    borderRadius: 45,

  },

  ticketHeaderRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 12,

    zIndex: 10,

  },

  ticketAirlineName: {

    fontSize: 11,

    fontWeight: '800',

    color: 'rgba(255,255,255,0.9)',

    letterSpacing: 2,

  },

  mapIconButton: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.18)',

    paddingHorizontal: 8,

    paddingVertical: 3,

    borderRadius: 8,

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,0.28)',

    gap: 4,

  },

  mapIconText: {

    color: '#fff',

    fontSize: 9,

    fontWeight: '700',

    letterSpacing: 0.8,

  },

  ticketClassBadge: {

    backgroundColor: 'rgba(255,255,255,0.18)',

    paddingHorizontal: 10,

    paddingVertical: 3,

    borderRadius: 8,

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,0.28)',

  },

  ticketClassBadgeText: {

    color: '#fff',

    fontSize: 9,

    fontWeight: '700',

    letterSpacing: 0.8,

  },

  ticketRouteRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 12,

  },

  ticketRouteAirport: {

    flex: 1,

  },

  ticketIataCode: {

    fontSize: 28,

    fontWeight: '900',

    color: '#fff',

    letterSpacing: -0.5,

    lineHeight: 32,

  },

  ticketCityName: {

    fontSize: 10,

    color: 'rgba(255,255,255,0.7)',

    fontWeight: '600',

    marginTop: 0,

  },

  ticketFlightPath: {

    flex: 1,

    alignItems: 'center',

  },

  ticketFlightLine: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 2,

  },

  ticketLineDot: {

    width: 4,

    height: 4,

    borderRadius: 2,

    backgroundColor: 'rgba(255,255,255,0.6)',

  },

  ticketLineBar: {

    flex: 1,

    height: 0.8,

    backgroundColor: 'rgba(255,255,255,0.4)',

  },

  ticketDuration: {

    color: 'rgba(255,255,255,0.75)',

    fontSize: 9,

    marginTop: 3,

    letterSpacing: 0.3,

    fontWeight: '600',

  },

  ticketTimeRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

  },

  ticketTimeText: {

    fontSize: 14,

    fontWeight: '800',

    color: '#fff',

    letterSpacing: 0.2,

  },

  ticketFlightCode: {

    fontSize: 10,

    color: 'rgba(255,255,255,0.75)',

    letterSpacing: 1,

    fontWeight: '700',

  },

  ticketTearRow: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#F8F9FB',

    height: 22,

  },

  ticketHalfCircle: {

    width: 22,

    height: 22,

    borderRadius: 11,

  },

  ticketHalfCircleLeft: {

    marginLeft: -11,

  },

  ticketHalfCircleRight: {

    marginRight: -11,

  },

  ticketDashedLineContainer: {

    flex: 1,

    flexDirection: 'row',

    justifyContent: 'space-evenly',

    alignItems: 'center',

    paddingHorizontal: 2,

  },

  ticketDash: {

    width: 4,

    height: 0.8,

    backgroundColor: '#D0DCF2',

    borderRadius: 0.5,

  },

  ticketCardBottom: {

    backgroundColor: '#F8F9FB',

    paddingHorizontal: 16,

    paddingTop: 12,

    paddingBottom: 14,

  },

  ticketTripTitle: {

    fontSize: 13,

    fontWeight: '800',

    color: '#0F1D3B',

    marginBottom: 10,

    letterSpacing: 0.2,

  },

  ticketDetailsGrid: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 8,

    marginBottom: 10,

  },

  ticketDetailItem: {

    width: '48%',

  },

  ticketDetailLabel: {

    fontSize: 8,

    color: ranaColors.textSecondary,

    letterSpacing: 1,

    fontWeight: '700',

    marginBottom: 2,

  },

  ticketDetailValue: {

    fontSize: 12,

    fontWeight: '700',

    color: '#0F1D3B',

    letterSpacing: 0.1,

  },

  ticketBudgetSection: {

    marginTop: 10,

    marginBottom: 8,

    paddingTop: 8,

    borderTopWidth: 0.8,

    borderTopColor: '#E0E8F5',

  },

  ticketBudgetHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    marginBottom: 3,

  },

  ticketBudgetLabel: {

    fontSize: 9,

    fontWeight: '700',

    color: '#0EA5E9',

    letterSpacing: 0.6,

  },

  ticketBudgetRange: {

    fontSize: 13,

    fontWeight: '800',

    color: '#0F1D3B',

    marginBottom: 4,

  },

  ticketBudgetNoteRow: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 4,

    marginBottom: 1,

  },

  ticketBudgetDot: {

    fontSize: 10,

    color: '#64748B',

    lineHeight: 16,

  },

  ticketBudgetNoteText: {

    fontSize: 10,

    color: '#64748B',

    flex: 1,

    lineHeight: 16,

  },

  ticketBarcodeRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    borderTopWidth: 0.8,

    borderTopColor: '#E0E8F5',

    paddingTop: 8,

  },

  ticketBarcodeContainer: {

    flexDirection: 'row',

    alignItems: 'flex-end',

    gap: 1,

    height: 18,

  },

  ticketBarcodeLine: {

    borderRadius: 0.5,

  },

  ticketStatusBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderRadius: 12,

    paddingHorizontal: 10,

    paddingVertical: 4,

    gap: 4,

  },

  ticketStatusDot: {

    width: 5,

    height: 5,

    borderRadius: 2.5,

  },

  ticketStatusTextSmall: {

    fontSize: 9,

    fontWeight: '800',

    letterSpacing: 0.6,

  },

  ticketShell: {

    flexDirection: 'row',

    minHeight: 212,

  },

  ticketMainSection: {

    flex: 1,

    paddingHorizontal: 18,

    paddingVertical: 16,

    backgroundColor: '#FFFFFF',

  },

  ticketTitle: {

    fontSize: 20,

    fontWeight: '800',

    color: '#0F1D3B',

    lineHeight: 26,

    marginBottom: 14,

  },

  ticketDetailsContainer: {

    gap: 10,

    marginBottom: 14,

  },

  ticketInfoRow: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 10,

  },

  ticketIconBox: {

    width: 32,

    height: 20,

    borderRadius: 10,

    backgroundColor: ranaColors.primary,

    justifyContent: 'center',

    alignItems: 'center',

    marginTop: 1,

  },

  ticketInfoContent: {

    flex: 1,

    justifyContent: 'center',

  },

  ticketInfoLabel: {

    fontSize: 9,

    fontWeight: '700',

    color: ranaColors.textSecondary,

    letterSpacing: 0.8,

    marginBottom: 2,

  },

  ticketInfoText: {

    fontSize: 13,

    fontWeight: '600',

    color: ranaColors.textPrimary,

    lineHeight: 18,

  },

  ticketCostSection: {

    backgroundColor: '#F0F4FF',

    paddingHorizontal: 14,

    paddingVertical: 14,

    borderRadius: 14,

    marginBottom: 12,

    borderLeftWidth: 4,

    borderLeftColor: ranaColors.primary,

  },

  ticketCostLabel: {

    fontSize: 9,

    fontWeight: '800',

    color: ranaColors.textSecondary,

    letterSpacing: 1.2,

    marginBottom: 6,

  },

  ticketCostValue: {

    fontSize: 28,

    fontWeight: '900',

    color: ranaColors.primary,

    lineHeight: 34,

  },

  ticketFooterRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: 10,

  },

  ticketStatusBadgeLegacy: {

    backgroundColor: '#E8EFF9',

    paddingHorizontal: 11,

    paddingVertical: 6,

    borderRadius: 8,

    borderWidth: 1,

    borderColor: '#D0DCF2',

  },

  ticketStatusText: {

    fontSize: 9,

    fontWeight: '800',

    color: '#1B2B59',

    letterSpacing: 1,

  },

  ticketCodeText: {

    fontSize: 11,

    fontWeight: '700',

    color: ranaColors.textSecondary,

    letterSpacing: 0.5,

  },

  ticketDividerSection: {

    width: 1,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F0F4FF',

    position: 'relative',

  },

  ticketDividerDashed: {

    width: 1,

    flex: 1,

    height: 1,

    borderLeftWidth: 1,

    borderStyle: 'dashed',

    borderColor: '#D0DCF2',

  },

  ticketCutTop: {

    position: 'absolute',

    top: -10,

    width: 20,

    height: 20,

    borderRadius: 10,

    backgroundColor: ranaColors.backgroundTop,

  },

  ticketCutBottom: {

    position: 'absolute',

    bottom: -10,

    width: 20,

    height: 20,

    borderRadius: 10,

    backgroundColor: ranaColors.backgroundTop,

  },

  ticketPunchHole: {

    position: 'absolute',

    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: '#DCE5F6',

    top: '50%',

    marginTop: -4,

  },

  ticketAdmitText: {

    position: 'absolute',

    left: -22,

    top: '50%',

    marginTop: -30,

    transform: [{ rotate: '-90deg' }],

    fontSize: 9,

    letterSpacing: 2,

    fontWeight: '700',

    color: '#7D8BAB',

  },

  ticketStubSection: {

    width: '28%',

    paddingVertical: 14,

    paddingHorizontal: 10,

    justifyContent: 'center',

    alignItems: 'center',

    backgroundColor: '#FAFCFF',

  },

  ticketQrBox: {

    width: 60,

    height: 60,

    borderRadius: 8,

    borderWidth: 1.5,

    borderColor: '#D0DCF2',

    backgroundColor: '#FFFFFF',

    position: 'relative',

    marginBottom: 10,

  },

  ticketQrCell: {

    position: 'absolute',

    width: 14,

    height: 14,

    backgroundColor: '#C7D3EC',

    borderRadius: 2,

  },

  ticketQrCellDark: {

    backgroundColor: '#243B6A',

  },

  ticketQrPos1: { top: 6, left: 6 },

  ticketQrPos2: { top: 6, right: 6 },

  ticketQrPos3: { top: 23, left: 23 },

  ticketQrPos4: { bottom: 6, left: 6 },

  ticketQrPos5: { bottom: 6, right: 6 },

  ticketQrPos6: { top: 23, right: 6 },

  ticketStubLabel: {

    fontSize: 9,

    fontWeight: '800',

    color: '#334C7A',

    letterSpacing: 0.5,

    marginBottom: 3,

  },

  ticketStubSeat: {

    fontSize: 9,

    fontWeight: '700',

    color: '#5A6D95',

    textTransform: 'uppercase',

  },

  ticketBottomMeta: {

    marginTop: 10,

    paddingTop: 10,

    borderTopWidth: 1,

    borderColor: '#E8EEF9',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: 8,

  },

  ticketMiniPill: {

    paddingHorizontal: 10,

    paddingVertical: 4,

    borderRadius: 999,

    backgroundColor: '#EAF0FD',

  },

  ticketMiniPillText: {

    fontSize: 10,

    fontWeight: '800',

    color: '#1B2B59',

    letterSpacing: 0.5,

  },

  upcomingCostText: {

    fontSize: 11,

    fontWeight: '700',

    color: ranaColors.primary,

  },

  ticketHeaderDestination: {

    fontSize: 22,

    fontWeight: '800',

    color: '#fff',

    letterSpacing: 0.5,

  },

  ticketHeaderCountry: {

    fontSize: 12,

    fontWeight: '600',

    color: 'rgba(255,255,255,0.78)',

    marginTop: 3,

  },

  carouselDots: {

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    marginTop: 24,

    marginBottom: 8,

    gap: 6,

  },

  carouselDot: {

    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: '#D6E0F5',

  },

  carouselDotActive: {

    width: 18,

    backgroundColor: ranaColors.primary,

  },



  destinationHeader: {

    marginTop: 130,

    marginBottom: 16,

  },

  destinationTitle: {

    fontSize: 28,

    fontWeight: '800',

    color: ranaColors.textPrimary,

  },



  // Calendar Timeline styles

  calendarSection: {

    marginTop: 16,

    marginBottom: 8,

  },

  calendarScroll: {

    gap: 12,

    paddingBottom: 8,

  },

  calDayBox: {

    alignItems: 'center',

    justifyContent: 'center',

    width: 54,

    height: 74,

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

    ...ranaShadow.card,

  },

  calDayToday: {

    backgroundColor: ranaColors.primary,

  },

  calDayLabel: {

    fontSize: 11,

    color: ranaColors.textSecondary,

    marginBottom: 4,

  },

  calDayNumber: {

    fontSize: 16,

    fontWeight: '700',

    color: ranaColors.textPrimary,

    marginBottom: 4,

  },

  calDayTodayText: {

    color: '#FFFFFF',

  },

  calDot: {

    width: 6,

    height: 6,

    borderRadius: 3,

  },

  calLegendRow: {

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 8,

  },

  calDotLegend: {

    width: 10,

    height: 10,

    borderRadius: 5,

    marginRight: 6,

  },

  calLegendText: {

    fontSize: 12,

    color: ranaColors.textSecondary,

  },



  // Ã¢â€â‚¬Ã¢â€â‚¬ Header Ã¢â€â‚¬Ã¢â€â‚¬

  topRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: ranaSpacing.sm,

  },

  logoTitle: { fontSize: 24, fontWeight: '800', color: ranaColors.textPrimary },

  tagline: { fontSize: 14, color: ranaColors.textSecondary, marginTop: 2 },



  greetingCard: {

    backgroundColor: ranaColors.card, borderRadius: ranaRadius.lg,

    padding: ranaSpacing.md, marginTop: ranaSpacing.xs,

    marginBottom: ranaSpacing.sm, ...ranaShadow.card,

  },

  greetingTitle: { fontSize: 20, fontWeight: '700', color: ranaColors.textPrimary, marginBottom: ranaSpacing.xs },

  greetingBody: { fontSize: 14, color: ranaColors.textSecondary, lineHeight: 20 },



  // Ã¢â€â‚¬Ã¢â€â‚¬ Stats Ã¢â€â‚¬Ã¢â€â‚¬

  statsRow: { flexDirection: 'row', gap: ranaSpacing.sm, marginBottom: ranaSpacing.sm },

  statCard: {

    flex: 1, backgroundColor: ranaColors.card,

    borderRadius: ranaRadius.md, padding: ranaSpacing.sm, ...ranaShadow.soft,

  },

  statLabel: { fontSize: 13, color: ranaColors.textSecondary },

  statValue: { marginTop: 6, fontSize: 18, fontWeight: '700', color: ranaColors.textPrimary },



  // Ã¢â€â‚¬Ã¢â€â‚¬ Weather Ã¢â€â‚¬Ã¢â€â‚¬

  weatherCard: {

    backgroundColor: ranaColors.card, borderRadius: ranaRadius.md,

    padding: ranaSpacing.sm, flexDirection: 'row', alignItems: 'center',

    justifyContent: 'space-between', marginBottom: ranaSpacing.sm, ...ranaShadow.soft,

  },

  sectionHeading: { fontSize: 16, fontWeight: '600', color: ranaColors.textPrimary },

  weatherText: { marginTop: 4, fontSize: 14, color: ranaColors.textSecondary },



  // Ã¢â€â‚¬Ã¢â€â‚¬ Heatmap Ã¢â€â‚¬Ã¢â€â‚¬

  heatmapCard: {

    backgroundColor: ranaColors.card, borderRadius: ranaRadius.md,

    padding: ranaSpacing.sm, marginBottom: ranaSpacing.md, ...ranaShadow.soft,

  },

  heatGrid: { marginTop: ranaSpacing.xs, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  heatCell: { width: 16, height: 16, borderRadius: 6 },



  // Ã¢â€â‚¬Ã¢â€â‚¬ Discover header Ã¢â€â‚¬Ã¢â€â‚¬

  discoverHeader: { marginBottom: ranaSpacing.sm },

  discoverTitle: { fontSize: 20, fontWeight: '800', color: ranaColors.textPrimary },

  discoverSubtitle: { fontSize: 13, color: ranaColors.textSecondary, marginTop: 3 },



  // Ã¢â€â‚¬Ã¢â€â‚¬ Filter chips Ã¢â€â‚¬Ã¢â€â‚¬

  filterRow: { gap: 8, paddingBottom: ranaSpacing.sm },

  filterChip: {

    paddingHorizontal: 16, paddingVertical: 8,

    borderRadius: ranaRadius.pill,

    backgroundColor: ranaColors.card,

    borderWidth: 1.5, borderColor: ranaColors.accent,

  },

  filterChipActive: { backgroundColor: ranaColors.primary, borderColor: ranaColors.primary },

  filterChipText: { fontSize: 13, fontWeight: '600', color: ranaColors.textSecondary },

  filterChipTextActive: { color: '#fff' },



  // Ã¢â€â‚¬Ã¢â€â‚¬ Destination card Ã¢â€â‚¬Ã¢â€â‚¬

  destCard: {

    backgroundColor: ranaColors.card,

    borderRadius: ranaRadius.lg,

    marginBottom: ranaSpacing.sm,

    overflow: 'hidden',

    ...ranaShadow.card,

  },

  destImage: {

    width: '100%',

    height: 200,

    justifyContent: 'flex-end',

  },

  destImageOverlay: {

    flex: 1,

    borderRadius: ranaRadius.lg,

    padding: 14,

    justifyContent: 'space-between',

    alignItems: 'flex-start',

  },

  destTag: {

    paddingHorizontal: 10,

    paddingVertical: 4,

    borderRadius: ranaRadius.pill,

  },

  destTagText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  destImageBottom: { width: '100%' },

  destNameOnImage: { fontSize: 20, fontWeight: '800', color: '#fff' },

  destLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },

  destLocationText: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },



  // Info chips row

  destInfoRow: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between', // Use space-between for better distribution

    gap: 8, // Reset gap to a reasonable value

    paddingHorizontal: 14,

    paddingTop: 12,

  },

  destInfoChip: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,

    backgroundColor: ranaColors.accent,

    paddingHorizontal: 10,

    paddingVertical: 6,

    borderRadius: ranaRadius.pill,

  },

  destInfoChipText: { fontSize: 12, fontWeight: '600', color: ranaColors.textPrimary },



  // Description

  destDescription: {

    fontSize: 13,

    color: ranaColors.textSecondary,

    lineHeight: 20,

    paddingHorizontal: 14,

    paddingTop: 10,

  },

  destExpandRow: { paddingHorizontal: 14, paddingVertical: 10 },

  destExpandHint: { fontSize: 12, fontWeight: '600', color: ranaColors.primary },

  // Calendar button
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: ranaColors.accent,
  },
  calendarBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ranaColors.primary,
  },

  // Weather card row (replaces dashboard header)
  weatherCardRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -15,
    marginBottom: 20,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Trip Calendar Modal Styles (Reorganized Hierarchy)
  // ──────────────────────────────────────────────────────────────────────────
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  calendarModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    height: '92%',
    paddingTop: 0,
    paddingBottom: 0,
    overflow: 'hidden',
    flexDirection: 'column',
  },

  // 1. TOP HEADER
  calendarTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF9',
    backgroundColor: '#FAFAFA',
  },
  calendarHeaderBtn: {
    padding: 8,
  },
  calendarHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: ranaColors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  calendarHeaderSpacer: {
    width: 44,
  },

  // 2. MONTH & YEAR NAVIGATION BAR
  calendarNavBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0EAFF',
  },
  calendarMonthNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(27,43,89,0.05)',
  },
  calendarMonthDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  calendarMonthText: {
    fontSize: 14,
    fontWeight: '700',
    color: ranaColors.primary,
  },
  calendarYearText: {
    fontSize: 12,
    fontWeight: '600',
    color: ranaColors.textSecondary,
    marginTop: 2,
  },

  // SCROLLABLE CONTENT AREA
  calendarContentScroll: {
    flex: 1,
  },
  calendarContentContainer: {
    paddingBottom: 24,
  },

  // 3. CALENDAR GRID (FIXED SIZE)
  calendarGridSection: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  calendarWeekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 6,
    paddingHorizontal: 2,
  },
  calendarWeekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  calendarWeekdayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: ranaColors.textSecondary,
  },
  calendarDaysGrid: {
    gap: 6,
  },
  calendarGridWeek: {
    flexDirection: 'row',
    gap: 6,
  },
  // DATE CELL - PERFECTLY UNIFORM SIZE
  calendarGridDay: {
    flex: 1,
    aspectRatio: 1 / 1,
    borderRadius: 8,
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: '#E0EAFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 0,
    maxWidth: '100%',
  },
  calendarGridDayHasTrips: {
    backgroundColor: ranaColors.primary,
    borderColor: ranaColors.primary,
    borderWidth: 1,
  },
  calendarGridDaySelected: {
    borderWidth: 2,
    borderColor: ranaColors.primary,
    backgroundColor: '#F5F9FF',
  },
  calendarGridDayToday: {
    backgroundColor: '#FFE8B6',
    borderColor: '#FFA500',
    borderWidth: 1.5,
  },
  calendarGridDayEmpty: {
    flex: 1,
    aspectRatio: 1 / 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  calendarGridDayNum: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B8C1',
    lineHeight: 14,
  },
  calendarGridDayNumActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarGridDayNumSelected: {
    color: ranaColors.primary,
    fontWeight: '700',
  },
  calendarGridDayDot: {
    display: 'none',
  },

  // 4. SELECTED DAY SUMMARY (TIGHT, DIRECT FLOW)
  calendarDaySummary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EEF3FF',
    borderBottomWidth: 1,
    borderBottomColor: '#D0E4FF',
  },
  calendarDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: ranaColors.primary,
  },
  calendarDayDate: {
    fontSize: 15,
    fontWeight: '700',
    color: ranaColors.textPrimary,
    marginTop: 2,
  },

  // 5. DAILY TRIP LIST (DIRECT, NO SCROLL WRAPPER)
  calendarDayActivitiesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  calendarActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F4FF',
  },
  calendarActivityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  calendarActivityBody: {
    flex: 1,
  },
  calendarActivityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  calendarActivityLocation: {
    fontSize: 12,
    color: ranaColors.textSecondary,
    marginTop: 2,
  },
  calendarActivityTime: {
    fontSize: 11,
    color: ranaColors.primary,
    fontWeight: '600',
    marginTop: 3,
  },
  calendarActivityActions: {
    padding: 6,
  },

  // 6. EMPTY STATES
  calendarNoTripsState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  calendarNoTripsText: {
    fontSize: 14,
    fontWeight: '600',
    color: ranaColors.textSecondary,
  },
  calendarSelectPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  calendarSelectPromptText: {
    fontSize: 15,
    fontWeight: '600',
    color: ranaColors.textSecondary,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Date Filter Styles
  // ──────────────────────────────────────────────────────────────────────────
  dateFilterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  dateFilterPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  dateFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF9',
  },
  dateFilterTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  dateFilterQuickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dateFilterQuickBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#D0E4FF',
    alignItems: 'center',
  },
  dateFilterQuickBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: ranaColors.primary,
  },
  dateFilterSection: {
    marginBottom: 24,
  },
  dateFilterSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ranaColors.textPrimary,
    marginBottom: 10,
  },
  dateFilterMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateFilterMonthBtn: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5F9FF',
    borderWidth: 1.5,
    borderColor: '#E0EAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateFilterMonthBtnActive: {
    backgroundColor: ranaColors.primary,
    borderColor: ranaColors.primary,
  },
  dateFilterMonthBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: ranaColors.textSecondary,
  },
  dateFilterMonthBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateFilterYearScroll: {
    gap: 8,
    paddingRight: 16,
  },
  dateFilterYearBtn: {
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F5F9FF',
    borderWidth: 1.5,
    borderColor: '#E0EAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateFilterYearBtnActive: {
    backgroundColor: ranaColors.primary,
    borderColor: ranaColors.primary,
  },
  dateFilterYearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: ranaColors.textSecondary,
  },
  dateFilterYearBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateFilterActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dateFilterCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#D0E4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateFilterCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: ranaColors.primary,
  },
  dateFilterConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: ranaColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateFilterConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calendarFilterBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(27,43,89,0.05)',
  },

  // DEPRECATED - keeping for cleanup
  calendarEmptyState: {
    display: 'none',
  },
  calendarEmptyInitial: {
    display: 'none',
  },
  calendarEmptyStateText: {
    display: 'none',
  },
  calendarEmptyStateSubtext: {
    display: 'none',
  },
  calendarEmptyInitialText: {
    display: 'none',
  },
  calendarAddActivityBtn: {
    display: 'none',
  },
  calendarAddActivityBtnText: {
    display: 'none',
  },

});

