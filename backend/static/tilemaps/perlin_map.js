import { createNoise2D } from '../../node_modules/simplex-noise/dist/esm/simplex-noise.js';

export function generatePerlinMap(map, layerEau, layerIle) {
    const eau = 57
    const sable = 58
    //applique le jeu de tuile tileset au calque surface
    //const layer = map.createLayer('Surface 1', tileset); 
    const noise = new createNoise2D();

    const frequence = 0.05;
    const rayonIle = 1.3; // A augmenter en fonction des dimensions de la carte
    const variationBord = 0.08; // Réduit pour éviter des variations trop chaotiques

    for (let i = 0; i < map.height; i++) {
        for (let j = 0; j < map.width; j++) {
            const noiseValue = (noise(i * frequence, j * frequence) + 1) / 2;

            // Calculer la distance du centre (dégradé radial)
            const dx = (i - map.height / 2.0) / (map.height / 2.0);
            const dy = (j - map.width / 2.0) / (map.width / 2.0);
            // Utiliser une distance Manhattan modifiée pour une forme plus naturelle
            const distanceCentre = Math.sqrt(dx * dx + dy * dy) * 1.1;

            // Ajouter une variation progressive du bruit selon la distance
            const variationProgressive = variationBord * (1 - distanceCentre);
            const seuil = rayonIle + (noiseValue - 0.5) * variationProgressive;

            if (distanceCentre > seuil) {
                layerEau.putTileAt(eau, i, j);
                //console.log(layer.getTileAt(i,j))
                //layer.getTileAt(i,j).canCollide = true;
            } else {
                layerIle.putTileAt(sable, i, j);
            }
        }
    }

}
