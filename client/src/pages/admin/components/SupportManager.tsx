import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Send, Clock, CheckCircle,
  AlertTriangle, User, Store, Loader2,
  Search, Filter, X, Eye, Mail, Phone
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateString));
};

const PRIORITIES = {
  low: { label: 'Basse', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  medium: { label: 'Moyenne', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  high: { label: 'Haute', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  urgent: { label: 'Urgent', color: 'bg-red-600/30 text-red-300 border-red-500 animate-pulse' },
};

const STATUSES = {
  open: { label: 'Ouvert', color: 'bg-blue-500/20 text-blue-400', icon: MessageSquare },
  pending: { label: 'En attente', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
  resolved: { label: 'Résolu', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'bg-slate-500/20 text-slate-500', icon: X },
};

export default function SupportManager() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('open');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
   .from('support_tickets')
   .select(`
        *,
        profiles:user_id (full_name, email, phone, store_name, avatar_url, role)
      `)
   .order('updated_at', { ascending: false })
   .limit(100);

    if (!error) setTickets(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();
    const channel = supabase
   .channel('support')
   .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchTickets)
   .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  const openTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    const { data } = await supabase
   .from('support_messages')
   .select('*')
   .eq('ticket_id', ticket.id)
   .order('created_at', { ascending: true });
    setMessages(data || []);

    // Marquer comme lu
    await supabase.from('support_tickets').update({ admin_read: true }).eq('id', ticket.id);
  };

  const sendReply = async () => {
    if (!replyText.trim() ||!selectedTicket) return;
    setSending(true);
    try {
      await supabase.from('support_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: 'admin', // ou ton user admin id
        sender_type: 'admin',
        message: replyText,
        is_internal: false,
      });

      await supabase.from('support_tickets').update({
        status: 'pending',
        last_reply_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', selectedTicket.id);

      setReplyText('');
      openTicket(selectedTicket);
      toast.success("Réponse envoyée");
    } catch {
      toast.error("Erreur");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (ticketId: string, status: string) => {
    await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', ticketId);
    toast.success(`Ticket ${STATUSES[status as keyof typeof STATUSES].label}`);
    fetchTickets();
    if (selectedTicket?.id === ticketId) setSelectedTicket({...selectedTicket, status});
  };

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch =!searchTerm ||
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.profiles?.store_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* LISTE TICKETS */}
      <div className="w-full lg:w- bg-[#0B0F19] border border-white/10 rounded-3xl flex flex-col overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h2 className="text-xl font-black text-white uppercase flex items-center gap-2 mb-4">
            <MessageSquare className="text-blue-500" /> Support
          </h2>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-1.5">
            {(['open','pending','resolved','all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text- font-bold uppercase transition-all ${
                  filter === f? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {f === 'all'? 'Tous' : STATUSES[f as keyof typeof STATUSES]?.label || f} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : filteredTickets.length === 0? (
            <div className="text-center py-20 text-slate-500 text-sm">Aucun ticket</div>
          ) : filteredTickets.map(ticket => {
            const status = STATUSES[ticket.status as keyof typeof STATUSES];
            const priority = PRIORITIES[ticket.priority as keyof typeof PRIORITIES] || PRIORITIES.medium;
            const StatusIcon = status.icon;
            return (
              <div
                key={ticket.id}
                onClick={() => openTicket(ticket)}
                className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all ${
                  selectedTicket?.id === ticket.id? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''
                } ${!ticket.admin_read? 'bg-amber-500/5' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {ticket.profiles?.role === 'vendor'? <Store size={14} className="text-amber-500" /> : <User size={14} className="text-slate-500" />}
                    <span className="text-xs font-bold text-white truncate max-w-">
                      {ticket.profiles?.store_name || ticket.profiles?.full_name || 'Utilisateur'}
                    </span>
                    {!ticket.admin_read && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                  </div>
                  <span className={`text- px-2 py-0.5 rounded-full border font-bold uppercase ${priority.color}`}>
                    {priority.label}
                  </span>
                </div>
                <p className="text-sm text-white font-medium truncate mb-1">{ticket.subject}</p>
                <p className="text- text-slate-500 line-clamp-1 mb-2">{ticket.last_message || ticket.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1 text- px-2 py-0.5 rounded-full ${status.color}`}>
                    <StatusIcon size={10} /> {status.label}
                  </span>
                  <span className="text- text-slate-600">{formatDate(ticket.updated_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONVERSATION */}
      <div className="flex-1 bg-[#0B0F19] border border-white/10 rounded-3xl flex flex-col overflow-hidden hidden lg:flex">
        {!selectedTicket? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3">
            <MessageSquare size={48} className="text-slate-700" />
            <p className="text-slate-600 font-bold uppercase text-sm">Sélectionne un ticket</p>
          </div>
        ) : (
          <>
            {/* Header ticket */}
            <div className="p-5 border-b border-white/10 bg-black/20">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                    {selectedTicket.profiles?.avatar_url? (
                      <img src={selectedTicket.profiles.avatar_url} className="w-full h-full object-cover" />
                    ) : selectedTicket.profiles?.role === 'vendor'? (
                      <Store className="text-amber-500" />
                    ) : <User className="text-slate-500" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{selectedTicket.subject}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">{selectedTicket.profiles?.store_name || selectedTicket.profiles?.full_name}</span>
                      <span className="flex items-center gap-1 text- text-slate-500"><Mail size={11} /> {selectedTicket.profiles?.email}</span>
                      {selectedTicket.profiles?.phone && (
                        <span className="flex items-center gap-1 text- text-slate-500"><Phone size={11} /> {selectedTicket.profiles.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {Object.entries(STATUSES).map(([key, s]) => (
                    <button
                      key={key}
                      onClick={() => updateStatus(selectedTicket.id, key)}
                      className={`px-3 py-1.5 rounded-lg text- font-bold uppercase transition-all ${
                        selectedTicket.status === key? s.color + ' ring-1 ring-current' : 'bg-white/5 text-slate-500 hover:bg-white/10'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-black/20">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 mb-6">
                <p className="text- text-amber-400 uppercase font-bold mb-1">Description initiale</p>
                <p className="text-sm text-slate-300">{selectedTicket.description}</p>
                <p className="text- text-slate-600 mt-2">{formatDate(selectedTicket.created_at)} • {selectedTicket.category}</p>
              </div>

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'admin'? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.sender_type === 'admin'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                     : 'bg-white/10 text-slate-200 rounded-bl-sm border border-white/5'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text- mt-1.5 ${msg.sender_type === 'admin'? 'text-blue-200' : 'text-slate-500'}`}>
                      {msg.sender_type === 'admin'? 'Support' : 'Client'} • {formatDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Réponse */}
            <div className="p-4 border-t border-white/10 bg-black/40">
              <div className="flex gap-3">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' &&!e.shiftKey) { e.preventDefault(); sendReply(); }}}
                  placeholder="Écrire une réponse..."
                  className="flex-1 bg-[#05070B] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 resize-none"
                  rows={2}
                />
                <button
                  onClick={sendReply}
                  disabled={sending ||!replyText.trim()}
                  className="px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl font-bold text-white flex items-center gap-2 self-end"
                >
                  {sending? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}