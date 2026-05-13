/**
 * Calcule le prix final affiché au public (TVA et Frais de service inclus)
 * basé sur des paliers de prix stricts, APPLIQUÉ À TOUS LES PRODUITS SANS EXCEPTION.
 * 
 * @param basePrice - Le prix de base fixé par le vendeur
 * @param vendorRole - (Optionnel) Conservé pour la compatibilité avec les autres fichiers
 * @returns Le prix final arrondi
 */
export const getPublicPrice = (basePrice: number, vendorRole?: string): number => {
  let commissionRate = 0;

  // 🟢 Application stricte de tes paliers de commission POUR TOUT LE MONDE
  if (basePrice <= 30000) {
    commissionRate = 0.05;       // 5% pour 0 - 30 000 FCFA
  } else if (basePrice <= 100000) {
    commissionRate = 0.08;       // 8% pour 30 001 - 100 000 FCFA
  } else if (basePrice <= 300000) {
    commissionRate = 0.10;       // 10% pour 100 001 - 300 000 FCFA
  } else {
    commissionRate = 0.12;       // 12% pour 300 000 FCFA et plus
  }

  // Retourne le prix calculé et arrondi à l'entier
  return Math.round(basePrice + (basePrice * commissionRate));
};