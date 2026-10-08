"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, Bell, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/discover', icon: Compass, label: 'Discover' },
    { href: '/create', icon: Plus, label: 'Create', isCreate: true },
    { href: '/notifications', icon: Bell, label: 'Inbox' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <nav className="flex justify-around items-center h-16 px-2">
        {links.map(({ href, icon: Icon, label, isCreate }) => {
          const isActive = pathname === href;
          return (
            <Link 
              key={href} 
              href={href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-white" : "text-white/50 hover:text-white/80"
              )}
            >
              {isCreate ? (
                <div className="bg-gradient-to-tr from-violet-600 to-pink-500 rounded-xl p-1.5 shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                  <Icon className="w-6 h-6 text-white" strokeWidth={3} />
                </div>
              ) : (
                <>
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
