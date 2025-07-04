const BASE_URL = "https://raw.githubusercontent.com/Pongpisud1998/bmamap/main/geodata/";

export const addLayer = async (layers: any[]) => {
    const enrichedLayers = await Promise.all(
        layers.map(async (layer) => {
            if (layer.type !== 'geojson') return layer;

            try {
                const response = await fetch(`${BASE_URL}${layer.path}`);
                const geojson = await response.json();
                return { ...layer, geojson };
            } catch (error) {
                console.error(`Error loading ${layer.name}`, error);
                return { ...layer, geojson: null };
            }
        })
    );

    return enrichedLayers;
};