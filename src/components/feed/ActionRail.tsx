"use client";

import React, { useState } from 'react';
import { GameMeta } from '../../types/game';
import { Heart, MessageCircle, Share2, Trophy } from 'lucide-react';
import { useUserStore } from '../../store/userStore';

export function ActionRail({ game }: { game: GameMeta }) {
  const toggleLike = useUserStore(s => s.toggleLike);
  const isLiked = useUserStore(s => !!s.likedGames[game.id]);
  
  const [likeAnim, setLikeAnim] = useState(false);

  const handleLike = () => {
    toggleLike(game.id);
    if (!isLiked) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 500);
    }
  };

  return (
    <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-6 pointer-events-auto">
       <div className="flex flex-col items-center gap-1 group">
         <button 
           onClick={handleLike}
           className={`p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-transform active:scale-90 ${isLiked ? 'text-pink-500' : 'text-white'}`}
           aria-label="Like game"
         >
           <Heart className={`w-7 h-7 ${isLiked ? 'fill-pink-500' : ''} ${likeAnim ? 'animate-[ping_0.5s_cubic-bezier(0,0,0.2,1)]' : ''}`} />
         </button>
         <span className="text-white text-xs font-bold font-mono">{game.likes + (isLiked ? 1 : 0)}</span>
       </div>
       
       <div className="flex flex-col items-center gap-1 group">
         <button className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90">
           <MessageCircle className="w-7 h-7" />
         </button>
         <span className="text-white text-xs font-bold font-mono">{game.commentsCount}</span>
       </div>

       <div className="flex flex-col items-center gap-1 group">
         <button className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90">
           <Trophy className="w-7 h-7" />
         </button>
         <span className="text-white text-xs font-bold font-mono">Rank</span>
       </div>

       <div className="flex flex-col items-center gap-1 group">
         <button className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90">
           <Share2 className="w-7 h-7" />
         </button>
       </div>
    </div>
  );
}
