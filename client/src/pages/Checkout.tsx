import { useState } from 'react';
import { MapPin, Wallet, CheckCircle2, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck, Loader2, FileDown, Home, Phone } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getPublicPrice } from '../utils/pricing';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const COMMUNES = ['Abobo','Adjamé','Attécoubé','Cocody','Koumassi','Marcory','Plateau','Port-Bouët','Treichville','Yopougon'];
const PAYMENTS = [
  { id: 'wave', name: 'Wave', desc: 'Sans frais' },
  { id: 'orange', name: 'Orange Money', desc: 'Sécurisé' },
  { id: 'mtn', name: 'MTN MoMo', desc: 'Rapide' },
  { id: 'cash', name: 'Espèces', desc: 'À la livraison' }
];

const images = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string,string>;

export default function Checkout() {
  const { items, clearCart } = useCartStore();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [pay, setPay] = useState('wave');
  const [form, setForm] = useState({ name:'', phone:'', commune:'', address:'' });

  const base = (i:any)=> i.original_price || i.price || 0;
  const final = (i:any)=> i.final_price || getPublicPrice(base(i));
  const total = items.reduce((s,i)=>s+final(i)*i.quantity,0) + 2000;

  const img = (p?:string)=>{ if(!p) return ''; const n=p.split('/').pop(); const f=Object.keys(images).find(k=>k.endsWith('/'+n)); return f?images[f]:p; };

  const placeOrder = async (e:React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data:{user} } = await supabase.auth.getUser();
      if(!user) throw new Error('Connectez-vous');

      // Récupère boutique
      const { data: prods } = await supabase.from('products')
       .select('id, vendor_id, shop:vendor_shops!vendor_id(shop_name)')
       .in('id', items.map(i=>i.id));

      const num = `SA-${Math.floor(100000+Math.random()*900000)}`;
      const { data: order, error } = await supabase.from('orders').insert({
        customer_id: user.id,
        client_name: form.name,
        client_phone: form.phone,
        delivery_city: form.commune,
        delivery_address: form.address,
        total_amount: total,
        status: 'pending',
        payment_method: pay,
        order_number: num
      }).select().single();
      if(error) throw error;

      const lines = items.map(it=>{
        const p = prods?.find(x=>x.id===it.id);
        return {
          order_id: order.id,
          product_id: it.id,
          product_name: it.name,
          quantity: it.quantity,
          unit_price: final(it),
          total_price: final(it)*it.quantity,
          vendor_id: p?.vendor_id,
          shop_name: p?.shop?.shop_name || 'SpaceAuto24'
        }
      });
      await supabase.from('order_items').insert(lines);

      setOrderNo(num); setDone(true); clearCart(); toast.success('Commande créée');
    } catch(err:any){ toast.error(err.message) }
    finally{ setLoading(false) }
  };

  const pdf = ()=>{
    const doc = new jsPDF();
    doc.text('SPACEAUTO24 - Reçu '+orderNo,14,20);
    autoTable(doc,{ startY:30, head:[['Produit','Qté','PU','Total']], body: items.map(i=>[i.name,i.quantity,final(i).toLocaleString(),(final(i)*i.quantity).toLocaleString()]) });
    doc.save(`recu_${orderNo}.pdf`);
  };

  if(done) return (
    <div className="min-h-screen bg-slate-50 grid place-items-center p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4"/>
        <h1 className="text-2xl font-black uppercase">Commande validée</h1>
        <p className="mt-2 text-slate-600">{form.name}</p>
        <p className="font-mono text-blue-600 font-bold my-3">{orderNo}</p>
        <button onClick={pdf} className="w-full bg-slate-900 text-white py-3 rounded-xl mt-4 flex items-center justify-center gap-2"><FileDown size={16}/> Reçu PDF</button>
        <Link to="/" className="w-full block bg-slate-100 py-3 rounded-xl mt-2">Accueil</Link>
      </div>
    </div>
  );

  if(!items.length) return (
    <div className="min-h-screen bg-slate-50 grid place-items-center">
      <div className="text-center">
        <ShoppingBag className="mx-auto text-slate-300" size={48}/>
        <h2 className="mt-4 font-black text-xl uppercase">Panier vide</h2>
        <Link to="/" className="mt-4 inline-block bg-blue-600 text-white px-6 py-3 rounded-xl">Boutique</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button onClick={()=>nav(-1)} className="flex items-center gap-2 text-xs uppercase font-bold text-slate-500 mb-6"><ArrowLeft size={14}/> Retour</button>

        <div className="grid lg:grid-cols-3 gap-6">
          <form onSubmit={placeOrder} className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border">
              <h3 className="font-black uppercase mb-4 flex items-center gap-2"><MapPin size={16} className="text-blue-600"/> Livraison</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <input required placeholder="Nom complet" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="p-3 bg-slate-50 rounded-xl border"/>
                <input required placeholder="07 00 00 00 00" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="p-3 bg-slate-50 rounded-xl border"/>
                <select required value={form.commune} onChange={e=>setForm({...form,commune:e.target.value})} className="p-3 bg-slate-50 rounded-xl border"><option value="">Commune</option>{COMMUNES.map(c=><option key={c}>{c}</option>)}</select>
                <input required placeholder="Adresse" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="p-3 bg-slate-50 rounded-xl border"/>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border">
              <h3 className="font-black uppercase mb-4 flex items-center gap-2"><Wallet size={16} className="text-blue-600"/> Paiement</h3>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENTS.map(p=>(
                  <label key={p.id} onClick={()=>setPay(p.id)} className={`p-4 border-2 rounded-xl cursor-pointer ${pay===p.id?'border-blue-600 bg-blue-50':'border-slate-200'}`}>
                    <div className="font-bold text-sm">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.desc}</div>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 text-emerald-600 text-xs mt-3"><ShieldCheck size={14}/> Paiement sécurisé</div>
            </div>
          </form>

          <div className="bg-slate-900 text-white p-6 rounded-2xl h-fit sticky top-6">
            <h3 className="font-bold uppercase mb-4">Résumé</h3>
            <div className="space-y-3 max-h-60 overflow-auto pr-2 mb-4">
              {items.map(i=>(
                <div key={i.id} className="flex gap-3">
                  <img src={img(i.image_url)} className="w-12 h-12 rounded-lg bg-white/10 object-contain"/>
                  <div className="text-xs">
                    <div className="font-bold truncate max-w-">{i.name}</div>
                    <div className="text-blue-400">x{i.quantity} • {(final(i)*i.quantity).toLocaleString()} F</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Sous-total</span><span>{(total-2000).toLocaleString()} F</span></div>
              <div className="flex justify-between text-emerald-400"><span>Livraison</span><span>2 000 F</span></div>
              <div className="flex justify-between font-black text-lg pt-2 border-t border-white/10"><span>Total</span><span>{total.toLocaleString()} F</span></div>
            </div>
            <button onClick={placeOrder} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold uppercase mt-5 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading?<Loader2 className="animate-spin" size={16}/>:'Confirmer'} <ArrowRight size={16}/>
            </button>
            <div className="flex items-center justify-center gap-1 text- text-slate-400 mt-3"><Phone size={12}/> Support: 07 00 00 00 00</div>
          </div>
        </div>
      </div>
    </div>
  );
}