"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  User, 
  LogOut, 
  PlusCircle, 
  Home, 
  Menu, 
  X,
  Loader2
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const MAIN_SITE_URL = "https://main-website-volunteer.vercel.app";

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  useEffect(() => {
    // Слушаем изменения авторизации, чтобы Navbar обновлялся мгновенно
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    // Первичная проверка сессии
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
    };

    checkUser();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Очищаем локальное состояние перед редиректом
    setUser(null);
    window.location.href = `${MAIN_SITE_URL}/login`;
  };

  const navLinks = [
    { name: "Главная", href: "/", icon: Home },
    { name: "События", href: "/dashboard", icon: LayoutDashboard },
    { name: "Профиль", href: "/profile", icon: User },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 py-3 md:py-4 px-4 md:px-6 sticky top-0 z-[100]">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* Логотип */}
        <Link 
          href="/" 
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center gap-2 font-black text-xl md:text-2xl text-[#10b981] z-[110]"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 bg-[#10b981] rounded-xl flex items-center justify-center shadow-lg shadow-green-100">
            <PlusCircle className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="tracking-tighter uppercase">EVENT<span className="text-gray-900">FLOW</span></span>
        </Link>

        {/* Десктопная навигация */}
        <div className="hidden md:flex items-center gap-2">
          {authLoading ? (
            <div className="px-4"><Loader2 className="w-5 h-5 animate-spin text-gray-200" /></div>
          ) : user ? (
            <>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-200 ${
                      isActive 
                        ? "bg-green-50 text-[#10b981]" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
              
              <div className="w-px h-6 bg-gray-100 mx-2" />

              <button 
                onClick={handleSignOut} 
                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 group"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden group-hover:inline text-xs font-black">Выход</span>
              </button>
            </>
          ) : (
            <Link 
              href={`${MAIN_SITE_URL}/login`}
              className="px-6 py-2.5 bg-[#10b981] text-white rounded-xl font-black shadow-lg shadow-green-100 hover:scale-105 active:scale-95 transition-all"
            >
              Войти
            </Link>
          )}
        </div>

        {/* Кнопка бургера */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-gray-900 hover:bg-gray-50 rounded-xl transition-all z-[110] relative"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>

        {/* Мобильное меню */}
        <div className={`
          fixed inset-0 bg-white z-[105] md:hidden flex flex-col transition-all duration-300 ease-in-out
          ${isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"}
        `}>
          <div className="flex flex-col h-full pt-24 px-6 pb-10">
            {user ? (
              <>
                <div className="space-y-3">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link 
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-4 p-5 rounded-2xl font-black text-xl transition-all ${
                          isActive 
                            ? "bg-green-50 text-[#10b981]" 
                            : "text-gray-500 bg-gray-50"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        {link.name}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-auto pt-8 border-t border-gray-100">
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl font-black text-xl text-red-500 bg-red-50 active:scale-[0.98] transition-all"
                  >
                    <LogOut className="w-6 h-6" />
                    Выход из системы
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-10">
                <Link 
                  href={`${MAIN_SITE_URL}/login`}
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center p-6 bg-[#10b981] text-white rounded-3xl font-black text-2xl shadow-xl shadow-green-100"
                >
                  Войти в аккаунт
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}