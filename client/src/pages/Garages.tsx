import { useState, useEffect } from 'react';
import { MapPin, Star, Wrench, Phone, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { garageService } from '../services/garageService';
import type { Garage } from '../types';

const ZONES = ["Toutes les zones", "Marcory", "Yopougon", "Cocody", "Adjamé", "Koumassi", "Treichville"];
const SPECIALTIES = ["Toutes", "Mécanique Générale", "Diagnostic Électronique", "Climatisation", "Pneumatique", "Carrosserie"];

export default function Garages() {
  // Correction Typage : On utilise l'interface Garage importée
  const [garages, setGarages] = useState<Garage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState("Toutes les zones");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Toutes");

  useEffect(() => {
    let isMounted = true;

    const fetchGarages = async () => {
      setIsLoading(true);
      try {
        const data = await garageService.getGarages({
          // On passe undefined si "Toutes" pour laisser le service gérer le filtre
          commune: selectedZone !== "Toutes les zones" ? selectedZone : undefined,
          specialty: selectedSpecialty !== "Toutes" ? selectedSpecialty : undefined
        });
        
        if (isMounted) {
          setGarages(data || []);
        }
      } catch (error) {
        console.error("Erreur SpaceAuto24 - Garages:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchGarages();

    return () => { isMounted = false; };
  }, [selectedZone, selectedSpecialty]);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* HERO SECTION */}
      <div className="bg-slate-900 py-16 md:py-24 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] md:text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <ShieldCheck className="w-4 h-4" />
              <span>Réseau de Confiance Abidjan</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-8">
              Trouvez le bon garage pour <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 italic">monter vos pièces</span>
            </h1>
            
            <div className="bg-white p-3 rounded-3xl md:rounded-full flex flex-col md:flex-row gap-3 max-w-4xl shadow-2xl">
              <div className="flex-1 flex items-center bg-slate-50 rounded-2xl md:rounded-full px-5 py-4">
                <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                <select 
                  className="bg-transparent w-full outline-none text-sm font-black text-slate-700 cursor-pointer appearance-none uppercase tracking-tight"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                >
                  {ZONES.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                </select>
              </div>
              
              <div className="flex-1 flex items-center bg-slate-50 rounded-2xl md:rounded-full px-5 py-4">
                <Wrench className="w-5 h-5 text-emerald-500 mr-3" />
                <select 
                  className="bg-transparent w-full outline-none text-sm font-black text-slate-700 cursor-pointer appearance-none uppercase tracking-tight"
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
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Loader2 className="w-16 h-16 animate-spin mb-6 text-blue-600" />
            <p className="font-black uppercase tracking-[0.3em] text-[10px]">Analyse du réseau en cours...</p>
          </div>
        ) : garages.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto">
            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Secteur hors réseau</h3>
            <p className="text-slate-500 font-medium italic">Nous n'avons pas encore d'experts certifiés dans cette zone.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-12">
            {garages.map((garage) => (
              <div key={garage.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 group flex flex-col border-b-4 border-b-transparent hover:border-b-blue-600">
                <div className="h-60 relative overflow-hidden">
                  <img 
                    src={garage.image_url || 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80'} 
                    alt={garage.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  />
                  <div className="absolute top-6 left-6">
                    {garage.is_certified && (
                      <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-[0.1em] px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/30">
                        <ShieldCheck className="w-4 h-4" /> Certifié SpaceAuto24
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-8 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-none mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                        {garage.name}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{garage.commune}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                      <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                      <span className="text-xs font-black text-orange-700">{garage.rating || "New"}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                    {garage.specialties?.slice(0, 3).map((spec: string, idx: number) => (
                      <span key={idx} className="bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border border-slate-100">
                        {spec}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-auto pt-8 border-t border-slate-50 flex gap-4">
                    <button className="flex-[2] bg-slate-900 hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                      Réserver un pont
                    </button>
                    {garage.whatsapp_number && (
                      <a 
                        href={`https://wa.me/225${garage.whatsapp_number.replace(/\s/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/5 active:scale-95"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
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