import { useState, useEffect } from 'react';
import { 
  Gavel, User, Store, MessageSquare, Scale, 
  AlertCircle, CheckCircle, XCircle, FileText, 
  Image as ImageIcon, ArrowLeft, Loader2 
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Typage des données de litige
interface Dispute {
  id: string;
  order_id: string;
  status: 'pending' | 'refunded' | 'validated';
  reason: string;
  customer_statement: string;
  vendor_statement: string;
  amount: number;
  customer_name: string;
  vendor_store: string;
}

export default function DisputeResolution() {
  const { id } = useParams<{ id: string }>(); // Récupère l'ID du litige dans l'URL
  const navigate = useNavigate();
  
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<'pending' | 'refunded' | 'validated'>('pending');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchDisputeDetails();
  }, [id]);

  const fetchDisputeDetails = async () => {
    setLoading(true);
    try {
      // 1. Récupérer les infos du litige et les jointures
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          orders(amount, profiles(full_name), vendors:vendor_id(store_name))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Adaptation des données reçues
      setDispute({
        id: data.id,
        order_id: data.order_id,
        status: data.status,
        reason: data.reason,
        customer_statement: data.customer_statement,
        vendor_statement: data.vendor_statement,
        amount: data.orders.amount,
        customer_name: data.orders.profiles.full_name,
        vendor_store: data.orders.vendors.store_name
      });
      setDecision(data.status);

      // 2. Récupérer le chat du litige
      const { data: chat } = await supabase
        .from('dispute_messages')
        .select('*')
        .eq('dispute_id', id)
        .order('created_at', { ascending: true });
      
      setMessages(chat || []);

    } catch (err) {
      console.error("Erreur chargement litige:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDispute = async () => {
    if (decision === 'pending') return alert("Veuillez choisir un verdict.");
    if (!justification) return alert("Veuillez justifier votre décision.");

    setIsSubmitting(true);
    try {
      // Mise à jour du litige
      const { error } = await supabase
        .from('disputes')
        .update({ 
          status: decision, 
          admin_justification: justification,
          closed_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      // Logique métier : Si 'refunded', on pourrait marquer la commande comme annulée
      // Si 'validated', on libère les fonds du vendeur.
      
      alert("Le dossier a été fermé et les parties ont été notifiées.");
      navigate('/admin/dashboard');
    } catch (err) {
      alert("Une erreur est survenue lors de la fermeture.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#0B0F1A] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="bg-[#0B0F1A] min-h-screen text-slate-200 p-8 lg:p-12">
      {/* HEADER D'ARBITRAGE */}
      <div className="flex items-center justify-between mb-12 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-6">
          <Link to="/admin/dashboard" className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-[1000] uppercase tracking-tighter text-white">Arbitrage de Litige</h1>
            <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.3em] mt-1">Dossier #{dispute?.id.slice(0, 8)} • Priorité Haute</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-3 bg-slate-800/50 px-5 py-2 rounded-2xl border border-slate-700">
            <Scale className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salle d'audience virtuelle</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-tighter">Montant en jeu : {dispute?.amount.toLocaleString()} CFA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLONNE GAUCHE : LES DEUX PARTIES */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PLAIGNANT (CLIENT) */}
            <div className="bg-slate-800/30 border border-red-500/20 p-8 rounded-[2.5rem] relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500"><User /></div>
                <h3 className="font-black text-sm uppercase">{dispute?.customer_name} (Client)</h3>
              </div>
              <p className="text-xs text-slate-400 font-bold mb-4 italic leading-relaxed">
                "{dispute?.customer_statement}"
              </p>
              <div className="flex gap-2">
                <div className="h-16 w-16 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center cursor-pointer hover:border-blue-500"><ImageIcon className="w-5 h-5 text-slate-600" /></div>
                <div className="h-16 w-16 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center cursor-pointer hover:border-blue-500"><FileText className="w-5 h-5 text-slate-600" /></div>
              </div>
            </div>

            {/* DÉFENDEUR (VENDEUR) */}
            <div className="bg-slate-800/30 border border-blue-500/20 p-8 rounded-[2.5rem]">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500"><Store /></div>
                <h3 className="font-black text-sm uppercase">{dispute?.vendor_store} (Vendeur)</h3>
              </div>
              <p className="text-xs text-slate-400 font-bold mb-4 italic leading-relaxed">
                "{dispute?.vendor_statement}"
              </p>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-[9px] font-black text-emerald-500 uppercase tracking-widest text-center">
                Défense enregistrée
              </div>
            </div>
          </div>

          {/* FIL DE DISCUSSION */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Historique des échanges
            </h3>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
              {messages.length > 0 ? messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.sender_role === 'customer' ? 'items-start' : 'items-end'} gap-1`}>
                  <span className="text-[8px] font-black text-slate-600 uppercase mx-2">
                    {m.sender_role === 'customer' ? 'Client' : 'Vendeur'} • {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <div className={`p-4 rounded-2xl text-[11px] font-bold max-w-[80%] ${
                    m.sender_role === 'customer' 
                    ? 'bg-slate-800 rounded-tl-none text-slate-300' 
                    : 'bg-blue-600/10 border border-blue-500/20 rounded-tr-none text-blue-300 text-right'
                  }`}>
                    {m.content}
                  </div>
                </div>
              )) : (
                <p className="text-center text-[10px] font-black text-slate-600 uppercase py-10">Aucun message pour ce dossier</p>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : VERDICT FINAL */}
        <div className="space-y-8">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-xs font-[1000] uppercase tracking-widest text-white mb-8 text-center flex items-center justify-center gap-2">
              <Gavel className="w-5 h-5 text-orange-400" /> Verdict Admin
            </h3>
            
            <div className="space-y-4">
              <button 
                onClick={() => setDecision('refunded')}
                disabled={dispute?.status !== 'pending'}
                className={`w-full py-5 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${decision === 'refunded' ? 'border-red-500 bg-red-500/10' : 'border-slate-700 hover:bg-slate-800 disabled:opacity-50'}`}
              >
                <XCircle className={`w-6 h-6 ${decision === 'refunded' ? 'text-red-500' : 'text-slate-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">Rembourser le Client</span>
              </button>

              <button 
                onClick={() => setDecision('validated')}
                disabled={dispute?.status !== 'pending'}
                className={`w-full py-5 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${decision === 'validated' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:bg-slate-800 disabled:opacity-50'}`}
              >
                <CheckCircle className={`w-6 h-6 ${decision === 'validated' ? 'text-emerald-500' : 'text-slate-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">Valider la Vente</span>
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-700 text-left">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Justification de la décision</label>
              <textarea 
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                disabled={dispute?.status !== 'pending'}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs font-bold text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 h-24 disabled:opacity-50"
                placeholder="Expliquez votre choix aux deux parties..."
              ></textarea>
            </div>

            {dispute?.status === 'pending' && (
              <button 
                onClick={handleCloseDispute}
                disabled={isSubmitting}
                className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fermer le Dossier définitivement"}
              </button>
            )}
            
            {dispute?.status !== 'pending' && (
              <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase">Dossier Classé : {dispute?.status === 'refunded' ? 'Remboursement' : 'Validation'}</span>
              </div>
            )}
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-[2rem] flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
            <p className="text-[9px] font-black text-orange-400 uppercase leading-relaxed tracking-tighter text-left">
              Attention : Une fois le dossier fermé, les fonds seront automatiquement transférés par le système Stripe/Wave. Cette action est irréversible.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}