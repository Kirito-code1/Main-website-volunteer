"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { User, LogOut, ShieldCheck, Camera, Loader2 } from "lucide-react";
import { getLoginUrl, hydrateSessionFromUrl } from "../lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  ), []);

  const fetchUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user || null);

    if (user) {
      setNewName(user.user_metadata?.full_name || "");
      setNewPhone(user.user_metadata?.phone || "");
    }

    return Boolean(user);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      await hydrateSessionFromUrl(supabase);
      const hasUser = await fetchUser();
      if (!isMounted) return;

      if (!hasUser) {
        setLoading(false);
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
  }, [fetchUser, supabase]);

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file || !user) return;
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
    router.refresh();
    window.location.href = getLoginUrl();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><Loader2 className="animate-spin text-[#10b981]" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="h-40 bg-gradient-to-br from-[#10b981] to-[#3b82f6]" />
          <div className="px-10 pb-10">
            <div className="relative -mt-20 mb-6 flex justify-between items-end">
              <div className="w-40 h-40 bg-white rounded-[38px] p-1.5 shadow-2xl overflow-hidden relative">
                {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover rounded-[32px]" alt="Фото профиля" /> : <User className="w-full h-full p-8 text-gray-200" />}
                <label className="absolute bottom-2 right-2 p-3 bg-[#10b981] text-white rounded-2xl cursor-pointer"><Camera className="w-5 h-5" /><input type="file" className="hidden" onChange={handleAvatarUpload} disabled={uploading} /></label>
              </div>
              <button onClick={() => setIsEditModalOpen(true)} className="px-8 py-4 bg-gray-900 text-white rounded-[22px] font-black">Настроить</button>
            </div>
            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-2">{user.user_metadata?.full_name || "Участник"}<ShieldCheck className="w-6 h-6 text-[#10b981]" /></h1>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm space-y-4">
            <p className="text-gray-400 font-black uppercase text-[10px]">Почта</p>
            <p className="font-bold">{user.email}</p>
          </div>
          <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm">
             <button onClick={handleLogout} className="w-full py-4 bg-gray-50 text-gray-900 rounded-[22px] font-black">Выйти</button>
          </div>
        </div>
      </div>
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border" placeholder="Имя" />
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border" placeholder="Телефон" />
              <button disabled={isSaving} className="w-full py-4 bg-[#10b981] text-white rounded-2xl font-black">{isSaving ? "Сохранение..." : "Сохранить"}</button>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-full text-gray-400 font-bold">Отмена</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
