"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  User,
  Mail,
  CalendarDays,
  X,
  ShieldCheck,
  Loader2,
  Phone,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function OrganizerProfileModal({ userId, isOpen, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      ),
    []
  );

  const fetchOrganizerProfile = useCallback(async () => {
    try {
      setLoading(true);
      setProfile(null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Ошибка Supabase:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Системная ошибка:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchOrganizerProfile();
    }
  }, [fetchOrganizerProfile, isOpen, userId]);

  // Функция для форматирования даты "На сайте с..."
  const formatJoinedDate = (dateString) => {
    if (!dateString) return "Недавно";
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 relative">
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-10 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#10b981]" />
          </div>
        ) : profile ? (
          <div>
            {/* Градиентный фон шапки */}
            <div className="h-32 bg-gradient-to-r from-[#10b981] to-[#3b82f6]" />

            <div className="px-8 pb-8">
              {/* Аватар */}
              <div className="relative -mt-12 mb-6">
                <div className="w-24 h-24 bg-white rounded-[28px] p-1 shadow-xl">
                  <div className="w-full h-full bg-gray-100 rounded-[24px] overflow-hidden flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        className="w-full h-full object-cover"
                        alt={profile.full_name}
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                </div>
              </div>

              {/* Имя и статус */}
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  {profile.full_name || "Участник"}
                  <ShieldCheck className="w-5 h-5 text-[#10b981]" />
                </h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
                  Организатор сообщества
                </p>
              </div>

              {/* Информационные карточки */}
              <div className="space-y-3">
                {/* Телефон */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Phone className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                      Телефон
                    </p>
                    <p className="text-gray-900 font-bold">
                      {profile.phone || "Не указан"}
                    </p>
                  </div>
                </div>

                {/* Дата регистрации */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                      На сайте с
                    </p>
                    <p className="text-gray-900 font-bold capitalize">
                      {formatJoinedDate(profile.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Кнопка закрытия */}
              <button
                onClick={onClose}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black mt-8 hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
              >
                Закрыть профиль
              </button>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <User className="w-8 h-8" />
            </div>
            <p className="text-gray-900 font-black text-xl">Профиль не найден</p>
            <p className="text-gray-500 mt-2">Возможно, пользователь удалил свой аккаунт</p>
            <button 
              onClick={onClose}
              className="mt-6 text-[#10b981] font-bold hover:underline"
            >
              Вернуться назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
