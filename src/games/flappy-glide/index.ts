import { GameModule, GameContext, GameInstance } from '../../game-engine/types';
import { createGameLoop } from '../../game-engine/createGameLoop';
import { setupCanvas } from '../../game-engine/canvas';

const LOGICAL_W = 360;
const LOGICAL_H = 640;

interface Pillar { x: number; gapTop: number; passed: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

const FlappyGlide: GameModule = {
  create: (ctx: GameContext): GameInstance => {
    const { ctx: gCtx, resize } = setupCanvas(ctx.canvas, LOGICAL_W, LOGICAL_H);

    const gravityBase: number = typeof ctx.config.gravity === 'number' ? ctx.config.gravity : 0.5;
    const gapSize: number = typeof ctx.config.gapSize === 'number' ? ctx.config.gapSize : 150;
    const speedBase: number = typeof ctx.config.speed === 'number' ? ctx.config.speed : 2.5;
    const isNight: boolean = !!ctx.config.isNight;

    type State = 'idle' | 'playing' | 'dead';
    let state: State = 'idle';
    let birdY = LOGICAL_H / 2;
    let birdVelocity = 0;
    let pillars: Pillar[] = [];
    let score = 0;
    let bestScore = 0;
    let animT = 0;
    let deathTimer = 0;
    let particles: Particle[] = [];
    const bgStars: { x: number; y: number; r: number; }[] = [];
    let speedMultiplier = 1;

    // Generate stars for background
    for (let i = 0; i < 80; i++) {
      bgStars.push({ x: Math.random() * LOGICAL_W, y: Math.random() * LOGICAL_H, r: Math.random() * 1.5 + 0.3 });
    }

    const spawnPillar = (x: number) => {
      const gapTop = 80 + Math.random() * (LOGICAL_H - 80 - gapSize - 80);
      pillars.push({ x, gapTop, passed: false });
    };

    const spawnParticles = (x: number, y: number) => {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: ['#f43f5e', '#fb923c', '#fbbf24'][Math.floor(Math.random() * 3)]
        });
      }
    };

    const flapBird = () => {
      birdVelocity = -9;
    };

    const triggerDeath = () => {
      if (state !== 'playing') return;
      state = 'dead';
      deathTimer = 0;
      spawnParticles(80, birdY);
      if (score > bestScore) bestScore = score;
      ctx.events.onGameOver({ score });
    };

    const drawBird = (y: number, alpha = 1) => {
      gCtx.globalAlpha = alpha;
      const birdAngle = Math.max(-0.5, Math.min(0.8, birdVelocity * 0.04));

      gCtx.save();
      gCtx.translate(80, y);
      gCtx.rotate(birdAngle);

      // Glow
      const glow = gCtx.createRadialGradient(0, 0, 5, 0, 0, 22);
      glow.addColorStop(0, isNight ? 'rgba(251,191,36,0.8)' : 'rgba(244,63,94,0.8)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      gCtx.fillStyle = glow;
      gCtx.beginPath();
      gCtx.arc(0, 0, 22, 0, Math.PI * 2);
      gCtx.fill();

      // Body
      gCtx.beginPath();
      gCtx.arc(0, 0, 12, 0, Math.PI * 2);
      gCtx.fillStyle = isNight ? '#fde047' : '#f43f5e';
      gCtx.fill();
      gCtx.strokeStyle = isNight ? '#fbbf24' : '#e11d48';
      gCtx.lineWidth = 2;
      gCtx.stroke();

      gCtx.restore();
      gCtx.globalAlpha = 1;
    };

    const drawPillar = (x: number, top: number, bottom: number) => {
      const pillarColor = isNight ? '#0ea5e9' : '#10b981';
      const pillarDark = isNight ? '#0369a1' : '#065f46';

      // Shadow
      gCtx.fillStyle = 'rgba(0,0,0,0.3)';
      gCtx.fillRect(x + 5, 0, 55, top);
      gCtx.fillRect(x + 5, bottom, 55, LOGICAL_H - bottom);

      // Pillar body
      gCtx.fillStyle = pillarColor;
      gCtx.fillRect(x, 0, 55, top);
      gCtx.fillRect(x, bottom, 55, LOGICAL_H - bottom);

      // Cap (rounded top/bottom)
      gCtx.fillStyle = pillarDark;
      gCtx.fillRect(x - 5, top - 20, 65, 20);
      gCtx.fillRect(x - 5, bottom, 65, 20);

      // Highlight strip
      gCtx.fillStyle = 'rgba(255,255,255,0.15)';
      gCtx.fillRect(x + 5, 0, 8, top - 20);
      gCtx.fillRect(x + 5, bottom + 20, 8, LOGICAL_H - bottom - 20);
    };

    const draw = () => {
      // Sky gradient
      const sky = gCtx.createLinearGradient(0, 0, 0, LOGICAL_H);
      if (isNight) {
        sky.addColorStop(0, '#020617');
        sky.addColorStop(1, '#0f172a');
      } else {
        sky.addColorStop(0, '#0f172a');
        sky.addColorStop(1, '#1e293b');
      }
      gCtx.fillStyle = sky;
      gCtx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      // Stars
      if (isNight || state === 'idle') {
        bgStars.forEach(s => {
          gCtx.beginPath();
          gCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          gCtx.fillStyle = `rgba(255,255,255,${0.4 + Math.sin(animT * 2 + s.x) * 0.3})`;
          gCtx.fill();
        });
      }

      // Pillars
      pillars.forEach(p => {
        drawPillar(p.x, p.gapTop, p.gapTop + gapSize);
      });

      // Ground
      gCtx.fillStyle = '#1e293b';
      gCtx.fillRect(0, LOGICAL_H - 30, LOGICAL_W, 30);
      gCtx.fillStyle = '#10b981';
      gCtx.fillRect(0, LOGICAL_H - 32, LOGICAL_W, 6);

      // Bird
      if (state !== 'dead' || deathTimer < 30) {
        drawBird(birdY, state === 'dead' ? Math.max(0, 1 - deathTimer / 30) : 1);
      }

      // Particles
      particles.forEach(p => {
        gCtx.globalAlpha = p.life;
        gCtx.beginPath();
        gCtx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
        gCtx.fillStyle = p.color;
        gCtx.fill();
      });
      gCtx.globalAlpha = 1;

      // UI
      if (state === 'idle') {
        gCtx.fillStyle = 'rgba(0,0,0,0.5)';
        gCtx.beginPath();
        (gCtx as CanvasRenderingContext2D).roundRect?.(LOGICAL_W / 2 - 100, LOGICAL_H / 2 - 50, 200, 90, 12);
        gCtx.fill();
        gCtx.fillStyle = '#fff';
        gCtx.font = 'bold 22px sans-serif';
        gCtx.textAlign = 'center';
        gCtx.fillText(isNight ? 'Flappy Glide Night' : 'Flappy Glide', LOGICAL_W / 2, LOGICAL_H / 2 - 18);
        gCtx.fillStyle = 'rgba(255,255,255,0.6)';
        gCtx.font = '15px sans-serif';
        gCtx.fillText('Tap to flap!', LOGICAL_W / 2, LOGICAL_H / 2 + 22);
      }

      if (state === 'playing' || state === 'dead') {
        // Score
        gCtx.fillStyle = '#fff';
        gCtx.font = 'bold 40px sans-serif';
        gCtx.textAlign = 'center';
        gCtx.shadowColor = 'rgba(0,0,0,0.5)';
        gCtx.shadowBlur = 8;
        gCtx.fillText(score.toString(), LOGICAL_W / 2, 70);
        gCtx.shadowBlur = 0;
      }
    };

    const update = (delta: number) => {
      ctx.input.update();
      animT += 0.016;

      if (state === 'idle') {
        birdY = LOGICAL_H / 2 + Math.sin(animT * 2) * 15;
        if (ctx.input.isPointerJustDown || ctx.input.isKeyPressed(' ')) {
          state = 'playing';
          birdY = LOGICAL_H / 2;
          birdVelocity = 0;
          pillars = [];
          score = 0;
          speedMultiplier = 1;
          spawnPillar(LOGICAL_W + 50);
        }
        return;
      }

      if (state === 'dead') {
        deathTimer++;
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= 0.04; });
        particles = particles.filter(p => p.life > 0);
        return;
      }

      // Playing
      if (ctx.input.isPointerJustDown || ctx.input.isKeyPressed(' ')) {
        flapBird();
      }

      const gravity = gravityBase * (delta / 16.6);
      birdVelocity += gravity;
      birdVelocity = Math.min(birdVelocity, 14); // terminal velocity
      birdY += birdVelocity * (delta / 16.6);

      const speed = speedBase * speedMultiplier * (delta / 16.6);
      pillars.forEach(p => { p.x -= speed; });

      // Spawn
      if (!pillars.length || pillars[pillars.length - 1].x < LOGICAL_W - 180) {
        spawnPillar(LOGICAL_W + 60);
      }
      if (pillars[0]?.x < -65) pillars.shift();

      // Score + collision
      for (const p of pillars) {
        if (!p.passed && p.x + 27 < 80) {
          p.passed = true;
          score++;
          speedMultiplier = 1 + score * 0.03;
          ctx.events.onScore(score);
        }
        // Collision: bird circle (r=12) vs pillar rect
        const bx = 80, by = birdY, br = 12;
        if (bx + br > p.x && bx - br < p.x + 55) {
          if (by - br < p.gapTop || by + br > p.gapTop + gapSize) {
            triggerDeath(); return;
          }
        }
      }

      // Floor/ceiling
      if (birdY > LOGICAL_H - 40 || birdY < 0) {
        triggerDeath();
      }

      // Particles
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= 0.04; });
      particles = particles.filter(p => p.life > 0);
    };

    const loop = createGameLoop(update, draw);

    return {
      initialize: () => { resize(); draw(); },
      start: () => { state = 'idle'; loop.start(); },
      pause: () => loop.stop(),
      resume: () => { resize(); loop.start(); },
      restart: () => {
        state = 'idle';
        birdY = LOGICAL_H / 2;
        birdVelocity = 0;
        pillars = [];
        score = 0;
        particles = [];
        speedMultiplier = 1;
        loop.start();
      },
      destroy: () => { loop.stop(); ctx.input.cleanup(); },
      resize: () => resize(),
    };
  }
};

export default FlappyGlide;
