import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  User, 
  MoreHorizontal, 
  Phone, 
  MessageSquare,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';

// Interfaces pour Typer nos données
interface Contact {
  id: string; // ID du client
  name: string;
  lastMsg: string;
  time: string;
  online: boolean;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
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

  // 1. Charger la liste des contacts (les clients qui ont écrit au vendeur)
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;
      try {
        // Dans une vraie BDD relationnelle complexe, on ferait une jointure.
        // Ici, on récupère les messages récents dont le vendeur est impliqué
        const { data: recentMessages, error } = await supabase
          .from('messages')
          .select('sender_id, receiver_id, content, created_at, is_read')
          .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Logique de regroupement pour extraire les contacts uniques
        const contactsMap = new Map<string, Contact>();
        
        recentMessages?.forEach((msg) => {
          const contactId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          
          if (!contactsMap.has(contactId)) {
            contactsMap.set(contactId, {
              id: contactId,
              name: `Client #${contactId.substring(0, 4)}`, // En l'absence d'une table profiles publique complète
              lastMsg: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              online: false, // Simulé
              unread: (msg.receiver_id === user.id && !msg.is_read) ? 1 : 0
            });
          }
        });

        // Conversion Map en Array
        setContacts(Array.from(contactsMap.values()));
      } catch (err) {
        console.error("Erreur contacts:", err);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
    
    // Souscription aux nouveaux messages (Temps Réel)
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new as Message;
        if (newMsg.receiver_id === user?.id || newMsg.sender_id === user?.id) {
           fetchContacts(); // Rafraîchir la liste de gauche
           if (selectedChat === newMsg.sender_id || selectedChat === newMsg.receiver_id) {
               setMessages(prev => [...prev, newMsg]); // Ajouter au chat actuel si ouvert
               scrollToBottom();
           } else if (newMsg.receiver_id === user?.id) {
               toast("Nouveau message reçu !", { icon: '💬' });
           }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user, selectedChat]);

  // 2. Charger les messages d'un chat spécifique
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !selectedChat) return;
      setLoadingChat(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        
        // Marquer comme lus
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('receiver_id', user.id)
          .eq('sender_id', selectedChat);
          
      } catch (err) {
        console.error("Erreur chat:", err);
      } finally {
        setLoadingChat(false);
        scrollToBottom();
      }
    };

    if (selectedChat) fetchMessages();
  }, [selectedChat, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 3. Envoyer un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedChat) return;

    const msgContent = newMessage;
    setNewMessage(''); // Vider l'input instantanément pour l'UX

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: selectedChat,
          content: msgContent
        }])
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data]);
      scrollToBottom();
    } catch (err) {
      console.error("Erreur envoi:", err);
      toast.error("Message non envoyé");
    }
  };

  const currentContactName = contacts.find(c => c.id === selectedChat)?.name || 'Client';

  return (
    // Suppression des classes de padding globales (VendorLayout gère ça)
    <div className="w-full max-w-7xl mx-auto flex flex-col h-[calc(100vh-180px)] min-h-[600px] animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-[1000] uppercase text-slate-900 tracking-tighter flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-600 rounded-full shadow-lg shadow-blue-600/20"></div>
            Messagerie Directe
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-5">
            Communication Client
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 h-full overflow-hidden">
        
        {/* LISTE DES CONTACTS (Cachée sur mobile si un chat est ouvert) */}
        <div className={`lg:col-span-4 bg-white rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full
          ${selectedChat ? 'hidden lg:flex' : 'flex'}`}
        >
          <div className="p-4 md:p-6 pb-2">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Chercher..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-slate-100 focus:border-blue-500 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingContacts ? (
              <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center p-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Aucun message reçu.
              </div>
            ) : (
              contacts.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedChat(c.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 flex items-center gap-4 group
                    ${selectedChat === c.id 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                      : 'hover:bg-slate-50 bg-white'
                    }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                      ${selectedChat === c.id ? 'bg-blue-500/50 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <User className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-xs font-[1000] uppercase tracking-tight truncate
                        ${selectedChat === c.id ? 'text-white' : 'text-slate-900'}`}>
                        {c.name}
                      </p>
                      <span className={`text-[9px] font-bold ${selectedChat === c.id ? 'text-blue-200' : 'text-slate-400'}`}>
                        {c.time}
                      </span>
                    </div>
                    <p className={`text-[10px] font-medium truncate ${selectedChat === c.id ? 'text-blue-100' : 'text-slate-500'}`}>
                      {c.lastMsg}
                    </p>
                  </div>

                  {c.unread > 0 && selectedChat !== c.id && (
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0">
                      {c.unread}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ZONE DE CHAT */}
        <div className={`lg:col-span-8 bg-white rounded-3xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden relative
          ${!selectedChat ? 'hidden lg:flex' : 'flex'}`}
        >
          {selectedChat ? (
            <>
              {/* En-tête du Chat */}
              <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  {/* Bouton retour pour Mobile uniquement */}
                  <button onClick={() => setSelectedChat(null)} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-[1000] uppercase text-slate-900 tracking-tight">{currentContactName}</h3>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Actif</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                   <button className="p-2.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><Phone className="w-4 h-4" /></button>
                   <button className="p-2.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Corps des Messages */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-50/50 space-y-4">
                {loadingChat ? (
                   <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                ) : (
                  <>
                    <div className="flex justify-center my-4">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">Début de la discussion</span>
                    </div>
                    {messages.map((msg, index) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id || index} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && <div className="w-6 h-6 bg-slate-200 rounded-full flex-shrink-0 mb-1"></div>}
                          <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-2xl shadow-sm text-xs md:text-sm
                            ${isMe 
                              ? 'bg-blue-600 text-white rounded-br-sm' 
                              : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'}`}
                          >
                            <p className="leading-relaxed">{msg.content}</p>
                            <span className={`text-[8px] font-black uppercase mt-1 block ${isMe ? 'text-blue-200 text-right' : 'text-slate-300 text-left'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Barre de saisie */}
              <div className="p-3 md:p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3 bg-slate-50 p-1.5 md:p-2 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrire un message..." 
                    className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm font-medium text-slate-900 px-3 py-2 placeholder:text-slate-400"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white p-2.5 md:p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95 flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5 ml-1" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-10 bg-slate-50/30">
              <div className="w-20 h-20 bg-white shadow-sm rounded-3xl flex items-center justify-center text-blue-100 mb-6 border border-slate-100">
                <MessageSquare className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-sm font-[1000] uppercase text-slate-900 tracking-tight mb-2">Sélectionnez une discussion</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs">
                Répondez rapidement pour augmenter votre taux de conversion.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}