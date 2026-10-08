"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { BRAND_NAME } from '../../lib/brand';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopBar() {
  const pathname = usePathname();
  
  if (pathname !== '/' && !pathname.startsWith('/game/')) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-40 pt-[env(safe-area-inset-top)] flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
       <Link href="/" className="pointer-events-auto">
         <h1 className="font-space font-black text-xl tracking-tighter text-white drop-shadow-md">
           {BRAND_NAME}
         </h1>
       </Link>
       
       <Link href="/discover?focus=search" className="pointer-events-auto p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90">
         <Search className="w-5 h-5" />
       </Link>
    </div>
  );
}
