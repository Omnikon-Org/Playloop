import { InputManager } from './types';

type PointerHandler = (e: PointerEvent) => void;
type TouchHandler = (e: TouchEvent) => void;

export function createInputManager(canvas: HTMLCanvasElement): InputManager {
  let isPointerDown = false;
  let pointerX = 0;
  let pointerY = 0;
  
  let currentPointerJustDown = false;
  let currentPointerJustUp = false;
  let nextPointerJustDown = false;
  let nextPointerJustUp = false;

  const keysDown = new Set<string>();
  const keysPressed = new Set<string>();
  const nextKeysPressed = new Set<string>();

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    pointerX = clientX - rect.left;
    pointerY = clientY - rect.top;
  };

  const handlePointerDown: PointerHandler = (e) => {
    e.preventDefault();
    isPointerDown = true;
    nextPointerJustDown = true;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove: PointerHandler = (e) => {
    e.preventDefault();
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp: PointerHandler = () => {
    isPointerDown = false;
    nextPointerJustUp = true;
  };

  const handleTouchStart: TouchHandler = (e) => {
    e.preventDefault();
    isPointerDown = true;
    nextPointerJustDown = true;
    if (e.touches.length > 0) {
      updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove: TouchHandler = (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd: TouchHandler = (e) => {
    e.preventDefault();
    isPointerDown = false;
    nextPointerJustUp = true;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    keysDown.add(e.key);
    nextKeysPressed.add(e.key);
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keysDown.delete(e.key);
  };

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return {
    get isPointerDown() { return isPointerDown; },
    get pointerX() { return pointerX; },
    get pointerY() { return pointerY; },
    get isPointerJustDown() { return currentPointerJustDown; },
    get isPointerJustUp() { return currentPointerJustUp; },
    isKeyDown: (code: string) => keysDown.has(code),
    isKeyPressed: (code: string) => keysPressed.has(code),
    update: () => {
      currentPointerJustDown = nextPointerJustDown;
      currentPointerJustUp = nextPointerJustUp;
      nextPointerJustDown = false;
      nextPointerJustUp = false;

      keysPressed.clear();
      nextKeysPressed.forEach(k => keysPressed.add(k));
      nextKeysPressed.clear();
    },
    cleanup: () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    }
  };
}
