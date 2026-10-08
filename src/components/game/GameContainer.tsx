"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useGameRuntime } from '../../game-engine/useGameRuntime';
import { GameMeta } from '../../types/game';
import { GameEvents } from '../../game-engine/types';
import { useUserStore } from '../../store/userStore';

interface GameContainerProps {
  game: GameMeta;
  isActive: boolean;
  isPreload: boolean;
  onGameOver?: (score: number) => void;
  onScoreUpdate?: (score: number) => void;
  onRestart?: () => void;
  interactionMode?: 'idle' | 'playing';
}

export function GameContainer({ game, isActive, isPreload, onGameOver, onScoreUpdate, onRestart, interactionMode = 'idle' }: GameContainerProps) {
  const [liveScore, setLiveScore] = useState(0);
  const [gameOverResult, setGameOverResult] = useState<{ score: number; isNewBest?: boolean } | null>(null);
  
  const updateBestScore = useUserStore(s => s.updateBestScore);

  const events: GameEvents = useMemo(() => ({
    onScore: (score) => {
      setLiveScore(score);
      onScoreUpdate?.(score);
    },
    onGameOver: (result) => {
      const isNewBest = updateBestScore(game.id, result.score);
      setGameOverResult({ score: result.score, isNewBest });
      onGameOver?.(result.score);
    },
    onReady: () => {},
    onError: (err) => console.error(err)
  }), [game.id, onGameOver, onScoreUpdate, updateBestScore]);

  const { canvasRef, error, isReady, instance } = useGameRuntime(
    game.engineKey,
    game.config,
    isActive,
    isPreload,
    events
  );

  // Reset game over state when game becomes active again after being away
  useEffect(() => {
    if (!isActive) {
      // Keep game over state so user sees it when scrolling back
    }
  }, [isActive]);

  const handleRestart = () => {
    setGameOverResult(null);
    setLiveScore(0);
    if (instance) {
      instance.restart();
    }
    onRestart?.();
  };

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 text-white gap-4 p-6">
        <span className="text-4xl">⚠️</span>
        <h3 className="font-bold text-xl">Game failed to load</h3>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-white text-black font-bold rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-2xl md:rounded-3xl">
      {/* Ambient glow */}
      <div 
        className="absolute inset-0 opacity-20 blur-[80px] pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${game.thumbnail.gradient[0]}, ${game.thumbnail.gradient[1]})` }}
      />
      
      <canvas 
        ref={canvasRef}
        className="relative z-10 block rounded-xl"
        style={{
          touchAction: interactionMode === 'playing' ? 'none' : 'auto',
          maxHeight: '100%',
          maxWidth: '100%',
        }}
      />
      
      {/* Loading */}
      {!isReady && isActive && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
      
      {/* Live HUD */}
      {isActive && isReady && !gameOverResult && interactionMode === 'playing' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md px-5 py-1.5 rounded-full border border-white/10 text-white font-bold text-2xl tabular-nums font-space tracking-tight">
          {liveScore.toLocaleString()}
        </div>
      )}
      
      {/* Game Over Panel */}
      {gameOverResult && isActive && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white">
          <div className="w-full max-w-sm flex flex-col items-center">
            <h2 className="text-3xl font-black mb-6 tracking-tight text-white/90">GAME OVER</h2>
            
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center mb-6">
              <span className="text-xs uppercase tracking-widest text-white/50 font-semibold mb-1">Your Score</span>
              <span className="text-7xl font-black tabular-nums tracking-tighter bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                {gameOverResult.score.toLocaleString()}
              </span>
              {gameOverResult.isNewBest && (
                <span className="mt-3 bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest animate-bounce">
                  🏆 New Best!
                </span>
              )}
            </div>
            
            <button 
              onClick={handleRestart}
              className="w-full py-4 bg-white text-black font-black text-xl rounded-2xl hover:bg-white/90 active:scale-[0.98] transition-all mb-3"
            >
              PLAY AGAIN
            </button>
            <button 
              className="w-full py-3 bg-white/10 text-white font-bold text-base rounded-2xl hover:bg-white/20 transition-colors mb-10"
            >
              VIEW LEADERBOARD
            </button>
            
            {/* Swipe hint – very prominent */}
            <div className="flex flex-col items-center gap-2 animate-pulse">
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 text-white/80 mb-1 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7 7 7" />
                </svg>
                <svg className="w-8 h-8 text-white/60 animate-bounce [animation-delay:150ms]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7 7 7" />
                </svg>
              </div>
              <span className="text-sm font-black uppercase tracking-[0.2em] text-white/80">Swipe for Next Game</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
