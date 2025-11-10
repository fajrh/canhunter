import React, { useRef, useEffect, useState } from 'react';
import type { GameState, Collectible, Vector2 } from '../types.ts';
import { PAN_DRAG_THRESHOLD, GAME_WORLD_SIZE, CAN_IMAGE_URLS } from '../constants.ts';
import { WaterFX } from '../services/waterfx.ts';

interface GameCanvasProps {
  gameState: GameState;
  onSetTargetPosition: (position: Vector2) => void;
  onPan: (delta: Vector2) => void;
  isInventoryFull: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onSetTargetPosition, onPan, isInventoryFull }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<Vector2>({ x: 0, y: 0 });
  const lastPanPointRef = useRef<Vector2>({x: 0, y: 0});
  const waterFxRef = useRef<WaterFX | null>(null);
  const animationFrameRef = useRef(0);
  
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: CAN_IMAGE_URLS.length });
  const [isGameReady, setIsGameReady] = useState(false);

  useEffect(() => {
    let loadedCount = 0;
    
    if (CAN_IMAGE_URLS.length === 0) {
        setIsGameReady(true);
        return;
    }

    CAN_IMAGE_URLS.forEach(url => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => {
            loadedCount++;
            setLoadedImages(prev => ({ ...prev, [url]: img }));
            setLoadingProgress({ loaded: loadedCount, total: CAN_IMAGE_URLS.length });
            if (!isGameReady) {
                setIsGameReady(true);
            }
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${url}`);
            loadedCount++; 
            setLoadingProgress({ loaded: loadedCount, total: CAN_IMAGE_URLS.length });
             if (!isGameReady) {
                setIsGameReady(true);
            }
        };
    });
  }, [isGameReady]);

  if (!waterFxRef.current) {
    waterFxRef.current = new WaterFX(208 /*hue*/, true);
  }

  const worldToScreen = (pos: Vector2, camera: Vector2, canvasDim: {width: number, height: number}): Vector2 => {
    return {
      x: pos.x - camera.x + canvasDim.width / 2,
      y: pos.y - camera.y + canvasDim.height / 2,
    };
  };

  const screenToWorld = (pos: Vector2, camera: Vector2, canvasDim: {width: number, height: number}): Vector2 => {
    return {
      x: pos.x + camera.x - canvasDim.width / 2,
      y: pos.y + camera.y - canvasDim.height / 2,
    };
  };

  useEffect(() => {
    const handleResize = () => setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastPanPointRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return;
    const currentPos = { x: e.clientX, y: e.clientY };
    const dist = Math.sqrt(
      Math.pow(currentPos.x - dragStartRef.current.x, 2) +
      Math.pow(currentPos.y - dragStartRef.current.y, 2)
    );
    if (dist > PAN_DRAG_THRESHOLD) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      const delta = {
        x: lastPanPointRef.current.x - currentPos.x,
        y: lastPanPointRef.current.y - currentPos.y
      };
      onPan(delta);
      lastPanPointRef.current = currentPos;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
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

        // Progress bar
        const progress = loadingProgress.total > 0 ? loadingProgress.loaded / loadingProgress.total : 0;
        const barWidth = Math.min(canvas.width * 0.6, 300);
        const barHeight = 20;
        const barX = centerX - barWidth / 2;
        const barY = centerY + 40;

        // Bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Bar progress fill
        ctx.fillStyle = '#48bb78';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Bar border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Loading text
        ctx.fillStyle = 'white';
        ctx.font = '14px "Lucida Console", Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
            `Loading Assets... (${loadingProgress.loaded}/${loadingProgress.total})`,
            centerX,
            barY + barHeight + 20
        );

        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const { camera, player, zones, kiosk, activeQuest, waterBodies, bridges, landmarks } = gameState;

      ctx.strokeStyle = `rgba(80, 80, 80, 1)`;
      ctx.fillStyle = `rgba(120, 120, 120, 1)`;
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      zones.forEach(zone => {
        const [x, y, w, h] = zone.rect;
        const screenPos = worldToScreen({x, y}, camera, canvasSize);
        ctx.strokeRect(screenPos.x, screenPos.y, w, h);
        ctx.fillText(zone.name, screenPos.x + w / 2, screenPos.y + h / 2);
      });

      const waterFx = waterFxRef.current!;
      if (waterBodies?.length) {
        waterBodies.forEach((wb) => {
          waterFx.drawWaterBody(ctx, wb.polygon, camera, canvasSize, time, wb.fill);
        });
      }

      if (bridges) {
        ctx.lineWidth = 12; // Wider for better visual path
        ctx.strokeStyle = '#6b4f3a'; // Brownish
        ctx.fillStyle = '#8d6e63'; // Lighter brown
        bridges.forEach((b) => {
          const [x,y,w,h] = b.rect;
          const screenPos = worldToScreen({x,y}, camera, canvasSize);
          ctx.fillRect(screenPos.x, screenPos.y, w, h);
          ctx.strokeRect(screenPos.x, screenPos.y, w, h);

          ctx.font = "10pt sans-serif";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.fillText(b.name, screenPos.x + w/2, screenPos.y + h/2 + 4);
        });
      }

      if (landmarks) {
        ctx.textAlign = "center";
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = 4;
        landmarks.forEach((lm) => {
          const p = worldToScreen(lm.position, camera, canvasSize);
          if (lm.emoji) {
            ctx.font = "22px sans-serif";
            ctx.fillText(lm.emoji, p.x, p.y);
          }
          ctx.font = "10pt sans-serif";
          ctx.fillStyle = "white";
          ctx.fillText(lm.name, p.x, p.y + (lm.emoji ? 18 : 0));
        });
      }
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Set consistent drawing alignment for all game objects
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      gameState.collectibles.forEach(c => {
        const { x, y } = worldToScreen(c.position, camera, canvasSize);
        if (c.imageUrl && loadedImages[c.imageUrl]) {
          const img = loadedImages[c.imageUrl];
          const drawHeight = 48;
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const drawWidth = drawHeight * aspectRatio;
          ctx.drawImage(
            img,
            x - drawWidth / 2, y - drawHeight, drawWidth, drawHeight
          );
        } else if (c.type === 'bin') {
          ctx.font = "48px sans-serif";
          ctx.fillText('🗑️', x, y);
          ctx.font = "24px sans-serif";
          ctx.fillText('♻️', x, y - 10);
        } else {
          ctx.font = "36px sans-serif";
          ctx.fillText(c.emoji, x, y);
        }
      });
      
      const kioskScreenPos = worldToScreen(kiosk, camera, canvasSize);
      ctx.font = "80px sans-serif";
      ctx.fillText("🏪", kioskScreenPos.x, kioskScreenPos.y);

      ctx.font = "64px sans-serif";
      gameState.houses.forEach(house => {
        const { x, y } = worldToScreen(house.position, camera, canvasSize);
        ctx.fillText("🏠", x, y);
      });

      gameState.flyingCans.forEach(can => {
        const currentPos = {
            x: can.start.x + (can.end.x - can.start.x) * can.progress,
            y: can.start.y + (can.end.y - can.start.y) * can.progress,
        };
        const {x, y} = worldToScreen(currentPos, camera, canvasSize);
        if (can.imageUrl && loadedImages[can.imageUrl]) {
          const img = loadedImages[can.imageUrl];
          const drawHeight = 32;
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const drawWidth = drawHeight * aspectRatio;
          ctx.drawImage(
            img,
            x - drawWidth / 2, y - drawHeight, drawWidth, drawHeight
          );
        } else {
          ctx.font = "24px sans-serif";
          ctx.fillText(can.emoji || "🥫", x, y);
        }
      });

      const playerScreenPos = worldToScreen(player.position, camera, canvasSize);
      ctx.font = "48px sans-serif";
      ctx.fillText("🧍", playerScreenPos.x, playerScreenPos.y);

      // Reset shadow and text alignment for UI elements that might follow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";

      let targetPos: Vector2 | null = null;
      let targetName: string = 'KIOSK';
      
      if (isInventoryFull) {
        targetPos = kiosk;
        targetName = 'KIOSK';
      } else if (activeQuest && activeQuest.targetZone) {
        const targetZone = zones.find(z => z.name === activeQuest.targetZone);
        if (targetZone) {
          const [zx, zy, zw, zh] = targetZone.rect;
          targetPos = { x: zx + zw / 2, y: zy + zh / 2 };
          targetName = activeQuest.targetZone;
        }
      }
      
      if (!targetPos && !isInventoryFull) {
        targetPos = kiosk;
      }

      if (targetPos) {
        const dx = targetPos.x - player.position.x;
        const dy = targetPos.y - player.position.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance > 150) {
          const angle = Math.atan2(dy, dx);
          const anchorX = playerScreenPos.x;
          const anchorY = playerScreenPos.y - 60; // Adjusted for new player anchor

          const shouldBlink = isInventoryFull && Math.floor(time / 500) % 2 === 0;

          if (!shouldBlink) {
            ctx.textAlign = "center";
            ctx.font = "8pt Arial";
            ctx.fillStyle = "yellow";
            ctx.fillText(targetName, anchorX, anchorY - 10);

            ctx.save();
            ctx.translate(anchorX, anchorY);
            ctx.rotate(angle);
            ctx.font = "30px sans-serif";
            ctx.fillStyle = "yellow";
            ctx.fillText("›", 0, 10);
            ctx.restore();
          }
        }
      }

      if (gameState.player.upgrades.has('map')) {
          const mapSize = Math.min(canvasSize.width, canvasSize.height) * 0.2;
          const mapMargin = 16;
          const mapX = canvasSize.width - mapSize - mapMargin;
          const mapY = mapMargin;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
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

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [gameState, canvasSize, onPan, onSetTargetPosition, isInventoryFull, loadedImages, isGameReady, loadingProgress]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      className="absolute top-0 left-0 w-full h-full"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
};

export default GameCanvas;