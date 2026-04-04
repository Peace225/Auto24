// src/data/mockData.ts

export const MOCK_PRODUCTS = [
  // ==========================================
  // 🟢 1. MOTEUR & TRANSMISSION (Pour la Grille)
  // ==========================================
  { id: 'm1', name: "Kit de Distribution Renforcé", brand: "GATES", category: "Distribution", price: 65000, oem_reference: "GAT-K01", is_certified: true, vendor_name: "Kouamé Auto Parts", image_filename: "distribution.jpg", inStock: true },
  { id: 'm2', name: "Kit d'embrayage complet + Butée", brand: "VALEO", category: "Embrayage", price: 125000, oem_reference: "VAL-8263", is_certified: true, vendor_name: "Top Mécanique Treichville", image_filename: "embrayage.jpg", inStock: true },
  { id: 'm3', name: "Turbocompresseur Garrett GT1749V", brand: "GARRETT", category: "Turbo", price: 250000, oem_reference: "GT-1749", is_certified: true, vendor_name: "Turbo CI Adjamé", image_filename: "turbo.jpg", inStock: true },
  { id: 'm4', name: "Injecteur Common Rail", brand: "DELPHI", category: "Injection", price: 85000, oem_reference: "DEL-INJ-CR", is_certified: true, vendor_name: "Diesel Expert", image_filename: "injecteur.jpg", inStock: true },

  // ==========================================
  // 🟢 2. FREINAGE & SÉCURITÉ (Pour la Grille)
  // ==========================================
  { id: 'f1', name: "Plaquettes de frein avant Céramique", brand: "BOSCH", category: "Plaquettes", price: 22000, oem_reference: "BOS-PL-Front", is_certified: true, vendor_name: "Garage Marcory Pro", image_filename: "frein_1.jpg", inStock: true },
  { id: 'f2', name: "Disques de Frein Ventilés (Jeu de 2)", brand: "BREMBO", category: "Disques", price: 45000, oem_reference: "BRE-DISC-V", is_certified: true, vendor_name: "Sidi Pièces Adjamé", image_filename: "frein_2.jpg", inStock: true },
  { id: 'f3', name: "Étrier de Frein Arrière", brand: "TRW", category: "Étrier", price: 35000, oem_reference: "TRW-ETR-R", is_certified: false, vendor_name: "Auto Elec Yopougon", image_filename: "frein_3.jpg", inStock: true },
  { id: 'f4', name: "Capteur de vitesse de roue ABS", brand: "ATE", category: "ABS", price: 18000, oem_reference: "ATE-ABS-01", is_certified: true, vendor_name: "Kouamé Auto Parts", image_filename: "capteur_abs.jpg", inStock: true },

  // ==========================================
  // 🟢 3. SUSPENSION & DIRECTION (Pour la Grille)
  // ==========================================
  { id: 's1', name: "Amortisseur Gaz Avant", brand: "MONROE", category: "Amortisseurs", price: 38000, oem_reference: "MON-G-Front", is_certified: true, vendor_name: "Top Mécanique Treichville", image_filename: "suspension_1.jpg", inStock: true },
  { id: 's2', name: "Bras de Suspension Inférieur", brand: "FEBI", category: "Bras", price: 25000, oem_reference: "FEB-BRAS-01", is_certified: true, vendor_name: "Sidi Pièces Adjamé", image_filename: "suspension_3.jpg", inStock: true },
  { id: 's3', name: "Rotule de Direction Extérieure", brand: "DELPHI", category: "Rotules", price: 9500, oem_reference: "DEL-ROT-EX", is_certified: false, vendor_name: "Garage Marcory Pro", image_filename: "suspension_2.jpg", inStock: true },
  { id: 's4', name: "Crémaillère de Direction Assistée", brand: "ZF", category: "Crémaillère", price: 185000, oem_reference: "ZF-CREM-01", is_certified: true, vendor_name: "Direction Plus Abidjan", image_filename: "cremaillere.jpg", inStock: true },

  // ==========================================
  // 🟢 4. FILTRATION & HUILE (Pour la Grille)
  // ==========================================
  { id: 'h1', name: "Huile Moteur Quartz 9000 5W-40 (5 Litres)", brand: "TOTAL", category: "Huile moteur", price: 24500, oem_reference: "TOT-9000-540", is_certified: true, vendor_name: "Station Total Angré", image_filename: "huile_1.jpg", inStock: true },
  { id: 'h2', name: "Filtre à Air Haute Filtration", brand: "PURFLUX", category: "Filtre air", price: 7500, oem_reference: "PUR-AIR-1", is_certified: true, vendor_name: "Top Mécanique Treichville", image_filename: "huile_3.jpg", inStock: true },
  { id: 'h3', name: "Filtre à Huile Métallique", brand: "BOSCH", category: "Filtre huile", price: 4500, oem_reference: "BOS-OIL-F", is_certified: true, vendor_name: "Garage Marcory Pro", image_filename: "huile_2.jpg", inStock: true },
  { id: 'h4', name: "Bouchon de Carter + Joint de Vidange", brand: "CORTECO", category: "Vidange", price: 1500, oem_reference: "COR-VID-01", is_certified: false, vendor_name: "Kouamé Auto Parts", image_filename: "bouchon.jpg", inStock: true },

  // ==========================================
  // 🟢 5. DÉMARRAGE & ÉNERGIE (Pour la Grille)
  // ==========================================
  { id: 'd1', name: "Batterie Start & Stop 70Ah", brand: "VARTA", category: "Batteries", price: 75000, oem_reference: "VAR-E39", is_certified: true, vendor_name: "Station Total Angré", image_filename: "demarrage_1.jpg", inStock: true },
  { id: 'd2', name: "Alternateur 14V 120A", brand: "DENSO", category: "Alternateurs", price: 110000, oem_reference: "DEN-ALT-120", is_certified: true, vendor_name: "Diesel Expert", image_filename: "demarrage_3.jpg", inStock: true },
  { id: 'd3', name: "Bougies d'allumage Iridium (x4)", brand: "NGK", category: "Bougies", price: 24000, oem_reference: "NGK-IRI-4", is_certified: true, vendor_name: "Sidi Pièces Adjamé", image_filename: "bougies.jpg", inStock: true },
  { id: 'd4', name: "Démarreur 1.4 kW", brand: "VALEO", category: "Démarreurs", price: 65000, oem_reference: "VAL-DEM-14", is_certified: true, vendor_name: "Auto Elec Yopougon", image_filename: "demarrage_2.jpg", inStock: false },

  // ==========================================
  // 🟢 6. VISIBILITÉ & PHARES (Pour la Grille)
  // ==========================================
  { id: 'v1', name: "Phare Avant Droit Full LED", brand: "TOYOTA OEM", category: "Phares LED", price: 150000, oem_reference: "TY-HL-22", is_certified: true, vendor_name: "Abidjan Optiques", image_filename: "phare_1.jpg", inStock: true },
  { id: 'v2', name: "Lot de 2 Ampoules H7 Vision Plus", brand: "PHILIPS", category: "Ampoules", price: 8500, oem_reference: "PH-H7-VP", is_certified: true, vendor_name: "Station Total Angré", image_filename: "phare_2.jpg", inStock: true },
  { id: 'v3', name: "Rétroviseur droit électrique + clignotant", brand: "PEUGEOT OEM", category: "Rétroviseurs", price: 55000, oem_reference: "PG-RET-208D", is_certified: true, vendor_name: "Kouamé Auto Parts", image_filename: "carrosserie_1.jpg", inStock: true },
  { id: 'v4', name: "Balais d'essuie-glace Aerotwin (Jeu de 2)", brand: "BOSCH", category: "Essuie-glace", price: 15000, oem_reference: "BOS-AER-22", is_certified: true, vendor_name: "Sidi Pièces Adjamé", image_filename: "essuie_1.jpg", inStock: true },

  // ==========================================
  // 🟢 8. CLIMATISATION & THERMIQUE (Pour la Grille)
  // ==========================================
  { id: 'c1', name: "Compresseur de Climatisation", brand: "DENSO", category: "Compresseur", price: 175000, oem_reference: "DEN-COMP-A", is_certified: true, vendor_name: "Kouamé Auto Parts", image_filename: "clim_1.jpg", inStock: true },
  { id: 'c2', name: "Radiateur de Refroidissement Moteur", brand: "NISSENS", category: "Radiateur", price: 55000, oem_reference: "NIS-RAD-M", is_certified: true, vendor_name: "Auto Elec Yopougon", image_filename: "clim_3.jpg", inStock: true },
  { id: 'c3', name: "Condenseur de climatisation en aluminium", brand: "VALEO", category: "Condenseur", price: 75000, oem_reference: "VAL-CON-11", is_certified: true, vendor_name: "Garage Marcory Pro", image_filename: "clim_2.jpg", inStock: true },
  { id: 'c4', name: "Sonde de Température Liquide Refroidissement", brand: "DELPHI", category: "Sondes", price: 12000, oem_reference: "DEL-SON-T", is_certified: false, vendor_name: "Treichville Auto", image_filename: "capteur_1.jpg", inStock: true },

  // ==========================================
  // 🟦 PIÈCES GÉNÉRALES (Pour la Navbar)
  // ==========================================
  { id: 'gen1', name: "Support Moteur Supérieur Droit", brand: "FEBI", category: "Pièces moteur", price: 18500, oem_reference: "FB-2234-A", is_certified: true, vendor_name: "Kouamé Auto Parts", image_filename: "moteur_1.jpg", inStock: true },
  { id: 'gen2', name: "Sonde Lambda Universelle 4 fils", brand: "DELPHI", category: "Capteurs et Sondes", price: 32000, oem_reference: "DEL-LAM-04", is_certified: true, vendor_name: "Auto Elec Yopougon", image_filename: "capteur_2.jpg", inStock: true },
  { id: 'gen3', name: "Silencieux arrière Inox universel", brand: "WALKER", category: "Echappement", price: 45000, oem_reference: "WLK-SIL-88", is_certified: true, vendor_name: "Top Mécanique Treichville", image_filename: "echappement_1.jpg", inStock: true },
  { id: 'gen4', name: "Joint de culasse Multicouche", brand: "ELRING", category: "Joints et Étanchéité", price: 22000, oem_reference: "ELR-JC-450", is_certified: true, vendor_name: "Garage Marcory Pro", image_filename: "joint_1.jpg", inStock: true }
];

// ==========================================
// 🟢 7. PNEUS & ÉQUIPEMENTS (Pour la Grille & Navbar)
// ==========================================
export const MOCK_TIRES = [
  // Liens de la grille
  { id: 't1', name: "Michelin Primacy 4", dimensions: "205/55 R16 91V", price: 65000, category: "Pneus été/4x4", brand: "Michelin", inStock: true, is_certified: true, vendor_name: "Abidjan Pneus Express", image_filename: "pneu_1.jpg" },
  { id: 't2', name: "Jante Alu BBS 17 Pouces", dimensions: "5x112 - 17\"", price: 85000, category: "Jantes", brand: "BBS", inStock: true, is_certified: false, vendor_name: "Tuning Shop Yopougon", image_filename: "jante_1.jpg" },
  { id: 't3', name: "Lot de 4 Valves Électroniques TPMS", dimensions: "Universel", price: 25000, category: "Valves", brand: "SCHRADER", inStock: true, is_certified: true, vendor_name: "Point S Marcory", image_filename: "valves.jpg" },
  { id: 't4', name: "Mini Compresseur d'air Portatif 12V", dimensions: "Jusqu'à 7 bars", price: 35000, category: "Gonflage", brand: "MICHELIN", inStock: true, is_certified: true, vendor_name: "Outillage Pro Adjamé", image_filename: "compresseur.jpg" },
  
  // Liens de la Navbar
  { id: 't5', name: "Continental PremiumContact 6", dimensions: "195/65 R15 91H", price: 58000, category: "Pneus Tourisme", brand: "Continental", inStock: true, is_certified: true, vendor_name: "Point S Marcory", image_filename: "pneu_2.jpg" },
  { id: 't6', name: "BFGoodrich All-Terrain T/A KO2", dimensions: "265/65 R17 120S", price: 145000, category: "Pneus 4x4 & SUV", brand: "BFGoodrich", inStock: true, is_certified: true, vendor_name: "Abidjan Pneus Express", image_filename: "pneu_4x4_1.jpg" },
  { id: 't7', name: "Cric Hydraulique Rouleur 2 Tonnes", dimensions: "Levage max 340mm", price: 28000, category: "Accessoires Roues (Crics, etc.)", brand: "Michelin", inStock: true, is_certified: true, vendor_name: "Outillage Pro Adjamé", image_filename: "cric_1.jpg" }
];

// ==========================================
// 🟢 ACCESSOIRES & ENTRETIEN (Navbar)
// ==========================================
export const MOCK_ACCESSORIES = [
  { id: 'a1', name: "Shampoing Ultime Meguiar's avec Cire (1.4L)", reference: "MEG-G17748", price: 15000, category: "Entretien et Nettoyage", brand: "Meguiar's", inStock: true, is_certified: true, vendor_name: "Car Wash Angré", image_filename: "shampoing.jpg" },
  { id: 'a2', name: "Nettoyant Jantes Extrême sans acide", reference: "MIC-NJ-500", price: 6500, category: "Entretien et Nettoyage", brand: "Michelin", inStock: true, is_certified: true, vendor_name: "Station Total", image_filename: "nettoyant_jantes.jpg" },
  { id: 'a4', name: "Jeu de Housses de siège universelles Similicuir", reference: "HOU-SIM-01", price: 45000, category: "Accessoires Intérieurs", brand: "Walser", inStock: true, is_certified: false, vendor_name: "Treichville Auto", image_filename: "housse_siege.jpg" },
  { id: 'a7', name: "Bâche de protection Auto Anti-grêle (Taille L)", reference: "BAC-PRO-L", price: 35000, category: "Accessoires Extérieurs", brand: "Carpoint", inStock: true, is_certified: true, vendor_name: "Auto Shop Yopougon", image_filename: "bache.jpg" },
  { id: 'a10', name: "Coffre de toit 320 Litres Noir Mat", reference: "THU-OCEAN-80", price: 185000, category: "Attelage et Portage", brand: "Thule", inStock: true, is_certified: true, vendor_name: "Outdoor Auto", image_filename: "coffre_toit.jpg" }
];