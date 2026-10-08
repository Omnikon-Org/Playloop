import { GameModule, GameContext, GameInstance } from '../../game-engine/types';
import { createGameLoop } from '../../game-engine/createGameLoop';
import { setupCanvas } from '../../game-engine/canvas';

const LOGICAL_W = 360;
const LOGICAL_H = 640;

const EMOJIS = ['🐶','🐱','🐻','🦊','🐯','🐨','🐸','🐙','🦋','🦄','🌸','⭐','🍕','🍉','🎸','🚀'];

interface Card {
  id: number; emoji: string; x: number; y: number; w: number; h: number;
  state: 'hidden' | 'showing' | 'matched';
  flipProgress: number; // 0 = hidden, 1 = shown
}

const MemoryFlip: GameModule = {
  create: (ctx: GameContext): GameInstance => {
    const { ctx: gCtx, resize } = setupCanvas(ctx.canvas, LOGICAL_W, LOGICAL_H);

    const cols: number = Array.isArray(ctx.config.grid) ? ctx.config.grid[0] : 4;
    const rows: number = Array.isArray(ctx.config.grid) ? ctx.config.grid[1] : 4;
    const totalPairs = (cols * rows) / 2;

    type State = 'idle' | 'playing' | 'done';
    let state: State = 'idle';
    let cards: Card[] = [];
    let firstPick: Card | null = null;
    let secondPick: Card | null = null;
    let waitTimer = 0;
    let moves = 0;
    let matches = 0;
    let startTime = 0;
    let elapsed = 0;
    let score = 0;
    let locked = false; // prevent picking during flip-back animation

    const buildCards = () => {
      const emojis = EMOJIS.slice(0, totalPairs);
      const deck = [...emojis, ...emojis].sort(() => Math.random() - 0.5);

      const padH = 56;
      const padV = 90;
      const gapH = 10;
      const gapV = 10;
      const usableW = LOGICAL_W - padH * 2;
      const usableH = LOGICAL_H - padV * 2;
      const cw = (usableW - gapH * (cols - 1)) / cols;
      const ch = (usableH - gapV * (rows - 1)) / rows;

      cards = deck.map((emoji, i) => ({
        id: i,
        emoji,
        x: padH + (i % cols) * (cw + gapH),
        y: padV + Math.floor(i / cols) * (ch + gapV),
        w: cw,
        h: ch,
        state: 'hidden' as const,
        flipProgress: 0,
      }));
    };

    const drawCard = (c: Card) => {
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      const scaleX = Math.abs(Math.cos(c.flipProgress * Math.PI));

      gCtx.save();
      gCtx.translate(cx, cy);
      gCtx.scale(scaleX, 1);

      const radius = 10;
      const hw = c.w / 2;
      const hh = c.h / 2;

      if (c.flipProgress < 0.5) {
        // Back
        const bgColor = c.state === 'matched' ? '#2e1065' : '#6d28d9';
        gCtx.fillStyle = bgColor;
        gCtx.beginPath();
        (gCtx as CanvasRenderingContext2D).roundRect?.(-hw, -hh, c.w, c.h, radius);
        gCtx.fill();
        // Pattern on back
        gCtx.strokeStyle = 'rgba(255,255,255,0.12)';
        gCtx.lineWidth = 1.5;
        gCtx.beginPath();
        (gCtx as CanvasRenderingContext2D).roundRect?.(-hw + 5, -hh + 5, c.w - 10, c.h - 10, 6);
        gCtx.stroke();
        // Logo mark
        gCtx.fillStyle = 'rgba(255,255,255,0.25)';
        gCtx.font = `${c.h * 0.3}px sans-serif`;
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'middle';
        gCtx.fillText('?', 0, 0);
      } else {
        // Front
        const faceColor = c.state === 'matched' ? '#1e1b4b' : '#1e293b';
        gCtx.fillStyle = faceColor;
        gCtx.beginPath();
        (gCtx as CanvasRenderingContext2D).roundRect?.(-hw, -hh, c.w, c.h, radius);
        gCtx.fill();

        if (c.state === 'matched') {
          gCtx.fillStyle = 'rgba(167,139,250,0.3)';
          gCtx.beginPath();
          (gCtx as CanvasRenderingContext2D).roundRect?.(-hw, -hh, c.w, c.h, radius);
          gCtx.fill();
        }

        gCtx.globalAlpha = c.state === 'matched' ? 0.5 : 1;
        gCtx.font = `${Math.min(c.w, c.h) * 0.5}px sans-serif`;
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'middle';
        gCtx.fillText(c.emoji, 0, 0);
        gCtx.globalAlpha = 1;
      }

      // Matched checkmark overlay
      if (c.state === 'matched') {
        gCtx.fillStyle = 'rgba(167,139,250,0.8)';
        gCtx.font = '14px sans-serif';
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'middle';
        gCtx.fillText('✓', hw - 14, -hh + 14);
      }

      gCtx.restore();
    };

    const draw = () => {
      const bg = gCtx.createLinearGradient(0, 0, 0, LOGICAL_H);
      bg.addColorStop(0, '#0f0c29');
      bg.addColorStop(1, '#302b63');
      gCtx.fillStyle = bg;
      gCtx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      if (state === 'idle') {
        // Draw a few preview cards
        gCtx.fillStyle = 'rgba(109,40,217,0.5)';
        [[60,200,80,100],[140,180,80,100],[220,195,80,100],[300,210,80,100]].forEach(([x,y,w,h]) => {
          gCtx.beginPath();
          (gCtx as CanvasRenderingContext2D).roundRect?.(x, y, w, h, 10);
          gCtx.fill();
          gCtx.fillStyle = 'rgba(255,255,255,0.2)';
          gCtx.font = '32px sans-serif';
          gCtx.textAlign = 'center';
          gCtx.textBaseline = 'middle';
          gCtx.fillText('?', x + w/2, y + h/2);
          gCtx.fillStyle = 'rgba(109,40,217,0.5)';
        });

        gCtx.fillStyle = '#fff';
        gCtx.font = 'bold 26px sans-serif';
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'alphabetic';
        gCtx.fillText('Memory Flip', LOGICAL_W / 2, LOGICAL_H / 2 + 60);
        gCtx.fillStyle = 'rgba(255,255,255,0.6)';
        gCtx.font = '15px sans-serif';
        gCtx.fillText(`${cols}×${rows} grid · Match all pairs`, LOGICAL_W / 2, LOGICAL_H / 2 + 95);
        gCtx.fillStyle = 'rgba(255,255,255,0.4)';
        gCtx.font = '14px sans-serif';
        gCtx.fillText('Tap to start', LOGICAL_W / 2, LOGICAL_H / 2 + 130);
        return;
      }

      cards.forEach(c => drawCard(c));

      // HUD
      gCtx.fillStyle = 'rgba(255,255,255,0.8)';
      gCtx.font = 'bold 16px sans-serif';
      gCtx.textAlign = 'left';
      gCtx.textBaseline = 'alphabetic';
      gCtx.fillText(`Moves: ${moves}`, 20, 44);
      gCtx.textAlign = 'right';
      gCtx.fillText(`${Math.floor(elapsed)}s`, LOGICAL_W - 20, 44);

      // Progress bar
      const pct = matches / totalPairs;
      gCtx.fillStyle = 'rgba(255,255,255,0.1)';
      gCtx.fillRect(20, 52, LOGICAL_W - 40, 4);
      gCtx.fillStyle = '#a78bfa';
      gCtx.fillRect(20, 52, (LOGICAL_W - 40) * pct, 4);
    };

    const update = (delta: number) => {
      ctx.input.update();
      // Animate card flips
      cards.forEach(c => {
        const target = c.state === 'hidden' ? 0 : 1;
        c.flipProgress += (target - c.flipProgress) * 0.18;
        if (Math.abs(c.flipProgress - target) < 0.01) c.flipProgress = target;
      });

      if (state === 'idle') {
        if (ctx.input.isPointerJustDown) {
          state = 'playing';
          buildCards();
          moves = 0;
          matches = 0;
          score = 0;
          startTime = performance.now();
          elapsed = 0;
        }
        return;
      }

      if (state === 'playing') {
        elapsed = (performance.now() - startTime) / 1000;

        if (waitTimer > 0) {
          waitTimer -= delta;
          if (waitTimer <= 0) {
            if (firstPick && secondPick) {
              if (firstPick.emoji === secondPick.emoji) {
                firstPick.state = 'matched';
                secondPick.state = 'matched';
                matches++;
                if (matches === totalPairs) {
                  state = 'done';
                  score = Math.max(0, 10000 - Math.floor(elapsed * 40) - moves * 80);
                  ctx.events.onScore(score);
                  ctx.events.onGameOver({ score, stats: { moves, time: Math.floor(elapsed) } });
                }
              } else {
                firstPick.state = 'hidden';
                secondPick.state = 'hidden';
              }
              firstPick = null;
              secondPick = null;
              locked = false;
            }
          }
          return;
        }

        if (!locked && ctx.input.isPointerJustDown) {
          const px = ctx.input.pointerX;
          const py = ctx.input.pointerY;

          for (const c of cards) {
            if (c.state !== 'hidden') continue;
            if (px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h) {
              c.state = 'showing';
              if (!firstPick) {
                firstPick = c;
              } else if (c.id !== firstPick.id && !secondPick) {
                secondPick = c;
                moves++;
                locked = true;
                waitTimer = 900;
              }
              break;
            }
          }
        }
      }
    };

    const loop = createGameLoop(update, draw);

    return {
      initialize: () => { resize(); draw(); },
      start: () => { state = 'idle'; loop.start(); },
      pause: () => loop.stop(),
      resume: () => { resize(); loop.start(); },
      restart: () => {
        state = 'idle'; cards = []; firstPick = null; secondPick = null;
        moves = 0; matches = 0; score = 0; waitTimer = 0; locked = false;
        loop.start();
      },
      destroy: () => { loop.stop(); ctx.input.cleanup(); },
      resize: () => resize(),
    };
  }
};

export default MemoryFlip;
