// src/lib/cloudinary.ts
import { Cloudinary } from "@cloudinary/url-gen";

// Configuration avec ton Cloud Name réel
export const cld = new Cloudinary({
  cloud: {
    cloudName: 'dpje4d7xa', 
  }
});

/**
 * Helper pour générer des URLs optimisées (format auto + qualité auto)
 * @param publicId - L'ID de l'image (ex: spaceauto24/products/moteur_v6)
 * @param width - Largeur souhaitée pour l'image
 */
export const getOptimizedUrl = (publicId: string, width = 500) => {
  return cld.image(publicId)
    .format('auto')     // Choisit le meilleur format (WebP, Avif) selon le navigateur
    .quality('auto')    // Compresse intelligemment sans perte de qualité visible
    .addTransformation(`w_${width},c_limit`) // Redimensionne pour éviter de charger des images trop grandes
    .toURL();
};