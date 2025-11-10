import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState, PlayerState, Collectible, Vector2, UpgradeId, Quest, Zone, House, WaterBody, Bridge } from '../types';
import {
  GAME_WORLD_SIZE, KIOSK_POSITION, KIOSK_INTERACTION_RADIUS, PLAYER_BASE_SPEED, BASE_INVENTORY_CAP,
  PLAYER_RADIUS, COLLECTIBLE_RADIUS, COLLECTIBLE_LIFESPAN, COLLECTIBLE_VALUE, ZONES, UPGRADES, QUESTS,
  HOME_POSITION, HOUSES, WATER_BODIES, BRIDGES, LANDMARKS, CAN_IMAGE_URLS,
} from '../constants';
import { audioService } from '../services/audioService';
import { saveService } from '../services/saveService';

// --- Geometry Utilities ---
const isPointInPolygon = (point: Vector2, polygon: Vector2[]): boolean => {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
};

const isPointInRect = (point: Vector2, rect: [number, number, number, number]): boolean => {
    const [x, y, w, h] = rect;
    return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
};

const isPointInWater = (point: Vector2, waterBodies: WaterBody[]): boolean => {
    return waterBodies.some(wb => isPointInPolygon(point, wb.polygon));
};

const isPointOnBridge = (point: Vector2, bridges: Bridge[]): boolean => {
    return bridges.some(b => isPointInRect(point, b.rect));
};


const getInitialPlayerState = (): PlayerState => ({
  position: HOME_POSITION,
  targetPosition: null,
  speed: PLAYER_BASE_SPEED,
  inventory: [],
  inventoryCap: BASE_INVENTORY_CAP,
  money: 0,
  upgrades: new Set(),
  hasCollectedFirstCan: false,
});

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = saveService.loadGame();
    const playerState = saved ? { ...getInitialPlayerState(), ...saved.player, upgrades: new Set(Array.from(saved.player.upgrades)), hasCollectedFirstCan: saved.player.hasCollectedFirstCan || false } : getInitialPlayerState();
    return {
      player: playerState,
      collectibles: saved?.collectibles || [],
      kiosk: KIOSK_POSITION,
      isPlayerNearKiosk: false,
      zones: ZONES,
      houses: HOUSES,
      waterBodies: WATER_BODIES,
      bridges: BRIDGES,
      landmarks: LANDMARKS,
      camera: { ...playerState.position },
      gameTime: saved?.gameTime || 0,
      activeQuest: saved?.activeQuest || { ...QUESTS[0], progress: 0 },
      lastSellTime: saved?.lastSellTime || 0,
      flyingCans: [],
      flyingCanIdCounter: 0,
    };
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const gameLoopRef = useRef<number | null>(null);
  const collectibleIdCounter = useRef(Math.max(0, ...gameState.collectibles.map(c => c.id)) + 1);

  const setToast = (message: string, duration: number = 3000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  };

  const clearToast = () => setToastMessage(null);

  const panCamera = useCallback((delta: Vector2) => {
    setGameState(prev => ({
      ...prev,
      camera: {
        x: Math.max(0, Math.min(GAME_WORLD_SIZE.width, prev.camera.x + delta.x)),
        y: Math.max(0, Math.min(GAME_WORLD_SIZE.height, prev.camera.y + delta.y)),
      }
    }));
  }, []);

  const gameLoop = useCallback((time: number) => {
    const deltaTime = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    setGameState(prev => {
      let newState = { ...prev, gameTime: prev.gameTime + deltaTime * 1000 };
      
      // Update Player
      const { player } = newState;
      if (player.targetPosition) {
        const dx = player.targetPosition.x - player.position.x;
        const dy = player.targetPosition.y - player.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.speed * deltaTime) {
          player.position = { ...player.targetPosition };
          player.targetPosition = null;
        } else {
          player.position.x += (dx / distance) * player.speed * deltaTime;
          player.position.y += (dy / distance) * player.speed * deltaTime;
        }
      }

      // Update Camera to follow player smoothly
      const camDx = player.position.x - newState.camera.x;
      const camDy = player.position.y - newState.camera.y;
      newState.camera.x += camDx * 0.3;
      newState.camera.y += camDy * 0.3;

      // Spawner logic
      if (Math.random() < 0.21) {
          const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
          if (Math.random() < zone.spawnMultiplier * 0.15) {
              const [zx, zy, zw, zh] = zone.rect;
              const position = { x: zx + Math.random() * zw, y: zy + Math.random() * zh };
              if (!isPointInWater(position, newState.waterBodies)) {
                const type = Math.random() < 0.7 ? 'can' : 'bottle';
                const imageUrl = CAN_IMAGE_URLS[Math.floor(Math.random() * CAN_IMAGE_URLS.length)];

                newState.collectibles.push({
                    id: collectibleIdCounter.current++,
                    type,
                    emoji: '🥫',
                    position,
                    spawnTime: newState.gameTime,
                    imageUrl,
                });
              }
          }
      }

      // Spawn recycling bins near houses
      if (Math.random() < 0.005) {
          const house = HOUSES[Math.floor(Math.random() * HOUSES.length)];
          const isBinAlreadyThere = newState.collectibles.some(c =>
              c.type === 'bin' &&
              Math.sqrt(Math.pow(c.position.x - house.position.x, 2) + Math.pow(c.position.y - house.position.y, 2)) < 100
          );
          if (!isBinAlreadyThere) {
              const position = {
                  x: house.position.x + (Math.random() - 0.5) * 60 + 30,
                  y: house.position.y + (Math.random() - 0.5) * 60 + 30,
              };
              if (!isPointInWater(position, newState.waterBodies)) {
                newState.collectibles.push({
                    id: collectibleIdCounter.current++,
                    type: 'bin',
                    emoji: '♻️',
                    position,
                    spawnTime: newState.gameTime,
                });
              }
          }
      }

      // O-train card special spawn
      if (player.upgrades.has('otrain') && Math.random() < 0.0005) {
        const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
        const [zx, zy, zw, zh] = zone.rect;
        for (let i = 0; i < 5 + Math.floor(Math.random() * 5); i++) {
           const position = { x: zx + Math.random() * zw, y: zy + Math.random() * zh };
           if (!isPointInWater(position, newState.waterBodies)) {
                const type = Math.random() < 0.7 ? 'can' : 'bottle';
                const imageUrl = CAN_IMAGE_URLS[Math.floor(Math.random() * CAN_IMAGE_URLS.length)];
                newState.collectibles.push({ 
                    id: collectibleIdCounter.current++, 
                    type, 
                    emoji: '🥫', 
                    position, 
                    spawnTime: newState.gameTime,
                    imageUrl,
                });
           }
        }
        setToast("O-Train Pass triggered a multi-spawn!", 3000);
        audioService.playTrainDing();
      }


      // Update Collectibles (check collision and lifespan)
      const collectedToday: {collectible: Collectible, zone: Zone | undefined}[] = [];
      const binsToExplode: Collectible[] = [];
      const remainingCollectibles = newState.collectibles.filter(c => {
        const dx = c.position.x - player.position.x;
        const dy = c.position.y - player.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < PLAYER_RADIUS + COLLECTIBLE_RADIUS) {
          if (c.type === 'bin') {
            binsToExplode.push(c);
            return false; // Remove bin
          }
          if (player.inventory.length < player.inventoryCap) {
            const zone = ZONES.find(z => isPointInRect(c.position, z.rect));
            collectedToday.push({collectible: c, zone});
            return false; // Remove can/bottle
          }
        }
        return newState.gameTime - c.spawnTime < COLLECTIBLE_LIFESPAN;
      });

      if (binsToExplode.length > 0) {
        binsToExplode.forEach(bin => {
            audioService.playPickupSound();
            const numToSpawn = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numToSpawn; i++) {
                const position = {
                    x: bin.position.x + (Math.random() - 0.5) * 50,
                    y: bin.position.y + (Math.random() - 0.5) * 50,
                };
                if (!isPointInWater(position, newState.waterBodies)) {
                    const type = Math.random() < 0.7 ? 'can' : 'bottle';
                    const imageUrl = CAN_IMAGE_URLS[Math.floor(Math.random() * CAN_IMAGE_URLS.length)];
                    remainingCollectibles.push({
                        id: collectibleIdCounter.current++,
                        type,
                        emoji: '🥫',
                        position,
                        spawnTime: newState.gameTime,
                        imageUrl,
                    });
                }
            }
        });
      }

      if(collectedToday.length > 0) {
        if (!player.hasCollectedFirstCan) {
          player.hasCollectedFirstCan = true;
        }
        player.inventory.push(...collectedToday.map(c => c.collectible));
        if (typeof navigator.vibrate === 'function') navigator.vibrate(50);
        audioService.playPickupSound();

        if (newState.activeQuest) {
            let progressIncrement = 0;
            if (newState.activeQuest.targetZone) {
                progressIncrement = collectedToday.filter(c => c.zone?.name === newState.activeQuest?.targetZone).length;
            } else if (newState.activeQuest.id === 4) {
                 newState.activeQuest.progress = player.money;
            } else {
                progressIncrement = collectedToday.length;
            }
            newState.activeQuest.progress += progressIncrement;

            if (newState.activeQuest.progress >= newState.activeQuest.targetCount) {
                setToast(`Quest Complete! +$${newState.activeQuest.reward.toFixed(2)}`, 5000);
                player.money += newState.activeQuest.reward;
                const nextQuestIndex = (newState.activeQuest.id % QUESTS.length);
                newState.activeQuest = { ...QUESTS[nextQuestIndex], progress: 0};
            }
        }
      }
      newState.collectibles = remainingCollectibles;

      const distToKiosk = Math.sqrt(Math.pow(player.position.x - KIOSK_POSITION.x, 2) + Math.pow(player.position.y - KIOSK_POSITION.y, 2));
      newState.isPlayerNearKiosk = distToKiosk < KIOSK_INTERACTION_RADIUS;
      
      const SELL_INTERVAL = 100; // ms
      if (newState.isPlayerNearKiosk && player.inventory.length > 0 && newState.gameTime - (newState.lastSellTime || 0) > SELL_INTERVAL) {
        const soldItem = player.inventory.pop();
        
        if (soldItem) {
          const valuePerItem = player.upgrades.has('vest') ? COLLECTIBLE_VALUE * 1.1 : COLLECTIBLE_VALUE;
          player.money += valuePerItem;
          newState.lastSellTime = newState.gameTime;
          
          newState.flyingCans.push({
            id: newState.flyingCanIdCounter++,
            start: { ...player.position },
            end: KIOSK_POSITION,
            progress: 0,
            imageUrl: soldItem.imageUrl,
            emoji: soldItem.emoji,
          });

          audioService.playSingleSellPop();
        }
      }
      
      const FLYING_CAN_SPEED = 0.8; // progress per second
      newState.flyingCans = newState.flyingCans.map(can => ({
          ...can,
          progress: can.progress + FLYING_CAN_SPEED * deltaTime,
      })).filter(can => can.progress < 1);

      return newState;
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    audioService.init();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
        setGameState(prev => {
            saveService.saveGame(prev);
            return prev;
        });
    }, 5000);
    return () => clearInterval(saveInterval);
  }, []);


  const setTargetPosition = useCallback((position: Vector2) => {
    setGameState(prev => {
      const onBridge = isPointOnBridge(position, prev.bridges);
      if (isPointInWater(position, prev.waterBodies) && !onBridge) {
        return prev; // Invalid target, do nothing
      }

      return {
        ...prev,
        player: {
          ...prev.player,
          targetPosition: { ...position }
        }
      };
    });
  }, []);

  const buyUpgrade = (upgradeId: UpgradeId) => {
    const upgrade = UPGRADES[upgradeId];
    if (!upgrade) return;

    setGameState(prev => {
      if (prev.player.money >= upgrade.cost && !prev.player.upgrades.has(upgradeId)) {
        const updatedStats = upgrade.apply(prev.player);
        audioService.playUpgradeSound();
        setToast(`Purchased: ${upgrade.name}!`, 3000);
        const newUpgrades = new Set(prev.player.upgrades);
        newUpgrades.add(upgradeId);

        return {
          ...prev,
          player: {
            ...prev.player,
            ...updatedStats,
            money: prev.player.money - upgrade.cost,
            upgrades: newUpgrades,
          }
        };
      } else if (prev.player.upgrades.has(upgradeId)) {
          setToast(`Already purchased!`, 2000);
      } else {
          setToast(`Not enough money!`, 2000);
      }
      return prev;
    });
  };
  
  const resetSave = () => {
    saveService.clearSave();
    const initialPlayer = getInitialPlayerState();
    setGameState({
      player: initialPlayer,
      collectibles: [],
      kiosk: KIOSK_POSITION,
      isPlayerNearKiosk: false,
      zones: ZONES,
      houses: HOUSES,
      waterBodies: WATER_BODIES,
      bridges: BRIDGES,
      landmarks: LANDMARKS,
      camera: { ...initialPlayer.position },
      gameTime: 0,
      activeQuest: { ...QUESTS[0], progress: 0 },
      lastSellTime: 0,
      flyingCans: [],
      flyingCanIdCounter: 0,
    });
    setToast("Game progress has been reset.", 3000);
  };


  return { gameState, setTargetPosition, buyUpgrade, panCamera, resetSave, toastMessage, clearToast };
};