"use client";

import React, { Suspense, useEffect, use } from 'react';
import { GameFeed } from '../../../components/feed/GameFeed';
import { useFeedStore } from '../../../store/feedStore';

function GamePageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const setActiveGameId = useFeedStore(s => s.setActiveGameId);
  const setInteractionMode = useFeedStore(s => s.setInteractionMode);

  useEffect(() => {
    setActiveGameId(id);
    setInteractionMode('playing');
  }, [id, setActiveGameId, setInteractionMode]);

  // In a real app we'd fetch the feed starting from this ID.
  // For now, we just show the feed and rely on state to snap/jump to it if possible.
  // Actually, wait, jumping in standard scroll-snap is tricky unless we fetch it as the first item.
  // Let's just render the Feed (it will eventually need to start at this item).
  return (
    <main className="w-full h-[100dvh] bg-black text-white relative">
      <GameFeed />
    </main>
  );
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="w-full h-full bg-black" />}>
      <GamePageContent params={params} />
    </Suspense>
  );
}
