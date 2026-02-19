"use client";
import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Plus,
  Trash2,
  Calendar,
  MapPin,
  BarChart3,
  X,
  Camera,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null); // ID для модалки удаления
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );

  // Блокировка скролла при открытых модалках
  useEffect(() => {
    if (isModalOpen || deleteId) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isModalOpen, deleteId]);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  async function fetchMyEvents() {
    setIsFetching(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("organization_id", user.id)
      .order("created_at", { ascending: false });
    
    setEvents(data || []);
    setIsFetching(false);
  }

  async function uploadImage(file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("event-images")
      .upload(fileName, file);

    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(fileName);
    return publicUrl;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let publicImageUrl = "";
      if (imageFile) {
        publicImageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase.from("events").insert([
        {
          ...form,
          organization_id: user.id,
          author_name: user.user_metadata?.full_name || "Организация",
          image_url: publicImageUrl,
        },
      ]);

      if (error) throw error;

      setForm({ title: "", description: "", date: "", location: "" });
      setImageFile(null);
      setIsModalOpen(false);
      fetchMyEvents();
    } catch (error) {
      alert("Ошибка: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Функция удаления для модалки
  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from("events").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchMyEvents();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <main className="max-w-6xl mx-auto py-6 md:py-12 px-4">
        
        {/* Шапка Дашборда */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900">Мои события</h1>
            <p className="text-gray-500 font-medium text-sm md:text-base">
              Управляйте вашими публикациями
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#10b981] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-green-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Создать событие
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6 transition-all hover:border-green-100">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-green-50 text-[#10b981] rounded-2xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                Активные объявления
              </p>
              <p className="text-3xl md:text-4xl font-black text-gray-900">
                {events.length}
              </p>
            </div>
          </div>
        </div>

        {/* Список */}
        <div className="space-y-4">
          {isFetching ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-green-500" /></div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 md:py-20 bg-white rounded-[32px] md:rounded-[40px] border-2 border-dashed border-gray-100 px-4">
              <p className="text-gray-400 font-medium">У вас пока нет публикаций</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-white p-4 rounded-[28px] md:rounded-[32px] border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 group hover:shadow-md transition-all relative"
              >
                <div className="w-full md:w-24 h-48 md:h-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                  {event.image_url ? (
                    <img src={event.image_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon className="w-8 h-8 md:w-6 md:h-6" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 w-full px-2 md:px-0">
                  <h3 className="font-bold text-lg md:text-xl text-gray-900 truncate">
                    {event.title}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#10b981]" /> {event.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#10b981]" /> {event.location}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDeleteId(event.id)}
                  className="md:mr-4 p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all self-end md:self-auto"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
            
            <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl md:text-2xl font-black text-gray-900">Новое событие</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 md:p-8 space-y-4 md:space-y-5 overflow-y-auto">
              <div className="relative group h-40 md:h-48 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center overflow-hidden transition-all hover:border-[#10b981]">
                {imageFile ? (
                  <div className="relative w-full h-full">
                    <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" alt="Preview" />
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); setImageFile(null); }}
                      className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-gray-400 text-sm font-bold">Добавить фото</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="space-y-4">
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 ring-green-100 focus:border-[#10b981] font-bold"
                  placeholder="Название события"
                />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full md:flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#10b981] font-bold"
                  />
                  <input
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full md:flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#10b981] font-bold"
                    placeholder="Место"
                  />
                </div>

                <textarea
                  rows="3"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#10b981] font-bold resize-none"
                  placeholder="О чем ваше событие?"
                />
              </div>

              <button
                disabled={loading}
                className="w-full py-5 bg-[#10b981] text-white rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-[#0da975] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Публикация...</span>
                  </>
                ) : (
                  "Опубликовать"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО УДАЛЕНИЯ */}
      {deleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Удалить?</h2>
            <p className="text-gray-500 font-medium mb-8">Это действие нельзя будет отменить.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                className="py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-600 active:scale-95 transition-all"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}