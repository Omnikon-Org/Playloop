import { useEffect, useRef, useState } from 'react';
import { GameInstance, GameEvents, GameModule } from './types';
import { getGameModuleLoader } from './registry';
import { createInputManager } from './input';
import { useSettingsStore } from '../store/settingsStore';

export function useGameRuntime(
  engineKey: string,
  config: Record<string, unknown>,
  isActive: boolean,
  isPreload: boolean,
  events: GameEvents,
  seed?: number
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [instance, setInstance] = useState<GameInstance | null>(null);
  
  const instanceRef = useRef<GameInstance | null>(null);
  const moduleRef = useRef<GameModule | null>(null);
  const hasStartedRef = useRef(false);
  
  const reducedMotion = useSettingsStore(s => s.reducedMotion);

  useEffect(() => {
    let mounted = true;
    
    async function load() {
      try {
        if (!moduleRef.current) {
          const loader = getGameModuleLoader(engineKey);
          moduleRef.current = await loader();
        }
        
        if (!mounted) return;
        
        if (!instanceRef.current && canvasRef.current && moduleRef.current) {
          const input = createInputManager(canvasRef.current);
          instanceRef.current = moduleRef.current.create({
            canvas: canvasRef.current,
            config,
            events,
            input,
            reducedMotion,
            seed
          });
          
          instanceRef.current.initialize();
          if (mounted) {
            setInstance(instanceRef.current);
            setIsReady(true);
            // If already active when mounted, start immediately
            if (isActive) {
              instanceRef.current.start();
              hasStartedRef.current = true;
            }
          }
        }
      } catch (err) {
        if (mounted) {
          console.error(err);
          setError(err as Error);
          events.onError(err as Error);
        }
      }
    }
    
    if (isPreload || isActive) {
      load();
    }
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineKey, isPreload, isActive]);

  useEffect(() => {
    if (isActive && instanceRef.current && isReady) {
      if (!hasStartedRef.current) {
        instanceRef.current.start();
        hasStartedRef.current = true;
      } else {
        instanceRef.current.resume();
      }
    } else if (!isActive && instanceRef.current) {
      instanceRef.current.pause();
    }
  }, [isActive, isReady]);

  // Handle document visibility
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && instanceRef.current && isActive) {
        instanceRef.current.pause();
      } else if (!document.hidden && instanceRef.current && isActive) {
        instanceRef.current.resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive]);
  
  // Cleanup when no longer active or preloaded
  useEffect(() => {
    if (!isActive && !isPreload) {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
        setInstance(null);
        setIsReady(false);
        hasStartedRef.current = false;
      }
    }
  }, [isActive, isPreload]);

  return {
    canvasRef,
    error,
    isReady,
    instance
  };
}
