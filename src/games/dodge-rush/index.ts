import { GameModule, GameContext, GameInstance } from '../../game-engine/types';
import { createGameLoop } from '../../game-engine/createGameLoop';
import { setupCanvas } from '../../game-engine/canvas';

const LOGICAL_W = 360;
const LOGICAL_H = 640;

interface Obstacle { x: number; y: number; w: number; h: number; color: string; }
interface Star { x: number; y: number; spd: number; size: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; }

const DodgeRush: GameModule = {
  create: (ctx: GameContext): GameInstance => {
    const { ctx: gCtx, resize } = setupCanvas(ctx.canvas, LOGICAL_W, LOGICAL_H);

    const startSpeed: number = typeof ctx.config.startSpeed === 'number' ? ctx.config.startSpeed : 4;
    const accel: number = typeof ctx.config.acceleration === 'number' ? ctx.config.acceleration : 0.08;

    type State = 'idle' | 'playing' | 'dead';
    let state: State = 'idle';
    let playerX = LOGICAL_W / 2;
    let score = 0;
    let elapsed = 0;
    let speed = startSpeed;
    let obstacles: Obstacle[] = [];
    let nextSpawn = 60;
    const stars: Star[] = [];
    let particles: Particle[] = [];
    let animT = 0;
    let shakeDuration = 0;

    for (let i = 0; i < 60; i++) {
      stars.push({ x: Math.random() * LOGICAL_W, y: Math.random() * LOGICAL_H, spd: 1 + Math.random() * 3, size: Math.random() * 1.5 + 0.5 });
    }

    const PLAYER_W = 28;
    const PLAYER_H = 36;
    const PLAYER_Y = LOGICAL_H - 100;
    const OBS_COLORS = ['#ef4444', '#f97316', '#eab308', '#ec4899', '#8b5cf6'];

    const spawnObstacle = () => {
      const w = 28 + Math.random() * 70;
      const x = 20 + Math.random() * (LOGICAL_W - w - 40);
      const h = 18 + Math.random() * 20;
      const color = OBS_COLORS[Math.floor(Math.random() * OBS_COLORS.length)];
      obstacles.push({ x, y: -h - 10, w, h, color });
    };

    const triggerDeath = () => {
      if (state !== 'playing') return;
      state = 'dead';
      shakeDuration = 20;
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: playerX, y: PLAYER_Y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 2,
          life: 1
        });
      }
      ctx.events.onGameOver({ score });
    };

    const drawShip = (x: number, y: number) => {
      // Engine glow
      const glow = gCtx.createRadialGradient(x, y + PLAYER_H / 2, 2, x, y + PLAYER_H / 2, 20);
      glow.addColorStop(0, 'rgba(99,102,241,0.8)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      gCtx.fillStyle = glow;
      gCtx.fillRect(x - 20, y - 10, 40, 40);

      // Thruster flames
      const flameH = 10 + Math.sin(animT * 20) * 4;
      gCtx.fillStyle = '#f97316';
      gCtx.beginPath();
      gCtx.moveTo(x - 7, y + PLAYER_H / 2);
      gCtx.lineTo(x, y + PLAYER_H / 2 + flameH);
      gCtx.lineTo(x + 7, y + PLAYER_H / 2);
      gCtx.fill();

      // Body
      gCtx.fillStyle = '#6366f1';
      gCtx.beginPath();
      gCtx.moveTo(x, y - PLAYER_H / 2);
      gCtx.lineTo(x - PLAYER_W / 2, y + PLAYER_H / 2);
      gCtx.lineTo(x + PLAYER_W / 2, y + PLAYER_H / 2);
      gCtx.closePath();
      gCtx.fill();

      // Wing highlights
      gCtx.strokeStyle = '#818cf8';
      gCtx.lineWidth = 2;
      gCtx.stroke();
    };

    const draw = () => {
      const sx = shakeDuration > 0 ? (Math.random() - 0.5) * 6 : 0;
      const sy = shakeDuration > 0 ? (Math.random() - 0.5) * 6 : 0;

      gCtx.save();
      gCtx.translate(sx, sy);

      // Background
      const bg = gCtx.createLinearGradient(0, 0, 0, LOGICAL_H);
      bg.addColorStop(0, '#09090b');
      bg.addColorStop(1, '#18181b');
      gCtx.fillStyle = bg;
      gCtx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      // Stars
      stars.forEach(s => {
        gCtx.beginPath();
        gCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        gCtx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(animT + s.x * 0.1) * 0.3})`;
        gCtx.fill();
      });

      // Lane guides
      gCtx.strokeStyle = 'rgba(255,255,255,0.03)';
      gCtx.lineWidth = 1;
      for (let x = 80; x < LOGICAL_W; x += 80) {
        gCtx.beginPath();
        gCtx.moveTo(x, 0);
        gCtx.lineTo(x, LOGICAL_H);
        gCtx.stroke();
      }

      // Obstacles
      obstacles.forEach(o => {
        // Shadow
        gCtx.fillStyle = 'rgba(0,0,0,0.4)';
        gCtx.fillRect(o.x + 4, o.y + 4, o.w, o.h);

        // Body
        gCtx.fillStyle = o.color;
        gCtx.beginPath();
        (gCtx as CanvasRenderingContext2D).roundRect?.(o.x, o.y, o.w, o.h, 6);
        gCtx.fill();

        // Highlight
        gCtx.fillStyle = 'rgba(255,255,255,0.2)';
        gCtx.fillRect(o.x + 4, o.y + 2, o.w - 8, 3);
      });

      // Player
      if (state !== 'dead') {
        drawShip(playerX, PLAYER_Y);
      }

      // Particles
      particles.forEach(p => {
        gCtx.globalAlpha = p.life;
        gCtx.beginPath();
        gCtx.arc(p.x, p.y, 5 * p.life, 0, Math.PI * 2);
        gCtx.fillStyle = '#6366f1';
        gCtx.fill();
      });
      gCtx.globalAlpha = 1;

      // Score
      if (state === 'playing') {
        gCtx.fillStyle = 'rgba(255,255,255,0.8)';
        gCtx.font = 'bold 18px sans-serif';
        gCtx.textAlign = 'right';
        gCtx.fillText(`${score}`, LOGICAL_W - 20, 40);
        // Speed indicator
        gCtx.fillStyle = 'rgba(255,255,255,0.3)';
        gCtx.font = '12px sans-serif';
        gCtx.fillText(`× ${speed.toFixed(1)}`, LOGICAL_W - 20, 58);
      }

      if (state === 'idle') {
        gCtx.fillStyle = 'rgba(0,0,0,0.6)';
        gCtx.beginPath();
        (gCtx as CanvasRenderingContext2D).roundRect?.(LOGICAL_W / 2 - 110, LOGICAL_H / 2 - 55, 220, 100, 12);
        gCtx.fill();
        gCtx.fillStyle = '#fff';
        gCtx.font = 'bold 22px sans-serif';
        gCtx.textAlign = 'center';
        gCtx.fillText('Dodge Rush', LOGICAL_W / 2, LOGICAL_H / 2 - 20);
        gCtx.fillStyle = 'rgba(255,255,255,0.6)';
        gCtx.font = '14px sans-serif';
        gCtx.fillText('Drag or arrow keys to dodge', LOGICAL_W / 2, LOGICAL_H / 2 + 20);
      }

      gCtx.restore();
    };

    const update = (delta: number) => {
      ctx.input.update();
      animT += 0.016;

      if (shakeDuration > 0) shakeDuration--;

      if (state === 'idle') {
        // Idle ship bob
        const t = animT;
        const bx = LOGICAL_W / 2 + Math.sin(t) * 20;
        playerX = playerX + (bx - playerX) * 0.05;
        if (ctx.input.isPointerDown || ctx.input.isKeyDown('ArrowLeft') || ctx.input.isKeyDown('ArrowRight') || ctx.input.isPointerJustDown) {
          state = 'playing';
          elapsed = 0;
          score = 0;
          speed = startSpeed;
          obstacles = [];
          nextSpawn = 60;
        }
        return;
      }

      if (state === 'dead') {
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.04; });
        particles = particles.filter(p => p.life > 0);
        return;
      }

      // Playing
      elapsed += delta;
      speed = startSpeed + (elapsed / 1000) * accel * 10;
      score = Math.floor(elapsed / 10);
      ctx.events.onScore(score);

      // Move player
      const moveSpd = 7 * (delta / 16.6);
      if (ctx.input.isPointerDown) {
        const tx = ctx.input.pointerX;
        playerX += (tx - playerX) * 0.18;
      }
      if (ctx.input.isKeyDown('ArrowLeft') || ctx.input.isKeyDown('a') || ctx.input.isKeyDown('A')) playerX -= moveSpd;
      if (ctx.input.isKeyDown('ArrowRight') || ctx.input.isKeyDown('d') || ctx.input.isKeyDown('D')) playerX += moveSpd;
      playerX = Math.max(PLAYER_W / 2 + 10, Math.min(LOGICAL_W - PLAYER_W / 2 - 10, playerX));

      // Move stars (parallax)
      stars.forEach(s => {
        s.y += s.spd * (delta / 16.6) * 0.5;
        if (s.y > LOGICAL_H) s.y = -2;
      });

      // Spawn obstacles
      nextSpawn -= delta / 16.6;
      if (nextSpawn <= 0) {
        spawnObstacle();
        nextSpawn = Math.max(20, 80 - speed * 4);
      }

      // Move obstacles
      const obsSpeed = speed * (delta / 16.6);
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.y += obsSpeed;
        if (o.y > LOGICAL_H + 50) {
          obstacles.splice(i, 1);
          continue;
        }
        // Collision: rect vs rect
        const px = playerX - PLAYER_W / 2;
        const py = PLAYER_Y - PLAYER_H / 2;
        if (px < o.x + o.w && px + PLAYER_W > o.x && py < o.y + o.h && py + PLAYER_H > o.y) {
          triggerDeath();
          return;
        }
      }

      particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.04; });
      particles = particles.filter(p => p.life > 0);
    };

    const loop = createGameLoop(update, draw);

    return {
      initialize: () => { resize(); draw(); },
      start: () => { state = 'idle'; loop.start(); },
      pause: () => loop.stop(),
      resume: () => { resize(); loop.start(); },
      restart: () => {
        state = 'idle'; playerX = LOGICAL_W / 2; score = 0; elapsed = 0;
        speed = startSpeed; obstacles = []; particles = []; nextSpawn = 60;
        loop.start();
      },
      destroy: () => { loop.stop(); ctx.input.cleanup(); },
      resize: () => resize(),
    };
  }
};

export default DodgeRush;
