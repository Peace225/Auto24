import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Send, 
  User, 
  MoreHorizontal, 
  Phone, 
  MessageSquare,
  ArrowLeft,
  Loader2,
  CheckCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';

interface Contact {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
  avatar?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function VendorMessages() {
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1. CHARGER LES CONTACTS (AVEC NOMS RÉELS) ---
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    try {
      // On récupère les messages ET les profils associés pour avoir les noms
      const { data: recentMessages, error } = await supabase
        .from('messages')
        .select(`
          sender_id, 
          receiver_id, 
          content, 
          created_at, 
          is_read,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(full_name, avatar_url)
        `)
        .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const contactsMap = new Map<string, Contact>();
      
      recentMessages?.forEach((msg: any) => {
        const isIAsender = msg.sender_id === user.id;
        const contactId = isIAsender ? msg.receiver_id : msg.sender_id;
        const profile = isIAsender ? msg.receiver : msg.sender;
        
        if (!contactsMap.has(contactId)) {
          contactsMap.set(contactId, {
            id: contactId,
            name: profile?.full_name || `Client #${contactId.substring(0, 4)}`,
            avatar: profile?.avatar_url,
            lastMsg: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            unread: (!isIAsender && !msg.is_read) ? 1 : 0
          });
        } else if (!isIAsender && !msg.is_read) {
          const existing = contactsMap.get(contactId)!;
          contactsMap.set(contactId, { ...existing, unread: existing.unread + 1 });
        }
      });

      setContacts(Array.from(contactsMap.values()));
    } catch (err) {
      console.error("Erreur contacts:", err);
    } finally {
      setLoadingContacts(false);
    }
  }, [user]);

  // --- 2. CHARGER LES MESSAGES D'UNE DISCUSSION ---
  const fetchMessages = useCallback(async (contactId: string) => {
    if (!user) return;
    setLoadingChat(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Marquer comme lu
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', contactId)
        .eq('is_read', false);
        
      // Mettre à jour les badges de notification localement
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, unread: 0 } : c));
    } catch (err) {
      console.error("Erreur chat:", err);
    } finally {
      setLoadingChat(false);
      scrollToBottom();
    }
  }, [user]);

  // --- 3. GESTION DU TEMPS RÉEL ---
  useEffect(() => {
    fetchContacts();

    const subscription = supabase
      .channel('vendor-messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new as Message;
        
        // Si le message nous concerne
        if (newMsg.receiver_id === user?.id || newMsg.sender_id === user?.id) {
          fetchContacts(); // On rafraîchit la liste de gauche (dernier message, ordre)

          // Si c'est la discussion actuellement ouverte
          if (selectedChat === newMsg.sender_id || selectedChat === newMsg.receiver_id) {
            setMessages(prev => {
              // Éviter les doublons si l'envoi local a déjà ajouté le message
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            scrollToBottom();
            
            // Si c'est un message reçu, on le marque comme lu immédiatement
            if (newMsg.receiver_id === user?.id) {
               supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id).then();
            }
          } else if (newMsg.receiver_id === user?.id) {
            toast.success("Nouveau message reçu");
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user, selectedChat, fetchContacts]);

  useEffect(() => {
    if (selectedChat) fetchMessages(selectedChat);
  }, [selectedChat, fetchMessages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // --- 4. ENVOYER UN MESSAGE ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedChat) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: selectedChat,
          content
        }])
        .select()
        .single();

      if (error) throw error;
      // Le message sera ajouté par le Realtime, mais on peut l'ajouter ici pour plus de réactivité
      setMessages(prev => [...prev, data]);
      scrollToBottom();
    } catch (err) {
      toast.error("Échec de l'envoi");
    }
  };

  const currentContact = contacts.find(c => c.id === selectedChat);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 overflow-hidden">
        
        {/* LISTE DES CONTACTS */}
        <div className={`lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full
          ${selectedChat ? 'hidden lg:flex' : 'flex'}`}
        >
          <div className="p-6 border-b border-slate-50">
            <h1 className="text-xl font-[1000] uppercase text-slate-900 tracking-tighter flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Messages
            </h1>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher un client..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold border border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {loadingContacts ? (
              <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="text-slate-300 w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucune discussion</p>
              </div>
            ) : (
              contacts.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedChat(c.id)}
                  className={`w-full p-4 rounded-2xl transition-all duration-200 flex items-center gap-4 group
                    ${selectedChat === c.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50'}`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden
                      ${selectedChat === c.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                      {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-xs font-[1000] uppercase tracking-tight truncate ${selectedChat === c.id ? 'text-white' : 'text-slate-900'}`}>
                        {c.name}
                      </p>
                      <span className={`text-[8px] font-black ${selectedChat === c.id ? 'text-blue-200' : 'text-slate-400'}`}>
                        {c.time}
                      </span>
                    </div>
                    <p className={`text-[10px] font-medium truncate ${selectedChat === c.id ? 'text-blue-100/80' : 'text-slate-500'}`}>
                      {c.lastMsg}
                    </p>
                  </div>

                  {c.unread > 0 && selectedChat !== c.id && (
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 animate-bounce">
                      {c.unread}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ZONE DE CHAT */}
        <div className={`lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden
          ${!selectedChat ? 'hidden lg:flex' : 'flex'}`}
        >
          {selectedChat ? (
            <>
              {/* Header Chat */}
              <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedChat(null)} className="lg:hidden p-2 text-slate-400">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 border border-blue-100">
                    {currentContact?.avatar ? <img src={currentContact.avatar} className="w-full h-full object-cover rounded-xl" /> : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-[1000] uppercase text-slate-900 tracking-tight">{currentContact?.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En ligne</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><Phone className="w-4 h-4" /></button>
                   <button className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-50/30 space-y-4">
                {loadingChat ? (
                   <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && <div className="w-6 h-6 bg-slate-200 rounded-lg shrink-0 mb-1 overflow-hidden">
                            {currentContact?.avatar && <img src={currentContact.avatar} className="w-full h-full object-cover" />}
                          </div>}
                          <div className={`max-w-[80%] md:max-w-[60%] p-4 rounded-2xl shadow-sm
                            ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}
                          >
                            <p className="text-xs md:text-sm leading-relaxed font-medium">{msg.content}</p>
                            <div className="flex items-center justify-end gap-1 mt-1.5">
                              <span className={`text-[8px] font-black uppercase ${isMe ? 'text-blue-200' : 'text-slate-300'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              {isMe && <CheckCheck className={`w-3 h-3 ${msg.is_read ? 'text-emerald-400' : 'text-blue-300'}`} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-slate-50">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrire votre réponse..." 
                    className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm font-bold text-slate-900 px-3 py-2"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-10 bg-slate-50/20">
              <div className="w-20 h-20 bg-white shadow-xl shadow-blue-500/5 rounded-[2rem] flex items-center justify-center text-blue-500 mb-6 border border-slate-100">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h2 className="text-lg font-[1000] uppercase text-slate-900 tracking-tighter mb-2">Centre de Messagerie</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-xs leading-relaxed">
                Sélectionnez un client pour répondre à ses questions et finaliser vos ventes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}