import React, { useRef, useEffect, useState } from 'react';
import type { GameState, Vector2 } from '../types.ts';
import { CAN_IMAGE_URLS, GAME_WORLD_SIZE, CRITTER_ATLAS, CRITTER_FPS_IDLE, CRITTER_FPS_WALK } from '../constants.ts';
import { WaterFX } from '../services/waterfx.ts';

interface GameCanvasProps {
  gameState: GameState;
  onSetTargetPosition: (position: Vector2) => void;
  isInventoryFull: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onSetTargetPosition, isInventoryFull }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const waterFxRef = useRef<WaterFX | null>(null);
  const animationFrameRef = useRef(0);
  
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 1 });
  const [allAssetsLoaded, setAllAssetsLoaded] = useState(false);

  useEffect(() => {
    const imagesToLoad = [...CAN_IMAGE_URLS, CRITTER_ATLAS.image];
    let loadedCount = 0;
    setLoadingProgress({ loaded: 0, total: imagesToLoad.length });

    if (imagesToLoad.length === 0) {
        setAllAssetsLoaded(true);
        return;
    }

    const handleImageLoad = () => {
        loadedCount++;
        setLoadingProgress({ loaded: loadedCount, total: imagesToLoad.length });
        if (loadedCount === imagesToLoad.length) {
            setTimeout(() => setAllAssetsLoaded(true), 500); // short delay to see 100%
        }
    };

    imagesToLoad.forEach(url => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => {
            setLoadedImages(prev => ({ ...prev, [url]: img }));
            handleImageLoad();
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${url}`);
            handleImageLoad(); // Still increment count on error to not block loading forever
        };
    });
  }, []);

  if (!waterFxRef.current) {
    waterFxRef.current = new WaterFX(208, true);
  }

  const worldToScreen = (pos: Vector2, camera: Vector2, canvasDim: {width: number, height: number}): Vector2 => ({
    x: pos.x - camera.x + canvasDim.width / 2,
    y: pos.y - camera.y + canvasDim.height / 2,
  });

  const screenToWorld = (pos: Vector2, camera: Vector2, canvasDim: {width: number, height: number}): Vector2 => ({
    x: pos.x + camera.x - canvasDim.width / 2,
    y: pos.y + camera.y - canvasDim.height / 2,
  });

  useEffect(() => {
    const handleResize = () => setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const clickPos = screenToWorld({ x: e.clientX, y: e.clientY }, gameState.camera, canvasSize);
    onSetTargetPosition(clickPos);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const render = (time: number) => {
      ctx.fillStyle = '#a1c099';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const { camera, player, zones, kiosk, activeQuest, waterBodies, bridges, landmarks, foliage, floatingTexts, clickMarkers, critters } = gameState;

      const waterFx = waterFxRef.current!;
      waterBodies.forEach((wb) => waterFx.drawWaterBody(ctx, wb.polygon, camera, canvasSize, time, wb.fill));
      
      // Culling boundaries
      const viewBounds = {
          left: camera.x - canvasSize.width / 2 - 100,
          right: camera.x + canvasSize.width / 2 + 100,
          top: camera.y - canvasSize.height / 2 - 100,
          bottom: camera.y + canvasSize.height / 2 + 100,
      };

      landmarks.forEach((lm) => {
        if (lm.position.x < viewBounds.left || lm.position.x > viewBounds.right || lm.position.y < viewBounds.top || lm.position.y > viewBounds.bottom) return;
        const p = worldToScreen(lm.position, camera, canvasSize);
        if (lm.emoji) { ctx.font = "22px sans-serif"; ctx.fillText(lm.emoji, p.x, p.y); }
        ctx.font = "8pt Arial"; ctx.fillStyle = "white"; ctx.fillText(lm.name, p.x, p.y + (lm.emoji ? 14 : -4));
      });

      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      foliage.forEach(f => {
          if (f.position.x < viewBounds.left || f.position.x > viewBounds.right || f.position.y < viewBounds.top || f.position.y > viewBounds.bottom) return;
          const { x, y } = worldToScreen(f.position, camera, canvasSize);
          ctx.font = f.type === 'tree' ? "26px sans-serif" : "16px sans-serif";
          ctx.fillText(f.emoji, x, y);
      });
      
      const critterImg = loadedImages[CRITTER_ATLAS.image];
      if (critterImg) {
        critters.forEach(c => {
          if (c.pos.x < viewBounds.left || c.pos.x > viewBounds.right || c.pos.y < viewBounds.top || c.pos.y > viewBounds.bottom) return;
          const screenPos = worldToScreen(c.pos, camera, canvasSize);
          const seq = CRITTER_ATLAS.anims[c.anim] || [];
          const fps = c.state === 'WALK' ? CRITTER_FPS_WALK : CRITTER_FPS_IDLE;
          const idx = seq.length ? Math.floor((c.tAnim * fps) % seq.length) : 0;
          const fr = CRITTER_ATLAS.frames[seq[idx]];
          if (!fr) return;
          
          const flip = c.dir < -Math.PI / 2 || c.dir > Math.PI / 2;
          ctx.save();
          ctx.translate(screenPos.x, screenPos.y);
          if (flip) ctx.scale(-1, 1);
          ctx.drawImage(critterImg, fr.x, fr.y, fr.w, fr.h, -fr.w / 2, -fr.h, fr.w, fr.h);
          ctx.restore();
        });
      }

      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";

      gameState.collectibles.forEach(c => {
        if (c.position.x < viewBounds.left || c.position.x > viewBounds.right || c.position.y < viewBounds.top || c.position.y > viewBounds.bottom) return;
        const { x, y } = worldToScreen(c.position, camera, canvasSize);
        const img = c.imageUrl ? loadedImages[c.imageUrl] : null;
        if (img) {
          const drawHeight = 48; const aspectRatio = img.width / img.height; const drawWidth = drawHeight * aspectRatio;
          ctx.drawImage(img, x - drawWidth / 2, y - drawHeight, drawWidth, drawHeight);
        } else {
          ctx.font = "36px sans-serif";
          ctx.fillText(c.type === 'bin' ? '♻️' : '🥫', x, y);
        }
      });
      
      const kioskScreenPos = worldToScreen(kiosk, camera, canvasSize);
      ctx.font = "80px sans-serif"; ctx.fillText("🏪", kioskScreenPos.x, kioskScreenPos.y);

      gameState.houses.forEach(house => {
        if (house.position.x < viewBounds.left || house.position.x > viewBounds.right || house.position.y < viewBounds.top || house.position.y > viewBounds.bottom) return;
        const { x, y } = worldToScreen(house.position, camera, canvasSize);
        ctx.font = "64px sans-serif";
        ctx.fillText("🏠", x, y);
      });

      const playerScreenPos = worldToScreen(player.position, camera, canvasSize);
      ctx.font = "48px sans-serif"; 
      ctx.fillText(player.upgrades.has('bicycle') ? "🚴" : "🧍", playerScreenPos.x, playerScreenPos.y);

      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      floatingTexts.forEach(text => {
          const { x, y } = worldToScreen(text.position, camera, canvasSize);
          ctx.font = "bold 18px sans-serif";
          ctx.fillStyle = `rgba(57, 255, 20, ${text.life})`;
          ctx.strokeStyle = `rgba(0,0,0, ${text.life * 0.8})`;
          ctx.lineWidth = 3;
          ctx.strokeText(text.text, x, y);
          ctx.fillText(text.text, x, y);
      });

      clickMarkers.forEach(marker => {
          const { x, y } = worldToScreen(marker.position, camera, canvasSize);
          const radius = 20 * (1 - marker.life);
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = `rgba(255, 255, 0, ${marker.life})`;
          ctx.lineWidth = 3;
          ctx.stroke();
      });

      ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";

      // Kiosk direction indicator (bottom-left)
      const kioskIndicatorPadding = 30;
      const kioskIndicatorX = kioskIndicatorPadding;
      const kioskIndicatorY = canvasSize.height - kioskIndicatorPadding;
      const angleToKiosk = Math.atan2(kiosk.y - player.position.y, kiosk.x - player.position.x);

      ctx.save();
      ctx.translate(kioskIndicatorX, kioskIndicatorY);
      ctx.rotate(angleToKiosk);
      ctx.font = "24px sans-serif";
      ctx.fillStyle = "rgba(255, 215, 0, 0.8)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.fillText("›", 0, 0);
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    animationFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameState, canvasSize, onSetTargetPosition, isInventoryFull, loadedImages]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute top-0 left-0 w-full h-full cursor-pointer"
        onPointerDown={handlePointerDown}
      />
      {!allAssetsLoaded && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/2 max-w-sm pointer-events-none">
          <p className="text-white text-center text-sm text-outline">Loading Assets...</p>
          <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1 border-2 border-white/50">
            <div 
              className="bg-yellow-400 h-1.5 rounded-full" 
              style={{ width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%`, transition: 'width 0.2s' }}
            ></div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameCanvas;