import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { parse } from 'papaparse';

MapboxGL.setAccessToken('');

const BASE_URL = 'https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/geodata/';
const AIR4THAI_URL = 'http://air4thai.com/forweb/getAQI_JSON.php';

const baseMapStyles = [
  { name: "Google Hybrid", style: "https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/basemap/ghyb.json" },
  { name: "OpenStreetMap", style: "https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/basemap/osm.json" },
  { name: "ESRI WorldImagery", style: "https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/basemap/esri.json" },
  { name: "Carto Light", style: "https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/basemap/cartoLight.json" },
  { name: "Carto Dark", style: "https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/basemap/cartoDark.json" },
];

const AQI_TYPES = ['AQI', 'PM25', 'PM10', 'O3', 'CO', 'NO2', 'SO2'];

const colorMap: any = {
  "0": "#808080", // gray
  "1": "#00bfff", // sky blue
  "2": "#32cd32", // lime green
  "3": "#ffa500", // orange
  "4": "#ff4500", // red-orange
  "5": "#800080", // purple
};

const initialLayers = [
  { id: 1, type: 'geojson', name: 'เขต', name_en: 'district', path: 'district.geojson', visible: true },
  { id: 2, type: 'geojson', name: 'ถนน', name_en: 'road', path: 'bma_road.geojson', visible: false },
  { id: 3, type: 'geojson', name: 'ทางจักรยาน', name_en: 'bike_way', path: 'bike_way.geojson', visible: true },
  { id: 5, type: 'geojson', name: 'โรงเรียน', name_en: 'bma_school', path: 'bma_school.geojson', visible: true, icon: 'school.png' },
  { id: 6, type: 'geojson', name: 'สถานีตรวจวัด', name_en: 'air_pollution', path: 'air_pollution.geojson', visible: true, icon: 'station.png' },
  { id: 7, type: 'csv', name: 'กล้อง CCTV', name_en: 'bma_cctv', path: 'bma_cctv.csv', visible: true, icon: 'cctv.png' },
  { id: 9, type: 'geojson', name: 'อาคาร', name_en: 'bma_building', path: 'bma_building.geojson', visible: false },
  { id: 10, type: 'api', name: 'Air4Thai', name_en: 'air4thai', path: AIR4THAI_URL, visible: true, icon: 'air.png' },
  { id: 11, type: 'arcgis', name: 'BMAGI Basemap 2564', name_en: 'bma_basemap_arcgis', visible: false },
];

export default function MapScreen() {
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedStyle, setSelectedStyle] = useState(baseMapStyles[0].style);
  const [selectedAQI, setSelectedAQI] = useState('AQI');

  useEffect(() => {
    const loadLayers = async () => {
      const enriched = await Promise.all(initialLayers.map(async (layer) => {
        try {
          if (layer.type === 'geojson' && layer.path) {
            const res = await fetch(BASE_URL + layer.path);
            const geojson = await res.json();
            return { ...layer, geojson };
          } else if (layer.type === 'csv' && layer.path) {
            const res = await fetch(BASE_URL + layer.path);
            const text = await res.text();
            const parsed = parse(text, { header: true });
            const features = parsed.data.map((row: any) => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [parseFloat(row.lng), parseFloat(row.lat)] },
              properties: { ...row }
            }));
            return { ...layer, geojson: { type: 'FeatureCollection', features } };
          } else if (layer.type === 'api' && layer.path) {
            const res = await fetch(layer.path);
            const json = await res.json();
            const stations = json.stations || [];
            const features = stations.map((s: any) => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [parseFloat(s.long), parseFloat(s.lat)],
              },
              properties: { ...s }
            }));
            return { ...layer, geojson: { type: 'FeatureCollection', features } };
          }
        } catch (err) {
          console.warn("Failed to load layer", layer.name, err);
        }
        return layer;
      }));
      setLayers(enriched);
    };

    loadLayers();
  }, []);

  const toggleLayer = (id: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const getLayerStyle = (layer: any) => {
    switch (layer.name_en) {
      case 'district':
        return { lineColor: '#f391d6', lineWidth: 8 };
      case 'road':
        return { lineColor: '#ffe53d', lineWidth: 3 };
      case 'bike_way':
        return { lineColor: '#ffa200', lineWidth: 5 };
      default:
        return { lineColor: 'blue', lineWidth: 1 };
    }
  };

  const renderAir4ThaiMarkers = (layer: any) => {
    if (!layer?.geojson?.features) return null;

    return layer.geojson.features.map((f: any, index: number) => {
      const coords = f.geometry.coordinates;
      let AQILast: any;
      try {
        AQILast = typeof f.properties.AQILast === 'string' ? JSON.parse(f.properties.AQILast) : f.properties.AQILast;
      } catch {
        return null;
      }

      const pollutant = AQILast?.[selectedAQI];
      if (!pollutant || pollutant.aqi === '-1' || pollutant.aqi === '-999') return null;

      const color = colorMap[pollutant.color_id] || '#cccccc';
      const valueText = selectedAQI === 'AQI' ? pollutant.aqi : pollutant.value;

      return (
        <MapboxGL.PointAnnotation
          key={`air4thai-${index}`}
          id={`air4thai-${index}`}
          coordinate={coords}
        >
          <View style={{
            width: 30,
            height: 30,
            backgroundColor: color,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#fff',
          }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>{valueText}</Text>
          </View>
        </MapboxGL.PointAnnotation>
      );
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <MapboxGL.MapView style={{ flex: 1 }} styleURL={selectedStyle}>
        <MapboxGL.Camera zoomLevel={10} centerCoordinate={[100.5, 13.75]} />

        {layers.map(layer => {
          if (!layer.visible || !layer.geojson) return null;
          if (layer.name_en === 'air4thai') return renderAir4ThaiMarkers(layer);

          const iconId = layer.icon?.replace('.png', '');
          return (
            <MapboxGL.ShapeSource key={`source-${layer.id}`} id={`source-${layer.id}`} shape={layer.geojson}>
              {iconId ? (
                <MapboxGL.SymbolLayer
                  id={`layer-${layer.id}`}
                  style={{ iconImage: iconId, iconSize: 0.2 }}
                />
              ) : (
                <MapboxGL.LineLayer
                  id={`layer-${layer.id}`}
                  style={getLayerStyle(layer)}
                />
              )}
            </MapboxGL.ShapeSource>
          );
        })}
      </MapboxGL.MapView>

      <View style={styles.layerControl}>
        <FlatList
          data={layers}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => toggleLayer(item.id)} style={styles.layerItem}>
              <Text>{item.visible ? '✅' : '⬜'} {item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <ScrollView horizontal style={styles.baseControl}>
        {baseMapStyles.map(b => (
          <TouchableOpacity key={b.name} onPress={() => setSelectedStyle(b.style)} style={styles.baseItem}>
            <Text>{b.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal style={styles.aqiControl}>
        {AQI_TYPES.map(type => (
          <TouchableOpacity key={type} onPress={() => setSelectedAQI(type)} style={styles.aqiItem}>
            <Text style={{ color: selectedAQI === type ? 'blue' : 'black' }}>{type}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  baseControl: {
    position: 'absolute', top: 50, left: 10,
    backgroundColor: 'white', padding: 6, borderRadius: 8, zIndex: 10,
  },
  baseItem: { marginHorizontal: 6 },
  aqiControl: {
    position: 'absolute', top: 100, left: 10,
    backgroundColor: 'white', padding: 6, borderRadius: 8, zIndex: 10,
  },
  aqiItem: { marginHorizontal: 6 },
  layerControl: {
    position: 'absolute', bottom: 20, left: 10,
    backgroundColor: 'white', padding: 10, borderRadius: 8,
    maxHeight: 250, zIndex: 10,
  },
  layerItem: { paddingVertical: 4 }
});