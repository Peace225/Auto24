import { useState } from 'react';
import { MapPin, Phone, User, Wallet, CheckCircle2, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck, Truck, Loader2, FileDown, Home, CreditCard } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getPublicPrice } from '../utils/pricing'; // 🟢 Import de la logique de commission

const COMMUNES_ABIDJAN = [
  'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi', 
  'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon'
];

const PAYMENT_OPTIONS = [
  { id: 'wave', name: 'Wave Mobile', desc: 'Sans frais', type: 'image' },
  { id: 'orange', name: 'Orange Money', desc: 'Sécurisé CI', type: 'image' },
  { id: 'mtn', name: 'MTN MoMo', desc: 'Rapide', type: 'image' },
  { id: 'cash', name: 'Espèces', desc: 'À la livraison', type: 'icon' }
];

const allImages = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp}', { 
  eager: true, 
  query: '?url',
  import: 'default'
}) as Record<string, string>;

export default function Checkout() {
  // 🟢 1. On ne prend QUE les items et clearCart. On gère les calculs ici pour plus de sécurité.
  const { items, clearCart } = useCartStore();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('wave');
  const [formData, setFormData] = useState({
    fullName: '', phone: '', commune: '', address: ''
  });

  // 🟢 2. CALCULS SÉCURISÉS (Prix de base VS Prix Public via Paliers)
  const getItemBasePrice = (item: any) => item.original_price || item.price || 0;
  
  const getItemFinalPrice = (item: any) => {
    if (item.final_price) return item.final_price;
    const basePrice = getItemBasePrice(item);
    
    // 🟢 La fonction se base uniquement sur le prix, plus besoin du vendorPlan
    return getPublicPrice(basePrice);
  };

  // Somme totale que recevra le vendeur
  const baseTotal = items.reduce((acc, item) => acc + (getItemBasePrice(item) * item.quantity), 0);
  
  // Somme totale que paiera le client (hors livraison)
  const publicTotal = items.reduce((acc, item) => acc + (getItemFinalPrice(item) * item.quantity), 0);
  
  const deliveryFee = 2000;
  const serviceFee = publicTotal - baseTotal; // La marge de SpaceAuto24 calculée dynamiquement !
  const totalAmount = publicTotal + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getAssetUrl = (keyword: string) => {
    const path = Object.keys(allImages).find(p => p.toLowerCase().includes(keyword.toLowerCase()));
    return path ? allImages[path] : '';
  };

  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return 'https://via.placeholder.com/100?text=Piece';
    const name = imagePath.split('/').pop();
    const fullPath = Object.keys(allImages).find(path => path.endsWith(`/${name}`));
    return fullPath ? allImages[fullPath] : imagePath;
  };

  // 🟢 3. GÉNÉRATION DU REÇU PDF (Avec les bons prix)
  const generatePDFReceipt = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('SPACEAUTO24', 14, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('LA RÉFÉRENCE AUTOMOBILE À ABIDJAN', 14, 26);
    doc.text(`Reçu N° : ${orderId}`, 14, 34);
    doc.text(`Émis le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`, 14, 40);

    doc.setDrawColor(241, 245, 249);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 48, 180, 36, 3, 3, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATAIRE :', 18, 56);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nom : ${formData.fullName}`, 18, 63);
    doc.text(`Contact : ${formData.phone}`, 18, 69);
    doc.text(`Adresse : ${formData.address}, ${formData.commune}`, 18, 75);

    // Les lignes de produits utilisent le prix public (TTC)
    const tableData = items.map(item => [
      item.name.toUpperCase(),
      item.quantity.toString(),
      `${getItemFinalPrice(item).toLocaleString()} FCFA`,
      `${(getItemFinalPrice(item) * item.quantity).toLocaleString()} FCFA`
    ]);

    autoTable(doc, {
      startY: 92,
      head: [['DÉSIGNATION', 'QTÉ', 'P.U (TTC)', 'TOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontSize: 8, halign: 'center' },
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 90 }, 3: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.text('SOUS-TOTAL (Articles) :', 130, finalY);
    doc.text(`${baseTotal.toLocaleString()} FCFA`, 175, finalY, { align: 'right' });
    
    doc.text('FRAIS DE SERVICE :', 130, finalY + 7);
    doc.text(`${serviceFee.toLocaleString()} FCFA`, 175, finalY + 7, { align: 'right' });

    doc.text('LIVRAISON :', 130, finalY + 14);
    doc.text(`${deliveryFee.toLocaleString()} FCFA`, 175, finalY + 14, { align: 'right' });

    doc.setFillColor(37, 99, 235);
    doc.rect(125, finalY + 19, 70, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL TTC :', 130, finalY + 26);
    doc.text(`${totalAmount.toLocaleString()} FCFA`, 190, finalY + 26, { align: 'right' });

    doc.save(`Recu_SpaceAuto24_${orderId}.pdf`);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setOrderId(`SA-${Math.floor(100000 + Math.random() * 900000)}`);
      setOrderComplete(true);
      clearCart();
      setIsProcessing(false);
    }, 2000);
  };

  // 🔴 ÉCRAN DE SUCCÈS
  if (orderComplete) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4 md:p-6">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white ring-1 ring-emerald-100">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-3">Commande Valide</h2>
          <p className="text-slate-600 text-sm md:text-base mb-8 leading-relaxed">
            Merci <strong>{formData.fullName}</strong>. Numéro de suivi : <br/>
            <span className="text-blue-600 font-black text-lg mt-1 block">{orderId}</span>
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={generatePDFReceipt} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95">
              <FileDown className="w-4 h-4" /> Télécharger mon reçu
            </button>
            <Link to="/" className="w-full bg-slate-100 text-slate-700 p-4 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 🔴 ÉCRAN PANIER VIDE
  if (items.length === 0) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-slate-100">
          <ShoppingBag className="w-8 h-8 text-slate-300" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3">Panier Vide</h2>
        <p className="text-slate-500 mb-8 max-w-sm text-sm">Découvrez notre collection et ajoutez des pièces à votre commande.</p>
        <Link to="/" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md">
          Explorer le catalogue
        </Link>
      </div>
    );
  }

  // 🔵 ÉCRAN NORMAL DE CHECKOUT
  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-[10px] uppercase tracking-widest transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Retour au catalogue
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              Caisse Rapide
            </h1>
          </div>
          <div className="flex items-center gap-2 text-slate-400 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm w-fit">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Paiement 100% Sécurisé</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- COLONNE GAUCHE : FORMULAIRES --- */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-6">
              
              {/* LIVRAISON */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight">Livraison</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nom Complet</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400" placeholder="Ex: Bakayoko Moussa" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Téléphone</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400" placeholder="07 00 00 00 00" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Commune</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <select name="commune" required value={formData.commune} onChange={handleInputChange} className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-slate-900 appearance-none cursor-pointer">
                        <option value="">Sélectionner une zone</option>
                        {COMMUNES_ABIDJAN.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Adresse Précise</label>
                    <input type="text" name="address" required value={formData.address} onChange={handleInputChange} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400" placeholder="Quartier, Bâtiment..." />
                  </div>
                </div>
              </div>

              {/* PAIEMENT */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight">Paiement</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PAYMENT_OPTIONS.map((method) => {
                    const isSelected = selectedPayment === method.id;
                    return (
                      <label key={method.id} className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}>
                        <input type="radio" name="payment" value={method.id} checked={isSelected} onChange={() => setSelectedPayment(method.id)} className="sr-only" />
                        
                        <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-100 grayscale opacity-60'}`}>
                          {method.type === 'icon' ? (
                            <Truck className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                          ) : (
                            <img src={getAssetUrl(method.id)} alt={method.name} className="max-h-6 object-contain" />
                          )}
                        </div>

                        <div className="flex-grow">
                          <h3 className={`font-black text-xs uppercase tracking-tight ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{method.name}</h3>
                          <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{method.desc}</p>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>

          {/* --- COLONNE DROITE : RÉSUMÉ --- */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-slate-900 p-6 md:p-8 rounded-2xl text-white shadow-xl lg:sticky lg:top-24 border border-slate-800">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-4 text-slate-300 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Votre Panier
              </h2>

              <div className="space-y-4 mb-6 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-white/5 rounded-lg p-1.5 border border-white/5 shrink-0">
                      <img src={getImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-contain mix-blend-lighten" />
                    </div>
                    <div className="flex-grow flex flex-col justify-center min-w-0">
                      <h4 className="text-[10px] font-bold uppercase text-slate-200 truncate mb-1">{item.name}</h4>
                      <div className="flex justify-between items-center text-[11px] font-black text-blue-400">
                        <span className="text-[9px] text-slate-500 font-medium uppercase">Qté: {item.quantity}</span>
                        {/* 🟢 Affichage du prix public (avec la comission par palier) */}
                        <span>{(getItemFinalPrice(item) * item.quantity).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-white/10 pt-5 mb-6">
                
                {/* 🟢 ARTICLES (PRIX DE BASE VENDEUR) */}
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Articles (Vendeur)</span>
                  <span className="text-white">{baseTotal.toLocaleString()} FCFA</span>
                </div>

                {/* 🟢 FRAIS DE SERVICE SÉPARÉS */}
                {serviceFee > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 group relative cursor-help">
                    <span className="flex items-center gap-1 border-b border-dashed border-slate-500">
                      Frais de Service
                    </span>
                    <span className="text-blue-400">+{serviceFee.toLocaleString()} FCFA</span>
                    
                    {/* Tooltip caché */}
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 text-[9px] text-slate-300 p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl border border-slate-700">
                      Couvre la garantie 7 jours, le support et la sécurisation du paiement.
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Livraison</span>
                  <span className="text-emerald-400">+{deliveryFee.toLocaleString()} FCFA</span>
                </div>
                
                {/* 🟢 TOTAL GLOBAL TTC */}
                <div className="bg-white/5 p-4 md:p-5 rounded-xl mt-4 border border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Total TTC</span>
                  <span className="text-xl md:text-2xl font-black tracking-tighter text-white">
                    {totalAmount.toLocaleString()} <span className="text-xs text-blue-400 ml-1">FCFA</span>
                  </span>
                </div>

              </div>

              <button type="submit" form="checkout-form" disabled={isProcessing} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> En cours...</> : <>Confirmer & Payer <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}