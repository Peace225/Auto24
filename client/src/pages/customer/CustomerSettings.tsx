import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  User, MapPin, Phone, Camera, 
  Loader2, ShieldCheck, Lock, Save, X 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CustomerSettings() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    commune: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        commune: user.commune || ''
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop lourde (max 2Mo)");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setUser({ ...user, avatar_url: publicUrl });
      toast.success("Portrait mis à jour !");
    } catch (error: any) {
      toast.error("Erreur de téléchargement.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          commune: formData.commune
        })
        .eq('id', user?.id);

      if (error) throw error;
      setUser({ ...user!, ...formData });
      toast.success("Profil sauvegardé.");
    } catch (error: any) {
      toast.error("Erreur de sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        
        {/* COLONNE GAUCHE : PHOTO & SÉCURITÉ */}
        <div className="space-y-6 md:space-y-8">
          
          {/* Carte Avatar Compacte */}
          <div className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-20 md:h-32 bg-slate-50"></div>
            
            <div className="relative z-10 flex flex-col items-center mt-4 md:mt-6">
              <div className="relative mb-4 md:mb-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-[2rem] border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center cursor-pointer shadow-lg border-4 border-white active:scale-95 transition-transform">
                  <Camera className="w-4 h-4 md:w-5 md:h-5" />
                  <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl md:rounded-[2rem] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              
              <h3 className="text-lg md:text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">{user?.full_name || 'Membre'}</h3>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate max-w-full">{user?.email}</p>
              
              <div className="mt-4 md:mt-6 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Compte Vérifié</span>
              </div>
            </div>
          </div>

          {/* Carte Sécurité Compacte */}
          <div className="bg-slate-900 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
            <Lock className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
            <div className="relative z-10">
              <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-blue-400 mb-2 md:mb-4">Sécurité</h4>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 leading-tight uppercase mb-4">
                Lien de réinitialisation par email.
              </p>
              <button className="w-full py-3 md:py-4 bg-white/10 hover:bg-white/20 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                Changer le pass
              </button>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : FORMULAIRE COMPACT */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] p-5 md:p-12 shadow-sm space-y-6 md:space-y-8">
            <div className="mb-2 border-b border-slate-50 pb-4 md:pb-6">
              <h2 className="text-lg md:text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Profil <span className="text-blue-600">Client</span></h2>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Vos coordonnées de livraison</p>
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Champ Nom Complet */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Nom complet
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-4 py-3.5 md:px-6 md:py-5 bg-slate-50 border-2 border-slate-50 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black text-slate-900 uppercase focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Champ Téléphone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" /> Téléphone
                  </label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+225..."
                    className="w-full px-4 py-3.5 md:px-6 md:py-5 bg-slate-50 border-2 border-slate-50 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black text-slate-900 uppercase focus:border-blue-600 focus:bg-white outline-none transition-all"
                  />
                </div>

                {/* Champ Commune */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Commune
                  </label>
                  <input 
                    type="text" 
                    value={formData.commune}
                    onChange={(e) => setFormData({...formData, commune: e.target.value})}
                    placeholder="COCODY, YOP..."
                    className="w-full px-4 py-3.5 md:px-6 md:py-5 bg-slate-50 border-2 border-slate-50 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black text-slate-900 uppercase focus:border-blue-600 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 md:pt-8 border-t border-slate-50">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 md:py-5 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em] active:scale-95 transition-all shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>Mettre à jour le profil <Save className="w-3.5 h-3.5 md:w-4 md:h-4" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}