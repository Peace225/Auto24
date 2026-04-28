import { useState } from 'react';
import { 
  Settings, User, ShieldCheck, 
  Save, Loader2, Percent, 
  Mail, Lock, Globe, Camera, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore';

export default function SettingsManager() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    adminName: user?.full_name || 'Admin',
    adminEmail: user?.email || '',
    commissionRate: '15',
    autoApproveProducts: false,
    emailNotifications: true,
    maintenanceMode: false
  });

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    try {
      let finalAvatarUrl = user.avatar_url;

      if (adminAvatar) {
        const fileExt = adminAvatar.name.split('.').pop();
        const fileName = `admin_${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, adminAvatar, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        finalAvatarUrl = urlData.publicUrl;
      } else if (adminAvatarPreview === null) {
        finalAvatarUrl = null;
      }

      const { error: dbError } = await supabase.from('profiles').update({ full_name: settings.adminName, avatar_url: finalAvatarUrl }).eq('id', user.id);
      if (dbError) throw dbError;

      setUser({ ...user, full_name: settings.adminName, avatar_url: finalAvatarUrl });
      toast.success("Paramètres enregistrés");
    } catch (error: any) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      
      {/* 🟢 HEADER COMPACT */}
      <div className="bg-[#111625] border border-white/5 rounded-xl md:rounded-[2.5rem] p-4 md:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-600/10 rounded-full blur-[50px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-3 mb-1">
            <Settings className="w-5 h-5 md:w-8 md:h-8 text-slate-400" />
            <h2 className="text-lg md:text-3xl font-[1000] uppercase tracking-tighter text-white italic">Paramètres</h2>
          </div>
          <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest md:ml-11">Configuration globale SpaceAuto24</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 md:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          
          {/* SECTION PROFIL */}
          <div className="space-y-4 md:space-y-8">
            <div className="bg-[#111625] border border-white/5 rounded-xl md:rounded-[2.5rem] p-5 md:p-8 shadow-xl">
              <h3 className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-white/5 pb-3 mb-5 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Compte Admin
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative group w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center hover:border-blue-500 transition-all overflow-hidden shrink-0">
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    {adminAvatarPreview ? (
                      <img src={adminAvatarPreview} alt="Avatar" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                     <h4 className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-wider">Avatar Admin</h4>
                     <p className="text-[8px] font-bold text-slate-500 uppercase">Modifier la photo</p>
                     {adminAvatarPreview && (
                        <button type="button" onClick={removeAvatar} className="mt-1 text-[7px] font-black text-red-500 uppercase flex items-center gap-1">
                          <X className="w-2.5 h-2.5" /> Supprimer
                        </button>
                     )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom Complet</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input type="text" name="adminName" value={settings.adminName} onChange={handleChange} className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg font-bold text-white outline-none focus:border-blue-500/50 transition-all text-[11px]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Lecture seule)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input type="email" disabled value={settings.adminEmail} className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg font-bold text-slate-500 outline-none cursor-not-allowed text-[11px]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111625] border border-white/5 rounded-xl p-4 md:p-8 shadow-xl">
              <h3 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Sécurité
              </h3>
              <button type="button" className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/5 rounded-lg"><Lock className="w-3.5 h-3.5 text-slate-400" /></div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Changer le mot de passe</span>
                </div>
                <span className="text-[7px] text-slate-500 font-bold uppercase">Accès restreint</span>
              </button>
            </div>
          </div>

          {/* SECTION PLATEFORME */}
          <div className="space-y-4 md:space-y-8">
            <div className="bg-[#111625] border border-white/5 rounded-xl md:rounded-[2.5rem] p-5 md:p-8 shadow-xl">
              <h3 className="text-[9px] font-black text-purple-500 uppercase tracking-widest border-b border-white/5 pb-3 mb-5 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Règles Marketplace
              </h3>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Commission Globale (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input type="number" name="commissionRate" value={settings.commissionRate} onChange={handleChange} className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg font-bold text-white outline-none focus:border-purple-500/50 transition-all text-[11px]" />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <ToggleSwitch 
                    label="Validation automatique" 
                    description="Publication sans modération"
                    name="autoApproveProducts"
                    checked={settings.autoApproveProducts}
                    onChange={handleChange}
                  />
                  <ToggleSwitch 
                    label="Mode Maintenance" 
                    description="Désactiver l'accès public"
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

        {/* 🟢 BOUTON SAUVEGARDE COMPACT */}
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-blue-600 text-white font-[1000] text-[9px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.25)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enregistrer les réglages <Save className="w-3.5 h-3.5" /></>}
          </button>
        </div>
      </form>
    </div>
  );
}

function ToggleSwitch({ label, description, name, checked, onChange, isDanger = false }: any) {
  return (
    <label className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
      <div className="pr-2">
        <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isDanger ? 'text-red-400' : 'text-white'}`}>{label}</p>
        <p className="text-[7.5px] font-bold text-slate-500 uppercase leading-none">{description}</p>
      </div>
      <div className="relative shrink-0">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only peer" />
        <div className={`w-9 h-5 rounded-full peer-focus:outline-none transition-colors ${checked ? (isDanger ? 'bg-red-600' : 'bg-blue-600') : 'bg-slate-700'}`}></div>
        <div className="absolute left-[2px] top-[2px] bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
      </div>
    </label>
  );
}