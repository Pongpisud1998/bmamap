import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { addLayer } from './functions/addLayer'; // path to your addLayer.tsx

// Define basemaps
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

// Initial layer data
const initialLayers: any[] = [
  {
    id: 1,
    type: 'geojson',
    name_en: 'district',
    name: 'เขต',
    path: 'district.geojson',
    geojson: null,
    visible: true,
    icon: null,
    minzoom: 10,
    maxzoom: 15,
  },
  {
    id: 2,
    type: 'geojson',
    name_en: 'road',
    name: 'เส้นถนน',
    path: 'bma_road.geojson',
    geojson: null,
    visible: true,
    icon: null,
    minzoom: 15,
    maxzoom: 22,
  },
  {
    id: 3,
    type: 'geojson',
    name_en: 'bma_school',
    name: 'โรงเรียน',
    path: 'bma_school.geojson',
    geojson: null,
    visible: true,
    icon: null,
    minzoom: 15,
    maxzoom: 22,
  },
  // ... add more
];

export default function MapViewScreen() {
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedStyle, setSelectedStyle] = useState(baseMapStyles[0].style);
  const [showBasemapSelector, setShowBasemapSelector] = useState(false);

  useEffect(() => {
    const loadLayers = async () => {
      const loaded = await addLayer(initialLayers);
      setLayers(loaded);
    };
    loadLayers();
  }, []);

  const toggleLayer = (id: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <MapboxGL.MapView style={{ flex: 1 }} styleURL={selectedStyle}>
        <MapboxGL.Camera zoomLevel={11} centerCoordinate={[100.5, 13.75]} />

        {layers.map((layer) => {
          if (!layer.visible || !layer.geojson) return null;

          return (
            <MapboxGL.ShapeSource
              key={`source-${layer.id}`}
              id={`source-${layer.id}`}
              shape={layer.geojson}
            >
              {layer.icon ? (
                <MapboxGL.SymbolLayer
                  id={`layer-${layer.id}`}
                  style={{
                    iconImage: layer.icon.replace('/assets/images/', '').replace('.png', ''),
                    iconSize: 0.5,
                  }}
                  minZoomLevel={layer.minzoom}
                  maxZoomLevel={layer.maxzoom}
                />
              ) : (
                <MapboxGL.LineLayer
                  id={`layer-${layer.id}`}
                  style={{ lineColor: 'blue', lineWidth: 1 }}
                  minZoomLevel={layer.minzoom}
                  maxZoomLevel={layer.maxzoom}
                />
              )}
            </MapboxGL.ShapeSource>
          );
        })}
      </MapboxGL.MapView>

      {/* Basemap Switcher Button */}
      <TouchableOpacity
        style={styles.basemapToggle}
        onPress={() => setShowBasemapSelector(!showBasemapSelector)}
      >
        <Text style={styles.buttonText}>🗺️</Text>
      </TouchableOpacity>

      {/* Basemap Selection Panel */}
      {showBasemapSelector && (
        <View style={styles.basemapList}>
          {baseMapStyles.map((item) => (
            <TouchableOpacity
              key={item.name}
              onPress={() => {
                setSelectedStyle(item.style);
                setShowBasemapSelector(false);
              }}
              style={[
                styles.basemapItem,
                selectedStyle === item.style && styles.basemapSelected
              ]}
            >
              <Text>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* GeoJSON Layer Toggle Panel */}
      <View style={styles.layerControl}>
        <FlatList
          data={layers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => toggleLayer(item.id)}
              style={styles.layerItem}
            >
              <Text>{item.visible ? '✅' : '⬜'} {item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layerControl: {
    position: 'absolute',
    top: 80,
    left: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    maxHeight: 250,
    zIndex: 999,
  },
  layerItem: {
    paddingVertical: 4,
  },
  basemapToggle: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    zIndex: 999,
  },
  buttonText: {
    fontSize: 18,
  },
  basemapList: {
    position: 'absolute',
    top: 90,
    right: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    zIndex: 999,
  },
  basemapItem: {
    paddingVertical: 6,
  },
  basemapSelected: {
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
});