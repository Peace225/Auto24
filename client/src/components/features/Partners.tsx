import { ChevronLeft, ChevronRight, Pause, Play, Award } from 'lucide-react';
import { useState } from 'react';

// Import dynamique des images locales
const logoFiles = import.meta.glob('../../assets/partners/*.{png,jpg,jpeg,svg,webp}', { eager: true, as: 'url' });

const PARTNERS = [
  { name: 'Elf', filename: 'elf.jpg' },
  { name: 'Valeo', filename: 'valeo.jpg' },
  { name: 'LAND ROVER', filename: 'landrover.jpg' },
  { name: 'CHEVROLET', filename: 'chevrolet.jpg' },
  { name: 'Bosch', filename: 'bosch.jpg' },
  { name: 'TRW', filename: 'trw.jpg' },
  { name: 'Toyota', filename: 'toyota.jpg' },
  { name: 'Mitsubishi', filename: 'mit.jpg' },
  { name: 'BMW', filename: 'bmw.jpg' },
  { name: 'Nissan', filename: 'nissan.jpg' },
  { name: 'Ford', filename: 'ford.jpg' },
  { name: 'GMC', filename: 'gmc.jpg' },
  { name: 'Honda', filename: 'honda.jpg' },
];

export default function Partners() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section className="bg-white py-8 md:py-20 border-t border-slate-50 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        
        {/* --- EN-TÊTE COMPACT --- */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-12 gap-4 md:gap-6">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center justify-center sm:justify-start gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-2 md:mb-3">
              <Award className="w-3 h-3 md:w-3.5 md:h-3.5" />
              Réseau Officiel
            </div>
            <h2 className="text-xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
              Nos partenaires 
               <span className="text-blue-600"> & marques</span>
            </h2>
            <p className="text-slate-500 text-[10px] md:text-sm mt-2 font-medium max-w-sm mx-auto sm:mx-0">
              Les plus grands équipementiers disponibles à Abidjan.
            </p>
          </div>

          {/* Contrôles d'animation Compacts */}
          <div className="flex items-center justify-center sm:justify-end gap-3 bg-slate-50 px-3 py-1.5 rounded-full w-full sm:w-auto self-center sm:self-auto shadow-sm border border-slate-100">
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="text-slate-400 hover:text-blue-600 transition-colors p-1"
              aria-label={isPaused ? "Reprendre" : "Pause"}
            >
              {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
            </button>
            <div className="w-px h-3 bg-slate-200" />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${i === 2 ? 'bg-blue-600 w-4' : 'bg-slate-200 w-1'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* --- ZONE DE DÉFILEMENT --- */}
        <div className="relative flex items-center group">
          
          <div className="absolute inset-y-0 left-0 w-8 md:w-24 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 md:w-24 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

          {/* CONTENEUR DU CARROUSEL (Cartes plus petites sur mobile) */}
          <div className="overflow-hidden w-full -mx-4 sm:mx-0 px-4 sm:px-0">
            <div 
              className={`flex items-center animate-infinite-scroll py-4 md:py-6 gap-3 md:gap-6 ${isPaused ? '[animation-play-state:paused]' : ''}`}
            >
              {[...PARTNERS, ...PARTNERS, ...PARTNERS].map((brand, index) => {
                const logoPath = `../../assets/partners/${brand.filename}`;
                const logoUrl = logoFiles[logoPath] as string;

                return (
                  <div key={index} className="flex-shrink-0">
                    {/* CARTE LOGO RÉDUITE */}
                    <div className="w-24 h-16 sm:w-36 sm:h-24 md:w-44 md:h-28 bg-white border border-slate-100 rounded-xl md:rounded-[1.5rem] shadow-sm flex items-center justify-center p-3 md:p-6 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer grayscale opacity-70 hover:grayscale-0 hover:opacity-100">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt={brand.name} 
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[7px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">{brand.name}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button className="hidden sm:flex absolute -left-2 lg:-left-6 z-30 p-2 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="hidden sm:flex absolute -right-2 lg:-right-6 z-30 p-2 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100">
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>
      </div>
    </section>
  );
}

function TrendingUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
      <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
  );
}