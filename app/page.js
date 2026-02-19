"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Navbar from "./components/Navbar";
import { 
  Calendar, MapPin, ArrowRight, User, 
  Search, X, Info, AlignLeft, ImageIcon 
} from "lucide-react";
import OrganizerProfileModal from "./components/OrganizerModal";

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isOrganizerOpen, setIsOrganizerOpen] = useState(false);
  const [selectedOrganizerId, setSelectedOrganizerId] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    // Выбираем все данные. Убедись, что в селекте есть колонка с ID автора!
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    setEvents(data || []);
    setLoading(false);
  }

  const filtered = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openOrganizer = (id) => {
    if (!id) {
      console.warn("ID организатора отсутствует в данных события");
      return;
    }
    setSelectedOrganizerId(id);
    setIsOrganizerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <div className="max-w-6xl mx-auto pt-16 px-4">
        {/* Поиск */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
            Открой для себя <span className="text-[#10b981]">события</span>
          </h1>
          <div className="max-w-xl mx-auto relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#10b981] transition-colors" />
            <input 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white shadow-2xl shadow-gray-200/40 rounded-[28px] outline-none focus:ring-2 ring-[#10b981]/20 transition-all border-none text-lg" 
              placeholder="Поиск по названию или месту..."
            />
          </div>
        </div>

        {/* Сетка */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#10b981]"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {filtered.map(event => (
              <div key={event.id} className="group bg-white rounded-[35px] border border-gray-100 p-2 hover:shadow-2xl transition-all duration-500">
                <div className="h-52 bg-gray-100 rounded-[28px] relative overflow-hidden mb-6">
                  {event.image_url ? (
                    <img src={event.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-green-50 text-green-200"><ImageIcon className="w-12 h-12" /></div>
                  )}
                </div>
                
                <div className="px-6 pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-[#10b981]" />
                    <button 
                      onClick={() => openOrganizer(event.user_id || event.organization_id)} 
                      className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#10b981]"
                    >
                      {event.author_name || "Организатор"}
                    </button>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-1">{event.title}</h3>
                  <button onClick={() => setSelectedEvent(event)} className="w-full py-4 bg-gray-50 rounded-[22px] font-bold hover:bg-[#10b981] hover:text-white transition-all">
                    Подробнее
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалка события */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[45px] overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="h-64 relative">
              <img src={selectedEvent.image_url} className="w-full h-full object-cover" alt="" />
              <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-xl rounded-2xl"><X /></button>
            </div>
            <div className="p-10">
              <div 
                onClick={() => openOrganizer(selectedEvent.user_id || selectedEvent.organization_id)}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-[24px] mb-8 cursor-pointer hover:bg-green-50 group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center"><User className="text-[#10b981]" /></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Организатор</p>
                  <p className="text-gray-900 font-black group-hover:text-[#10b981]">{selectedEvent.author_name}</p>
                </div>
              </div>
              <h2 className="text-4xl font-black mb-6">{selectedEvent.title}</h2>
              <p className="text-gray-500 whitespace-pre-line">{selectedEvent.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Модалка профиля */}
      <OrganizerProfileModal 
        userId={selectedOrganizerId}
        isOpen={isOrganizerOpen}
        onClose={() => setIsOrganizerOpen(false)}
      />
    </div>
  );
}