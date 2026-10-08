"use client";

import React, { useEffect, useState } from 'react';
import { GameMeta } from '../../types/game';
import { ActionRail } from './ActionRail';
import { Creator } from '../../types/creator';
import { getCreatorById } from '../../lib/repositories/creatorRepository';
import { useUserStore } from '../../store/userStore';

export function FeedOverlay({ game }: { game: GameMeta }) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const toggleFollow = useUserStore(s => s.toggleFollow);
  const isFollowing = useUserStore(s => !!s.following[game.creatorId]);

  useEffect(() => {
    getCreatorById(game.creatorId).then(setCreator);
  }, [game.creatorId]);

  return (
    <>
      <ActionRail game={game} />
      
      <div className="absolute left-4 bottom-24 right-20 z-20 pointer-events-auto flex flex-col gap-2 pointer-events-none">
        
        {/* Creator info */}
        {creator && (
          <div className="flex items-center gap-3 mb-1 pointer-events-auto">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-white/20">
               {creator.displayName[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm tracking-wide">@{creator.username}</span>
            </div>
            <button 
              onClick={() => toggleFollow(creator.id)}
              className={`ml-2 px-3 py-1 text-xs font-bold rounded-full transition-colors ${isFollowing ? 'bg-white/20 text-white' : 'bg-white text-black'}`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
        
        <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md">{game.title}</h3>
        
        <p className="text-white/90 text-sm font-medium line-clamp-2 drop-shadow-sm pointer-events-auto">
          {game.description}
        </p>
        
        <div className="flex gap-2 mt-1">
          <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md rounded border border-white/10 text-[10px] text-white/80 font-bold uppercase tracking-wider">
            {game.category}
          </span>
          <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md rounded border border-white/10 text-[10px] text-white/80 font-bold uppercase tracking-wider">
            {game.difficulty}
          </span>
        </div>
      </div>
    </>
  );
}
