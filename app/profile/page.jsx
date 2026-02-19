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
  LogIn
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

  const fetchUser = useCallback(async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
      setUser(supabaseUser);
      setNewName(supabaseUser.user_metadata?.full_name || "");
      setNewPhone(supabaseUser.user_metadata?.phone || "");
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Просто слушаем, есть ли кто-то в системе. Никаких редиректов!
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setNewName(session.user.user_metadata?.full_name || "");
        setNewPhone(session.user.user_metadata?.phone || "");
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    fetchUser();

    return () => subscription.unsubscribe();
  }, [supabase, fetchUser]);

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file || !user) return;

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
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin h-10 w-10 text-[#10b981]" />
      </div>
    );
  }

  // Если пользователь не найден (не залогинен), показываем экран-заглушку
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-[28px] flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Вы не вошли в аккаунт</h1>
        <p className="text-gray-500 mb-8 max-w-xs font-medium">Войдите, чтобы просматривать и редактировать свой профиль</p>
        <a 
          href={`${AUTH_SITE_URL}/login`}
          className="px-8 py-4 bg-[#10b981] text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2"
        >
          <LogIn className="w-5 h-5" /> Перейти к входу
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10 md:pb-20">
      <div className="max-w-3xl mx-auto py-6 md:py-12 px-4 animate-in fade-in duration-500">
        
        {/* ШАПКА ПРОФИЛЯ */}
        <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-6 md:mb-8">
          <div className="h-32 md:h-40 bg-gradient-to-br from-[#10b981] via-[#059669] to-[#3b82f6]" />
          <div className="px-6 md:px-10 pb-8 md:pb-10">
            <div className="relative -mt-16 md:-mt-20 mb-6 flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
              <div className="relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[28px] md:rounded-[38px] p-1.5 shadow-2xl">
                  <div className="w-full h-full bg-gray-100 rounded-[24px] md:rounded-[32px] overflow-hidden flex items-center justify-center relative">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <User className="w-12 h-12 md:w-20 md:h-20 text-gray-300" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>
                <label className="absolute bottom-1 right-1 p-2.5 bg-[#10b981] text-white rounded-xl shadow-xl cursor-pointer hover:scale-110 transition-all">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full md:w-auto px-8 py-4 bg-gray-900 text-white rounded-[20px] font-black hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-5 h-5" /> Настроить
              </button>
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 flex items-center justify-center md:justify-start gap-3">
                {user.user_metadata?.full_name || "Участник"}
                <ShieldCheck className="w-6 h-6 text-[#10b981]" />
              </h1>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-2 flex items-center justify-center md:justify-start gap-2">
                <CalendarDays className="w-4 h-4" /> На сайте с {new Date(user.created_at).toLocaleDateString("ru-RU", { year: "numeric", month: "long" })}
              </p>
            </div>
          </div>
        </div>

        {/* КАРТОЧКИ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Mail /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 font-black uppercase">Почта</p>
                <p className="font-bold truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 text-[#10b981] rounded-2xl"><Phone /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 font-black uppercase">Телефон</p>
                <p className="font-bold">{user.user_metadata?.phone || "Не указан"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm flex flex-col">
            <h3 className="font-black text-xl mb-6">Безопасность</h3>
            <button 
              onClick={handleLogout}
              className="mt-auto w-full py-4 bg-gray-50 text-gray-900 rounded-2xl font-black hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" /> Выйти
            </button>
          </div>
        </div>
      </div>

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Настройки профиля</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-100 focus:border-[#10b981] font-bold" 
                placeholder="Имя" 
              />
              <input 
                type="tel" 
                value={newPhone} 
                onChange={(e) => setNewPhone(e.target.value)} 
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-100 focus:border-[#10b981] font-bold" 
                placeholder="Телефон" 
              />
              <div className="flex flex-col gap-2 pt-4">
                <button disabled={isSaving} className="w-full py-4 bg-[#10b981] text-white rounded-2xl font-black shadow-lg hover:bg-[#0da975]">
                  {isSaving ? "Сохранение..." : "Сохранить изменения"}
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