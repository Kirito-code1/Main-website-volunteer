"use client";
import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  User, Mail, Edit3, LogOut, ShieldCheck, Camera, CalendarDays, Loader2, Trash2, AlertTriangle, Phone,
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const AUTH_SITE_URL = "https://main-website-volunteer.vercel.app";
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setNewName(user.user_metadata?.full_name || "");
      setNewPhone(user.user_metadata?.phone || "");
      setLoading(false);
      return true;
    }
    return false;
  };

  useEffect(() => {
    const handleInitialAuth = async () => {
      // 1. Проверяем, пришел ли токен в URL (#access_token=...)
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        // Supabase автоматически подхватит токены из URL при вызове getUser() или getSession()
        const isSuccess = await fetchUser();
        if (isSuccess) {
          // Очищаем URL от токенов для безопасности
          window.history.replaceState(null, "", window.location.pathname);
          return;
        }
      }

      // 2. Если в URL ничего нет, пробуем обычную загрузку (куки)
      const hasSession = await fetchUser();
      
      // 3. Если и так пусто — редирект на логин
      if (!hasSession) {
        window.location.href = `${AUTH_SITE_URL}/login`;
      }
    };

    handleInitialAuth();
  }, []);

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      await supabase.storage.from("avatars").upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      await fetchUser();
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: newName, phone: newPhone },
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

  // Пока проверяем авторизацию — показываем спиннер
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-[#10b981]" />
        <p className="text-gray-400 font-bold animate-pulse uppercase text-xs tracking-widest">Синхронизация...</p>
      </div>
    );
  }

  // Если юзера нет, компонент ничего не рендерит (сработает редирект в useEffect)
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10">
      <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in duration-500">
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="h-40 bg-gradient-to-br from-[#10b981] to-[#3b82f6]" />
          <div className="px-10 pb-10">
            <div className="relative -mt-20 mb-6 flex justify-between items-end">
              <div className="w-40 h-40 bg-white rounded-[38px] p-1.5 shadow-2xl overflow-hidden relative">
                {user.user_metadata?.avatar_url ? (
                   <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover rounded-[32px]" />
                ) : (
                   <User className="w-full h-full p-8 text-gray-200" />
                )}
                <label className="absolute bottom-2 right-2 p-3 bg-[#10b981] text-white rounded-2xl cursor-pointer hover:scale-110 transition-transform active:scale-95 shadow-lg">
                  <Camera className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(true)} 
                className="px-8 py-4 bg-gray-900 text-white rounded-[22px] font-black hover:bg-black transition-all active:scale-95 shadow-lg"
              >
                Настроить
              </button>
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3">
                {user.user_metadata?.full_name || "Участник"}
                <ShieldCheck className="w-6 h-6 text-[#10b981]" />
              </h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">ID: {user.id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm space-y-4">
            <div>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-1">Почта</p>
              <p className="font-bold text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-1">Телефон</p>
              <p className="font-bold text-gray-900">{user.user_metadata?.phone || "Не указан"}</p>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm flex flex-col justify-center gap-3">
             <button 
               onClick={handleLogout} 
               className="w-full py-4 bg-gray-50 text-gray-900 rounded-[22px] font-black hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
             >
               <LogOut className="w-5 h-5" /> Выйти
             </button>
          </div>
        </div>
      </div>

      {/* MODAL EDIT */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black mb-6">Редактировать профиль</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                className="w-full p-5 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-[#10b981] font-bold" 
                placeholder="Ваше имя" 
              />
              <input 
                value={newPhone} 
                onChange={(e) => setNewPhone(e.target.value)} 
                className="w-full p-5 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-[#10b981] font-bold" 
                placeholder="Ваш телефон" 
              />
              <div className="pt-4 flex flex-col gap-2">
                <button disabled={isSaving} className="w-full py-5 bg-[#10b981] text-white rounded-2xl font-black shadow-lg hover:bg-[#0da975] transition-all">
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </button>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-full py-2 text-gray-400 font-bold">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}