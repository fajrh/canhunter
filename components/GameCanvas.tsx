import React, { useRef, useEffect, useState } from 'react';
import type { GameState, Vector2, Bridge, ChatBubble } from '../types.ts';
import { CAN_IMAGE_URLS, GAME_WORLD_SIZE, CRITTER_ATLAS, CRITTER_FPS_IDLE, CRITTER_FPS_WALK, QUEBEC_BORDER_Y, SPEED_BOOST_DURATION } from '../constants.ts';
import { WaterFX } from '../services/waterfx.ts';
import { t } from '../services/localization.ts';

interface GameCanvasProps {
  gameStateRef: React.MutableRefObject<GameState>;
  onSetTargetPosition: (position: Vector2, isBridgeClick?: boolean) => void;
}

const drawChatBubble = (ctx: CanvasRenderingContext2D, bubble: ChatBubble, camera: Vector2, canvasSize: {width:number, height:number}) => {
    const pos = {x: bubble.position.x - camera.x + canvasSize.width/2, y: bubble.position.y - camera.y + canvasSize.height/2};
    
    const bubbleX = pos.x - bubble.width / 2;
    const bubbleY = pos.y - 60 - bubble.height;

    ctx.globalAlpha = Math.min(1, bubble.life * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(bubbleX + 10, bubbleY);
    ctx.lineTo(bubbleX + bubble.width - 10, bubbleY);
    ctx.quadraticCurveTo(bubbleX + bubble.width, bubbleY, bubbleX + bubble.width, bubbleY + 10);
    ctx.lineTo(bubbleX + bubble.width, bubbleY + bubble.height - 10);
    ctx.quadraticCurveTo(bubbleX + bubble.width, bubbleY + bubble.height, bubbleX + bubble.width - 10, bubbleY + bubble.height);
    ctx.lineTo(pos.x + 5, bubbleY + bubble.height);
    ctx.lineTo(pos.x, bubbleY + bubble.height + 10);
    ctx.lineTo(pos.x - 5, bubbleY + bubble.height);
    ctx.lineTo(bubbleX + 10, bubbleY + bubble.height);
    ctx.quadraticCurveTo(bubbleX, bubbleY + bubble.height, bubbleX, bubbleY + bubble.height - 10);
    ctx.lineTo(bubbleX, bubbleY + 10);
    ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + 10, bubbleY);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 8pt Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const lineHeight = 12;
    for (let i = 0; i < bubble.lines.length; i++) {
        ctx.fillText(bubble.lines[i], bubbleX + bubble.width / 2, bubbleY + 10 + i * lineHeight);
    }
    ctx.globalAlpha = 1;
};

const GameCanvas: React.FC<GameCanvasProps> = ({ gameStateRef, onSetTargetPosition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [devicePixelRatio, setDevicePixelRatio] = useState(window.devicePixelRatio || 1);
  const waterFxRef = useRef<WaterFX | null>(null);
  const patternCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const groundPatternRef = useRef<CanvasPattern | null>(null);
  
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 1 });
  const [allAssetsLoaded, setAllAssetsLoaded] = useState(false);

  useEffect(() => {
    const imagesToLoad = [...CAN_IMAGE_URLS, CRITTER_ATLAS.image];
    let loadedCount = 0;
    setLoadingProgress({ loaded: 0, total: imagesToLoad.length });

    if (imagesToLoad.length === 0) { setAllAssetsLoaded(true); return; }

    imagesToLoad.forEach(url => {
        const img = new Image(); img.crossOrigin = "anonymous"; img.src = url;
        img.onload = () => { setLoadedImages(prev => ({ ...prev, [url]: img })); loadedCount++; setLoadingProgress({ loaded: loadedCount, total: imagesToLoad.length }); if (loadedCount === imagesToLoad.length) setTimeout(() => setAllAssetsLoaded(true), 500); };
        img.onerror = () => { console.error(`Failed to load image: ${url}`); loadedCount++; setLoadingProgress({ loaded: loadedCount, total: imagesToLoad.length }); if (loadedCount === imagesToLoad.length) setTimeout(() => setAllAssetsLoaded(true), 500); };
    });
  }, []);

  if (!waterFxRef.current) waterFxRef.current = new WaterFX(208, true);

  const worldToScreen = (pos: Vector2, camera: Vector2, canvasDim: {width: number, height: number}): Vector2 => ({ x: pos.x - camera.x + canvasDim.width / 2, y: pos.y - camera.y + canvasDim.height / 2 });
  const screenToWorld = (pos: Vector2, camera: Vector2, canvasDim: {width: number, height: number}): Vector2 => ({ x: pos.x + camera.x - canvasDim.width / 2, y: pos.y + camera.y - canvasDim.height / 2 });

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };
    window.addEventListener('resize', handleResize);
    const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    const handleDprChange = () => setDevicePixelRatio(window.devicePixelRatio || 1);
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handleDprChange);
    else if (mediaQuery.addListener) mediaQuery.addListener(handleDprChange);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', handleDprChange);
      else if (mediaQuery.removeListener) mediaQuery.removeListener(handleDprChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = devicePixelRatio;
    canvas.width = Math.floor(canvasSize.width * dpr);
    canvas.height = Math.floor(canvasSize.height * dpr);
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
  }, [canvasSize, devicePixelRatio]);
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left ?? 0);
    const y = e.clientY - (rect?.top ?? 0);
    onSetTargetPosition(screenToWorld({ x, y }, gameStateRef.current.camera, canvasSize));
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const ensureGroundPattern = () => {
      if (!patternCanvasRef.current) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = patternCanvas.height = 256;
        const pctx = patternCanvas.getContext('2d');
        if (pctx) {
          const gradient = pctx.createLinearGradient(0, 0, 256, 256);
          gradient.addColorStop(0, '#a7c9a2');
          gradient.addColorStop(1, '#8fb588');
          pctx.fillStyle = gradient;
          pctx.fillRect(0, 0, 256, 256);
          pctx.fillStyle = 'rgba(255,255,255,0.05)';
          for (let i = 0; i < 140; i++) {
            const size = 1 + Math.random() * 3;
            pctx.beginPath();
            pctx.arc(Math.random() * 256, Math.random() * 256, size, 0, Math.PI * 2);
            pctx.fill();
          }
          pctx.strokeStyle = 'rgba(70, 102, 70, 0.15)';
          for (let i = 0; i < 8; i++) {
            pctx.beginPath();
            pctx.moveTo(Math.random() * 256, Math.random() * 256);
            pctx.lineTo(Math.random() * 256, Math.random() * 256);
            pctx.stroke();
          }
        }
        patternCanvasRef.current = patternCanvas;
      }
      if (patternCanvasRef.current && !groundPatternRef.current) {
        groundPatternRef.current = ctx.createPattern(patternCanvasRef.current, 'repeat');
      }
      return groundPatternRef.current;
    };
    let animationFrameId: number;
    
    const render = (time: number) => {
      const gameState = gameStateRef.current;
      if (!gameState) {
          animationFrameId = requestAnimationFrame(render);
          return;
      }
      const { camera, player, refundDepot, stashHouse, waterBodies, bridges, landmarks, foliage, floatingTexts, clickMarkers, critters, language, traffic, npcs, crosswalks, dialogue, closestBridge } = gameState;
      const dpr = devicePixelRatio;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

      const pattern = ensureGroundPattern();
      ctx.fillStyle = pattern || '#a1c099';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      const CULL_MARGIN = 100;
      const viewBounds = { left: camera.x - canvasSize.width/2 - CULL_MARGIN, right: camera.x + canvasSize.width/2 + CULL_MARGIN, top: camera.y - canvasSize.height/2 - CULL_MARGIN, bottom: camera.y + canvasSize.height/2 + CULL_MARGIN };
      
      const waterFx = waterFxRef.current!;
      waterBodies.forEach(wb => {
          waterFx.drawWaterBody(ctx, wb.polygon, camera, canvasSize, time);
      });

      ctx.save();
      const vignette = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
      vignette.addColorStop(0, 'rgba(0,0,0,0.18)');
      vignette.addColorStop(0.3, 'rgba(0,0,0,0)');
      vignette.addColorStop(0.7, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.28)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      ctx.restore();
      
      const borderY = QUEBEC_BORDER_Y;
      if (borderY > viewBounds.top && borderY < viewBounds.bottom) {
        const borderStartScreen = worldToScreen({ x: -100, y: borderY }, camera, canvasSize);
        const borderEndScreen = worldToScreen({ x: GAME_WORLD_SIZE.width + 100, y: borderY }, camera, canvasSize);
        ctx.save(); ctx.beginPath(); ctx.moveTo(borderStartScreen.x, borderStartScreen.y); ctx.lineTo(borderEndScreen.x, borderEndScreen.y); ctx.setLineDash([20, 15]); ctx.lineDashOffset = -(time / 100);
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255, 223, 0, 0.8)'; ctx.shadowColor = 'rgba(255, 223, 0, 1)'; ctx.shadowBlur = 15; ctx.stroke(); ctx.restore();
      }

      // Render bridges
      bridges.forEach(b => {
          const { x, y } = worldToScreen({ x: b.rect[0], y: b.rect[1] }, camera, canvasSize);
          ctx.fillStyle = b.repairGag ? 'rgba(80, 60, 60, 0.8)' : 'rgba(80, 80, 80, 0.8)';
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 2;
          ctx.fillRect(x, y, b.rect[2], b.rect[3]);
          ctx.strokeRect(x, y, b.rect[2], b.rect[3]);
      });

      if (closestBridge) {
          const [bx, by, bw, bh] = closestBridge.rect;
          const topLeft = worldToScreen({ x: bx, y: by }, camera, canvasSize);
          const bottomRight = worldToScreen({ x: bx + bw, y: by + bh }, camera, canvasSize);
          const width = bottomRight.x - topLeft.x;
          const height = bottomRight.y - topLeft.y;
          ctx.save();
          ctx.fillStyle = 'rgba(255, 215, 0, 0.12)';
          ctx.fillRect(topLeft.x, topLeft.y, width, height);
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 6]);
          ctx.strokeRect(topLeft.x, topLeft.y, width, height);
          ctx.restore();

          ctx.save();
          const labelWidth = Math.min(360, canvasSize.width - 40);
          const labelX = (canvasSize.width - labelWidth) / 2;
          const labelY = 20;
          ctx.fillStyle = 'rgba(12, 20, 12, 0.65)';
          ctx.fillRect(labelX, labelY, labelWidth, 48);
          ctx.fillStyle = '#FFE27A';
          ctx.font = '600 16px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const bridgeName = closestBridge.nameKey ? t(closestBridge.nameKey, language) : closestBridge.name;
          ctx.fillText(`${t('bridge_label', language)}: ${bridgeName}`, labelX + labelWidth / 2, labelY + 24);
          ctx.restore();
      }

      crosswalks.forEach(cw => { /* ... crosswalk drawing ... */ });
      
      [...landmarks, ...foliage, ...gameState.collectibles].forEach(obj => {
          if(obj.position.x < viewBounds.left || obj.position.x > viewBounds.right || obj.position.y < viewBounds.top || obj.position.y > viewBounds.bottom) return;
          const { x, y } = worldToScreen(obj.position, camera, canvasSize);
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';

          // FIX: Corrected rendering logic to prioritize images over emojis, and to handle optional emojis safely.
          if ('imageUrl' in obj && obj.imageUrl) {
            const img = loadedImages[obj.imageUrl];
            if (img) {
              const drawHeight = 48; const aspectRatio = img.width / img.height; const drawWidth = drawHeight * aspectRatio;
              ctx.drawImage(img, x - drawWidth / 2, y - drawHeight, drawWidth, drawHeight);
            }
          } else if ('emoji' in obj && obj.emoji) {
            ctx.font = ('type' in obj && obj.type === 'other') ? '24px sans-serif' : '36px sans-serif';
            ctx.fillText(obj.emoji, x, y);
          }

          if ('nameKey' in obj && obj.nameKey) {
            ctx.font = '8pt Arial'; ctx.fillStyle = "white"; ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
            const text = t(obj.nameKey as string, language);
            ctx.strokeText(text, x, y + 14); ctx.fillText(text, x, y + 14);
          }
      });

      const pathTargets: Vector2[] = [];
      if (player.targetPosition) pathTargets.push(player.targetPosition);
      if (player.pathQueue.length) pathTargets.push(...player.pathQueue);
      if (pathTargets.length) {
          const startPos = worldToScreen(player.position, camera, canvasSize);
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 8]);
          ctx.beginPath();
          ctx.moveTo(startPos.x, startPos.y);
          pathTargets.forEach(pt => {
              const p = worldToScreen(pt, camera, canvasSize);
              ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
      }

      [...traffic, ...npcs].forEach(e => {
          if(e.position.x < viewBounds.left || e.position.x > viewBounds.right || e.position.y < viewBounds.top || e.position.y > viewBounds.bottom) return;
          const { x, y } = worldToScreen(e.position, camera, canvasSize);
          ctx.font = "36px sans-serif"; ctx.fillText(e.emoji, x, y);
      });

      const depotScreenPos = worldToScreen(refundDepot, camera, canvasSize);
      ctx.font = "80px sans-serif"; ctx.fillText("🏪", depotScreenPos.x, depotScreenPos.y);
      const stashScreenPos = worldToScreen(stashHouse, camera, canvasSize);
      ctx.font = "80px sans-serif"; ctx.fillText("📦", stashScreenPos.x, stashScreenPos.y);

      gameState.houses.forEach(h => { 
          if(h.position.x < viewBounds.left || h.position.x > viewBounds.right || h.position.y < viewBounds.top || h.position.y > viewBounds.bottom) return;
          const {x,y} = worldToScreen(h.position, camera, canvasSize); ctx.font = "64px sans-serif"; ctx.fillText("🏠", x, y); 
      });
      
      const playerScreenPos = worldToScreen(player.position, camera, canvasSize);
      if (player.speedBoostTimer > 0) {
          const boostRatio = Math.min(1, player.speedBoostTimer / SPEED_BOOST_DURATION);
          ctx.save();
          ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time / 120);
          ctx.fillStyle = 'rgba(255, 224, 102, 0.55)';
          ctx.beginPath();
          ctx.arc(playerScreenPos.x, playerScreenPos.y - 12, 38 + boostRatio * 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
      }
      if (player.isInvulnerable && Math.floor(time / 100) % 2 === 0) { /* don't draw player */ }
      else {
          ctx.font = "48px sans-serif";
          ctx.fillText(player.upgrades.has('bicycle') ? "🚴" : "🧍", playerScreenPos.x, playerScreenPos.y);
          const hpBarWidth = 40; const hpBarHeight = 5;
          const hpBarX = playerScreenPos.x - hpBarWidth / 2; const hpBarY = playerScreenPos.y - 55;
          ctx.fillStyle = '#333'; ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
          ctx.fillStyle = player.hp / player.maxHp > 0.3 ? '#7CFC00' : '#FF4500';
          ctx.fillRect(hpBarX, hpBarY, hpBarWidth * (player.hp / player.maxHp), hpBarHeight);
      }
      
      if (closestBridge) {
          const angle = Math.atan2(closestBridge.from.y - player.position.y, closestBridge.from.x - player.position.x);
          ctx.save();
          ctx.translate(playerScreenPos.x, playerScreenPos.y - 60);
          ctx.rotate(angle + Math.PI / 2);
          ctx.font = "24px sans-serif"; ctx.fillStyle = 'rgba(255, 255, 0, 0.9)'; ctx.textAlign = 'center';
          ctx.fillText('🔽', 0, 0);
          ctx.font = 'bold 10pt Arial';
          ctx.fillText(t('bridge_label', language), 0, 20);
          ctx.restore();
      }

      floatingTexts.forEach(text => {
        const { x, y } = worldToScreen(text.position, camera, canvasSize);
        ctx.save();
        ctx.font = 'bold 18px sans-serif';
        ctx.globalAlpha = Math.max(0, text.life);
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 3;
        ctx.strokeText(text.text, x, y);
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, x, y);
        ctx.restore();
      });
      
      clickMarkers.forEach(marker => {
        const { x, y } = worldToScreen(marker.position, camera, canvasSize);
        ctx.globalAlpha = marker.life;
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        const size = 10;
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      dialogue.forEach(bubble => drawChatBubble(ctx, bubble, camera, canvasSize));

      animationFrameId = requestAnimationFrame(render);
    };
    
    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStateRef, canvasSize, onSetTargetPosition, loadedImages, devicePixelRatio]);

  return (
    <>
      <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="absolute top-0 left-0 w-full h-full cursor-pointer" onPointerDown={handlePointerDown} />
      {!allAssetsLoaded && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/2 max-w-sm pointer-events-none">
          <p className="text-white text-center text-sm text-outline">{t('loading_assets', gameStateRef.current?.language || 'en')}</p>
          <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1 border-2 border-white/50">
            <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%`, transition: 'width 0.2s' }}></div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameCanvas;
