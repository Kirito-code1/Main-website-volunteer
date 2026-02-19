"use client";
import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  User, Mail, Edit3, LogOut, CheckCircle2, 
  X, ShieldCheck, Camera, CalendarDays, Loader2, Trash2, AlertTriangle, Phone
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Состояния для модалок
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState(""); // Новое состояние для телефона
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Актуальный URL вашего сайта на Vercel
  const AUTH_SITE_URL = "https://main-website-volunteer.vercel.app";

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `${AUTH_SITE_URL}/login`;
      return;
    }
    setUser(user);
    setNewName(user.user_metadata?.full_name || "");
    setNewPhone(user.user_metadata?.phone || "");
    setLoading(false);
  }

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;
      await fetchUser();
    } catch (error) {
      console.error("Ошибка загрузки:", error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { 
        full_name: newName,
        phone: newPhone 
      }
    });

    if (!error) {
      await fetchUser();
      setIsEditModalOpen(false);
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = `${AUTH_SITE_URL}/login`;
  };

  const confirmDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      // Предполагается, что у вас есть RPC функция delete_user в Supabase
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;

      await supabase.auth.signOut();
      window.location.href = `${AUTH_SITE_URL}/login`;
    } catch (error) {
      console.error("Ошибка при удалении:", error.message);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const getJoinedDate = () => {
    if (!user) return "";
    return new Date(user.created_at).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin h-10 w-10 text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <div className="max-w-3xl mx-auto py-12 px-4">

        {/* ШАПКА ПРОФИЛЯ */}
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="h-40 bg-gradient-to-br from-[#10b981] via-[#059669] to-[#3b82f6]" />
          <div className="px-10 pb-10">
            <div className="relative -mt-20 mb-8 flex justify-between items-end">
              <div className="relative group">
                <div className="w-40 h-40 bg-white rounded-[38px] p-1.5 shadow-2xl transition-transform group-hover:scale-[1.01]">
                  <div className="w-full h-full bg-gray-100 rounded-[32px] overflow-hidden flex items-center justify-center relative">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <User className="w-20 h-20 text-gray-300" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>
                <label className="absolute bottom-2 right-2 p-3 bg-[#10b981] text-white rounded-2xl shadow-xl cursor-pointer hover:bg-[#0da975] transition-all hover:scale-110 active:scale-90">
                  <Camera className="w-5 h-5" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-8 py-4 bg-gray-900 text-white rounded-[22px] font-black hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <Edit3 className="w-5 h-5" />
                <span>Настроить</span>
              </button>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3">
                {user.user_metadata?.full_name || "Участник"}
                <ShieldCheck className="w-6 h-6 text-[#10b981]" />
              </h1>
              <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-xs tracking-widest">
                <CalendarDays className="w-4 h-4" /> На сайте с {getJoinedDate()}
              </div>
            </div>
          </div>
        </div>

        {/* КАРТОЧКИ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Контакты */}
          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm flex flex-col gap-6 group hover:border-blue-100 transition-colors">
            {/* Email */}
            <div className="flex items-center gap-5 min-w-0">
              <div className="flex-shrink-0 p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Почта</p>
                <p className="text-gray-900 font-bold text-base truncate" title={user.email}>{user.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-5 min-w-0">
              <div className="flex-shrink-0 p-4 bg-green-50 text-[#10b981] rounded-2xl group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Телефон</p>
                <p className="text-gray-900 font-bold text-base truncate">
                  {user.user_metadata?.phone || "Не указан"}
                </p>
              </div>
            </div>
          </div>

          {/* Аккаунт */}
          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-gray-900 font-black text-xl mb-1">Безопасность</h3>
            <p className="text-gray-400 text-sm font-medium mb-6">Управление доступом</p>
            
            <div className="space-y-3 mt-auto">
              <button onClick={handleLogout} className="w-full py-4 bg-gray-50 text-gray-900 rounded-[22px] font-black hover:bg-gray-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <LogOut className="w-5 h-5" /> Выйти
              </button>
              <button onClick={() => setIsDeleteModalOpen(true)} className="w-full py-4 border-2 border-red-50 text-red-500 rounded-[22px] font-black hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                <Trash2 className="w-5 h-5" /> Удалить
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* МОДАЛКА: РЕДАКТИРОВАНИЕ ПРОФИЛЯ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-900">Профиль</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Имя</label>
                <input 
                  type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-green-100 outline-none font-bold text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Телефон</label>
                <input 
                  type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+7 (___) ___ __ __"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 ring-green-100 outline-none font-bold text-gray-900"
                />
              </div>
              <button disabled={isSaving} className="w-full py-5 bg-[#10b981] text-white rounded-[22px] font-black shadow-lg shadow-green-100 active:scale-95 transition-all mt-4">
                {isSaving ? "Сохранение..." : "Сохранить изменения"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Удалить аккаунт?</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                Это действие **необратимо**. Все ваши данные, достижения и история будут удалены навсегда.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDeleteAccount}
                  disabled={isDeleting}
                  className="w-full py-5 bg-red-500 text-white rounded-[22px] font-black hover:bg-red-600 transition-all shadow-lg shadow-red-100 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="animate-spin w-5 h-5" /> : "Да, удалить навсегда"}
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-5 bg-gray-50 text-gray-500 rounded-[22px] font-black hover:bg-gray-100 transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}