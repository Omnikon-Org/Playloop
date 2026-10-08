import { GameModule, GameContext, GameInstance } from '../../game-engine/types';
import { createGameLoop } from '../../game-engine/createGameLoop';
import { setupCanvas } from '../../game-engine/canvas';

const LOGICAL_W = 360;
const LOGICAL_H = 640;

type OpMode = 'add' | 'sub' | 'multiply';

interface AnswerBtn { x: number; y: number; w: number; h: number; value: number; idx: number; flashColor?: string; flashTimer: number; }

const MathBlitz: GameModule = {
  create: (ctx: GameContext): GameInstance => {
    const { ctx: gCtx, resize } = setupCanvas(ctx.canvas, LOGICAL_W, LOGICAL_H);

    const timeLimit: number = typeof ctx.config.timeLimit === 'number' ? ctx.config.timeLimit : 30;
    const modes: OpMode[] = Array.isArray(ctx.config.modes) ? ctx.config.modes : ['add', 'sub'];

    type State = 'idle' | 'playing' | 'done';
    let state: State = 'idle';
    let score = 0;
    let timeLeft = timeLimit;
    let streak = 0;
    let maxStreak = 0;
    let multiplier = 1;
    let correct = 0;
    let wrong = 0;
    let question = '';
    let correctAnswer = 0;
    let buttons: AnswerBtn[] = [];
    let bgPulse = 0;
    let lastAnswerCorrect: boolean | null = null;
    let feedbackTimer = 0;

    const BW = 140, BH = 76;
    const BTN_POSITIONS = [
      [20, 380], [200, 380],
      [20, 470], [200, 470],
    ];

    const genQuestion = () => {
      const mode = modes[Math.floor(Math.random() * modes.length)];
      let a: number, b: number;

      if (mode === 'multiply') {
        a = 2 + Math.floor(Math.random() * 11);
        b = 2 + Math.floor(Math.random() * 11);
        correctAnswer = a * b;
        question = `${a} × ${b}`;
      } else if (mode === 'sub') {
        a = 10 + Math.floor(Math.random() * 50);
        b = 1 + Math.floor(Math.random() * (a - 1));
        correctAnswer = a - b;
        question = `${a} − ${b}`;
      } else {
        a = 5 + Math.floor(Math.random() * 60);
        b = 5 + Math.floor(Math.random() * 60);
        correctAnswer = a + b;
        question = `${a} + ${b}`;
      }

      // Build distractors
      const answers: number[] = [correctAnswer];
      while (answers.length < 4) {
        const delta = Math.floor(Math.random() * 15) + 1;
        const fake = correctAnswer + (Math.random() > 0.5 ? delta : -delta);
        if (fake > 0 && fake !== correctAnswer && !answers.includes(fake)) {
          answers.push(fake);
        }
      }
      const shuffled = answers.sort(() => Math.random() - 0.5);

      buttons = shuffled.map((val, i) => ({
        x: BTN_POSITIONS[i][0],
        y: BTN_POSITIONS[i][1],
        w: BW,
        h: BH,
        value: val,
        idx: i,
        flashColor: undefined,
        flashTimer: 0,
      }));
    };

    const handleAnswer = (btn: AnswerBtn) => {
      if (btn.value === correctAnswer) {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
        multiplier = 1 + Math.floor(streak / 5);
        score += 10 * multiplier;
        correct++;
        ctx.events.onScore(score);
        btn.flashColor = '#22c55e';
        btn.flashTimer = 12;
        lastAnswerCorrect = true;
        feedbackTimer = 15;
        bgPulse = 1;
        genQuestion();
      } else {
        streak = 0;
        multiplier = 1;
        wrong++;
        timeLeft = Math.max(0, timeLeft - 2);
        btn.flashColor = '#ef4444';
        btn.flashTimer = 14;
        lastAnswerCorrect = false;
        feedbackTimer = 15;
        bgPulse = -1;
        // Find correct button and flash green
        const correctBtn = buttons.find(b => b.value === correctAnswer);
        if (correctBtn) { correctBtn.flashColor = '#22c55e'; correctBtn.flashTimer = 14; }
        // Delay next question
        setTimeout(() => { if (state === 'playing') genQuestion(); }, 700);
      }
    };

    const drawBtn = (b: AnswerBtn) => {
      let bg = '#1e293b';
      if (b.flashTimer > 0 && b.flashColor) {
        bg = b.flashColor;
      }

      gCtx.fillStyle = bg;
      gCtx.beginPath();
      (gCtx as CanvasRenderingContext2D).roundRect?.(b.x, b.y, b.w, b.h, 14);
      gCtx.fill();

      // Border
      gCtx.strokeStyle = b.flashTimer > 0 && b.flashColor ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)';
      gCtx.lineWidth = 2;
      gCtx.stroke();

      // Highlight strip
      gCtx.fillStyle = 'rgba(255,255,255,0.06)';
      gCtx.fillRect(b.x + 8, b.y + 6, b.w - 16, 8);

      gCtx.fillStyle = '#fff';
      gCtx.font = 'bold 28px sans-serif';
      gCtx.textAlign = 'center';
      gCtx.textBaseline = 'middle';
      gCtx.fillText(b.value.toString(), b.x + b.w / 2, b.y + b.h / 2);
    };

    const draw = () => {
      // Background
      const bgGreen = Math.max(0, bgPulse) * 0.2;
      const bgRed = Math.max(0, -bgPulse) * 0.2;
      const bg = gCtx.createLinearGradient(0, 0, 0, LOGICAL_H);
      bg.addColorStop(0, `rgba(${Math.floor(bgRed * 80)}, ${Math.floor(bgGreen * 80)}, 0, 1)`);
      bg.addColorStop(0, '#0c0a1e');
      bg.addColorStop(1, '#1a1030');
      gCtx.fillStyle = bg;
      gCtx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      if (state === 'idle') {
        gCtx.fillStyle = '#fff';
        gCtx.font = 'bold 28px sans-serif';
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'alphabetic';
        gCtx.fillText('Math Blitz', LOGICAL_W / 2, LOGICAL_H / 2 - 20);
        gCtx.fillStyle = 'rgba(255,255,255,0.5)';
        gCtx.font = '16px sans-serif';
        gCtx.fillText(`${timeLimit}s · solve as many as you can`, LOGICAL_W / 2, LOGICAL_H / 2 + 20);
        gCtx.font = '14px sans-serif';
        gCtx.fillStyle = 'rgba(255,255,255,0.35)';
        gCtx.fillText('Tap to start', LOGICAL_W / 2, LOGICAL_H / 2 + 55);
        return;
      }

      if (state === 'playing') {
        // Timer bar
        const pct = Math.max(0, timeLeft / timeLimit);
        const barColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444';
        gCtx.fillStyle = 'rgba(255,255,255,0.08)';
        gCtx.fillRect(20, 20, LOGICAL_W - 40, 12);
        gCtx.fillStyle = barColor;
        gCtx.beginPath();
        (gCtx as CanvasRenderingContext2D).roundRect?.(20, 20, (LOGICAL_W - 40) * pct, 12, 6);
        gCtx.fill();

        // Time + streak
        gCtx.fillStyle = '#fff';
        gCtx.font = 'bold 15px sans-serif';
        gCtx.textAlign = 'left';
        gCtx.textBaseline = 'alphabetic';
        gCtx.fillText(`${Math.ceil(timeLeft)}s`, 20, 54);
        if (streak > 1) {
          gCtx.fillStyle = '#fbbf24';
          gCtx.textAlign = 'center';
          gCtx.fillText(`🔥 ×${multiplier} streak ${streak}`, LOGICAL_W / 2, 54);
        }
        gCtx.textAlign = 'right';
        gCtx.fillStyle = '#fff';
        gCtx.fillText(`${score}`, LOGICAL_W - 20, 54);

        // Question
        gCtx.fillStyle = '#fff';
        gCtx.font = 'bold 64px sans-serif';
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'middle';
        gCtx.fillText(question, LOGICAL_W / 2, 200);

        // Sub-label
        gCtx.fillStyle = 'rgba(255,255,255,0.4)';
        gCtx.font = '14px sans-serif';
        gCtx.fillText('= ?', LOGICAL_W / 2, 265);

        // Buttons
        gCtx.textBaseline = 'alphabetic';
        buttons.forEach(b => drawBtn(b));

        // Feedback flash
        if (feedbackTimer > 0 && lastAnswerCorrect !== null) {
          gCtx.globalAlpha = feedbackTimer / 15 * 0.3;
          gCtx.fillStyle = lastAnswerCorrect ? '#22c55e' : '#ef4444';
          gCtx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
          gCtx.globalAlpha = 1;
        }
      }
    };

    const update = (delta: number) => {
      ctx.input.update();
      if (bgPulse > 0) bgPulse = Math.max(0, bgPulse - 0.06);
      if (bgPulse < 0) bgPulse = Math.min(0, bgPulse + 0.06);
      if (feedbackTimer > 0) feedbackTimer--;

      buttons.forEach(b => { if (b.flashTimer > 0) b.flashTimer--; });

      if (state === 'idle') {
        if (ctx.input.isPointerJustDown) {
          state = 'playing';
          score = 0; timeLeft = timeLimit; streak = 0; correct = 0; wrong = 0; multiplier = 1; maxStreak = 0;
          genQuestion();
        }
        return;
      }

      if (state === 'playing') {
        timeLeft -= delta / 1000;
        if (timeLeft <= 0) {
          timeLeft = 0;
          state = 'done';
          ctx.events.onGameOver({ score, stats: { correct, wrong, maxStreak } });
          return;
        }

        if (ctx.input.isPointerJustDown) {
          const px = ctx.input.pointerX;
          const py = ctx.input.pointerY;
          for (const b of buttons) {
            if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
              handleAnswer(b);
              break;
            }
          }
        }
        // Keyboard 1-4
        ['1','2','3','4'].forEach((k, i) => {
          if (ctx.input.isKeyPressed(k) && buttons[i]) handleAnswer(buttons[i]);
        });
      }
    };

    const loop = createGameLoop(update, draw);

    return {
      initialize: () => { resize(); draw(); },
      start: () => { state = 'idle'; loop.start(); },
      pause: () => loop.stop(),
      resume: () => { resize(); loop.start(); },
      restart: () => {
        state = 'idle'; score = 0; timeLeft = timeLimit; streak = 0;
        multiplier = 1; correct = 0; wrong = 0; buttons = [];
        loop.start();
      },
      destroy: () => { loop.stop(); ctx.input.cleanup(); },
      resize: () => resize(),
    };
  }
};

export default MathBlitz;
