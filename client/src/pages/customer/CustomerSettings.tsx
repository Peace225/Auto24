import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  User, MapPin, Phone, Camera, 
  Loader2, ShieldCheck, Lock, Save 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CustomerSettings() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // États du formulaire
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    commune: ''
  });

  // Charger les données initiales
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        commune: user.commune || ''
      });
    }
  }, [user]);

  // 🟢 LOGIQUE UPLOAD AVATAR (Sécurisée contre l'erreur 400)
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
        .upload(filePath, file, { 
          contentType: file.type,
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // Met à jour la Navbar et le Sidebar instantanément
      setUser({ ...user, avatar_url: publicUrl });
      toast.success("Portrait mis à jour !");
    } catch (error: any) {
      toast.error("Erreur de téléchargement.");
      console.error(error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 🟢 LOGIQUE MISE À JOUR PROFIL
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

      // Met à jour le store local
      setUser({ ...user!, ...formData });
      toast.success("Informations sauvegardées avec succès.");
    } catch (error: any) {
      toast.error("Erreur lors de la sauvegarde.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLONNE GAUCHE : PHOTO & SÉCURITÉ */}
        <div className="space-y-8">
          
          {/* Carte Avatar */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-32 bg-slate-50"></div>
            
            <div className="relative z-10 flex flex-col items-center mt-6">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <label className="absolute -bottom-3 -right-3 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-slate-900 transition-all border-4 border-white">
                  <Camera className="w-5 h-5" />
                  <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-[2rem] flex items-center justify-center border-4 border-white">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">{user?.full_name || 'Membre SpaceAuto'}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{user?.email}</p>
              
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">Compte Sécurisé</span>
              </div>
            </div>
          </div>

          {/* Carte Sécurité (Visuelle) */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
            <Lock className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 rotate-12" />
            <div className="relative z-10">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-400 mb-4">Mot de passe</h4>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight mb-6">
                Pour modifier votre mot de passe, un lien sécurisé sera envoyé à votre adresse email.
              </p>
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : FORMULAIRE */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8">
            <div className="mb-4 border-b border-slate-50 pb-6">
              <h2 className="text-2xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Informations <span className="text-blue-600">Personnelles</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Mettez à jour vos coordonnées de livraison</p>
            </div>

            <div className="space-y-6">
              {/* Champ Nom Complet */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  <User className="w-4 h-4 text-blue-600" /> Nom complet
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="EX: JEAN KOUASSI"
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-[11px] font-black text-slate-900 uppercase focus:border-blue-600 focus:bg-white outline-none transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Champ Téléphone */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    <Phone className="w-4 h-4 text-blue-600" /> Téléphone
                  </label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+225 00 00 00 00 00"
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-[11px] font-black text-slate-900 uppercase focus:border-blue-600 focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Champ Commune */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    <MapPin className="w-4 h-4 text-blue-600" /> Commune principale
                  </label>
                  <input 
                    type="text" 
                    value={formData.commune}
                    onChange={(e) => setFormData({...formData, commune: e.target.value})}
                    placeholder="EX: COCODY ANGRÉ"
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-[11px] font-black text-slate-900 uppercase focus:border-blue-600 focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Sauvegarder les modifications <Save className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}