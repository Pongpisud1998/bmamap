
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

MapboxGL.setAccessToken(null); // Not needed if using public styles like MapLibre demo

export default function MapViewComponent() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      MapboxGL.requestAndroidLocationPermissions();
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/basemap/ghyb.json"
      >
        <MapboxGL.Camera
          zoomLevel={12}
          centerCoordinate={[100.523186, 13.736717]} // Bangkok
        />
        <MapboxGL.PointAnnotation
          id="marker"
          coordinate={[100.523186, 13.736717]}
        >
          <View />
        </MapboxGL.PointAnnotation>
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
