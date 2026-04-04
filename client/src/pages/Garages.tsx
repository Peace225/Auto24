// src/pages/Garages.tsx
import { useState, useMemo, useEffect } from 'react';
import { MapPin, Star, Wrench, Search, Phone, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { garageService } from '../services/garageService';
import type { Garage } from '../types';

const ZONES = ["Toutes les zones", "Marcory", "Yopougon", "Cocody", "Adjamé", "Koumassi", "Treichville"];
const SPECIALTIES = ["Toutes", "Mécanique Générale", "Diagnostic Électronique", "Climatisation", "Pneumatique", "Carrosserie"];

export default function Garages() {
  const [garages, setGarages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState("Toutes les zones");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Toutes");

  // 🟢 CHARGEMENT DEPUIS SUPABASE
  useEffect(() => {
    const fetchGarages = async () => {
      setIsLoading(true);
      const data = await garageService.getGarages({
        commune: selectedZone,
        specialty: selectedSpecialty
      });
      setGarages(data);
      setIsLoading(false);
    };
    fetchGarages();
  }, [selectedZone, selectedSpecialty]);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* HERO SECTION (Design original conservé) */}
      <div className="bg-slate-900 py-16 md:py-24 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] md:text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <ShieldCheck className="w-4 h-4" />
              <span>Réseau de Confiance Abidjan</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-tight mb-6">
              Trouvez le bon garage pour <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">monter vos pièces</span>
            </h1>
            
            <div className="bg-white p-2 rounded-2xl md:rounded-full flex flex-col md:flex-row gap-2 max-w-4xl shadow-2xl">
              <div className="flex-1 flex items-center bg-slate-50 rounded-xl md:rounded-full px-4 py-3">
                <MapPin className="w-5 h-5 text-slate-400 mr-3" />
                <select 
                  className="bg-transparent w-full outline-none text-sm font-bold text-slate-700 cursor-pointer appearance-none"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                >
                  {ZONES.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                </select>
              </div>
              
              <div className="flex-1 flex items-center bg-slate-50 rounded-xl md:rounded-full px-4 py-3">
                <Wrench className="w-5 h-5 text-slate-400 mr-3" />
                <select 
                  className="bg-transparent w-full outline-none text-sm font-bold text-slate-700 cursor-pointer appearance-none"
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                >
                  {SPECIALTIES.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTE DES GARAGES */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-black uppercase tracking-widest text-[10px]">Recherche des experts...</p>
          </div>
        ) : garages.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">Aucun garage dans cette zone</h3>
            <p className="text-slate-500">Essayez une autre commune d'Abidjan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {garages.map((garage) => (
              <div key={garage.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col">
                <div className="h-48 relative overflow-hidden">
                  <img src={garage.image_url} alt={garage.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4">
                    {garage.is_certified && (
                      <span className="bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Certifié SpaceAuto24
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold">{garage.commune}</span>
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{garage.name}</h3>
                    <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-md">
                      <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                      <span className="text-xs font-black text-orange-700">{garage.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {garage.specialties?.map((spec: string, idx: number) => (
                      <span key={idx} className="bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {spec}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-50 flex gap-3">
                    <button className="flex-1 bg-slate-900 hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl transition-colors">
                      Prendre RDV
                    </button>
                    <a 
                      href={`https://wa.me/225${garage.whatsapp_number}`} 
                      target="_blank" 
                      className="w-14 h-auto bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}