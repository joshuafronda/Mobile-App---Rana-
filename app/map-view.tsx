/**
 * map-view.tsx — Live Route Tracker
 *
 * Shows your current GPS position as a pulsing dot moving in real-time
 * on top of the drawn OSRM route between origin and destination.
 *
 * Params: origin, destination, transport, title, accent (optional hex color)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function accentFromTransport(t: string): string {
  if (t.toLowerCase().includes('airplane') || t.toLowerCase().includes('flight')) return '#1B2B59';
  if (['ferry', 'fastcraft', 'bangka', 'cruise'].some(s => t.toLowerCase().includes(s))) return '#0284C7';
  return '#F59E0B'; // land default
}

async function nominatimGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!query?.trim()) return null;
  const headers = { 'Accept-Language': 'en', 'User-Agent': 'TravelApp/1.0' };
  const base = 'https://nominatim.openstreetmap.org/search?format=json&limit=1';

  // 1st attempt: bias to the Philippines for accuracy
  try {
    const url = `${base}&countrycodes=ph&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (data?.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}

  // 2nd attempt: global search (handles international destinations)
  try {
    const url = `${base}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (data?.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}

  return null;
}

function formatPHP(v: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(v);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — transport mode classification
// ─────────────────────────────────────────────────────────────────────────────

/** Returns 'air' | 'sea' | 'land' based on transport type string */
function routeMode(t: string): 'air' | 'sea' | 'land' {
  const lower = t.toLowerCase();
  if (lower.includes('airplane') || lower.includes('flight')) return 'air';
  if (['ferry', 'fastcraft', 'bangka', 'cruise'].some(s => lower.includes(s))) return 'sea';
  return 'land';
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaflet HTML (live tracking map)
// mode = 'air'  → dashed straight line + plane icon label
// mode = 'sea'  → dashed curved great-circle arc + wave label
// mode = 'land' → solid OSRM road route
// ─────────────────────────────────────────────────────────────────────────────

function buildTrackHtml(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
  accent: string,
  mode: 'air' | 'sea' | 'land',
): string {
  // For air/sea we compute a great-circle arc with N intermediate points so it
  // curves naturally on the Mercator projection. For short domestic hops it
  // stays practically straight which is fine.
  const arcScript = `
  /* Great-circle arc (air / sea) */
  function toRad(d){return d*Math.PI/180;}
  function toDeg(r){return r*180/Math.PI;}
  function greatCircleArc(from,to,steps){
    var pts=[];
    var lat1=toRad(from.lat),lon1=toRad(from.lng);
    var lat2=toRad(to.lat),  lon2=toRad(to.lng);
    for(var i=0;i<=steps;i++){
      var f=i/steps;
      var A=Math.sin((1-f)*Math.acos(Math.sin(lat1)*Math.sin(lat2)+Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1)));
      var B=Math.sin(f       *Math.acos(Math.sin(lat1)*Math.sin(lat2)+Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1)));
      var denom=Math.sin(Math.acos(Math.sin(lat1)*Math.sin(lat2)+Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1)));
      if(denom<0.0001){pts.push([from.lat+f*(to.lat-from.lat),from.lng+f*(to.lng-from.lng)]);continue;}
      var x=A*Math.cos(lat1)*Math.cos(lon1)+B*Math.cos(lat2)*Math.cos(lon2);
      var y=A*Math.cos(lat1)*Math.sin(lon1)+B*Math.cos(lat2)*Math.sin(lon2);
      var z=A*Math.sin(lat1)               +B*Math.sin(lat2);
      pts.push([toDeg(Math.atan2(z,Math.sqrt(x*x+y*y))),toDeg(Math.atan2(y,x))]);
    }
    return pts;
  }`;

  // Dash pattern used for air & sea lines
  // Leaflet doesn't natively support SVG dash arrays on polylines in all
  // versions, so we layer: a thin solid base + a wide dashed overlay.
  const airSeaRouteScript = `
  var arcPts = greatCircleArc(FROM, TO, 80);
  /* Subtle base line */
  L.polyline(arcPts,{color:ACCENT,weight:2,opacity:0.25}).addTo(map);
  /* Dashed overlay */
  L.polyline(arcPts,{
    color:ACCENT,weight:${mode === 'air' ? 4 : 3},opacity:0.9,
    dashArray:'${mode === 'air' ? '14, 10' : '6, 8'}',
    lineCap:'round',lineJoin:'round'
  }).addTo(map);
  /* Midpoint icon label */
  var mid=arcPts[Math.floor(arcPts.length/2)];
  var modeEmoji='${mode === 'air' ? '✈' : '⛵'}';
  L.marker(mid,{
    icon:L.divIcon({
      html:'<div style="font-size:20px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,.3))">'+modeEmoji+'</div>',
      iconSize:[24,24],iconAnchor:[12,12],className:''
    }),
    interactive:false
  }).addTo(map);
  var lineBounds=L.polyline(arcPts).getBounds();
  map.fitBounds(lineBounds,{padding:[80,40]});
  /* Approximate distance from coords */
  var R=6371;
  var dLat=toRad(TO.lat-FROM.lat),dLon=toRad(TO.lng-FROM.lng);
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(FROM.lat))*Math.cos(toRad(TO.lat))*Math.sin(dLon/2)*Math.sin(dLon/2);
  var km=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'routeReady',distanceKm:parseFloat(km.toFixed(1)),durationMin:null}));`;

  const landRouteScript = `
  fetch('https://router.project-osrm.org/route/v1/driving/'+FROM.lng+','+FROM.lat+';'+TO.lng+','+TO.lat+'?overview=full&geometries=geojson')
  .then(function(r){return r.json();})
  .then(function(d){
    if(!d.routes||!d.routes.length){
      /* Fallback: straight line */
      L.polyline([[FROM.lat,FROM.lng],[TO.lat,TO.lng]],{color:ACCENT,weight:4,opacity:0.7,dashArray:'8,6'}).addTo(map);
      map.fitBounds([[FROM.lat,FROM.lng],[TO.lat,TO.lng]],{padding:[80,40]});
      return;
    }
    var r=d.routes[0];
    var coords=r.geometry.coordinates.map(function(c){return[c[1],c[0]];});
    /* Soft shadow underline */
    L.polyline(coords,{color:'#000',weight:9,opacity:0.07}).addTo(map);
    /* Main road line */
    L.polyline(coords,{color:ACCENT,weight:5,opacity:0.92,lineCap:'round',lineJoin:'round'}).addTo(map);
    map.fitBounds(L.polyline(coords).getBounds(),{padding:[80,30]});
    var km=(r.distance/1000).toFixed(1),min=Math.round(r.duration/60);
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'routeReady',distanceKm:parseFloat(km),durationMin:min}));
  })
  .catch(function(){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'routeError'}));
  });`;

  const routeBlock = mode === 'land' ? landRouteScript : `${arcScript}\n  ${airSeaRouteScript}`;

  // Origin/Destination marker style differs per mode
  const fromLabel = mode === 'air' ? 'Departure Airport' : mode === 'sea' ? 'Port of Origin' : 'Origin';
  const toLabel   = mode === 'air' ? 'Arrival Airport'   : mode === 'sea' ? 'Port of Destination' : 'Destination';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body,#map{width:100%;height:100%;background:#e8ecf0;}
/* Pulsing live-location dot */
@keyframes pulse{0%{transform:scale(1);opacity:1}70%{transform:scale(2.4);opacity:0}100%{transform:scale(1);opacity:0}}
.you-dot{position:relative;width:22px;height:22px;}
.you-dot-core{position:absolute;inset:4px;background:${accent};border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.4);}
.you-dot-ring{position:absolute;inset:0;background:${accent};border-radius:50%;opacity:0.35;animation:pulse 2s ease-out infinite;}
/* Marker labels */
.end-label{
  background:#fff;border:2px solid ${accent};border-radius:8px;
  padding:3px 8px;font-size:11px;font-weight:700;color:${accent};
  white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.2);
  transform:translateY(-28px);
}
</style>
</head>
<body>
<div id="map"></div>
<script>
(function(){
  var FROM={lat:${fromLat},lng:${fromLng}};
  var TO={lat:${toLat},lng:${toLng}};
  var ACCENT='${accent}';

  var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([FROM.lat,FROM.lng],6);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd'}).addTo(map);

  /* ── Terminal markers ───────────────────────────────── */
  function endMarker(lat,lng,label,fill){
    return L.marker([lat,lng],{
      icon:L.divIcon({
        html:'<div style="display:flex;flex-direction:column;align-items:center">'
          +'<div style="width:14px;height:14px;background:'+fill+';border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>'
          +'<div class=\\"end-label\\" style=\\"border-color:'+fill+';color:'+fill+'\\">'+label+'</div>'
          +'</div>',
        iconSize:[80,40],iconAnchor:[40,14],className:''
      })
    }).addTo(map);
  }
  endMarker(FROM.lat,FROM.lng,'${fromLabel}','#22C55E');
  endMarker(TO.lat,TO.lng,'${toLabel}','#EF4444');

  /* ── Live "You" marker ──────────────────────────────── */
  var youIcon=L.divIcon({
    html:'<div class="you-dot"><div class="you-dot-ring"></div><div class="you-dot-core"></div></div>',
    iconSize:[22,22],iconAnchor:[11,11],className:''
  });
  var youMarker=L.marker([FROM.lat,FROM.lng],{icon:youIcon,zIndexOffset:1000}).addTo(map);

  /* ── Route drawing ──────────────────────────────────── */
  ${routeBlock}

  /* ── Receive location / control messages ────────────── */
  function handleMsg(raw){
    try{
      var d=JSON.parse(raw);
      if(d.type==='loc'){
        youMarker.setLatLng([d.lat,d.lng]);
      } else if(d.type==='center'){
        map.setView(youMarker.getLatLng(),15);
      }
    }catch(e){}
  }
  document.addEventListener('message',function(e){handleMsg(e.data);});
  window.addEventListener('message',function(e){handleMsg(e.data);});
})();
</script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

type Stage = 'geocoding' | 'ready' | 'error';

export default function MapViewScreen() {
  const params = useLocalSearchParams<{
    origin: string;
    destination: string;
    transport?: string;
    title?: string;
    accent?: string;
    distanceKm?: string;
    totalCost?: string;
  }>();

  const originStr      = params.origin      ?? '';
  const destinationStr = params.destination ?? '';
  const transport      = params.transport   ?? '';
  const tripTitle      = params.title       ?? '';
  const distanceKm     = params.distanceKm  ? parseFloat(params.distanceKm) : 0;
  const totalCost      = params.totalCost   ? parseFloat(params.totalCost)  : 0;
  const accent         = params.accent      ?? accentFromTransport(transport);
  const mode           = routeMode(transport);

  const [stage,        setStage]        = useState<Stage>('geocoding');
  const [fromCoords,   setFromCoords]   = useState<{ lat: number; lng: number } | null>(null);
  const [toCoords,     setToCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const [routeKm,      setRouteKm]      = useState<number>(distanceKm);
  const [routeMin,     setRouteMin]     = useState<number | null>(null);
  const [userLat,      setUserLat]      = useState<number | null>(null);
  const [userLng,      setUserLng]      = useState<number | null>(null);
  const [tracking,     setTracking]     = useState(false);
  const [centered,     setCentered]     = useState(false);
  const [geocodeErr,   setGeocodeErr]   = useState<string>('');

  const webRef   = useRef<WebView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the tracking dot in native HUD
  useEffect(() => {
    if (!tracking) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tracking, pulseAnim]);

  // Geocode origin + destination on mount
  useEffect(() => {
    if (!originStr || !destinationStr) {
      setGeocodeErr('Origin or destination is missing.');
      setStage('error');
      return;
    }
    (async () => {
      const [from, to] = await Promise.all([
        nominatimGeocode(originStr),
        nominatimGeocode(destinationStr),
      ]);
      if (!from && !to) {
        setGeocodeErr(`Could not locate:\n"${originStr}"\n"${destinationStr}"`);
        setStage('error');
        return;
      }
      if (!from) {
        setGeocodeErr(`Could not locate origin:\n"${originStr}"`);
        setStage('error');
        return;
      }
      if (!to) {
        setGeocodeErr(`Could not locate destination:\n"${destinationStr}"`);
        setStage('error');
        return;
      }
      setFromCoords(from);
      setToCoords(to);
      setStage('ready');
    })();
  }, [originStr, destinationStr]);

  // Start GPS watch when map is ready
  useEffect(() => {
    if (stage !== 'ready') return;
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !mounted) return;
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5, timeInterval: 2000 },
        (pos) => {
          if (!mounted) return;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLat(lat);
          setUserLng(lng);
          setTracking(true);
          webRef.current?.injectJavaScript(
            `handleMsg(${JSON.stringify(JSON.stringify({ type: 'loc', lat, lng }))});true;`
          );
        }
      );
    })();
    return () => {
      mounted = false;
      watchRef.current?.remove();
    };
  }, [stage]);

  function handleWebMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'routeReady') {
        setRouteKm(msg.distanceKm);
        setRouteMin(msg.durationMin);
      }
    } catch {}
  }

  function centerOnMe() {
    webRef.current?.injectJavaScript(
      `handleMsg(${JSON.stringify(JSON.stringify({ type: 'center' }))});true;`
    );
    setCentered(true);
    setTimeout(() => setCentered(false), 2000);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* Native back header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={ranaColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {tripTitle || `${originStr} → ${destinationStr}`}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {originStr}  →  {destinationStr}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* Map area */}
      <View style={styles.mapArea}>
        {stage === 'geocoding' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={accent} />
            <Text style={styles.loadingText}>Locating route…</Text>
            <Text style={styles.loadingSub}>
              {originStr}{'  →  '}{destinationStr}
            </Text>
          </View>
        )}

        {stage === 'error' && (
          <View style={styles.center}>
            <Ionicons name="location-outline" size={52} color={ranaColors.muted} />
            <Text style={styles.errorText}>Could not locate this route.</Text>
            <Text style={styles.errorSub}>
              {geocodeErr || 'Check that origin and destination are valid place names.'}
            </Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: accent }]} onPress={() => router.back()}>
              <Text style={styles.retryBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'ready' && fromCoords && toCoords && (
          <WebView
            ref={webRef}
            source={{ html: buildTrackHtml(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng, accent, mode) }}
            style={styles.webview}
            onMessage={handleWebMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="compatibility"
          />
        )}

        {/* Center-on-me button */}
        {stage === 'ready' && tracking && (
          <TouchableOpacity
            style={[styles.centerBtn, { borderColor: accent }]}
            onPress={centerOnMe}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons
                name={centered ? 'locate' : 'navigate-outline'}
                size={22}
                color={accent}
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom HUD */}
      {stage === 'ready' && (
        <SafeAreaView edges={['bottom']} style={styles.hud}>
          {/* Live tracking pill */}
          <View style={styles.hudTrackRow}>
            <View style={[styles.liveTag, tracking ? { backgroundColor: accent + '20', borderColor: accent + '60' } : {}]}>
              <View style={[styles.liveDot, { backgroundColor: tracking ? accent : '#9CA3AF' }]} />
              <Text style={[styles.liveText, { color: tracking ? accent : '#9CA3AF' }]}>
                {tracking ? 'Live Tracking' : 'Waiting for GPS…'}
              </Text>
            </View>
            {transport ? (
              <View style={styles.transportTag}>
                <Ionicons
                  name={mode === 'air' ? 'airplane' : mode === 'sea' ? 'boat-outline' : 'car-outline'}
                  size={12}
                  color={ranaColors.textSecondary}
                />
                <Text style={styles.transportTagText}>{transport}</Text>
                {mode !== 'land' && (
                  <Text style={[styles.transportTagBadge, { color: accent }]}>
                    {mode === 'air' ? '- - - ✈' : '~~ ⛵'}
                  </Text>
                )}
              </View>
            ) : null}
          </View>

          {/* Route info */}
          <View style={styles.hudRouteRow}>
            <View style={styles.hudDot} />
            <Text style={styles.hudOrigin} numberOfLines={1}>{originStr}</Text>
          </View>
          <View style={[styles.hudRouteRow, { marginTop: 4 }]}>
            <View style={[styles.hudDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.hudDest} numberOfLines={1}>{destinationStr}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {routeKm > 0 && (
              <View style={styles.statPill}>
                <Ionicons name="resize-outline" size={13} color={accent} />
                <Text style={styles.statVal}>{routeKm.toFixed(1)} km</Text>
              </View>
            )}
            {routeMin !== null && (
              <View style={styles.statPill}>
                <Ionicons name="time-outline" size={13} color={accent} />
                <Text style={styles.statVal}>~{routeMin} min</Text>
              </View>
            )}
            {totalCost > 0 && (
              <View style={styles.statPill}>
                <Ionicons name="cash-outline" size={13} color={accent} />
                <Text style={styles.statVal}>{formatPHP(totalCost)}</Text>
              </View>
            )}
            {userLat !== null && (
              <View style={styles.statPill}>
                <Ionicons name="location" size={13} color={accent} />
                <Text style={styles.statVal}>{userLat.toFixed(4)}, {userLng!.toFixed(4)}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ranaSpacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: ranaRadius.sm,
    backgroundColor: ranaColors.backgroundTop,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: ranaColors.textPrimary },
  headerSub: { fontSize: 11, color: ranaColors.textSecondary, marginTop: 1 },
  mapArea: { flex: 1, position: 'relative' },
  webview: { flex: 1 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 10,
  },
  loadingText: { fontSize: 16, fontWeight: '700', color: ranaColors.textPrimary, marginTop: 4 },
  loadingSub: { fontSize: 12, color: ranaColors.textSecondary, textAlign: 'center' },
  errorText: { fontSize: 16, fontWeight: '700', color: ranaColors.textPrimary, textAlign: 'center' },
  errorSub: { fontSize: 12, color: ranaColors.textSecondary, textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: ranaRadius.pill,
  },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  centerBtn: {
    position: 'absolute', right: 16, bottom: 16,
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    ...ranaShadow.soft,
  },
  // HUD
  hud: {
    backgroundColor: '#fff',
    paddingHorizontal: ranaSpacing.md,
    paddingTop: 14,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    ...ranaShadow.soft,
  },
  hudTrackRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  liveTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: ranaRadius.pill,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  transportTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: ranaRadius.pill,
    backgroundColor: ranaColors.backgroundTop,
  },
  transportTagText: { fontSize: 11, fontWeight: '600', color: ranaColors.textSecondary },
  transportTagBadge: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  hudRouteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  hudDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E',
    flexShrink: 0,
  },
  hudOrigin: { fontSize: 13, fontWeight: '700', color: ranaColors.textPrimary, flex: 1 },
  hudDest: { fontSize: 13, fontWeight: '700', color: ranaColors.textPrimary, flex: 1 },
  statsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 4,
  },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: ranaRadius.pill,
    backgroundColor: ranaColors.backgroundTop,
  },
  statVal: { fontSize: 12, fontWeight: '700', color: ranaColors.textPrimary },
});
