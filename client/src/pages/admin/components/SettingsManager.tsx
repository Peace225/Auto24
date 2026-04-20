import { useState } from 'react';
import { 
  Settings, User, ShieldCheck, 
  Save, Loader2, Database, Percent, 
  Mail, Lock, Globe, Camera, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore'; // 🟢 Importation du store global

export default function SettingsManager() {
  const { user, setUser } = useAuthStore(); // 🟢 Récupération de l'admin actuel et du setter
  const [isLoading, setIsLoading] = useState(false);
  
  // États synchronisés avec les données réelles de l'admin
  const [settings, setSettings] = useState({
    adminName: user?.full_name || 'Admin',
    adminEmail: user?.email || '',
    commissionRate: '15',
    autoApproveProducts: false,
    emailNotifications: true,
    maintenanceMode: false
  });

  // ÉTATS POUR LA PHOTO DE PROFIL ADMIN
  const [adminAvatar, setAdminAvatar] = useState<File | null>(null);
  const [adminAvatarPreview, setAdminAvatarPreview] = useState<string | null>(user?.avatar_url || null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAdminAvatar(file);
      setAdminAvatarPreview(URL.createObjectURL(file)); 
    }
  };

  const removeAvatar = () => {
    setAdminAvatar(null);
    setAdminAvatarPreview(null);
  };

  // ==========================================
  // 🟢 LOGIQUE DE SAUVEGARDE RÉELLE (SUPABASE)
  // ==========================================
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    try {
      let finalAvatarUrl = user.avatar_url;

      // 1. Si une nouvelle image a été choisie, on l'upload
      if (adminAvatar) {
        const fileExt = adminAvatar.name.split('.').pop();
        const fileName = `admin_${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images') // Assure-toi que ton bucket s'appelle "images"
          .upload(filePath, adminAvatar, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        finalAvatarUrl = urlData.publicUrl;
      } else if (adminAvatarPreview === null) {
        finalAvatarUrl = null; // Si l'admin a cliqué sur supprimer
      }

      // 2. Mise à jour dans la table 'profiles' de Supabase
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ 
          full_name: settings.adminName,
          avatar_url: finalAvatarUrl 
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // 3. 🟢 MISE À JOUR DU STORE GLOBAL (ZUSTAND)
      // C'est cette ligne qui fait changer l'image dans ta Navbar !
      setUser({
        ...user,
        full_name: settings.adminName,
        avatar_url: finalAvatarUrl
      });

      toast.success("Profil et paramètres mis à jour !");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur lors de la sauvegarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-slate-400" />
            <h2 className="text-2xl md:text-3xl font-[1000] uppercase tracking-tighter text-white italic">Paramètres Système</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] md:ml-11">
            Configuration globale SpaceAuto24
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLONNE GAUCHE : PROFIL */}
          <div className="space-y-8">
            <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                <User className="w-4 h-4" /> Compte Super Admin
              </h3>
              
              <div className="space-y-8">
                {/* ZONE PHOTO DE PROFIL CIRCULAIRE */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center hover:border-blue-500 hover:bg-white/10 transition-all overflow-hidden shrink-0 shadow-lg">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                    />
                    {adminAvatarPreview ? (
                      <div className="absolute inset-0 w-full h-full bg-black/40 z-10 flex items-center justify-center">
                        <img src={adminAvatarPreview} alt="Avatar Admin" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-center sm:text-left">
                     <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1">Avatar Administrateur</h4>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cliquez pour modifier</p>
                     {adminAvatarPreview && (
                        <button type="button" onClick={removeAvatar} className="mt-2 text-[8px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1 mx-auto sm:mx-0">
                          <X className="w-3 h-3" /> Supprimer la photo
                        </button>
                     )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nom Complet</label>
                    <div className="relative group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      <input type="text" name="adminName" value={settings.adminName} onChange={handleChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email de connexion</label>
                    <div className="relative group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-600 transition-all rounded-l-2xl" />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      <input type="email" name="adminEmail" disabled value={settings.adminEmail} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-slate-500 outline-none cursor-not-allowed text-xs" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Sécurité & Accès
              </h3>
              <button type="button" className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-xl"><Lock className="w-4 h-4 text-slate-400 group-hover:text-white" /></div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Modifier le mot de passe</span>
                </div>
                <span className="text-[8px] text-slate-500 font-bold uppercase">🔐 Sécurisé</span>
              </button>
            </div>
          </div>

          {/* COLONNE DROITE : PLATEFORME */}
          <div className="space-y-8">
            <div className="bg-[#111625] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-widest border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Règles Marketplace
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Commission Globale (%)</label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-purple-600 transition-all rounded-l-2xl" />
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-500 transition-colors" />
                    <input type="number" name="commissionRate" value={settings.commissionRate} onChange={handleChange} className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-xs" />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <ToggleSwitch 
                    label="Validation auto des produits" 
                    description="Publication directe sans modération"
                    name="autoApproveProducts"
                    checked={settings.autoApproveProducts}
                    onChange={handleChange}
                  />
                  <ToggleSwitch 
                    label="Mode Maintenance" 
                    description="Désactiver l'accès public au site"
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                    isDanger={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full md:w-auto group relative overflow-hidden px-12 py-5 rounded-2xl bg-blue-600 text-white font-[1000] text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)] disabled:opacity-50"
          >
            <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Enregistrer les changements <Save className="w-4 h-4" /></>}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

function ToggleSwitch({ label, description, name, checked, onChange, isDanger = false }: any) {
  return (
    <label className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors">
      <div className="pr-4">
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDanger ? 'text-red-400' : 'text-white'}`}>{label}</p>
        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed">{description}</p>
      </div>
      <div className="relative shrink-0">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only peer" />
        <div className={`w-11 h-6 rounded-full peer-focus:outline-none transition-colors ${checked ? (isDanger ? 'bg-red-600' : 'bg-blue-600') : 'bg-slate-700'}`}></div>
        <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-full"></div>
      </div>
    </label>
  );
}