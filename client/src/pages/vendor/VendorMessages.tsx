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

      // 3. Charge messages par conversation_id (PAS par sender/receiver)
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

  // REALTIME - filtré par conversation
  useEffect(() => {
    if (!user ||!conversationId) return;

    const channel = supabase.channel(`conv-${conversationId}`)
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}` // ← CRITIQUE
      }, (payload) => {
        const m = payload.new;
        setMessages(p => p.find(x => x.id === m.id)? p : [...p, m]);
        if (m.receiver_id === user.id) {
          supabase.from('messages').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', m.id);
        }
        scrollToBottom();
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
      conversation_id: conversationId, // ← INDISPENSABLE
      sender_id: user.id,
      receiver_id: ADMIN_ID,
      sender_type: 'vendor',
      content,
      is_read: false
    });

    // update conversation
    await supabase.from('conversations')
    .update({ last_message: content, updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  };

  const PlanIcon = vendorPlan === 'Premium'? Crown : vendorPlan === 'Pro'? Shield : Package;

  return (
    <div className="flex h-[calc(100vh-120px)] border border-slate-200 rounded-3xl bg-white shadow-2xl overflow-hidden">
      <div className="w-80 border-r p-8 bg-slate-50 flex flex-col">
        <h2 className="text-xl font-black text-slate-900 mb-8">Support Admin</h2>
        <div className="bg-white p-5 rounded-2xl border mb-8 flex items-center gap-3">
          <PlanIcon size={24} className={vendorPlan === 'Premium'? 'text-amber-500' : 'text-blue-500'} />
          <span className="font-bold">{vendorPlan} Plan</span>
        </div>
        <div className="mt-auto flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${adminStatus === 'online'? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="font-medium text-slate-600">{isTyping? 'Admin écrit...' : adminStatus === 'online'? 'En ligne' : 'Hors ligne'}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#F8FAFC]">
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {isLoading? <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-slate-400" /></div> :
            messages.map((m) => {
              const isMe = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${isMe? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[70%]">
                    <div className={`p-5 rounded-3xl shadow-sm ${isMe? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                      <p className="text- leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 mt-2 px-1 ${isMe? 'justify-end' : 'justify-start'}`}>
                      <span className="text- text-slate-400">{formatDate(m.created_at)}</span>
                      {isMe && (m.is_read? <CheckCheck size={14} className="text-emerald-500" /> : <Check size={14} className="text-slate-400" />)}
                    </div>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100">
          <div className="relative flex items-center max-w-3xl mx-auto">
            <input
              className="w-full bg-slate-100 rounded-full py-4 pl-6 pr-14 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newMessage}
              onChange={e => {
                setNewMessage(e.target.value);
                channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: user?.id } });
              }}
              placeholder="Écrire à l'admin..."
            />
            <button type="submit" disabled={!newMessage.trim()} className="absolute right-1.5 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white p-2.5 rounded-full transition-all">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}