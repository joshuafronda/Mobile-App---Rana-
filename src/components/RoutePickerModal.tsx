/**
 * RoutePickerModal — Angkas-style full-screen map picker.
 *
 * UX flow (3 stages):
 *   1. PICKUP  — move map under the fixed center pin → "Set as Pickup"
 *   2. DROPOFF — move map under the fixed center pin → "Set as Drop-off" → route drawn
 *   3. CONFIRM — review origin, destination, distance → "Confirm Route"
 *
 * Uses CartoDB Voyager tiles (Google-Maps-like look) + Nominatim reverse geocode + OSRM routing.
 * No API key required.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RouteResult {
  origin: string;
  destination: string;
  distanceKm: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: RouteResult) => void;
  accentColor?: string;
  /** Label shown in the top bar at the pickup stage, e.g. "Pickup Airport" */
  pickupLabel?: string;
  /** Label shown at the dropoff stage */
  dropoffLabel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the full self-contained HTML page
// ─────────────────────────────────────────────────────────────────────────────

function buildHtml(lat: number, lng: number, accent: string): string {
  const a = accent.replace(/'/g, "\\'");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{width:100%;height:100%;overflow:hidden;background:#e8ecf0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
#map{width:100%;height:100%;}

/* ── Center pin ─────────────────────────────────────── */
#pin-wrap{
  position:fixed;left:50%;top:50%;
  transform:translate(-50%, calc(-100% + 4px));
  z-index:800;pointer-events:none;
  display:flex;flex-direction:column;align-items:center;
  transition:transform 0.2s cubic-bezier(.34,1.56,.64,1);
}
#pin-wrap.up{transform:translate(-50%, calc(-115% + 4px));}
#pin-svg{width:48px;height:48px;filter:drop-shadow(0 6px 10px rgba(0,0,0,0.35));}
#pin-shadow{width:10px;height:5px;border-radius:50%;background:rgba(0,0,0,0.25);}

/* ── Top bar ────────────────────────────────────────── */
#top-bar{
  position:fixed;top:0;left:0;right:0;z-index:900;
  background:#fff;
  box-shadow:0 2px 10px rgba(0,0,0,0.1);
  padding:14px 16px 14px;
  pointer-events:auto;
  touch-action:none;
}
#mode-badge{
  display:inline-flex;align-items:center;gap:6px;
  background:ACCENT_BG;color:ACCENT_COLOR;
  font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;
  padding:4px 10px;border-radius:20px;margin-bottom:8px;
}
#cur-address{
  font-size:15px;font-weight:700;color:#111827;
  min-height:20px;line-height:1.35;
}
#cur-sub{font-size:11px;color:#9CA3AF;margin-top:3px;min-height:14px;}

/* ── Route summary (stage 3) ────────────────────────── */
#route-card{display:none;}
.rt-row{display:flex;align-items:flex-start;gap:10px;margin-top:6px;}
.rt-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;margin-top:3px;}
.rt-dot-g{background:#22C55E;border:2.5px solid #16A34A;}
.rt-dot-r{background:#EF4444;border:2.5px solid #DC2626;}
.rt-addr{font-size:13px;color:#374151;font-weight:600;flex:1;line-height:1.4;}
.rt-meta{font-size:13px;font-weight:800;color:ACCENT_COLOR;margin-top:8px;padding-left:22px;}

/* ── Bottom sheet ───────────────────────────────────── */
#bottom{
  position:fixed;bottom:0;left:0;right:0;z-index:900;
  background:#fff;border-radius:22px 22px 0 0;
  padding:12px 18px 28px;
  box-shadow:0 -4px 28px rgba(0,0,0,0.14);
  pointer-events:auto;
  touch-action:none;
}
#handle{width:38px;height:4px;background:#E5E7EB;border-radius:2px;margin:0 auto 14px;}
#sh-title{font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;}
#sh-addr{font-size:14px;font-weight:700;color:#111827;min-height:18px;}
#sh-sub{font-size:11px;color:#9CA3AF;margin-top:2px;min-height:14px;}
#cta{
  margin-top:14px;width:100%;padding:16px;border-radius:15px;
  background:ACCENT_COLOR;color:#fff;font-size:16px;font-weight:800;
  border:none;cursor:pointer;
  box-shadow:0 5px 18px ACCENT_SHADOW;
  transition:transform 0.1s,opacity 0.1s;
  pointer-events:auto;touch-action:manipulation;
  -webkit-appearance:none;
}
#cta:active{transform:scale(0.97);opacity:0.9;}
#cta:disabled{background:#D1D5DB;color:#9CA3AF;box-shadow:none;}

/* ── My location button ─────────────────────────────── */
#myloc{
  position:fixed;right:14px;bottom:150px;z-index:850;
  width:46px;height:46px;border-radius:23px;
  background:#fff;border:none;cursor:pointer;
  box-shadow:0 3px 12px rgba(0,0,0,0.22);
  display:flex;align-items:center;justify-content:center;font-size:20px;
}

/* ── Reset button (stage 2+) ────────────────────────── */
#resetBtn{
  position:fixed;left:14px;bottom:150px;z-index:850;
  background:#fff;border:none;cursor:pointer;
  padding:10px 14px;border-radius:22px;
  box-shadow:0 3px 12px rgba(0,0,0,0.18);
  font-size:12px;font-weight:700;color:#6B7280;
  display:none;
}
</style>
</head>
<body>

<div id="map"></div>

<!-- Center pin (hidden at confirm stage) -->
<div id="pin-wrap">
  <svg id="pin-svg" viewBox="0 0 48 58" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="49" rx="11" ry="5.5" fill="rgba(0,0,0,0.18)"/>
    <path id="pin-body" d="M24 2C14.059 2 6 10.059 6 20c0 13.255 18 34 18 34S42 33.255 42 20C42 10.059 33.941 2 24 2z"
      fill="ACCENT_COLOR" stroke="white" stroke-width="2.5"/>
    <circle cx="24" cy="20" r="8" fill="white" opacity="0.95"/>
  </svg>
  <div id="pin-shadow"></div>
</div>

<!-- Top bar -->
<div id="top-bar">
  <div id="simple-view">
    <div id="mode-badge">
      <span id="badge-dot" style="width:6px;height:6px;border-radius:50%;background:ACCENT_COLOR;display:inline-block;"></span>
      <span id="badge-txt">Pickup</span>
    </div>
    <div id="cur-address">Move map to select location</div>
    <div id="cur-sub">Tap the button below to confirm</div>
  </div>
  <div id="route-card">
    <div class="rt-row"><div class="rt-dot rt-dot-g"></div><div class="rt-addr" id="rc-from">—</div></div>
    <div class="rt-row"><div class="rt-dot rt-dot-r"></div><div class="rt-addr" id="rc-to">—</div></div>
    <div class="rt-meta" id="rc-meta">—</div>
  </div>
</div>

<!-- Bottom sheet -->
<div id="bottom">
  <div id="handle"></div>
  <div id="sh-title">Address</div>
  <div id="sh-addr">Locating...</div>
  <div id="sh-sub">Move the map to select your location</div>
  <button id="cta" disabled>Set as Pickup</button>
</div>

<!-- Controls -->
<button id="myloc" onclick="goHome()">&#128205;</button>
<button id="resetBtn" onclick="resetAll()">&#8592; Change Pickup</button>

<script>
(function(){
  var LAT=${lat}, LNG=${lng};
  var ACCENT='${a}';
  var stage='pickup';
  var fromCoords=null, toCoords=null;
  var fromAddr='', toAddr='';
  var fromMarker=null, toMarker=null, routeLayer=null;
  var gcTimer=null, currentAddr='', distKm=0;

  /* ── Map init ─────────────────────────────────────── */
  var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([LAT,LNG],15);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
    maxZoom:20,subdomains:'abcd'
  }).addTo(map);
  L.control.zoom({position:'topright'}).addTo(map);

  /* ── Block map touch events on overlay panels ─────── */
  ['bottom','top-bar','myloc','resetBtn'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el)return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
    el.addEventListener('touchstart',function(e){e.stopPropagation();},{passive:false,capture:true});
    el.addEventListener('touchmove',function(e){e.stopPropagation();},{passive:false,capture:true});
    el.addEventListener('touchend',function(e){e.stopPropagation();},{passive:false,capture:true});
    el.addEventListener('pointerdown',function(e){e.stopPropagation();},{capture:true});
  });

  /* ── Markers ──────────────────────────────────────── */
  function dot(color,border){
    return L.divIcon({
      html:'<div style="width:20px;height:20px;background:'+color+';border:3px solid '+border+';border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,.35)"></div>',
      iconSize:[20,20],iconAnchor:[10,10],className:''
    });
  }
  var greenDot=dot('#22C55E','#fff');
  var redDot=dot('#EF4444','#fff');

  /* ── Geocode center ───────────────────────────────── */
  function geocodeCenter(){
    var c=map.getCenter();
    clearTimeout(gcTimer);
    gcTimer=setTimeout(function(){
      fetch('https://nominatim.openstreetmap.org/reverse?lat='+c.lat+'&lon='+c.lng+'&format=json&addressdetails=1',
        {headers:{'Accept-Language':'en','User-Agent':'TravelApp/1.0'}})
      .then(function(r){return r.json();})
      .then(function(d){
        var a=d.address||{};
        var parts=[];
        var road=a.road||a.pedestrian||a.footway||a.path;
        var area=a.suburb||a.neighbourhood||a.quarter||a.village||a.hamlet;
        var city=a.city||a.town||a.municipality||a.county;
        if(road)parts.push(road);
        if(area)parts.push(area);
        if(city)parts.push(city);
        currentAddr=parts.length?parts.join(', '):(d.display_name||'').split(',').slice(0,2).join(',').trim();
        var sub=d.display_name?(d.display_name.split(',').slice(2,4).join(',').trim()):'';
        $('cur-address').textContent=currentAddr;
        $('sh-addr').textContent=currentAddr;
        $('sh-sub').textContent=sub;
        $('cta').disabled=false;
      })
      .catch(function(){
        currentAddr='Unknown location';
        $('cur-address').textContent=currentAddr;
        $('sh-addr').textContent=currentAddr;
        $('cta').disabled=false;
      });
    },700);
  }

  /* ── Map events ───────────────────────────────────── */
  map.on('movestart',function(){
    if(stage==='confirm')return;
    $('pin-wrap').classList.add('up');
    $('cta').disabled=true;
    $('cur-address').textContent='Moving...';
    $('sh-addr').textContent='Moving...';
  });
  map.on('moveend',function(){
    if(stage==='confirm')return;
    $('pin-wrap').classList.remove('up');
    geocodeCenter();
  });

  /* Initial geocode */
  geocodeCenter();

  /* ── CTA click ────────────────────────────────────── */
  $('cta').addEventListener('click',function(){
    if(stage==='pickup') setPickup();
    else if(stage==='dropoff') setDropoff();
    else if(stage==='confirm') confirmRoute();
  });

  function setPickup(){
    var c=map.getCenter();
    fromCoords={lat:c.lat,lng:c.lng};
    fromAddr=currentAddr;
    if(fromMarker)map.removeLayer(fromMarker);
    fromMarker=L.marker([c.lat,c.lng],{icon:greenDot}).addTo(map);
    stage='dropoff';
    switchUI();
    geocodeCenter();
  }

  function setDropoff(){
    var c=map.getCenter();
    toCoords={lat:c.lat,lng:c.lng};
    toAddr=currentAddr;
    if(toMarker)map.removeLayer(toMarker);
    toMarker=L.marker([c.lat,c.lng],{icon:redDot}).addTo(map);
    fetchRoute();
  }

  function fetchRoute(){
    $('cta').disabled=true;
    $('sh-addr').textContent='Calculating route...';
    $('sh-sub').textContent='Please wait';
    var url='https://router.project-osrm.org/route/v1/driving/'
      +fromCoords.lng+','+fromCoords.lat+';'
      +toCoords.lng+','+toCoords.lat
      +'?overview=full&geometries=geojson';
    fetch(url)
    .then(function(r){return r.json();})
    .then(function(data){
      if(!data.routes||!data.routes.length){
        $('sh-addr').textContent='No route found. Tap to retry.';
        $('cta').textContent='Retry';
        $('cta').disabled=false;
        stage='dropoff';
        return;
      }
      var route=data.routes[0];
      distKm=(route.distance/1000);
      var min=Math.round(route.duration/60);
      var coords=route.geometry.coordinates.map(function(c){return[c[1],c[0]];});
      if(routeLayer)map.removeLayer(routeLayer);
      routeLayer=L.polyline(coords,{color:ACCENT,weight:6,opacity:0.88}).addTo(map);
      map.fitBounds(routeLayer.getBounds(),{padding:[90,30]});
      stage='confirm';
      switchUI(distKm.toFixed(1),min);
    })
    .catch(function(){
      $('sh-addr').textContent='Route error — check connection.';
      $('cta').textContent='Retry';
      $('cta').disabled=false;
    });
  }

  function switchUI(km,min){
    if(stage==='dropoff'){
      $('badge-txt').textContent='Drop-off';
      /* Change pin to red */
      $('pin-body').setAttribute('fill','#EF4444');
      $('badge-dot').style.background='#EF4444';
      $('cur-address').textContent=currentAddr||'Move map to select drop-off';
      $('cur-sub').textContent='Pickup set — now select your destination';
      $('sh-title').textContent='Drop-off point';
      $('sh-addr').textContent='Move map to set drop-off';
      $('sh-sub').textContent='';
      $('cta').textContent='Set as Drop-off';
      $('cta').disabled=false;
      $('cta').style.background=ACCENT;
      $('resetBtn').style.display='block';
    } else if(stage==='confirm'){
      /* Hide pin */
      $('pin-wrap').style.display='none';
      $('resetBtn').style.display='none';
      /* Top bar → route card */
      $('simple-view').style.display='none';
      $('route-card').style.display='block';
      $('rc-from').textContent=fromAddr;
      $('rc-to').textContent=toAddr;
      $('rc-meta').textContent=km+' km  ·  ~'+min+' min';
      /* Bottom sheet */
      $('sh-title').textContent='Route Summary';
      $('sh-addr').textContent=km+' km from pickup to drop-off';
      $('sh-sub').textContent='Estimated travel: ~'+min+' minutes';
      $('cta').textContent='Confirm Route';
      $('cta').disabled=false;
      $('cta').style.background='#22C55E';
      $('cta').style.boxShadow='0 5px 18px rgba(34,197,94,0.4)';
    }
  }

  function confirmRoute(){
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type:'confirm',
      origin:fromAddr,
      destination:toAddr,
      distanceKm:parseFloat(distKm.toFixed(2))
    }));
  }

  function resetAll(){
    if(fromMarker){map.removeLayer(fromMarker);fromMarker=null;}
    if(toMarker){map.removeLayer(toMarker);toMarker=null;}
    if(routeLayer){map.removeLayer(routeLayer);routeLayer=null;}
    stage='pickup';
    fromCoords=null;toCoords=null;fromAddr='';toAddr='';distKm=0;
    $('pin-wrap').style.display='flex';
    $('simple-view').style.display='block';
    $('route-card').style.display='none';
    $('badge-txt').textContent='Pickup';
    $('pin-body').setAttribute('fill',ACCENT);
    $('badge-dot').style.background=ACCENT;
    $('cur-address').textContent='Move map to select location';
    $('cur-sub').textContent='Tap the button below to confirm';
    $('sh-title').textContent='Address';
    $('sh-addr').textContent='Move map to select pickup';
    $('sh-sub').textContent='';
    $('cta').textContent='Set as Pickup';
    $('cta').style.background=ACCENT;
    $('cta').style.boxShadow='0 5px 18px ACCENT_SHADOW';
    $('cta').disabled=true;
    $('resetBtn').style.display='none';
    geocodeCenter();
  }

  function goHome(){map.setView([LAT,LNG],15);}

  function $(id){return document.getElementById(id);}
})();
</script>
</body>
</html>`
    .replace(/ACCENT_COLOR/g, accent)
    .replace(/ACCENT_BG/g, accent + '18')
    .replace(/ACCENT_SHADOW/g, accent + '44');
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function RoutePickerModal({
  visible,
  onClose,
  onConfirm,
  accentColor = ranaColors.primary,
  pickupLabel = 'Select Pickup',
  dropoffLabel = 'Select Drop-off',
}: Props) {
  const [lat, setLat] = useState(14.5995);  // default: Manila
  const [lng, setLng] = useState(120.9842);
  const [locReady, setLocReady] = useState(false);
  const webRef = useRef<WebView>(null);

  // Get user location when modal opens
  useEffect(() => {
    if (!visible) return;
    setLocReady(false);
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLat(loc.coords.latitude);
          setLng(loc.coords.longitude);
        }
      } catch {}
      setLocReady(true);
    })();
  }, [visible]);

  function handleMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'confirm') {
        onConfirm({
          origin: msg.origin,
          destination: msg.destination,
          distanceKm: msg.distanceKm,
        });
        onClose();
      }
    } catch {}
  }

  const html = locReady ? buildHtml(lat, lng, accentColor) : null;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        {/* Native header with close button */}
        <View style={styles.nativeHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={22} color={ranaColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.nativeTitle}>Select Route</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Map / loading */}
        {!locReady ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={styles.loaderText}>Getting your location…</Text>
          </View>
        ) : (
          <WebView
            ref={webRef}
            source={{ html: html! }}
            style={styles.webview}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            geolocationEnabled
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback
            // Allow loading the CDN resources
            originWhitelist={['*']}
            onError={(e) => console.warn('RoutePickerModal WebView error', e.nativeEvent)}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ranaColors.backgroundTop,
  },
  nativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ranaSpacing.md,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    ...ranaShadow?.soft,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: ranaRadius.sm,
    backgroundColor: ranaColors.backgroundTop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  webview: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: ranaColors.textSecondary,
  },
});
