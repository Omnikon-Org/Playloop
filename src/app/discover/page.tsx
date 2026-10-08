"use client";

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { GameMeta } from '../../types/game';
import { getFeedPage, searchGames, getGamesByCategory } from '../../lib/repositories/gameRepository';
import Link from 'next/link';

const CATEGORIES = ["🔥 Trending", "⚡ Quick Games", "🧠 Brain", "🎯 Skill", "🏎️ Racing", "😂 Casual", "👥 Multiplayer"];

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("🔥 Trending");
  const [games, setGames] = useState<GameMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    
    const loadData = async () => {
      if (query.length > 2) {
        const res = await searchGames(query);
        if (mounted) setGames(res);
      } else {
        const strippedCat = activeCategory.replace(/[\u{1F300}-\u{1F9FF}\s]/gu, '').trim();
        let res: GameMeta[] = [];
        if (activeCategory === "🔥 Trending") {
          res = (await getFeedPage(0, 10)).items;
        } else {
          res = await getGamesByCategory(strippedCat);
        }
        if (mounted) setGames(res);
      }
      if (mounted) setLoading(false);
    };

    const debounce = setTimeout(loadData, query ? 300 : 0);
    return () => { mounted = false; clearTimeout(debounce); };
  }, [query, activeCategory]);

  return (
    <div className="w-full h-full flex flex-col bg-[#07070c] text-white pt-[env(safe-area-inset-top)] pb-20 md:pb-0 overflow-hidden">
       {/* Sticky Header */}
       <div className="p-4 bg-black/80 backdrop-blur-md z-10 border-b border-white/10">
         <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
           <input 
             type="text"
             placeholder="Search games, creators..."
             value={query}
             onChange={e => setQuery(e.target.value)}
             className="w-full bg-white/10 border border-white/20 rounded-full py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-white/40 transition-colors"
           />
         </div>
       </div>

       {/* Scrollable Content */}
       <div className="flex-1 overflow-y-auto">
         {/* Categories (only if not searching) */}
         {!query && (
           <div className="flex overflow-x-auto gap-2 p-4 no-scrollbar">
             {CATEGORIES.map(cat => (
               <button
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeCategory === cat ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
               >
                 {cat}
               </button>
             ))}
           </div>
         )}

         {/* Grid */}
         {loading ? (
           <div className="p-8 text-center text-white/50 font-bold animate-pulse">Loading...</div>
         ) : games.length === 0 ? (
           <div className="p-12 text-center flex flex-col items-center">
             <span className="text-4xl mb-4">🥲</span>
             <h3 className="text-xl font-bold mb-2">No games found</h3>
             <p className="text-white/60 text-sm">
               {query ? `No results for "${query}"` : `${activeCategory} games coming soon!`}
             </p>
           </div>
         ) : (
           <div className="grid grid-cols-2 gap-3 p-4">
             {games.map(game => (
               <Link key={game.id} href={`/game/${game.id}`} className="flex flex-col gap-2 group">
                 <div 
                   className="w-full aspect-[3/4] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-[1.02] active:scale-95 shadow-lg border border-white/5"
                   style={{ background: `linear-gradient(to bottom right, ${game.thumbnail.gradient[0]}, ${game.thumbnail.gradient[1]})` }}
                 >
                   <span className="text-5xl">{game.thumbnail.emoji}</span>
                 </div>
                 <div className="px-1">
                   <h3 className="font-bold text-sm line-clamp-1">{game.title}</h3>
                   <div className="flex items-center justify-between mt-1">
                     <span className="text-xs text-white/50">{Math.floor(game.plays / 1000)}k plays</span>
                     <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-white/10 rounded-sm text-white/80">{game.difficulty}</span>
                   </div>
                 </div>
               </Link>
             ))}
           </div>
         )}
       </div>
    </div>
  );
}
