import { useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { WebView as NativeWebView, type WebViewMessageEvent } from "react-native-webview";

const WebView = NativeWebView as any;

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";


type Coordinate = { latitude: number; longitude: number };

type Settings = {
  lineSpacing: string;
  pointSpacing: string;
  angle: string;
  elevationMode: "copernicus" | "none";
};

const DEFAULT_CENTER = { latitude: 39.0, longitude: 35.0 };

const MAP_HTML = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><style>html,body,#map{height:100%;margin:0} .leaflet-control-attribution{font-size:9px}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const map=L.map('map',{zoomControl:false}).setView([39,35],6);L.control.zoom({position:'topright'}).addTo(map);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);let points=[];let markers=[];let line=null;function redraw(){markers.forEach(m=>m.remove());if(line)line.remove();markers=points.map((p,i)=>L.circleMarker([p.lat,p.lng],{radius:6,color:'#0f766e',weight:2,fillColor:'#fff',fillOpacity:1}).bindTooltip(String(i+1),{permanent:true,direction:'top',offset:[0,-5]}).addTo(map));if(points.length>1)line=L.polygon(points.map(p=>[p.lat,p.lng]),{color:'#0f766e',weight:3,fillColor:'#14b8a6',fillOpacity:.18}).addTo(map)}map.on('click',e=>{points.push({lat:e.latlng.lat,lng:e.latlng.lng});redraw();window.ReactNativeWebView.postMessage(JSON.stringify({type:'polygon',points}));});window.addEventListener('message',e=>{try{const m=JSON.parse(e.data);if(m.type==='clear'){points=[];redraw()}if(m.type==='undo'){points.pop();redraw()}}catch(_){}});</script></body></html>`;

export default function HomeScreen() {
  const colors = useColors();
  const mapRef = useRef<any>(null);
  const [polygon, setPolygon] = useState<Coordinate[]>([]);
  const [status, setStatus] = useState("Haritaya dokunarak ölçüm alanını çizin.");
  const [settings, setSettings] = useState<Settings>({ lineSpacing: "10", pointSpacing: "5", angle: "0", elevationMode: "copernicus" });
  const [busy, setBusy] = useState(false);

  const polygonLabel = useMemo(() => polygon.length ? `${polygon.length} köşe seçildi` : "Polygon bekleniyor", [polygon.length]);

  function handleMapMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type: string; points?: { lat: number; lng: number }[] };
      if (message.type === "polygon" && message.points) {
        setPolygon(message.points.map((p) => ({ latitude: p.lat, longitude: p.lng })));
        setStatus(`${message.points.length} köşe hazır. En az 3 köşe ile alanı tamamlayabilirsiniz.`);
      }
    } catch {
      setStatus("Harita verisi okunamadı.");
    }
  }

  function sendMapCommand(type: "clear" | "undo") {
    mapRef.current?.postMessage(JSON.stringify({ type }));
    if (type === "clear") {
      setPolygon([]);
      setStatus("Yeni bir polygon çizmek için haritaya dokunun.");
    } else {
      setPolygon((items) => items.slice(0, -1));
    }
  }

  async function generateGrid() {
    if (polygon.length < 3) {
      Alert.alert("Alan eksik", "Grid üretmek için harita üzerinde en az üç köşe seçin.");
      return;
    }
    setBusy(true);
    setStatus("Grid ve Copernicus DEM örneklemesi hazırlanıyor...");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setBusy(false);
    setStatus("Alan hazır. Grid motoru ve gerçek DEM örneklemesi bir sonraki adımda bağlanacak.");
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>SAHA ÖLÇÜMÜ</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Surveyor</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: polygon.length >= 3 ? colors.success : colors.warning }]} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroKicker}>API anahtarı gerektirmez</Text>
          <Text style={styles.heroTitle}>Alanınızı çizin, gridinizi hazırlayın.</Text>
          <Text style={styles.heroText}>OpenStreetMap tabanı üzerinde polygon seçin; Copernicus DEM ile yükseklik değerlerini kontrol edin.</Text>
        </View>

        <View style={[styles.mapCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.mapHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ölçüm alanı</Text>
              <Text style={[styles.caption, { color: colors.muted }]}>{polygonLabel}</Text>
            </View>
            <Pressable onPress={() => sendMapCommand("clear")} style={({ pressed }) => [styles.smallButton, { borderColor: colors.border }, pressed && styles.pressed]}>
              <Text style={[styles.smallButtonText, { color: colors.foreground }]}>Temizle</Text>
            </Pressable>
          </View>
          <View style={styles.mapWrap}>
            {Platform.OS === "web" ? (
              <View style={[styles.webMapFallback, { backgroundColor: colors.background }]}>
                <Text style={[styles.webMapFallbackTitle, { color: colors.foreground }]}>Android harita önizlemesi</Text>
                <Text style={[styles.webMapFallbackText, { color: colors.muted }]}>OpenStreetMap tabanlı etkileşimli harita Android cihazda açılacaktır.</Text>
              </View>
            ) : (
              <WebView ref={mapRef} source={{ html: MAP_HTML }} onMessage={handleMapMessage} originWhitelist={["*"]} javaScriptEnabled style={styles.map} />
            )}
          </View>
          <View style={styles.mapActions}>
            <Pressable onPress={() => sendMapCommand("undo")} style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.border }, pressed && styles.pressed]}>
              <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Son köşeyi geri al</Text>
            </Pressable>
            <Text style={[styles.mapHint, { color: colors.muted }]}>{status}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeading}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Grid ayarları</Text>
              <Text style={[styles.caption, { color: colors.muted }]}>Metre cinsinden</Text>
            </View>
            <Text style={[styles.modeBadge, { color: colors.primary, backgroundColor: colors.background }]}>DEM</Text>
          </View>
          <View style={styles.fieldsRow}>
            <Field label="Hat aralığı" value={settings.lineSpacing} onChangeText={(value) => setSettings({ ...settings, lineSpacing: value })} colors={colors} />
            <Field label="Nokta aralığı" value={settings.pointSpacing} onChangeText={(value) => setSettings({ ...settings, pointSpacing: value })} colors={colors} />
          </View>
          <View style={styles.fieldsRow}>
            <Field label="Açı" value={settings.angle} onChangeText={(value) => setSettings({ ...settings, angle: value })} colors={colors} />
            <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.muted }]}>Yükseklik</Text><View style={[styles.selectBox, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.selectText, { color: colors.foreground }]}>Copernicus DEM</Text></View></View>
          </View>
        </View>

        <View style={[styles.infoRow, { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }]}>
          <Text style={[styles.infoIcon, { color: colors.warning }]}>i</Text>
          <Text style={[styles.infoText, { color: colors.foreground }]}>İşlem tamamlandığında Z min, Z max ve farklı değer sayısı ayrıca gösterilecektir.</Text>
        </View>

        <Pressable onPress={generateGrid} disabled={busy} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, (pressed || busy) && styles.pressed]}>
          <Text style={styles.primaryButtonText}>{busy ? "Hazırlanıyor…" : "Grid üret"}</Text>
          <Text style={styles.primaryButtonArrow}>›</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function Field({ label, value, onChangeText, colors }: { label: string; value: string; onChangeText: (value: string) => void; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 34, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 4 },
  heroCard: { borderRadius: 22, padding: 20, minHeight: 150, justifyContent: "center" },
  heroKicker: { color: "#BEE3F8", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  heroTitle: { color: "#FFFFFF", fontSize: 24, lineHeight: 29, fontWeight: "800", maxWidth: 290 },
  heroText: { color: "#D9F3F0", fontSize: 13, lineHeight: 19, marginTop: 10, maxWidth: 320 },
  mapCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  mapHeader: { padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 17, fontWeight: "800" },
  caption: { fontSize: 12, marginTop: 3 },
  smallButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7 },
  smallButtonText: { fontSize: 12, fontWeight: "700" },
  mapWrap: { height: 270, backgroundColor: "#DDEAF2" },
  map: { flex: 1, backgroundColor: "transparent" },
  webMapFallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  webMapFallbackTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  webMapFallbackText: { fontSize: 12, lineHeight: 18, textAlign: "center" },
  mapActions: { padding: 12, gap: 8 },
  secondaryButton: { borderWidth: 1, borderRadius: 10, alignSelf: "flex-start", paddingHorizontal: 11, paddingVertical: 8 },
  secondaryButtonText: { fontSize: 12, fontWeight: "700" },
  mapHint: { fontSize: 12, lineHeight: 17 },
  card: { borderRadius: 20, borderWidth: 1, padding: 15, gap: 14 },
  cardHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modeBadge: { fontSize: 11, fontWeight: "800", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, overflow: "hidden" },
  fieldsRow: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: "700" },
  input: { height: 44, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, fontSize: 15, fontWeight: "600" },
  selectBox: { height: 44, borderWidth: 1, borderRadius: 11, justifyContent: "center", paddingHorizontal: 10 },
  selectText: { fontSize: 12, fontWeight: "700" },
  infoRow: { borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 9 },
  infoIcon: { borderWidth: 1, borderColor: "#F59E0B", borderRadius: 8, width: 20, height: 20, textAlign: "center", lineHeight: 18, fontWeight: "800" },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  primaryButton: { height: 56, borderRadius: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  primaryButtonArrow: { color: "#FFFFFF", fontSize: 29, lineHeight: 29, fontWeight: "300" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
