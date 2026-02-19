"use client";
import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Navbar from "../components/Navbar";
import {
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Send,
  BarChart3,
  Clock,
  X,
  Camera,
  Image as ImageIcon,
} from "lucide-react";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );

  useEffect(() => {
    fetchMyEvents();
  }, []);

  async function fetchMyEvents() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("organization_id", user.id)
      .order("created_at", { ascending: false });
    setEvents(data || []);
  }

  // Функция загрузки картинки
  async function uploadImage(file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("event-images")
      .upload(fileName, file);

    if (error) throw error;
    const {
      data: { publicUrl },
    } = supabase.storage.from("event-images").getPublicUrl(fileName);
    return publicUrl;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
      alert("Событие опубликовано!");
    } catch (error) {
      alert("Ошибка: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Удалить это объявление?")) {
      await supabase.from("events").delete().eq("id", id);
      fetchMyEvents();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <main className="max-w-6xl mx-auto py-12 px-4">
        {/* Шапка Дашборда */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900">Мои события</h1>
            <p className="text-gray-500 font-medium">
              Управляйте вашими публикациями
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#10b981] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-green-100 hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" /> Создать событие
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-green-50 text-[#10b981] rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                Активные объявления
              </p>
              <p className="text-4xl font-black text-gray-900">
                {events.length}
              </p>
            </div>
          </div>
        </div>

        {/* Список */}
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-medium">
                У вас пока нет публикаций
              </p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-white p-4 rounded-[32px] border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900">
                    {event.title}
                  </h3>
                  <div className="flex gap-4 mt-1 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {event.location}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="mr-4 p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* МОДАЛЬНОЕ ОКНО */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-900">
                Новое событие
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-8 space-y-5">
              {/* Загрузка фото */}
              <div className="relative group h-40 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center overflow-hidden transition-all hover:border-[#10b981]">
                {imageFile ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-gray-400 text-sm font-bold">
                      Нажмите, чтобы добавить фото
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#10b981]"
                placeholder="Название события"
              />
              <div className="flex gap-4">
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#10b981]"
                />
                <input
                  required
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#10b981]"
                  placeholder="Место"
                />
              </div>
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#10b981]"
                placeholder="Описание..."
              />

              <button
                disabled={loading}
                className="w-full py-5 bg-[#10b981] text-white rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-[#0da975] transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Публикация..." : "Опубликовать"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
