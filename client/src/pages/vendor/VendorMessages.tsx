import { 
  Search, 
  Send, 
  User, 
  MoreHorizontal, 
  Phone, 
  Paperclip, 
  MessageSquare // Ajouté ici pour corriger l'Uncaught ReferenceError
} from 'lucide-react';
import { useState } from 'react';

export default function VendorMessages() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  const contacts = [
    { id: 1, name: "Jean Kouassi", lastMsg: "La pièce est dispo ?", time: "12:30", online: true, unread: 2 },
    { id: 2, name: "Garage Auto Abidjan", lastMsg: "Merci pour l'envoi rapide !", time: "Hier", online: false, unread: 0 },
    { id: 3, name: "Saliou Diallo", lastMsg: "Je passe demain à 10h.", time: "Hier", online: true, unread: 0 },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pt-20 pb-20 px-4 max-w-6xl mx-auto">
      
      {/* HEADER PROFESSIONNEL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-[1000] uppercase text-slate-900 tracking-tighter flex items-center gap-4">
            <div className="w-2.5 h-10 bg-orange-500 rounded-full shadow-lg shadow-orange-500/20"></div>
            Messagerie Directe
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 ml-6">
            Support Client & Partenaires
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[750px]">
        
        {/* LISTE DES CONTACTS */}
        <div className="lg:col-span-4 bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
          <div className="p-8 pb-4">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <input 
                type="text" 
                placeholder="RECHERCHER UN CONTACT..." 
                className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl text-[10px] font-black outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all text-slate-900 tracking-widest"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
            {contacts.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedChat(c.id)}
                className={`p-6 rounded-[2rem] cursor-pointer transition-all duration-300 flex items-center gap-5 group
                  ${selectedChat === c.id 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-[1.02]' 
                    : 'hover:bg-slate-50 bg-white border border-transparent hover:border-slate-100'
                  }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors
                    ${selectedChat === c.id ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-white text-slate-400'}`}>
                    <User className="w-6 h-6" />
                  </div>
                  {c.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className={`text-[11px] font-[1000] uppercase tracking-wider truncate
                      ${selectedChat === c.id ? 'text-white' : 'text-slate-900'}`}>
                      {c.name}
                    </p>
                    <span className={`text-[9px] font-black uppercase ${selectedChat === c.id ? 'text-slate-400' : 'text-slate-300'}`}>
                      {c.time}
                    </span>
                  </div>
                  <p className={`text-[11px] font-bold truncate ${selectedChat === c.id ? 'text-slate-400' : 'text-slate-500'}`}>
                    {c.lastMsg}
                  </p>
                </div>

                {c.unread > 0 && selectedChat !== c.id && (
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[9px] font-black text-white">
                    {c.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ZONE DE CHAT */}
        <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden relative">
          {selectedChat ? (
            <>
              <div className="px-10 py-6 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-[1000] uppercase text-slate-900 tracking-widest">Client en ligne</h3>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Actif</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><Phone className="w-4 h-4" /></button>
                   <button className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex-1 p-10 overflow-y-auto bg-slate-50/30 space-y-6">
                <div className="flex justify-center">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] bg-white px-4 py-2 rounded-full border border-slate-100">Conversation lancée</span>
                </div>
                <div className="flex items-end gap-3 max-w-[70%]">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex-shrink-0"></div>
                  <div className="bg-white p-5 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">Salut ! Je voudrais savoir si l'article est toujours disponible ?</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white border-t border-slate-50">
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-[2rem] border-2 border-transparent focus-within:border-orange-500 transition-all">
                  <button className="p-3 text-slate-400 hover:text-orange-500"><Paperclip className="w-5 h-5" /></button>
                  <input 
                    type="text" 
                    placeholder="VOTRE MESSAGE..." 
                    className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-900"
                  />
                  <button className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-orange-500 transition-all shadow-lg shadow-slate-900/10">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-20">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8 border-2 border-dashed border-slate-100">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h2 className="text-sm font-[1000] uppercase text-slate-900 tracking-widest mb-3">Vos Conversations</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-xs leading-loose">
                Sélectionnez un client pour répondre à ses demandes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}