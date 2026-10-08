"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, Bell, User, type LucideProps } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

type NavItem = {
  href: string;
  icon: React.FC<LucideProps>;
  label: string;
  isAccent?: boolean;
};

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/create', icon: Plus, label: 'Create', isAccent: true },
  { href: '/notifications', icon: Bell, label: 'Inbox' },
  { href: '/profile', icon: User, label: 'Profile' },
];

function DesktopNavLink({ href, icon: Icon, label, isAccent, isActive }: NavItem & { isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-3 lg:px-4 rounded-xl transition-colors ${
        isAccent
          ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white'
          : isActive
          ? 'bg-white/10 text-white'
          : 'hover:bg-white/10 text-white/70 hover:text-white'
      }`}
    >
      <Icon className="w-6 h-6 flex-shrink-0" />
      <span className="hidden lg:block font-semibold">{label}</span>
    </Link>
  );
}

function DesktopSideNav() {
  const pathname = usePathname();
  return (
    <div className="hidden md:flex w-[80px] lg:w-[240px] flex-shrink-0 border-r border-white/10 flex-col py-6 px-3 gap-2">
      <div className="lg:px-4 mb-8">
        <span className="hidden lg:block font-space font-black text-2xl tracking-tighter text-white">PLAYLOOP</span>
        <span className="block lg:hidden font-space font-black text-2xl tracking-tighter text-white text-center">PL</span>
      </div>
      {navItems.map((item) => (
        <DesktopNavLink key={item.href} {...item} isActive={pathname === item.href} />
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-[100dvh] md:h-screen flex flex-col md:flex-row bg-[#07070c]">
      {/* Desktop SideNav */}
      <Suspense fallback={<div className="hidden md:flex w-[80px] lg:w-[240px] border-r border-white/10 bg-[#07070c]" />}>
        <DesktopSideNav />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 h-[100dvh] md:h-screen relative overflow-hidden flex justify-center items-center bg-[#07070c]">
        {/* Ambient gradient background for desktop */}
        <div className="hidden md:block absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)] pointer-events-none" />
        
        {/* Phone frame on desktop */}
        <div className="w-full h-full md:w-[390px] md:h-[844px] md:max-h-[92vh] md:border-[2px] md:border-white/10 md:rounded-[2.5rem] overflow-hidden relative bg-black md:shadow-[0_0_80px_rgba(124,58,237,0.3)]">
          <Suspense fallback={null}>
            <TopBar />
          </Suspense>
          {children}
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
