import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Loader2, MapPin, Camera,
  User as UserIcon, BadgeCheck, ShieldAlert, Store, Building
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function VendorSettings() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [shopData, setShopData] = useState({ name: '', description: '', address: '', manager_name: '' });
  const [vendorStatus, setVendorStatus] = useState<string>('unverified');
  const [files, setFiles] = useState<{ idCard: File | null; rccm: File | null; utilityBill: File | null }>({
    idCard: null, rccm: null, utilityBill: null
  });

  // Fetch profil et infos boutique
  const fetchVendorProfile = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setVendorStatus(data.vendor_status || 'unverified');
      setShopData({
        name: data.shop_name || '',
        description: data.shop_description || '',
        address: data.shop_address || '',
        manager_name: data.full_name || '' // <-- nom du gérant
      });
    }
  }, [user]);

  useEffect(() => { fetchVendorProfile(); }, [fetchVendorProfile]);

  // Upload logo boutique
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file ||!user) return;
    setLoading(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 800, fileType: 'image/webp' });
      const path = `${user.id}/logo-${Date.now()}.webp`;
      await supabase.storage.from('profiles').upload(path, compressed, { upsert: true, contentType: 'image/webp' });
      const { data } = supabase.storage.from('profiles').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
      setUser({...user, avatar_url: data.publicUrl });
      toast.success("Logo mis à jour!");
    } catch { toast.error("Erreur logo"); } finally { setLoading(false); }
  };

  const handleShopUpdate = async () => {
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      shop_name: shopData.name,
      shop_description: shopData.description,
      shop_address: shopData.address,
      full_name: shopData.manager_name // <-- sauvegarde nom gérant
    }).eq('id', user?.id);

    if (error) toast.error("Erreur mise à jour");
    else toast.success("Informations boutique enregistrées!");
    setLoading(false);
  };

  const handleCertificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.idCard ||!files.rccm ||!files.utilityBill) return toast.error("Dossier incomplet");
    setLoading(true);
    try {
      const urls: any = {};
      for (const [key, file] of Object.entries(files)) {
        const path = `${user?.id}/docs/${key}-${Date.now()}`;
        await supabase.storage.from('vendor-documents').upload(path, file!);
        urls[key] = supabase.storage.from('vendor-documents').getPublicUrl(path).data.publicUrl;
      }
      await supabase.from('profiles').update({
        vendor_status: 'pending',
        id_card_url: urls.idCard,
        rccm_url: urls.rccm,
        utility_bill_url: urls.utilityBill
      }).eq('id', user?.id);
      setVendorStatus('pending');
      toast.success("Dossier soumis pour vérification!");
    } catch { toast.error("Erreur envoi"); } finally { setLoading(false); }
  };

  const FileSlot = ({ label, icon: Icon, file, onChange }: any) => (
    <div className="relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer hover:border-amber-500 bg-slate-50">
      <input type="file" onChange={(e) => onChange(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" accept="image/*,.pdf" />
      <div className="flex flex-col items-center gap-2">
        {file? <BadgeCheck className="text-amber-500" /> : <Icon className="text-slate-400" />}
        <span className="text-xs font-bold uppercase">{file? "Document prêt" : label}</span>
        {file && <span className="text- text-slate-500 truncate max-w-full">{file.name}</span>}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">

      {/* 1. INFORMATIONS BOUTIQUE */}
      <div className="bg-white p-8 rounded- border shadow-sm">
        <h2 className="text-xl font-black flex items-center gap-2 mb-6"><Store /> Informations de la Boutique</h2>

        {/* LOGO BOUTIQUE AJOUTÉ */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border flex items-center justify-center">
            {user?.avatar_url? (
              <img src={user.avatar_url} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <label className="cursor-pointer bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800">
            {loading? <Loader2 className="w-4 h-4 animate-spin" /> : "Changer le logo"}
            <input type="file" hidden accept="image/*" onChange={handleLogoUpload} disabled={loading} />
          </label>
        </div>

        <div className="grid gap-4">
          <input type="text" placeholder="Nom de la boutique" className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-black outline-none" value={shopData.name} onChange={e => setShopData({...shopData, name: e.target.value})} />

          {/* NOM DU GÉRANT AJOUTÉ */}
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Nom du gérant" className="w-full pl-12 p-4 rounded-xl border focus:ring-2 focus:ring-black outline-none" value={shopData.manager_name} onChange={e => setShopData({...shopData, manager_name: e.target.value})} />
          </div>

          <textarea placeholder="Description" className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-black outline-none" rows={3} value={shopData.description} onChange={e => setShopData({...shopData, description: e.target.value})} />
          <input type="text" placeholder="Adresse physique" className="w-full p-4 rounded-xl border focus:ring-2 focus:ring-black outline-none" value={shopData.address} onChange={e => setShopData({...shopData, address: e.target.value})} />
          <button onClick={handleShopUpdate} disabled={loading} className="bg-black text-white py-3 rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50">
            {loading? "Enregistrement..." : "Enregistrer la boutique"}
          </button>
        </div>
      </div>

      {/* 2. BOUTONS UPLOAD DOCUMENTS */}
      <div className="bg-white p-8 rounded- border shadow-sm">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Building /> Documents de Certification</h2>
        <form onSubmit={handleCertificationSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FileSlot label="C.N.I" icon={FileText} file={files.idCard} onChange={(f: any) => setFiles({...files, idCard: f})} />
            <FileSlot label="R.C.C.M" icon={Upload} file={files.rccm} onChange={(f: any) => setFiles({...files, rccm: f})} />
            <FileSlot label="Facture Eau/Élec" icon={MapPin} file={files.utilityBill} onChange={(f: any) => setFiles({...files, utilityBill: f})} />
          </div>
          <button disabled={vendorStatus!== 'unverified' || loading} className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {vendorStatus === 'unverified'? "Soumettre au Super Admin" : "Statut: " + vendorStatus.toUpperCase()}
          </button>
        </form>
      </div>

    </div>
  );
}