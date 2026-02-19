"use client";
import React, { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  User,
  Mail,
  Edit3,
  LogOut,
  X,
  ShieldCheck,
  Camera,
  CalendarDays,
  Loader2,
  Trash2,
  AlertTriangle,
  Phone,
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Состояния для модалок
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

  // Функция загрузки данных юзера (вынесена для повторного использования)
  const fetchUser = useCallback(async () => {
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
    if (supabaseUser) {
      setUser(supabaseUser);
      setNewName(supabaseUser.user_metadata?.full_name || "");
      setNewPhone(supabaseUser.user_metadata?.phone || "");
      setLoading(false);
      return true;
    }
    return false;
  }, [supabase]);

  useEffect(() => {
    // 1. Слушаем состояние авторизации (события SIGNED_IN, INITIAL_SESSION и т.д.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        setNewName(session.user.user_metadata?.full_name || "");
        setNewPhone(session.user.user_metadata?.phone || "");
        setLoading(false);
      }
    });

    // 2. Логика проверки с задержкой (чтобы не выкидывало сразу)
    const initAuth = async () => {
      // Пробуем получить сессию сразу
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        setNewName(session.user.user_metadata?.full_name || "");
        setNewPhone(session.user.user_metadata?.phone || "");
        setLoading(false);
      } else {
        // Если сессии нет, ждем 2.5 секунды — даем шанс SDK достучаться до кук/хранилища
        setTimeout(async () => {
          const isFetched = await fetchUser();
          if (!isFetched) {
            // Только если через 2.5 сек юзера все еще нет — уходим на логин
            window.location.assign(`${AUTH_SITE_URL}/login`);
          }
        }, 2500);
      }
    };

    initAuth();

    return () => subscription.unsubscribe();
  }, [supabase, fetchUser]);

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;
      await fetchUser();
    } catch (error) {
      alert("Ошибка загрузки: " + error.message);
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
    } else {
      alert("Ошибка обновления: " + error.message);
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
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;
      await supabase.auth.signOut();
      window.location.href = `${AUTH_SITE_URL}/login`;
    } catch (error) {
      alert("Ошибка при удалении: " + error.message);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-4">
        <Loader2 className="animate-spin h-12 w-12 text-[#10b981]" />
        <p className="text-gray-500 font-bold animate-pulse">Синхронизация профиля...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10 md:pb-20">
      <div className="max-w-3xl mx-auto py-6 md:py-12 px-4">
        
        {/* ШАПКА ПРОФИЛЯ */}
        <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-6 md:mb-8">
          <div className="h-32 md:h-40 bg-gradient-to-br from-[#10b981] via-[#059669] to-[#3b82f6]" />
          <div className="px-6 md:px-10 pb-8 md:pb-10">
            <div className="relative -mt-16 md:-mt-20 mb-6 flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
              <div className="relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[28px] md:rounded-[38px] p-1.5 shadow-2xl transition-transform group-hover:scale-[1.01]">
                  <div className="w-full h-full bg-gray-100 rounded-[24px] md:rounded-[32px] overflow-hidden flex items-center justify-center relative">
                    {user?.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        className="w-full h-full object-cover"
                        alt="Avatar"
                      />
                    ) : (
                      <User className="w-12 h-12 md:w-20 md:h-20 text-gray-300" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    )}
                  </div>
                </div>
                <label className="absolute bottom-1 right-1 md:bottom-2 md:right-2 p-2.5 md:p-3 bg-[#10b981] text-white rounded-xl md:rounded-2xl shadow-xl cursor-pointer hover:bg-[#0da975] transition-all hover:scale-110 active:scale-90">
                  <Camera className="w-4 h-4 md:w-5 md:h-5" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-gray-900 text-white rounded-[18px] md:rounded-[22px] font-black hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base">Настроить</span>
              </button>
            </div>

            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 flex items-center justify-center md:justify-start gap-2 md:gap-3">
                {user?.user_metadata?.full_name || "Участник"}
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-[#10b981]" />
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 font-bold uppercase text-[10px] md:text-xs tracking-widest">
                <CalendarDays className="w-3.5 h-3.5 md:w-4 md:h-4" /> На сайте с {getJoinedDate()}
              </div>
            </div>
          </div>
        </div>

        {/* КАРТОЧКИ И МОДАЛКИ (остаются без изменений по верстке) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[35px] border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Mail className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 font-black uppercase">Почта</p>
                <p className="text-gray-900 font-bold truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 bg-green-50 text-[#10b981] rounded-xl">
                <Phone className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 font-black uppercase">Телефон</p>
                <p className="text-gray-900 font-bold">{user?.user_metadata?.phone || "Не указан"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[35px] border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-gray-900 font-black text-lg mb-1">Безопасность</h3>
            <p className="text-gray-400 text-xs font-medium mb-6">Управление доступом</p>
            <div className="space-y-3 mt-auto">
              <button onClick={handleLogout} className="w-full py-3.5 bg-gray-50 text-gray-900 rounded-[18px] font-black hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-sm">
                <LogOut className="w-4 h-4" /> Выйти
              </button>
              <button onClick={() => setIsDeleteModalOpen(true)} className="w-full py-3.5 border-2 border-red-50 text-red-500 rounded-[18px] font-black hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-sm">
                <Trash2 className="w-4 h-4" /> Удалить
              </button>
            </div>
          </div>
        </div>

        {/* МОДАЛКИ (Кратко для экономии места, логика та же) */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl">
              <h2 className="text-2xl font-black mb-6">Настройки</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-100 focus:border-[#10b981] font-bold" placeholder="Имя" />
                <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-100 focus:border-[#10b981] font-bold" placeholder="Телефон" />
                <button disabled={isSaving} className="w-full py-4 bg-[#10b981] text-white rounded-2xl font-black shadow-lg">
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </button>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-full py-2 text-gray-400 font-bold">Отмена</button>
              </form>
            </div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <div className="bg-white w-full max-w-md rounded-[40px] p-10 text-center shadow-2xl">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-black mb-4">Удалить аккаунт?</h2>
              <button onClick={confirmDeleteAccount} disabled={isDeleting} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black mb-2 shadow-lg">
                {isDeleting ? "Удаление..." : "Да, удалить"}
              </button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold">Отмена</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}