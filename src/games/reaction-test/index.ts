import { GameModule, GameContext, GameInstance } from '../../game-engine/types';
import { createGameLoop } from '../../game-engine/createGameLoop';
import { setupCanvas } from '../../game-engine/canvas';

const LOGICAL_W = 360;
const LOGICAL_H = 640;

const ReactionTest: GameModule = {
  create: (ctx: GameContext): GameInstance => {
    const { ctx: gCtx, resize } = setupCanvas(ctx.canvas, LOGICAL_W, LOGICAL_H);
    const maxRounds: number = typeof ctx.config.rounds === 'number' ? ctx.config.rounds : 5;

    type GameState = 'idle' | 'waiting' | 'ready' | 'flashing' | 'result' | 'gameover';
    let state: GameState = 'idle';
    let timer = 0;
    let delayMs = 0;
    let flashStartTime = 0;
    let currentRound = 0;
    const roundTimes: number[] = [];
    let lastReactionMs = 0;
    let earlyTap = false;
    let animT = 0;

    const avgMs = () => roundTimes.length ? roundTimes.reduce((a, b) => a + b, 0) / roundTimes.length : 0;
    const calcScore = (ms: number) => Math.max(0, Math.floor(1000 - ms));

    const draw = () => {
      gCtx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      animT += 0.02;

      if (state === 'idle') {
        // Splash
        const grad = gCtx.createLinearGradient(0, 0, 0, LOGICAL_H);
        grad.addColorStop(0, '#0f0c29');
        grad.addColorStop(1, '#302b63');
        gCtx.fillStyle = grad;
        gCtx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

        // pulsing circle
        const pulse = 1 + Math.sin(animT * 3) * 0.05;
        gCtx.beginPath();
        gCtx.arc(LOGICAL_W / 2, LOGICAL_H / 2 - 60, 60 * pulse, 0, Math.PI * 2);
        gCtx.strokeStyle = 'rgba(255,255,255,0.15)';
        gCtx.lineWidth = 2;
        gCtx.stroke();
        gCtx.beginPath();
        gCtx.arc(LOGICAL_W / 2, LOGICAL_H / 2 - 60, 40 * pulse, 0, Math.PI * 2);
        gCtx.fillStyle = 'rgba(255,255,255,0.9)';
        gCtx.fill();

        gCtx.fillStyle = '#fff';
        gCtx.font = `bold 28px sans-serif`;
        gCtx.textAlign = 'center';
        gCtx.fillText('Reaction Test', LOGICAL_W / 2, LOGICAL_H / 2 + 30);
        gCtx.fillStyle = 'rgba(255,255,255,0.6)';
        gCtx.font = `16px sans-serif`;
        gCtx.fillText('Tap when the screen turns green', LOGICAL_W / 2, LOGICAL_H / 2 + 65);
        gCtx.fillStyle = 'rgba(255,255,255,0.4)';
        gCtx.font = '14px sans-serif';
        gCtx.fillText('Tap anywhere to start', LOGICAL_W / 2, LOGICAL_H / 2 + 110);
      } else if (state === 'waiting' || state === 'ready') {
        const bg = gCtx.createLinearGradient(0, 0, 0, LOGICAL_H);
        bg.addColorStop(0, '#450a0a');
        bg.addColorStop(1, '#7f1d1d');
        gCtx.fillStyle = bg;
        gCtx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

        // Big red circle
        gCtx.beginPath();
        gCtx.arc(LOGICAL_W / 2, LOGICAL_H / 2 - 40, 90, 0, Math.PI * 2);
        gCtx.fillStyle = '#ef4444';
        gCtx.fill();

        gCtx.fillStyle = '#fff';
        gCtx.font = `bold 22px sans-serif`;
        gCtx.textAlign = 'center';
        gCtx.fillText('WAIT...', LOGICAL_W / 2, LOGICAL_H / 2 - 30);

        gCtx.fillStyle = 'rgba(255,255,255,0.5)';
        gCtx.font = '16px sans-serif';
        gCtx.fillText(`Round ${currentRound + 1} of ${maxRounds}`, LOGICAL_W / 2, LOGICAL_H / 2 + 20);
        gCtx.fillText('Don\'t tap early!', LOGICAL_W / 2, LOGICAL_H / 2 + 80);

        drawRoundDots();
      } else if (state === 'flashing') {
        const bg = gCtx.createLinearGradient(0, 0, 0, LOGICAL_H);
        bg.addColorStop(0, '#14532d');
        bg.addColorStop(1, '#166534');
        gCtx.fillStyle = bg;
        gCtx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

        const pulse = 1 + Math.sin(animT * 10) * 0.03;
        gCtx.beginPath();
        gCtx.arc(LOGICAL_W / 2, LOGICAL_H / 2 - 40, 90 * pulse, 0, Math.PI * 2);
        gCtx.fillStyle = '#22c55e';
        gCtx.fill();

        gCtx.fillStyle = '#fff';
        gCtx.font = `bold 28px sans-serif`;
        gCtx.textAlign = 'center';
        gCtx.fillText('NOW!', LOGICAL_W / 2, LOGICAL_H / 2 - 30);
        gCtx.font = '16px sans-serif';
        gCtx.fillStyle = 'rgba(255,255,255,0.7)';
        gCtx.fillText('TAP!', LOGICAL_W / 2, LOGICAL_H / 2 + 20);

        drawRoundDots();
      } else if (state === 'result') {
        const bg = gCtx.createLinearGradient(0, 0, 0, LOGICAL_H);
        bg.addColorStop(0, '#1e1b4b');
        bg.addColorStop(1, '#312e81');
        gCtx.fillStyle = bg;
        gCtx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

        if (earlyTap) {
          gCtx.fillStyle = '#f87171';
          gCtx.font = `bold 22px sans-serif`;
          gCtx.textAlign = 'center';
          gCtx.fillText('Too early! ❌', LOGICAL_W / 2, LOGICAL_H / 2 - 20);
        } else {
          gCtx.fillStyle = '#a78bfa';
          gCtx.font = `bold 44px sans-serif`;
          gCtx.textAlign = 'center';
          gCtx.fillText(`${Math.round(lastReactionMs)}ms`, LOGICAL_W / 2, LOGICAL_H / 2 - 10);
          gCtx.fillStyle = 'rgba(255,255,255,0.6)';
          gCtx.font = '16px sans-serif';
          const label = lastReactionMs < 200 ? '⚡ Blazing!' : lastReactionMs < 350 ? '✅ Great' : '👍 Not bad';
          gCtx.fillText(label, LOGICAL_W / 2, LOGICAL_H / 2 + 30);
        }
        gCtx.fillStyle = 'rgba(255,255,255,0.4)';
        gCtx.font = '14px sans-serif';
        gCtx.fillText('Tap to continue', LOGICAL_W / 2, LOGICAL_H / 2 + 70);

        drawRoundDots();
      } else if (state === 'gameover') {
        const bg = gCtx.createLinearGradient(0, 0, 0, LOGICAL_H);
        bg.addColorStop(0, '#1e1b4b');
        bg.addColorStop(1, '#312e81');
        gCtx.fillStyle = bg;
        gCtx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

        gCtx.fillStyle = '#fff';
        gCtx.font = `bold 24px sans-serif`;
        gCtx.textAlign = 'center';
        gCtx.fillText(`${maxRounds} rounds complete`, LOGICAL_W / 2, 100);

        gCtx.fillStyle = '#a78bfa';
        gCtx.font = `bold 48px sans-serif`;
        const avg = avgMs();
        gCtx.fillText(`${Math.round(avg)}ms`, LOGICAL_W / 2, 180);

        gCtx.fillStyle = 'rgba(255,255,255,0.6)';
        gCtx.font = '16px sans-serif';
        gCtx.fillText('Average reaction time', LOGICAL_W / 2, 210);

        roundTimes.forEach((t, i) => {
          const x = LOGICAL_W / 2;
          const y = 270 + i * 36;
          gCtx.fillStyle = 'rgba(255,255,255,0.3)';
          gCtx.fillRect(x - 100, y - 18, 200, 28);
          gCtx.fillStyle = '#fff';
          gCtx.font = '14px sans-serif';
          gCtx.textAlign = 'left';
          gCtx.fillText(`Round ${i + 1}`, x - 88, y);
          gCtx.textAlign = 'right';
          gCtx.fillText(`${Math.round(t)}ms`, x + 88, y);
        });
      }
    };

    const drawRoundDots = () => {
      const dotSpacing = 20;
      const startX = LOGICAL_W / 2 - ((maxRounds - 1) * dotSpacing) / 2;
      const y = LOGICAL_H - 80;
      for (let i = 0; i < maxRounds; i++) {
        gCtx.beginPath();
        gCtx.arc(startX + i * dotSpacing, y, 6, 0, Math.PI * 2);
        gCtx.fillStyle = i < roundTimes.length ? '#22c55e' : i === currentRound ? '#fff' : 'rgba(255,255,255,0.2)';
        gCtx.fill();
      }
    };

    const handleTap = () => {
      if (state === 'idle') {
        state = 'waiting';
        currentRound = 0;
        roundTimes.length = 0;
        earlyTap = false;
        startWaitPhase();
      } else if (state === 'ready') {
        earlyTap = true;
        lastReactionMs = 0;
        state = 'result';
      } else if (state === 'flashing') {
        lastReactionMs = performance.now() - flashStartTime;
        roundTimes.push(lastReactionMs);
        earlyTap = false;
        const score = calcScore(lastReactionMs);
        ctx.events.onScore(score);
        state = 'result';
        if (currentRound + 1 >= maxRounds) {
          // Show result briefly then game over
          setTimeout(() => {
            state = 'gameover';
            const finalScore = calcScore(avgMs());
            ctx.events.onScore(finalScore);
            ctx.events.onGameOver({ score: finalScore, stats: { avgMs: avgMs() } });
          }, 1000);
        }
      } else if (state === 'result') {
        if (currentRound + 1 < maxRounds) {
          currentRound++;
          state = 'waiting';
          startWaitPhase();
        }
      }
    };

    const startWaitPhase = () => {
      state = 'ready';
      delayMs = 1500 + Math.random() * 3000;
      timer = 0;
    };

    const update = (delta: number) => {
      ctx.input.update();
      if (ctx.input.isPointerJustDown || ctx.input.isKeyPressed(' ')) {
        handleTap();
      }
      if (state === 'ready') {
        timer += delta;
        if (timer >= delayMs) {
          state = 'flashing';
          flashStartTime = performance.now();
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
        state = 'idle';
        currentRound = 0;
        roundTimes.length = 0;
        earlyTap = false;
        loop.start();
      },
      destroy: () => { loop.stop(); ctx.input.cleanup(); },
      resize: () => { resize(); },
    };
  }
};

export default ReactionTest;
