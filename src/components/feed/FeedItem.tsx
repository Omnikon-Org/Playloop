"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { GameMeta } from '../../types/game';
import { GameContainer } from '../game/GameContainer';
import { useFeedStore } from '../../store/feedStore';
import { FeedOverlay } from './FeedOverlay';

interface FeedItemProps {
  game: GameMeta;
  isVirtualActive: boolean;
  isPreload: boolean;
  onBecomeActive: (id: string) => void;
}

export const FeedItem = React.memo(function FeedItem({ game, isVirtualActive, isPreload, onBecomeActive }: FeedItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeGameId, setInteractionMode, interactionMode } = useFeedStore();
  
  const isActive = activeGameId === game.id;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            onBecomeActive(game.id);
          }
        });
      },
      { threshold: [0.6] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [game.id, onBecomeActive]);

  const handleRestart = useCallback(() => {
    setInteractionMode('playing');
  }, [setInteractionMode]);
  
  const handleGameOver = useCallback(() => {
    setInteractionMode('idle');
  }, [setInteractionMode]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-[100dvh] snap-always snap-center flex flex-col relative overflow-hidden"
      style={{ scrollSnapStop: 'always' }}
    >
      <div className="flex-1 w-full h-full relative">
        {(isActive || isPreload || isVirtualActive) ? (
          <GameContainer 
            game={game} 
            isActive={isActive} 
            isPreload={isPreload} 
            interactionMode={isActive ? interactionMode : 'idle'}
            onRestart={handleRestart}
            onGameOver={handleGameOver}
          />
        ) : (
          /* Lightweight placeholder for distant items */
          <div 
            className="w-full h-full flex flex-col items-center justify-center text-white"
            style={{ background: `linear-gradient(to bottom, ${game.thumbnail.gradient[0]}, ${game.thumbnail.gradient[1]})` }}
          >
            <span className="text-8xl mb-4">{game.thumbnail.emoji}</span>
            <h2 className="text-2xl font-bold">{game.title}</h2>
          </div>
        )}
        
        {isActive && <FeedOverlay game={game} />}
      </div>
    </div>
  );
});
