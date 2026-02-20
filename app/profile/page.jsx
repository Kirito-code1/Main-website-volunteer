"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { User, LogOut, ShieldCheck, Camera, Loader2 } from "lucide-react";
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

  // Инициализируем клиент правильно через useMemo
  const supabase = useMemo(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    ), 
  []);

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);

      if (user) {
        setNewName(user.user_metadata?.full_name || "");
        setNewPhone(user.user_metadata?.phone || "");
      }

      return Boolean(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const hasUser = await fetchUser();
      if (!isMounted) return;

      if (!hasUser) {
        window.location.href = getLoginUrl();
        return;
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        window.location.href = getLoginUrl();
        return;
      }

      setUser(session.user);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUser, supabase.auth]);

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

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      await supabase.auth.updateUser({ 
        data: { avatar_url: publicUrl } 
      });
      
      await fetchUser();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Ошибка при загрузке фото");
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
      console.error("Error updating profile:", error);
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    window.location.href = getLoginUrl();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-[#10b981]" />
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
                  <img 
                    src={user.user_metadata.avatar_url} 
                    className="w-full h-full object-cover rounded-[32px]" 
                    alt="Фото профиля" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-[32px]">
                    <User className="w-20 h-20 text-gray-200" />
                  </div>
                )}
                <label className="absolute bottom-2 right-2 p-3 bg-[#10b981] text-white rounded-2xl cursor-pointer hover:bg-[#059669] transition-colors">
                  <Camera className="w-5 h-5" />
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleAvatarUpload} 
                    disabled={uploading} 
                    accept="image/*"
                  />
                </label>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(true)} 
                className="px-8 py-4 bg-gray-900 text-white rounded-[22px] font-black hover:bg-black transition-colors"
              >
                Настроить
              </button>
            </div>
            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-2">
              {user.user_metadata?.full_name || "Участник"}
              <ShieldCheck className="w-6 h-6 text-[#10b981]" />
            </h1>
          </div>
        </div>

        {/* Инфо и Кнопки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm space-y-4">
            <p className="text-gray-400 font-black uppercase text-[10px] tracking-wider">Почта</p>
            <p className="font-bold text-gray-900">{user.email}</p>
          </div>
          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm flex items-center">
             <button 
              onClick={handleLogout} 
              className="w-full py-4 bg-gray-50 text-gray-900 rounded-[22px] font-black hover:bg-red-50 hover:text-red-600 transition-all"
             >
               Выйти из аккаунта
             </button>
          </div>
        </div>
      </div>

      {/* Модальное окно редактирования */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl">
            <h3 className="text-2xl font-black mb-6">Редактировать профиль</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 ml-2">Имя</label>
                <input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#10b981]" 
                  placeholder="Ваше имя" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 ml-2">Телефон</label>
                <input 
                  value={newPhone} 
                  onChange={(e) => setNewPhone(e.target.value)} 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#10b981]" 
                  placeholder="Телефон" 
                />
              </div>
              <div className="pt-4 space-y-3">
                <button 
                  type="submit"
                  disabled={isSaving} 
                  className="w-full py-4 bg-[#10b981] text-white rounded-2xl font-black shadow-lg shadow-green-200 disabled:opacity-50"
                >
                  {isSaving ? "Сохранение..." : "Сохранить изменения"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="w-full text-gray-400 font-bold py-2"
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