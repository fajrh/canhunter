

import React, { useRef, useEffect, useState } from 'react';
import type { GameState, Vector2 } from '../types';
// FIX: Import GAME_WORLD_SIZE for minimap calculations.
import { CAN_IMAGE_URLS, GAME_WORLD_SIZE } from '../constants';
import { WaterFX } from '../services/waterfx';

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
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: CAN_IMAGE_URLS.length });
  const [isGameReady, setIsGameReady] = useState(false);

  useEffect(() => {
    const imagesToLoad = [...CAN_IMAGE_URLS];
    let loadedCount = 0;
    
    if (imagesToLoad.length === 0) {
        setIsGameReady(true);
        return;
    }

    const handleImageLoad = (url: string, img: HTMLImageElement) => {
        loadedCount++;
        setLoadedImages(prev => ({ ...prev, [url]: img }));
        setLoadingProgress({ loaded: loadedCount, total: imagesToLoad.length });
        if (loadedCount === imagesToLoad.length) {
            setIsGameReady(true);
        }
    };

    imagesToLoad.forEach(url => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => handleImageLoad(url, img);
        img.onerror = () => {
            console.error(`Failed to load image: ${url}`);
            handleImageLoad(url, img); // Still count it as "loaded" to not block the game
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

      if (!isGameReady) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.save();
        ctx.translate(centerX, centerY);
        const rotation = (time / 500) % (2 * Math.PI);
        ctx.rotate(rotation);
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('♻️', 0, -50);
        ctx.rotate(2 * Math.PI / 3);
        ctx.fillText('♻️', 0, -50);
        ctx.rotate(2 * Math.PI / 3);
        ctx.fillText('♻️', 0, -50);
        ctx.restore();
        const progress = loadingProgress.total > 0 ? loadingProgress.loaded / loadingProgress.total : 0;
        const barWidth = Math.min(canvas.width * 0.6, 300);
        const barHeight = 20;
        const barX = centerX - barWidth / 2;
        const barY = centerY + 40;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#48bb78';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = 'white';
        ctx.font = '14px "Lucida Console", Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Loading Assets... (${loadingProgress.loaded}/${loadingProgress.total})`, centerX, barY + barHeight + 20);
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const { camera, player, zones, kiosk, activeQuest, waterBodies, bridges, landmarks, foliage, floatingTexts, clickMarkers } = gameState;

      // Draw Ground Texture
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      const TILE_SIZE = 40;
      const screenStartX = camera.x - canvasSize.width / 2;
      const screenStartY = camera.y - canvasSize.height / 2;
      for (let y = screenStartY - (screenStartY % TILE_SIZE); y < screenStartY + canvasSize.height + TILE_SIZE; y += TILE_SIZE) {
        for (let x = screenStartX - (screenStartX % TILE_SIZE); x < screenStartX + canvasSize.width + TILE_SIZE; x += TILE_SIZE) {
          if ((Math.floor(x / TILE_SIZE) + Math.floor(y / TILE_SIZE)) % 2 === 0) {
            const screenPos = worldToScreen({x, y}, camera, canvasSize);
            ctx.fillRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
          }
        }
      }

      const waterFx = waterFxRef.current!;
      if (waterBodies?.length) {
        waterBodies.forEach((wb) => waterFx.drawWaterBody(ctx, wb.polygon, camera, canvasSize, time, wb.fill));
      }

      if (bridges) {
        ctx.lineWidth = 12; ctx.strokeStyle = '#6b4f3a'; ctx.fillStyle = '#8d6e63';
        bridges.forEach((b) => {
          const [x,y,w,h] = b.rect;
          const screenPos = worldToScreen({x,y}, camera, canvasSize);
          ctx.fillRect(screenPos.x, screenPos.y, w, h);
          ctx.strokeRect(screenPos.x, screenPos.y, w, h);
        });
      }

      if (landmarks) {
        ctx.textAlign = "center"; ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 4;
        landmarks.forEach((lm) => {
          const p = worldToScreen(lm.position, camera, canvasSize);
          if (lm.emoji) { ctx.font = "22px sans-serif"; ctx.fillText(lm.emoji, p.x, p.y); }
          ctx.font = "8pt Arial"; ctx.fillStyle = "white"; ctx.fillText(lm.name, p.x, p.y + (lm.emoji ? 14 : -4));
        });
      }

      // Draw Foliage
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      foliage.forEach(f => {
          const { x, y } = worldToScreen(f.position, camera, canvasSize);
          if (x < -40 || x > canvasSize.width + 40 || y < -60 || y > canvasSize.height + 40) return;
          ctx.font = f.variant === 1 ? "64px sans-serif" : "40px sans-serif";
          ctx.fillText(f.emoji, x, y);
      });
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";

      gameState.collectibles.forEach(c => {
        const { x, y } = worldToScreen(c.position, camera, canvasSize);
        if (x < -50 || x > canvasSize.width + 50 || y < -50 || y > canvasSize.height + 50) return;
        if (c.imageUrl && loadedImages[c.imageUrl]) {
          const img = loadedImages[c.imageUrl];
          const drawHeight = 48; const aspectRatio = img.naturalWidth / img.naturalHeight; const drawWidth = drawHeight * aspectRatio;
          ctx.drawImage(img, x - drawWidth / 2, y - drawHeight, drawWidth, drawHeight);
        } else if (c.type === 'bin') {
          ctx.font = "48px sans-serif"; ctx.fillText('🗑️', x, y); ctx.font = "24px sans-serif"; ctx.fillText('♻️', x, y - 10);
        } else {
          ctx.font = "36px sans-serif"; ctx.fillText(c.emoji, x, y);
        }
      });
      
      const kioskScreenPos = worldToScreen(kiosk, camera, canvasSize);
      ctx.font = "80px sans-serif"; ctx.fillText("🏪", kioskScreenPos.x, kioskScreenPos.y);

      ctx.font = "64px sans-serif";
      gameState.houses.forEach(house => {
        const { x, y } = worldToScreen(house.position, camera, canvasSize);
        if (x < -50 || x > canvasSize.width + 50 || y < -50 || y > canvasSize.height + 50) return;
        ctx.fillText("🏠", x, y);
      });

      gameState.flyingCans.forEach(can => {
        const currentPos = { x: can.start.x + (can.end.x - can.start.x) * can.progress, y: can.start.y + (can.end.y - can.start.y) * can.progress };
        const {x, y} = worldToScreen(currentPos, camera, canvasSize);
        if (can.imageUrl && loadedImages[can.imageUrl]) {
          const img = loadedImages[can.imageUrl];
          const drawHeight = 32; const aspectRatio = img.naturalWidth / img.naturalHeight; const drawWidth = drawHeight * aspectRatio;
          ctx.drawImage(img, x - drawWidth / 2, y - drawHeight, drawWidth, drawHeight);
        } else {
          ctx.font = "24px sans-serif"; ctx.fillText(can.emoji || "🥫", x, y);
        }
      });

      const playerScreenPos = worldToScreen(player.position, camera, canvasSize);
      ctx.font = "48px sans-serif"; ctx.fillText("🧍", playerScreenPos.x, playerScreenPos.y);

      // --- Draw UI Effects ---
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
      
      floatingTexts.forEach(text => {
          const { x, y } = worldToScreen(text.position, camera, canvasSize);
          ctx.font = "bold 16px Arial";
          ctx.fillStyle = `rgba(57, 255, 20, ${text.life})`;
          ctx.strokeStyle = `rgba(0, 0, 0, ${text.life * 0.7})`;
          ctx.lineWidth = 3;
          ctx.strokeText(text.text, x, y);
          ctx.fillText(text.text, x, y);
      });

      clickMarkers.forEach(marker => {
          const { x, y } = worldToScreen(marker.position, camera, canvasSize);
          const radius = 10 * (1 - marker.life); // Grows from 0 to 10
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = `rgba(255, 255, 255, ${marker.life})`;
          ctx.lineWidth = 2;
          ctx.stroke();
      });

      ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";

      // --- Draw Navigation Arrow ---
      let targetPos: Vector2 | null = isInventoryFull ? kiosk : null;
      let targetName: string = 'KIOSK';
      if (!targetPos && activeQuest?.targetZone) {
        const targetZone = zones.find(z => z.name === activeQuest.targetZone);
        if (targetZone) {
          const [zx, zy, zw, zh] = targetZone.rect;
          targetPos = { x: zx + zw / 2, y: zy + zh / 2 };
          targetName = activeQuest.targetZone;
        }
      }
      
      if (targetPos && Math.hypot(targetPos.x - player.position.x, targetPos.y - player.position.y) > 150) {
        const angle = Math.atan2(targetPos.y - player.position.y, targetPos.x - player.position.x);
        const anchorX = playerScreenPos.x;
        const anchorY = playerScreenPos.y - 60;
        const shouldBlink = isInventoryFull && Math.floor(time / 500) % 2 === 0;
        if (!shouldBlink) {
          ctx.textAlign = "center"; ctx.font = "8pt Arial"; ctx.fillStyle = "yellow";
          ctx.fillText(targetName, anchorX, anchorY - 10);
          ctx.save();
          ctx.translate(anchorX, anchorY); ctx.rotate(angle);
          ctx.font = "30px sans-serif"; ctx.fillStyle = "yellow"; ctx.fillText("›", 15, 10);
          ctx.restore();
        }
      }

      // --- Draw Minimap ---
      if (gameState.player.upgrades.has('map')) {
          const mapSize = Math.min(canvasSize.width, canvasSize.height) * 0.2;
          const mapMargin = 16;
          const mapX = canvasSize.width - mapSize - mapMargin;
          const mapY = mapMargin;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
          ctx.fillRect(mapX, mapY, mapSize, mapSize);
          ctx.strokeRect(mapX, mapY, mapSize, mapSize);
          const scaleX = mapSize / GAME_WORLD_SIZE.width;
          const scaleY = mapSize / GAME_WORLD_SIZE.height;
          ctx.fillStyle = 'cyan';
          ctx.beginPath();
          ctx.arc(mapX + gameState.player.position.x * scaleX, mapY + gameState.player.position.y * scaleY, 3, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = 'yellow';
          ctx.fillRect(mapX + gameState.kiosk.x * scaleX - 3, mapY + gameState.kiosk.y * scaleY - 3, 6, 6);
          ctx.fillStyle = 'lime';
          gameState.collectibles.forEach(c => {
             ctx.fillRect(mapX + c.position.x * scaleX - 1, mapY + c.position.y * scaleY - 1, 2, 2);
          });
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    animationFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameState, canvasSize, onSetTargetPosition, isInventoryFull, loadedImages, isGameReady, loadingProgress]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      className="absolute top-0 left-0 w-full h-full cursor-pointer"
      onPointerDown={handlePointerDown}
    />
  );
};

export default GameCanvas;
