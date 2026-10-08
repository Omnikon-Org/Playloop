"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GameMeta } from '../../types/game';
import { getFeedPage, getGameById } from '../../lib/repositories/gameRepository';
import { FeedItem } from './FeedItem';
import { useFeedStore } from '../../store/feedStore';

export function GameFeed({ initialGameId }: { initialGameId?: string }) {
  const [items, setItems] = useState<GameMeta[]>([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const setActiveGameId = useFeedStore(s => s.setActiveGameId);
  const activeGameId = useFeedStore(s => s.activeGameId);
  const setInteractionMode = useFeedStore(s => s.setInteractionMode);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchLock = useRef(false);

  const loadMore = useCallback(async () => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    try {
      let firstGame: GameMeta | null = null;
      if (items.length === 0 && initialGameId) {
        firstGame = await getGameById(initialGameId);
      }
      
      const res = await getFeedPage(cursor, 5);
      setItems(prev => {
        let newItems = [...prev];
        if (firstGame && prev.length === 0) {
          newItems.push(firstGame);
          // Filter out the initial game from the rest of the feed to avoid immediate duplicate
          res.items = res.items.filter(g => g.id !== initialGameId);
        }
        return [...newItems, ...res.items];
      });
      setCursor(res.nextCursor || 0);
    } finally {
      fetchLock.current = false;
    }
  }, [cursor]);

  useEffect(() => {
    loadMore().then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBecomeActive = useCallback((id: string) => {
    setActiveGameId(id);
    setInteractionMode('playing'); // start playing automatically
  }, [setActiveGameId, setInteractionMode]);

  // Infinite scroll check
  const activeIndex = items.findIndex(g => g.id === activeGameId);
  useEffect(() => {
    if (activeIndex >= 0 && items.length - activeIndex < 3) {
      loadMore();
    }
  }, [activeIndex, items.length, loadMore]);

  if (loading && items.length === 0) {
    return <div className="h-[100dvh] flex flex-col items-center justify-center bg-background text-white font-bold">LOADING...</div>;
  }

  return (
    <div 
      ref={containerRef}
      className="h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory bg-background text-foreground scroll-smooth no-scrollbar"
      style={{ overscrollBehavior: 'contain' }}
    >
      {items.map((game, idx) => {
        const isVirtualActive = Math.abs(idx - activeIndex) <= 1;
        const isPreload = idx === activeIndex + 1;
        // Generate a unique key because mock games loop
        const key = `${game.id}-${idx}`;
        return (
          <FeedItem 
            key={key} 
            game={game} 
            isVirtualActive={isVirtualActive} 
            isPreload={isPreload}
            onBecomeActive={handleBecomeActive}
          />
        );
      })}
    </div>
  );
}
