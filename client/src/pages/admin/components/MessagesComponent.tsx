import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Store, Loader2, Check, CheckCheck } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function MessagesComponent() {
  const { user } = useAuthStore();
  const userId = user?.id;

  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => {
    const date = new Date(d), today = new Date(), yest = new Date();
    yest.setDate(today.getDate()-1);
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yest.toDateString()) return "Hier";
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Vendors
  useEffect(() => {
    supabase.from('profiles').select('id, store_name').eq('role','vendor').order('store_name')
   .then(({data}) => setVendors(data || []));
  }, []);

  // Conversations
  useEffect(() => {
    let q = supabase.from('conversations')
   .select('*, client:client_id(full_name), vendor:vendor_id(store_name)')
   .order('updated_at',{ascending:false});
    if (selectedVendor!=='all') q = q.eq('vendor_id', selectedVendor);
    q.then(({data}) => {
      const convs = data || [];
      setConversations(convs);
      if (convs[0] &&!activeConv) setActiveConv(convs[0].id);
    });
  }, [selectedVendor]);

  // Crée conversation si vendeur sélectionné sans conv
  useEffect(() => {
    const ensureConv = async () => {
      if (selectedVendor === 'all' ||!userId || conversations.find(c => c.vendor_id === selectedVendor)) return;
      const { data } = await supabase.from('conversations')
     .insert({ vendor_id: selectedVendor, client_id: userId, last_message: 'Conversation démarrée' })
     .select('*, client:client_id(full_name), vendor:vendor_id(store_name)').single();
      if (data) {
        setConversations(p => [data,...p]);
        setActiveConv(data.id);
      }
    };
    ensureConv();
  }, [selectedVendor, userId, conversations]);

  // Charge messages
  useEffect(() => {
    if (!activeConv) return;
    setLoading(true);
    supabase.from('messages').select('*').eq('conversation_id', activeConv).order('created_at')
   .then(({data}) => {
      setMessages((data||[]).map(m => ({...m, text:m.content, me:m.sender_id===userId })));
      setLoading(false);
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),100);
    });
    if (userId) {
      supabase.from('messages')
     .update({is_read:true, read_at:new Date().toISOString()})
     .eq('conversation_id',activeConv).neq('sender_id',userId);
    }
  }, [activeConv, userId]);

  // Realtime
  useEffect(() => {
    if (!activeConv ||!userId) return;
    const ch = supabase.channel(`admin-${activeConv}`)
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${activeConv}`}, p => {
      const m = p.new;
      if (m.sender_id === userId) return;
      setMessages(prev => [...prev, {...m, text:m.content, me:false }]);
      supabase.from('messages').update({is_read:true, read_at:new Date().toISOString()}).eq('id', m.id);
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),50);
    })
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages',filter:`conversation_id=eq.${activeConv}`}, p => {
      setMessages(prev => prev.map(x => x.id===p.new.id? {...x, is_read:p.new.is_read, read_at:p.new.read_at} : x));
    })
   .on('postgres_changes',{event:'DELETE',schema:'public',table:'messages',filter:`conversation_id=eq.${activeConv}`}, p => {
      setMessages(prev => prev.filter(m => m.id!==p.old.id));
    })
   .on('broadcast',{event:'typing'}, ({payload}) => {
      const conv = conversations.find(c => c.id === activeConv);
      if (payload.user_id === conv?.vendor_id) {
        setIsTyping(true);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(()=>setIsTyping(false),2000);
      }
    })
   .subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [activeConv, userId, conversations]);

  const handleDelete = async (id:string) => {
    if (!confirm('Supprimer?')) return;
    const {error} = await supabase.from('messages').delete().eq('id',id);
    if(error) toast.error('Erreur'); else toast.success('Supprimé');
  };

  const handleSend = async () => {
    if (!message.trim() ||!activeConv ||!userId) return;
    const conv = conversations.find(c => c.id===activeConv);
    const receiverId = conv?.vendor_id;
    const text = message.trim();
    setMessage('');

    channelRef.current?.send({ type:'broadcast', event:'typing', payload:{ user_id:userId } });

    const {data,error} = await supabase.from('messages').insert({
      conversation_id:activeConv,
      sender_id:userId,
      receiver_id:receiverId,
      sender_type:'admin',
      content:text,
      is_read:false
    }).select().single();

    if(error){ toast.error(error.message); setMessage(text); return; }
    setMessages(prev => [...prev, {...data, text:data.content, me:true }]);
    await supabase.from('conversations').update({last_message:text, updated_at:new Date().toISOString()}).eq('id',activeConv);
    setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),50);
  };

  let lastDate = '';

  return (
    <div className="h-[calc(100vh-180px)] min-h- bg-[#0A0E14] border border-white/10 rounded-3xl flex overflow-hidden">
      <div className="w-80 border-r border-white/10 flex flex-col bg-[#05070B]/50">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-white font-bold mb-3">Conversations</h3>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={14}/>
            <select value={selectedVendor} onChange={e=>setSelectedVendor(e.target.value)} className="w-full bg-[#0A0E14] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none">
              <option value="all">Toutes les boutiques</option>
              {vendors.map(v=><option key={v.id} value={v.id}>{v.store_name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map(c=>(
            <button key={c.id} onClick={()=>setActiveConv(c.id)} className={`w-full p-3 text-left rounded-xl mb-1 transition-all ${activeConv===c.id?'bg-amber-500/10 border-l-2 border-amber-500':'hover:bg-white/5'}`}>
              <p className="text-white text-xs font-bold truncate">{c.vendor?.store_name || 'Boutique'}</p>
              <p className="text-slate-400 text- truncate">{c.last_message}</p>
            </button>
          ))}
        </div>
        {isTyping && <div className="p-3 text- text-amber-400 animate-pulse">Le vendeur écrit...</div>}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
          {loading? <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-amber-500"/></div> :
            messages.map(m => {
              const dateLabel = formatDate(m.created_at);
              const showDate = dateLabel!== lastDate; lastDate = dateLabel;
              return (
                <div key={m.id}>
                  {showDate && <div className="flex justify-center my-4"><span className="text- text-slate-400 bg-white/5 px-3 py-1 rounded-full">{dateLabel}</span></div>}
                  <div className={`group flex ${m.me?'justify-end':'justify-start'} mb-1`}>
                    <div className={`relative px-4 py-2.5 rounded-2xl max-w-[70%] ${m.me?'bg-amber-500 text-black rounded-br-sm':'bg-white/10 text-white rounded-bl-sm'}`}>
                      <p className="text- leading-snug whitespace-pre-wrap">{m.text}</p>
                      <div className={`flex items-center gap-1 mt-1.5 ${m.me?'justify-end':'justify-start'}`}>
                        <span className={`text- ${m.me?'text-black/60':'text-slate-400'}`}>{formatTime(m.created_at)}</span>
                        {m.me && (m.is_read? <CheckCheck size={14} className="text-blue-700" /> : <Check size={14} className="text-black/50" />)}
                      </div>
                      {m.me && <button onClick={()=>handleDelete(m.id)} className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={16}/></button>}
                    </div>
                  </div>
                </div>
              );
            })}
          <div ref={bottomRef}/>
        </div>

        <div className="p-3 border-t border-white/10 flex gap-2 bg-[#05070B]">
          <input value={message} onChange={e=>{setMessage(e.target.value); channelRef.current?.send({type:'broadcast',event:'typing',payload:{user_id:userId}});}} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),handleSend())} placeholder={activeConv?"Message au vendeur...":"Choisissez une boutique"} disabled={!activeConv} className="flex-1 bg-[#0A0E14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50 disabled:opacity-50"/>
          <button onClick={handleSend} disabled={!activeConv||!message.trim()} className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl disabled:opacity-50"><Send size={18}/></button>
        </div>
      </div>
    </div>
  );
}