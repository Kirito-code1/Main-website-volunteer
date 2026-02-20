"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  User, Mail, Edit3, LogOut, ShieldCheck, Camera, Loader2, Phone,
} from "lucide-react";
import { getLoginUrl } from "../lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 1. Правильная инициализация клиента
  const supabase = useMemo(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    ), 
  []);

  // 2. Единственная функция загрузки пользователя
  const fetchUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        setUser(null);
        return false;
      }

      setUser(user);
      setNewName(user.user_metadata?.full_name || "");
      setNewPhone(user.user_metadata?.phone || "");
      return true;
    } catch (err) {
      console.error("Ошибка при получении данных пользователя:", err);
      return false;
    }
  }, [supabase]);

  // 3. Обработка авторизации при монтировании
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // Здесь можно добавить логику обработки токенов из URL, если она нужна
      const hasSession = await fetchUser();
      
      if (isMounted) {
        if (!hasSession) {
          window.location.href = getLoginUrl();
        } else {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Подписка на изменения состояния (Logout в другой вкладке и т.д.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        window.location.href = getLoginUrl();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUser, supabase.auth]);

  // 4. Загрузка аватара
  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file || !user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      // Загрузка
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Получение URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Обновление метаданных
      await supabase.auth.updateUser({ 
        data: { avatar_url: publicUrl } 
      });

      await fetchUser();
    } catch (error) {
      alert("Ошибка загрузки изображения");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // 5. Обновление профиля
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: newName, phone: newPhone },
    });
    
    if (!error) {
      await fetchUser();
      setIsEditModalOpen(false);
    } else {
      alert("Ошибка при сохранении");
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = getLoginUrl();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-[#10b981]" />
        <p className="text-gray-400 font-bold animate-pulse uppercase text-xs tracking-widest">
          Синхронизация...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10">
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Карточка профиля */}
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="h-40 bg-gradient-to-br from-[#10b981] to-[#3b82f6]" />
          <div className="px-10 pb-10">
            <div className="relative -mt-20 mb-6 flex justify-between items-end">
              <div className="w-40 h-40 bg-white rounded-[38px] p-1.5 shadow-2xl overflow-hidden relative">
                {user.user_metadata?.avatar_url ? (
                   <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover rounded-[32px]" alt="Профиль" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-[32px]">
                      <User className="w-16 h-16 text-gray-200" />
                   </div>
                )}
                <label className="absolute bottom-2 right-2 p-3 bg-[#10b981] text-white rounded-2xl cursor-pointer hover:scale-110 transition-transform shadow-lg">
                  <Camera className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={handleAvatarUpload} disabled={uploading} accept="image/*" />
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
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">ID: {user.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        {/* Данные пользователя */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm space-y-6">
            <div>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-1 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Почта
              </p>
              <p className="font-bold text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-1 flex items-center gap-2">
                <Phone className="w-3 h-3" /> Телефон
              </p>
              <p className="font-bold text-gray-900">{user.user_metadata?.phone || "Не указан"}</p>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm flex flex-col justify-center">
             <button 
               onClick={handleLogout} 
               className="w-full py-4 bg-gray-50 text-gray-900 rounded-[22px] font-black hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
             >
               <LogOut className="w-5 h-5" /> Выйти
             </button>
          </div>
        </div>
      </div>

      {/* Модальное окно редактирования */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Редактировать профиль</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Полное имя</label>
                <input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="w-full p-5 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-[#10b981] font-bold" 
                  placeholder="Имя Фамилия" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Телефон</label>
                <input 
                  value={newPhone} 
                  onChange={(e) => setNewPhone(e.target.value)} 
                  className="w-full p-5 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-[#10b981] font-bold" 
                  placeholder="+7 (___) ___ __ __" 
                />
              </div>
              <div className="pt-4 flex flex-col gap-2">
                <button 
                  type="submit"
                  disabled={isSaving} 
                  className="w-full py-5 bg-[#10b981] text-white rounded-2xl font-black shadow-lg hover:bg-[#0da975] transition-all disabled:opacity-50"
                >
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="w-full py-2 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}