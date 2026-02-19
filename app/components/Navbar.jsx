"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, LogOut, PlusCircle, Home } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function Navbar() {
  const pathname = usePathname();
  
  // ЗАМЕНЯЕМ НА ТВОЙ URL VERCEL
  const MAIN_SITE_URL = "https://main-website-volunteer.vercel.app";

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Исправлено: перенаправляем на страницу логина на реальном домене
    window.location.href = `${MAIN_SITE_URL}/login`;
  };

  const navLinks = [
    { name: "Главная", href: "/", icon: Home },
    { name: "События", href: "/dashboard", icon: LayoutDashboard },
    { name: "Профиль", href: "/profile", icon: User },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-6 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 font-black text-2xl text-[#10b981]">
          <div className="w-9 h-9 bg-[#10b981] rounded-xl flex items-center justify-center shadow-lg shadow-green-100">
            <PlusCircle className="text-white w-6 h-6" />
          </div>
          EVENT<span className="text-gray-900">FLOW</span>
        </Link>

        <div className="flex items-center gap-1 md:gap-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  isActive ? "bg-green-50 text-[#10b981]" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden md:inline">{link.name}</span>
              </Link>
            );
          })}
          
          {/* Кнопка выхода */}
          <button 
            onClick={handleSignOut} 
            title="Выйти"
            className="ml-2 p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 group"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:group-hover:inline text-xs font-bold">Выход</span>
          </button>
        </div>
      </div>
    </nav>
  );
}