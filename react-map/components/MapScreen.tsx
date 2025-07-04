import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { parse } from 'papaparse';

const BASE_URL = 'https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/geodata/';
const AIR4THAI_URL = 'http://air4thai.com/forweb/getAQI_JSON.php';

const baseMapStyles = [
  {
    name: "Google Hybrid",
    style: "https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/basemap/ghyb.json"
  },
  {
    name: "OpenStreetMap",
    style: "https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/basemap/osm.json"
  },
  {
    name: "ESRI WorldImagery",
    style: "https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/basemap/esri.json"
  },
  {
    name: "Carto Light",
    style: "https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/basemap/cartoLight.json"
  },
  {
    name: "Carto Dark",
    style: "https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/basemap/cartoDark.json"
  },
];

const AQI_TYPES = ['AQI', 'PM25', 'PM10', 'O3', 'CO', 'NO2', 'SO2'];

const initialLayers = [
  { id: 1, type: 'geojson', name_en: 'district', name: 'เขต', path: 'district.geojson', visible: true, icon: null, minzoom: 10, maxzoom: 15 },
  { id: 2, type: 'geojson', name_en: 'road', name: 'ถนน', path: 'bma_road.geojson', visible: true, icon: null, minzoom: 15, maxzoom: 22 },
  { id: 5, type: 'geojson', name_en: 'bma_school', name: 'โรงเรียน', path: 'bma_school.geojson', visible: true, icon: 'school', minzoom: 10, maxzoom: 22 },
  { id: 6, type: 'geojson', name_en: 'air_pollution', name: 'สถานีตรวจวัด', path: 'air_pollution.geojson', visible: true, icon: 'station', minzoom: 10, maxzoom: 22 },
  { id: 7, type: 'csv', name_en: 'bma_cctv', name: 'กล้อง CCTV', path: 'bma_cctv.csv', visible: true, icon: 'cctv', minzoom: 10, maxzoom: 22 },
  { id: 9, type: 'shp', name_en: 'bma_building', name: 'อาคาร', path: 'bma_building.zip', visible: true, icon: null, minzoom: 15, maxzoom: 22 },
  { id: 10, type: 'api', name_en: 'air4thai', name: 'Air4Thai', path: AIR4THAI_URL, visible: true, icon: 'air', minzoom: 15, maxzoom: 22 },
  { id: 11, type: 'arcgis', name_en: 'bma_basemap_arcgis', name: 'BMAGI Basemap 2564', path: '', visible: false, icon: null, minzoom: 0, maxzoom: 22 }
];

export default function MapScreen() {
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedStyle, setSelectedStyle] = useState(baseMapStyles[0].style);
  const [selectedAQI, setSelectedAQI] = useState('AQI');

  useEffect(() => {
    const loadLayers = async () => {
      const enriched = await Promise.all(initialLayers.map(async (layer) => {
        if (layer.type === 'geojson') {
          const res = await fetch(BASE_URL + layer.path);
          const geojson = await res.json();
          return { ...layer, geojson };
        } else if (layer.type === 'csv') {
          const res = await fetch(BASE_URL + layer.path);
          const text = await res.text();
          const parsed = parse(text, { header: true });
          const features = parsed.data.map((row: any, i: number) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [parseFloat(row.lng), parseFloat(row.lat)] },
            properties: { ...row }
          }));
          return { ...layer, geojson: { type: 'FeatureCollection', features } };
        } else if (layer.type === 'api') {
          const res = await fetch(layer.path);
          const json = await res.json();
          const stations = json.stations || [];
          const features = stations.map((s: any) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [s.Long, s.Lat] },
            properties: { ...s }
          }));
          return { ...layer, geojson: { type: 'FeatureCollection', features } };
        } else {
          return layer;
        }
      }));

      setLayers(enriched);
    };

    loadLayers();
  }, []);

  const toggleLayer = (id: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  return (
    <View style={{ flex: 1 }}>
      <MapboxGL.MapView style={{ flex: 1 }} styleURL={selectedStyle}>
        <MapboxGL.Camera centerCoordinate={[100.5, 13.75]} zoomLevel={10} />

        {layers.map(layer => {
          if (!layer.visible || !layer.geojson) return null;

          // Air4Thai filter
          if (layer.name_en === 'air4thai') {
            const filtered = {
              ...layer.geojson,
              features: layer.geojson.features.filter((f: any) => f.properties[selectedAQI] !== undefined)
            };
            return (
              <MapboxGL.ShapeSource key={layer.id} id={`source-${layer.id}`} shape={filtered}>
                <MapboxGL.SymbolLayer id={`layer-${layer.id}`} style={{ iconImage: layer.icon, iconSize: 0.6 }} />
              </MapboxGL.ShapeSource>
            );
          }

          // 3D Buildings
          if (layer.name_en === 'bma_building') {
            return (
              <MapboxGL.ShapeSource key={layer.id} id={`source-${layer.id}`} shape={layer.geojson}>
                <MapboxGL.FillExtrusionLayer
                  id={`layer-${layer.id}`}
                  style={{
                    fillExtrusionHeight: ['get', 'height'],
                    fillExtrusionColor: '#aaa',
                    fillExtrusionOpacity: 0.7,
                  }}
                  minZoomLevel={layer.minzoom}
                  maxZoomLevel={layer.maxzoom}
                />
              </MapboxGL.ShapeSource>
            );
          }

          return (
            <MapboxGL.ShapeSource key={layer.id} id={`source-${layer.id}`} shape={layer.geojson}>
              {layer.icon ? (
                <MapboxGL.SymbolLayer id={`layer-${layer.id}`} style={{ iconImage: layer.icon, iconSize: 0.5 }} />
              ) : (
                <MapboxGL.LineLayer id={`layer-${layer.id}`} style={{ lineColor: 'blue', lineWidth: 1 }} />
              )}
            </MapboxGL.ShapeSource>
          );
        })}

        {/* ArcGIS tile service layer */}
        {/* <MapboxGL.RasterSource
          id="arcgis"
          tileSize={256}
          tileUrlTemplates={[
            "https://cpudgiapp.bangkok.go.th/arcgis/rest/services/GI_Platform/BMAGI_Basemap_2564/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&size=256,256&format=png&transparent=true&f=image"
          ]}
        >
          <MapboxGL.RasterLayer
            id="arcgis-layer"
            style={{ rasterOpacity: 0.8 }} // ✅ REQUIRED
          />
        </MapboxGL.RasterSource> */}
      </MapboxGL.MapView>

      {/* AQI dropdown */}
      <ScrollView horizontal style={styles.aqiControl}>
        {AQI_TYPES.map(type => (
          <TouchableOpacity key={type} onPress={() => setSelectedAQI(type)} style={styles.aqiItem}>
            <Text style={{ color: selectedAQI === type ? 'blue' : 'black' }}>{type}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Basemap switcher */}
      <ScrollView horizontal style={styles.basemapControl}>
        {baseMapStyles.map(style => (
          <TouchableOpacity key={style.name} onPress={() => setSelectedStyle(style.style)} style={styles.baseItem}>
            <Text>{style.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Layer toggle */}
      <View style={styles.layerControl}>
        <FlatList
          data={layers}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => toggleLayer(item.id)}>
              <Text>{item.visible ? '✅' : '⬜'} {item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  basemapControl: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  baseItem: {
    marginHorizontal: 6,
  },
  aqiControl: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  aqiItem: {
    marginHorizontal: 6,
  },
  layerControl: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 10,
  },
});