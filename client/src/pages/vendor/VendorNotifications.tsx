import { useState, useEffect } from 'react';
import { Package, CreditCard, AlertTriangle, ChevronRight, BellRing, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

// Interface unifiée pour nos notifications dynamiques
interface NotificationItem {
  id: string;
  type: 'order' | 'stock' | 'payment';
  title: string;
  desc: string;
  time: Date;
  icon: any;
  color: string;
  link: string;
}

export default function VendorNotifications() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const notifs: NotificationItem[] = [];

        // 1. Récupération des dernières commandes (order_items)
        const { data: recentOrders } = await supabase
          .from('order_items')
          .select('id, created_at, product_name, total_price, vendor_status, order:orders(order_number)')
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentOrders) {
          recentOrders.forEach(order => {
            // Notification de Nouvelle Commande
            notifs.push({
              id: `order-${order.id}`,
              type: 'order',
              title: `Nouvelle commande ${order.order?.order_number || ''}`,
              desc: `Vous avez vendu : ${order.product_name} (${order.total_price.toLocaleString()} CFA).`,
              time: new Date(order.created_at),
              icon: Package,
              color: 'bg-blue-50 text-blue-600 border-blue-200',
              link: '/vendor/orders'
            });

            // Notification de Paiement (si la commande est livrée)
            if (order.vendor_status === 'Livrée') {
              notifs.push({
                id: `payment-${order.id}`,
                type: 'payment',
                title: 'Paiement débloqué',
                desc: `Le montant de ${order.total_price.toLocaleString()} CFA est prêt à être viré sur votre compte.`,
                time: new Date(order.created_at), // Idéalement la date de mise à jour
                icon: CreditCard,
                color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                link: '/vendor/dashboard'
              });
            }
          });
        }

        // 2. Récupération des alertes de stock (products)
        const { data: lowStockProducts } = await supabase
          .from('products')
          .select('id, name, stock')
          .eq('vendor_id', user.id)
          .lt('stock', 5);

        if (lowStockProducts) {
          lowStockProducts.forEach(product => {
            notifs.push({
              id: `stock-${product.id}`,
              type: 'stock',
              title: 'Alerte Stock Critique',
              desc: `Attention, il ne reste que ${product.stock} unité(s) pour "${product.name}".`,
              time: new Date(), // On la met à "maintenant" pour qu'elle reste en haut
              icon: AlertTriangle,
              color: 'bg-orange-50 text-orange-600 border-orange-200',
              link: '/vendor/products'
            });
          });
        }

        // 3. Tri par date (du plus récent au plus ancien)
        notifs.sort((a, b) => b.time.getTime() - a.time.getTime());
        setNotifications(notifs);

      } catch (error) {
        console.error("Erreur chargement notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [user]);

  // Fonction pour formater la date relative (ex: "Il y a 2h")
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
    return `Il y a ${Math.floor(diffInSeconds / 86400)} jour(s)`;
  };

  return (
    // Plus besoin de min-h-screen ou pt-16 excessifs, VendorLayout gère ça
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-4xl mx-auto px-2 sm:px-4 pb-10">
      
      {/* HEADER PROFESSIONNEL */}
      <div className="flex items-center gap-4 mb-8 md:mb-12 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="p-3 md:p-4 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/20 shrink-0">
          <BellRing className="w-6 h-6 md:w-7 md:h-7 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-[1000] uppercase text-slate-900 tracking-tighter leading-none">
            Notifications
          </h1>
          <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            Activité en temps réel
          </p>
        </div>
      </div>
      
      {/* LISTE DES NOTIFICATIONS */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyse de votre activité...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-16 rounded-[2rem] border border-slate-100 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-2">Tout est à jour !</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vous n'avez aucune nouvelle alerte.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notifications.map(n => (
            <div 
              key={n.id} 
              onClick={() => navigate(n.link)}
              className="group relative bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 cursor-pointer overflow-hidden"
            >
              {/* PETITE BARRE DÉCORATIVE SUR LE CÔTÉ */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-transparent group-hover:bg-blue-600 transition-colors" />

              {/* ICON WRAPPER */}
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex-shrink-0 flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 ml-2 ${n.color}`}>
                <n.icon className="w-5 h-5 md:w-7 md:h-7" />
              </div>

              {/* TEXT CONTENT */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-start sm:items-center justify-between gap-2 mb-1.5">
                  <h3 className="text-xs md:text-sm font-[1000] uppercase text-slate-900 tracking-tight truncate">
                      {n.title}
                  </h3>
                  <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap bg-slate-50 px-2.5 py-1 md:py-1.5 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors border border-slate-100">
                      {getRelativeTime(n.time)}
                  </span>
                </div>
                <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed pr-2 md:pr-6 line-clamp-2">
                  {n.desc}
                </p>
              </div>

              {/* INDICATEUR DE DIRECTION DISCRET (Caché sur très petits écrans) */}
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-50 items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shrink-0">
                  <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER DISCRET */}
      {!loading && notifications.length > 0 && (
        <div className="mt-10 text-center">
          <button 
            onClick={() => setNotifications([])} // Simule la lecture
            className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 bg-slate-50 px-6 py-3 rounded-xl transition-all hover:bg-blue-50"
          >
            Marquer tout comme lu
          </button>
        </div>
      )}
    </div>
  );
}