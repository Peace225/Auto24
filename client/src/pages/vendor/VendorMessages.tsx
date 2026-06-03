import React, { useEffect, useState, useRef } from 'react';
import { Package, Shield, Crown, Send, Loader2, Check, CheckCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

const ADMIN_ID = '381661f7-7566-4b79-b94a-6fa274dba084';

export default function VendorMessages() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [vendorPlan, setVendorPlan] = useState('Standard');
  const [adminStatus, setAdminStatus] = useState<'online' | 'offline'>('offline');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const formatDate = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'}) + ' · ' + new Date(iso).toLocaleDateString('fr-FR', {day:'2-digit',month:'short'});

  // 🟢 MESSAGE DE BIENVENUE VIRTUEL
  const welcomeMessage = {
    id: 'system-welcome',
    sender_id: ADMIN_ID,
    content: "👋 Bonjour et bienvenue sur votre support dédié ! Je suis là pour vous accompagner dans la gestion de votre boutique ou répondre à vos questions. Comment puis-je vous aider aujourd'hui ?",
    created_at: new Date().toISOString(),
    is_read: true
  };

  // INIT - trouve ou crée la conversation
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: profile } = await supabase.from('profiles').select('subscription_plan').eq('id', user.id).single();
      if (profile?.subscription_plan) setVendorPlan(profile.subscription_plan.charAt(0).toUpperCase() + profile.subscription_plan.slice(1));

      // 1. Cherche conversation existante admin-vendor
      let { data: conv } = await supabase.from('conversations')
      .select('id')
      .eq('vendor_id', user.id)
      .eq('client_id', ADMIN_ID)
      .maybeSingle();

      // 2. Crée si n'existe pas
      if (!conv) {
        const { data: newConv } = await supabase.from('conversations')
        .insert({ vendor_id: user.id, client_id: ADMIN_ID, last_message: 'Conversation démarrée' })
        .select('id').single();
        conv = newConv;
      }
      setConversationId(conv!.id);

      // 3. Charge messages
      const { data } = await supabase.from('messages')
      .select('*')
      .eq('conversation_id', conv!.id)
      .order('created_at', { ascending: true });

      setMessages(data || []);
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);

      // marque lu
      await supabase.from('messages').update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conv!.id).eq('receiver_id', user.id);
    };
    init();
  }, [user]);

  // REALTIME
  useEffect(() => {
    if (!user ||!conversationId) return;

    const channel = supabase.channel(`conv-${conversationId}`)
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const m = payload.new;
        setMessages(p => p.find(x => x.id === m.id)? p : [...p, m]);
        if (m.receiver_id === user.id) {
          supabase.from('messages').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', m.id);
        }
        setTimeout(scrollToBottom, 100);
      })
    .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(p => p.map(x => x.id === payload.new.id? payload.new : x));
      })
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === ADMIN_ID) {
          setIsTyping(true);
          clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
        }
      })
    .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user, conversationId]);

  // Présence admin
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.from('profiles').select('last_seen').eq('id', ADMIN_ID).single();
      if (data) setAdminStatus(Date.now() - new Date(data.last_seen).getTime() < 65000? 'online' : 'offline');
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() ||!user ||!conversationId) return;

    const content = newMessage.trim();
    setNewMessage('');

    // typing
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id } });

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: ADMIN_ID,
      sender_type: 'vendor',
      content,
      is_read: false
    });

    await supabase.from('conversations')
    .update({ last_message: content, updated_at: new Date().toISOString() })
    .eq('id', conversationId);
    
    setTimeout(scrollToBottom, 100);
  };

  const PlanIcon = vendorPlan === 'Premium'? Crown : vendorPlan === 'Pro'? Shield : Package;

  return (
    // 🟢 Flex-col sur mobile pour empiler l'en-tête et les messages, flex-row sur desktop
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] border-0 md:border border-slate-200 rounded-none md:rounded-3xl bg-white md:shadow-2xl overflow-hidden pb-20 md:pb-0">
      
      {/* 🟢 Sidebar sur desktop -> devient un Header compact sur mobile */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 p-4 md:p-8 bg-slate-50 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start shrink-0 z-10 shadow-sm md:shadow-none">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 mb-0 md:mb-8 leading-none">Support Admin</h2>
          <div className="mt-1 md:mt-auto flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${adminStatus === 'online'? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="font-medium text-slate-600">{isTyping? 'Écrit...' : adminStatus === 'online'? 'En ligne' : 'Hors ligne'}</span>
          </div>
        </div>

        <div className="bg-white px-3 py-2 md:p-5 rounded-xl md:rounded-2xl border flex items-center gap-2 md:mb-8 shadow-sm">
          <PlanIcon className={`w-4 h-4 md:w-6 md:h-6 ${vendorPlan === 'Premium'? 'text-amber-500' : 'text-blue-500'}`} />
          <span className="text-xs md:text-base font-bold">{vendorPlan}</span>
        </div>
      </div>

      {/* 🟢 Zone de messagerie */}
      <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6">
          {isLoading? (
            <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>
          ) : (
            <>
              {/* 🟢 Rendu du message de bienvenue */}
              <div className="flex justify-start">
                <div className="max-w-[85%] md:max-w-[70%]">
                  <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm bg-white border border-slate-200 text-slate-800 rounded-bl-none">
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{welcomeMessage.content}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 md:mt-2 px-1 justify-start">
                    <span className="text-[10px] md:text-xs text-slate-400">Automatique</span>
                  </div>
                </div>
              </div>

              {/* 🟢 Messages de la base de données */}
              {messages.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMe? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%] md:max-w-[70%]">
                      <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm ${isMe? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                        {/* 🟢 Correction : ajout de text-sm md:text-base */}
                        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 mt-1 md:mt-2 px-1 ${isMe? 'justify-end' : 'justify-start'}`}>
                        {/* 🟢 Correction : ajout de text-[10px] md:text-xs */}
                        <span className="text-[10px] md:text-xs text-slate-400">{formatDate(m.created_at)}</span>
                        {isMe && (m.is_read? <CheckCheck size={14} className="text-emerald-500" /> : <Check size={14} className="text-slate-400" />)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 🟢 Formulaire de saisie */}
        <form onSubmit={handleSend} className="p-3 md:p-6 bg-white border-t border-slate-100 pb-safe z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="relative flex items-center max-w-3xl mx-auto">
            <input
              className="w-full bg-slate-100 rounded-full py-3 md:py-4 pl-4 md:pl-6 pr-12 md:pr-14 outline-none focus:ring-2 focus:ring-indigo-500 text-sm md:text-base transition-shadow"
              value={newMessage}
              onChange={e => {
                setNewMessage(e.target.value);
                channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: user?.id } });
              }}
              placeholder="Écrire à l'admin..."
            />
            <button type="submit" disabled={!newMessage.trim()} className="absolute right-1 md:right-1.5 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white p-2.5 rounded-full transition-all">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}