/**
 * LeafletMap — Expo-Go-compatible map using WebView + Leaflet.js (OpenStreetMap tiles)
 *              with OSRM routing (router.project-osrm.org).
 *
 * Props:
 *  lat / lng        – initial centre position (from expo-location)
 *  onTap            – called on each tap with the tapped lat/lng
 *  onRoute          – called after OSRM returns a route: { distanceM, durationS }
 *                     First tap  → sets "From" marker (green)
 *                     Second tap → sets "To" marker (red), fetches OSRM route
 *                     Third tap  → resets both markers and starts over
 */
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  lat: number;
  lng: number;
  zoom?: number;
  initialFrom?: { lat: number; lng: number };
  initialTo?: { lat: number; lng: number };
  onTap?: (lat: number, lng: number) => void;
  onRoute?: (distanceM: number, durationS: number) => void;
  style?: object;
};

function buildHtml(lat: number, lng: number, zoom: number, initialFrom?: { lat: number; lng: number }, initialTo?: { lat: number; lng: number }): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;padding:0;width:100%;height:100%;background:#e8e8e8;}
  #status{
    position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
    background:rgba(0,0,0,0.6);color:#fff;font-size:12px;
    padding:4px 12px;border-radius:20px;z-index:1000;
    font-family:sans-serif;pointer-events:none;white-space:nowrap;
  }
</style>
</head>
<body>
<div id="map"></div>
<div id="status">Tap to set From point</div>
<script>
  var OSRM = 'https://router.project-osrm.org/route/v1/driving/';
  var map = L.map('map',{zoomControl:true}).setView([${lat},${lng}],${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap contributors',maxZoom:19
  }).addTo(map);

  var youMarker = L.circleMarker([${lat},${lng}],{
    radius:8,fillColor:'#3B82F6',fillOpacity:1,color:'#fff',weight:2
  }).addTo(map).bindPopup('You are here');

  var fromMarker=null, toMarker=null, routeLayer=null;

  var greenIcon = L.divIcon({html:'<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',iconSize:[14,14],iconAnchor:[7,7],className:''});
  var redIcon   = L.divIcon({html:'<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',iconSize:[14,14],iconAnchor:[7,7],className:''});

  var initialFrom = ${initialFrom ? JSON.stringify(initialFrom) : 'null'};
  var initialTo = ${initialTo ? JSON.stringify(initialTo) : 'null'};
  if (initialFrom) {
    fromMarker = L.marker([initialFrom.lat, initialFrom.lng],{icon:greenIcon}).addTo(map).bindPopup('From');
  }
  if (initialTo) {
    toMarker = L.marker([initialTo.lat, initialTo.lng],{icon:redIcon}).addTo(map).bindPopup('To');
  }

  function setStatus(t){ document.getElementById('status').textContent = t; }

  function fetchRoute(from, to){
    setStatus('Fetching route…');
    var url = OSRM + from.lng+','+from.lat+';'+to.lng+','+to.lat+'?overview=full&geometries=geojson';
    fetch(url)
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(!data.routes || !data.routes.length){ setStatus('No route found'); return; }
        var route = data.routes[0];
        var coords = route.geometry.coordinates.map(function(c){ return [c[1],c[0]]; });
        if(routeLayer){ map.removeLayer(routeLayer); }
        routeLayer = L.polyline(coords,{color:'#3B82F6',weight:5,opacity:0.85}).addTo(map);
        map.fitBounds(routeLayer.getBounds(),{padding:[40,40]});
        var km = (route.distance/1000).toFixed(1);
        var min = Math.round(route.duration/60);
        setStatus(km+' km · ~'+min+' min  |  Tap again to reset');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:'route',
          distanceM: route.distance,
          durationS: route.duration
        }));
      })
      .catch(function(){ setStatus('Route error — check connection'); });
  }

  if (initialFrom && initialTo) {
    setTimeout(function() {
      fetchRoute(fromMarker.getLatLng(), toMarker.getLatLng());
    }, 500);
  }

  map.on('click',function(e){
    var lat=e.latlng.lat, lng=e.latlng.lng;
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'tap',lat:lat,lng:lng}));

    if(!fromMarker){
      fromMarker = L.marker([lat,lng],{icon:greenIcon}).addTo(map).bindPopup('From').openPopup();
      setStatus('From set — tap to set To point');
    } else if(!toMarker){
      toMarker = L.marker([lat,lng],{icon:redIcon}).addTo(map).bindPopup('To').openPopup();
      fetchRoute(fromMarker.getLatLng(), toMarker.getLatLng());
    } else {
      // reset
      map.removeLayer(fromMarker); fromMarker=null;
      map.removeLayer(toMarker);   toMarker=null;
      if(routeLayer){ map.removeLayer(routeLayer); routeLayer=null; }
      setStatus('Tap to set From point');
    }
  });

  // Receive realtime position updates from RN
  document.addEventListener('message', function(e){ handleMsg(e.data); });
  window.addEventListener('message',   function(e){ handleMsg(e.data); });
  function handleMsg(raw){
    try{
      var d=JSON.parse(raw);
      if(d.type==='move'){
        youMarker.setLatLng([d.lat,d.lng]);
        if(!fromMarker) map.setView([d.lat,d.lng]);
      }
    }catch(err){}
  }
</script>
</body>
</html>`;
}

export default function LeafletMap({ lat, lng, zoom = 14, initialFrom, initialTo, onTap, onRoute, style }: Props) {
  const webRef = useRef<WebView>(null);

  React.useEffect(() => {
    webRef.current?.injectJavaScript(
      `handleMsg(${JSON.stringify(JSON.stringify({ type: 'move', lat, lng }))});true;`
    );
  }, [lat, lng]);

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html: buildHtml(lat, lng, zoom, initialFrom, initialTo) }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        mixedContentMode="always"
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === 'tap') {
              onTap?.(msg.lat, msg.lng);
            } else if (msg.type === 'route') {
              onRoute?.(msg.distanceM, msg.durationS);
            }
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1 },
});
