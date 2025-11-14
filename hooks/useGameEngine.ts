import { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import type {
  GameState,
  PlayerState,
  Collectible,
  Vector2,
  UpgradeId,
  Quest,
  Critter,
  CritterKind,
  Bridge,
  FloatingText,
  Language,
  TrafficVehicle,
  NPC,
  ChatBubble,
  NPCType,
  UIState,
  Zone,
} from '../types.ts';
import {
  REFUND_DEPOT_POSITION,
  STASH_HOUSE_POSITION,
  KIOSK_INTERACTION_RADIUS,
  PLAYER_BASE_SPEED,
  BASE_INVENTORY_CAP,
  PLAYER_RADIUS,
  COLLECTIBLE_RADIUS,
  COLLECTIBLE_LIFESPAN,
  COLLECTIBLE_VALUE,
  ZONES,
  UPGRADES,
  QUESTS,
  HOUSES,
  WATER_BODIES,
  BRIDGES,
  LANDMARKS,
  CAN_IMAGE_URLS,
  FOLIAGE,
  MAX_COLLECTIBLES,
  INITIAL_COLLECTIBLE_TARGET,
  isPointInWater,
  CRITTER_SPAWNS,
  QUEBEC_BORDER_Y,
  isInQuebec,
  PLAYER_MAX_HP,
  TRAFFIC_PATHS,
  TRAFFIC_DAMAGE,
  NPC_SPAWNS,
  NPC_SHOVE_DAMAGE,
  CANAL_COLD_DAMAGE,
  CROSSWALKS,
  BARKS_GENERAL,
  BARKS_POLICE,
  BARKS_QC,
  SPEED_BOOST_CHAIN_THRESHOLD,
  SPEED_BOOST_CHAIN_WINDOW,
  SPEED_BOOST_BATCH_TRIGGER,
  SPEED_BOOST_DURATION,
  SPEED_BOOST_MULTIPLIER,
  BRIDGE_APPROACH_DISTANCE,
  BRIDGE_PATH_SAMPLES,
  BRIDGE_SNAP_PADDING,
  GAME_WORLD_SIZE,
} from '../constants.ts';
import { audioService } from '../services/audioService.ts';
import { saveService } from '../services/saveService.ts';

const isPointInRect = (point: Vector2, rect: [number, number, number, number]): boolean => {
  const [x, y, w, h] = rect;
  return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
};

// FIX: Added pointInPoly helper for canal cold damage check.
const pointInPoly = (pt: Vector2, poly: Vector2[]): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;
    const intersect =
      (yi > pt.y) !== (yj > pt.y) &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const isPointOnBridge = (point: Vector2, bridges: Bridge[]): boolean =>
  bridges.some((b) =>
    isPointInRect(point, [
      b.rect[0] - BRIDGE_SNAP_PADDING,
      b.rect[1] - BRIDGE_SNAP_PADDING,
      b.rect[2] + BRIDGE_SNAP_PADDING * 2,
      b.rect[3] + BRIDGE_SNAP_PADDING * 2,
    ]),
  );

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const len = (v: Vector2) => Math.hypot(v.x, v.y);
const norm = (v: Vector2) => {
  const L = len(v) || 1;
  return { x: v.x / L, y: v.y / L };
};
const distance = (a: Vector2, b: Vector2) => Math.hypot(a.x - b.x, a.y - b.y);

const segmentCrossesWater = (start: Vector2, end: Vector2, bridges: Bridge[]): boolean => {
  const steps = Math.max(4, Math.ceil(distance(start, end) / 40), BRIDGE_PATH_SAMPLES);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sample = { x: start.x + dx * t, y: start.y + dy * t };
    if (isPointInWater(sample) && !isPointOnBridge(sample, bridges)) {
      return true;
    }
  }
  return false;
};

const resolvePath = (start: Vector2, destination: Vector2, bridges: Bridge[]): Vector2[] | null => {
  if (isPointInWater(destination) && !isPointOnBridge(destination, bridges)) {
    return null;
  }

  if (!segmentCrossesWater(start, destination, bridges)) {
    return [destination];
  }

  const clampPoint = (point: Vector2): Vector2 => ({
    x: Math.max(0, Math.min(GAME_WORLD_SIZE.width, point.x)),
    y: Math.max(0, Math.min(GAME_WORLD_SIZE.height, point.y)),
  });

  let bestPath: Vector2[] | null = null;
  let bestCost = Infinity;

  bridges.forEach((bridge) => {
    if (bridge.repairGag) return;

    const [bx, by, bw, bh] = bridge.rect;
    const centerX = bx + bw / 2;
    const centerY = by + bh / 2;
    const horizontal = bw >= bh;
    const approachOffset = Math.max(BRIDGE_APPROACH_DISTANCE, Math.max(bw, bh) * 1.5);

    let entry: Vector2;
    let exit: Vector2;
    const midpoint: Vector2 = { x: centerX, y: centerY };

    if (horizontal) {
      const south: Vector2 = clampPoint({ x: centerX, y: by + bh + approachOffset });
      const north: Vector2 = clampPoint({ x: centerX, y: by - approachOffset });
      const startNorth = start.y < centerY;
      const destNorth = destination.y < centerY;
      if (startNorth === destNorth) {
        return;
      }
      entry = startNorth ? north : south;
      exit = destNorth ? north : south;
    } else {
      const east: Vector2 = clampPoint({ x: bx + bw + approachOffset, y: centerY });
      const west: Vector2 = clampPoint({ x: bx - approachOffset, y: centerY });
      const startEast = start.x > centerX;
      const destEast = destination.x > centerX;
      if (startEast === destEast) {
        return;
      }
      entry = startEast ? east : west;
      exit = destEast ? east : west;
    }

    const path = [entry, midpoint, exit, destination];
    let cost = 0;
    let blocked = false;
    let prev = start;
    for (const node of path) {
      if (segmentCrossesWater(prev, node, bridges) && node !== midpoint) {
        blocked = true;
        break;
      }
      cost += distance(prev, node);
      prev = node;
    }

    if (!blocked && cost < bestCost) {
      bestCost = cost;
      bestPath = path;
    }
  });

  return bestPath ? bestPath.map((node) => ({ ...node })) : null;
};

// --- New: path refinement & weighted spawning helpers (codex branch) ---
const refinePathSegments = (start: Vector2, path: Vector2[]): Vector2[] => {
  if (!path.length) return [];
  const refined: Vector2[] = [];
  let cursor = { ...start };
  path.forEach((node) => {
    const dx = node.x - cursor.x;
    const dy = node.y - cursor.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 1) {
      refined.push({ ...node });
    } else {
      const steps = Math.max(1, Math.ceil(dist / 220));
      for (let i = 1; i <= steps; i++) {
        refined.push({
          x: cursor.x + (dx * i) / steps,
          y: cursor.y + (dy * i) / steps,
        });
      }
    }
    cursor = node;
  });
  return refined;
};

const weightedZonePick = (zones: Zone[]): Zone => {
  const weights = zones.map((z) => Math.max(0.1, z.spawnMultiplier));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < zones.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      return zones[i];
    }
  }
  return zones[zones.length - 1];
};

const spawnCollectibleAt = (
  state: GameState,
  position: Vector2,
  idCounter: MutableRefObject<number>,
  spawnTime: number,
) => {
  const collectible: Collectible = {
    id: idCounter.current++,
    type: Math.random() < 0.75 ? 'can' : 'bottle',
    position,
    emoji: '🥫',
    spawnTime,
    imageUrl: CAN_IMAGE_URLS[Math.floor(Math.random() * CAN_IMAGE_URLS.length)],
  };
  state.collectibles.push(collectible);
};

const scatterCollectiblesAround = (
  state: GameState,
  center: Vector2,
  radius: number,
  count: number,
  idCounter: MutableRefObject<number>,
) => {
  let attempts = 0;
  const maxAttempts = count * 12;
  const spawnTime = state.gameTime;
  while (count > 0 && attempts < maxAttempts) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius;
    const candidate = {
      x: center.x + Math.cos(angle) * dist,
      y: center.y + Math.sin(angle) * dist,
    };
    if (
      candidate.x < 0 ||
      candidate.x > GAME_WORLD_SIZE.width ||
      candidate.y < 0 ||
      candidate.y > GAME_WORLD_SIZE.height
    ) {
      continue;
    }
    if (isPointInWater(candidate)) continue;
    spawnCollectibleAt(state, candidate, idCounter, spawnTime);
    count--;
  }
};

const ensureInitialCollectibles = (state: GameState, idCounter: MutableRefObject<number>) => {
  if (state.collectibles.length >= INITIAL_COLLECTIBLE_TARGET) return;

  // A little cluster near player
  scatterCollectiblesAround(state, state.player.position, 320, 24, idCounter);
  scatterCollectiblesAround(
    state,
    { x: state.player.position.x + 260, y: state.player.position.y - 220 },
    360,
    14,
    idCounter,
  );

  // Fill remaining using weighted zones
  const guardLimit = INITIAL_COLLECTIBLE_TARGET * 20;
  let guard = 0;
  while (state.collectibles.length < INITIAL_COLLECTIBLE_TARGET && guard < guardLimit) {
    guard++;
    const zone = weightedZonePick(state.zones);
    const [zx, zy, zw, zh] = zone.rect;
    const candidate = { x: zx + Math.random() * zw, y: zy + Math.random() * zh };
    if (isPointInWater(candidate)) continue;
    spawnCollectibleAt(state, candidate, idCounter, state.gameTime);
  }
};

let critterIdCounter = 0,
  trafficIdCounter = 0,
  npcIdCounter = 0;

const spawnCritter = (kind: CritterKind, pos: Vector2): Critter => ({
  id: critterIdCounter++,
  kind,
  pos: { ...pos },
  state: 'IDLE',
  dir: rand(0, Math.PI * 2),
  speed: kind === 'cat' ? rand(28, 42) : rand(30, 48),
  tState: 0,
  tAnim: 0,
  anim: kind + '_idle',
  bbox: { w: 24, h: 24 },
});

const spawnTraffic = (): TrafficVehicle => {
  const path = [...TRAFFIC_PATHS[Math.floor(Math.random() * TRAFFIC_PATHS.length)]];
  if (Math.random() > 0.5) path.reverse();
  const type = Math.random() > 0.8 ? 'bus' : 'car';
  return {
    id: trafficIdCounter++,
    type,
    position: { ...path[0] },
    speed: rand(60, 90),
    path,
    pathIndex: 1,
    emoji: type === 'bus' ? '🚌' : '🚗',
  };
};

const spawnNpc = (type: NPCType, pos: Vector2): NPC => {
  let emoji = '🧑';
  if (type === 'security') emoji = '👮';
  if (type === 'complainer') emoji = '😠';
  return {
    id: npcIdCounter++,
    type,
    position: pos,
    emoji,
    state: 'idle',
    timer: rand(2, 5),
    dialogueCooldown: 0,
  };
};

const getInitialPlayerState = (): PlayerState => ({
  position: { x: 1750, y: 3850 },
  targetPosition: null,
  pathQueue: [],
  speed: PLAYER_BASE_SPEED,
  velocity: { x: 0, y: 0 },
  inventory: [],
  inventoryCap: BASE_INVENTORY_CAP,
  money: 0,
  upgrades: new Set(),
  hasCollectedFirstCan: false,
  speedBoostTimer: 0,
  collectChain: 0,
  lastCollectTime: 0,
  hp: PLAYER_MAX_HP,
  maxHp: PLAYER_MAX_HP,
  stash: [],
  stashCap: 50,
  isInvulnerable: false,
  invulnerableTimer: 0,
});

// temp canvas for measuring chat bubble text
const tempCtx = document.createElement('canvas').getContext('2d')!;
tempCtx.font = 'bold 8pt Arial';

const calculateBubbleLayout = (
  text: string,
): { lines: string[]; width: number; height: number } => {
  const maxWidth = 150;
  const lineHeight = 12;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];
  let measuredWidth = 0;

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = tempCtx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      measuredWidth = Math.max(measuredWidth, tempCtx.measureText(currentLine).width);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  measuredWidth = Math.max(measuredWidth, tempCtx.measureText(currentLine).width);

  const bubbleWidth = measuredWidth + 20;
  const bubbleHeight = lines.length * lineHeight + 15;
  return { lines, width: bubbleWidth, height: bubbleHeight };
};

export const useGameEngine = () => {
  const gameState = useRef<GameState>(null!);
  const [uiState, setUiState] = useState<UIState>(null!);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const collectibleIdCounter = useRef(1);
  const effectIdCounter = useRef(0);
  const flashMessageTimeoutRef = useRef<number | null>(null);
  const oTrainTickerTimeoutRef = useRef<number | null>(null);

  // Initialize game state (once)
  if (gameState.current === null) {
    const saved = saveService.loadGame();
    const basePlayer = getInitialPlayerState();
    const playerState: PlayerState = saved
      ? {
          ...basePlayer,
          ...saved.player,
          upgrades: new Set(Array.from(saved.player.upgrades)),
          hasCollectedFirstCan: saved.player.hasCollectedFirstCan || false,
        }
      : basePlayer;

    playerState.pathQueue = (playerState.pathQueue || []).map((node) => ({ ...node }));
    playerState.velocity = playerState.velocity ? { ...playerState.velocity } : { x: 0, y: 0 };
    playerState.collectChain = playerState.collectChain || 0;
    playerState.lastCollectTime = playerState.lastCollectTime || 0;
    playerState.speedBoostTimer = playerState.speedBoostTimer || 0;

    collectibleIdCounter.current = saved
      ? Math.max(1, ...saved.collectibles.map((c) => c.id)) + 1
      : 1;

    gameState.current = {
      player: playerState,
      collectibles: saved?.collectibles || [],
      refundDepot: REFUND_DEPOT_POSITION,
      stashHouse: STASH_HOUSE_POSITION,
      isPlayerNearDepot: false,
      isPlayerNearStash: false,
      zones: ZONES,
      houses: HOUSES,
      waterBodies: WATER_BODIES,
      bridges: BRIDGES,
      landmarks: LANDMARKS,
      foliage: FOLIAGE,
      camera: { ...playerState.position },
      gameTime: saved?.gameTime || 0,
      activeQuest: saved?.activeQuest || { ...QUESTS[0], progress: 0 },
      lastSellTime: saved?.lastSellTime || 0,
      flyingCans: [],
      flyingCanIdCounter: 0,
      floatingTexts: [],
      clickMarkers: [],
      critters: CRITTER_SPAWNS.map((c) => spawnCritter(c.kind, c.pos)),
      language: saved?.language || (isInQuebec(playerState.position) ? 'fr' : 'en'),
      flashMessageKey: null,
      traffic: Array.from({ length: 15 }, spawnTraffic),
      npcs: NPC_SPAWNS.map((n) => spawnNpc(n.type, n.pos)),
      crosswalks: CROSSWALKS,
      isCashingOut: false,
      isWinter: true,
      dialogue: [],
      closestBridge: null,
    };

    // Top up initial collectibles if save is empty / light
    if (!saved || (saved.collectibles?.length ?? 0) < INITIAL_COLLECTIBLE_TARGET) {
      ensureInitialCollectibles(gameState.current, collectibleIdCounter);
    }

    setUiState({
      money: playerState.money,
      inventoryCount: playerState.inventory.length,
      inventoryCap: playerState.inventoryCap,
      stashCount: playerState.stash.length,
      stashCap: playerState.stashCap,
      hp: playerState.hp,
      maxHp: playerState.maxHp,
      activeQuest: gameState.current.activeQuest,
      gameTime: gameState.current.gameTime,
      language: gameState.current.language,
      flashMessageKey: null,
      isCashingOut: false,
      hasCollectedFirstCan: playerState.hasCollectedFirstCan,
      isInventoryFull: playerState.inventory.length >= playerState.inventoryCap,
      purchasedUpgrades: playerState.upgrades,
      speedBoostTimer: playerState.speedBoostTimer,
    });
  }

  useEffect(() => {
    if (!oTrainTickerTimeoutRef.current) {
      oTrainTickerTimeoutRef.current = window.setTimeout(() => {
        if (gameState.current) gameState.current.flashMessageKey = 'flash_o_train_ticker';
      }, 30000);
    }
    return () => {
      if (oTrainTickerTimeoutRef.current) clearTimeout(oTrainTickerTimeoutRef.current);
    };
  }, []);

  const setToast = (message: string, duration: number = 3000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  };
  const clearToast = () => setToastMessage(null);

  const gameLoop = useCallback(
    (time: number) => {
      const lastTime = lastTimeRef.current ?? time;
      const deltaTime = Math.min(0.05, (time - lastTime) / 1000);
      lastTimeRef.current = time;

      const state = gameState.current;
      if (!state) return;

      state.gameTime += deltaTime * 1000;
      const { player } = state;

      // Language switch on crossing border
      const prevLanguage = state.language;
      const currentLanguage: Language = isInQuebec(player.position) ? 'fr' : 'en';
      if (currentLanguage !== prevLanguage) {
        state.language = currentLanguage;
        if (currentLanguage === 'fr') {
          audioService.speak('Bienvenue à Québec', 'fr-CA');
          state.flashMessageKey = 'flash_welcome_quebec';
        } else {
          state.flashMessageKey = 'flash_welcome_ontario';
        }
      }

      // --- Player Movement (smoothed click-to-move) ---
      if (!player.targetPosition && player.pathQueue.length > 0) {
        const next = player.pathQueue.shift();
        if (next) {
          player.targetPosition = next;
        }
      }

      const activeSpeed =
        player.speed * (player.speedBoostTimer > 0 ? SPEED_BOOST_MULTIPLIER : 1);
      const prevPos = { ...player.position };
      const velocity = player.velocity;

      if (player.targetPosition) {
        const dx = player.targetPosition.x - player.position.x;
        const dy = player.targetPosition.y - player.position.y;
        const distanceToTarget = Math.hypot(dx, dy);

        if (distanceToTarget < Math.max(4, activeSpeed * deltaTime * 0.9)) {
          player.position = { ...player.targetPosition };
          player.targetPosition = null;
          velocity.x = 0;
          velocity.y = 0;
        } else {
          const desiredVx = (dx / distanceToTarget) * activeSpeed;
          const desiredVy = (dy / distanceToTarget) * activeSpeed;
          const smoothing = 1 - Math.pow(0.001, deltaTime * 12);
          velocity.x += (desiredVx - velocity.x) * smoothing;
          velocity.y += (desiredVy - velocity.y) * smoothing;

          const velocityMag = Math.hypot(velocity.x, velocity.y);
          const maxResponsiveSpeed = activeSpeed * 1.45;
          if (velocityMag > maxResponsiveSpeed) {
            const scale = maxResponsiveSpeed / velocityMag;
            velocity.x *= scale;
            velocity.y *= scale;
          }

          player.position.x += velocity.x * deltaTime;
          player.position.y += velocity.y * deltaTime;
        }
      } else {
        const damping = Math.pow(0.01, deltaTime * 6);
        velocity.x *= damping;
        velocity.y *= damping;
        if (Math.abs(velocity.x) < 0.02) velocity.x = 0;
        if (Math.abs(velocity.y) < 0.02) velocity.y = 0;
        player.position.x += velocity.x * deltaTime;
        player.position.y += velocity.y * deltaTime;
      }

      if (isPointInWater(player.position) && !isPointOnBridge(player.position, state.bridges)) {
        player.position = prevPos;
        player.targetPosition = null;
        player.pathQueue = [];
        velocity.x = 0;
        velocity.y = 0;
      }

      // Pull next path node if we reached one
      if (!player.targetPosition && player.pathQueue.length > 0) {
        const next = player.pathQueue.shift();
        if (next) {
          player.targetPosition = next;
        }
      }

      // Speed boost timers
      if (player.speedBoostTimer > 0) {
        player.speedBoostTimer = Math.max(0, player.speedBoostTimer - deltaTime * 1000);
        if (player.speedBoostTimer === 0) {
          player.collectChain = 0;
        }
      } else if (
        player.collectChain > 0 &&
        state.gameTime - player.lastCollectTime > SPEED_BOOST_CHAIN_WINDOW
      ) {
        player.collectChain = 0;
      }

      // Camera follows player
      state.camera.x += (player.position.x - state.camera.x) * 0.2;
      state.camera.y += (player.position.y - state.camera.y) * 0.2;

      // HP & damage
      if (player.isInvulnerable) {
        player.invulnerableTimer -= deltaTime;
        if (player.invulnerableTimer <= 0) player.isInvulnerable = false;
      } else {
        // Traffic damage
        state.traffic.forEach((t) => {
          if (
            Math.hypot(t.position.x - player.position.x, t.position.y - player.position.y) <
            PLAYER_RADIUS + 20
          ) {
            player.hp = Math.max(0, player.hp - TRAFFIC_DAMAGE);
            player.isInvulnerable = true;
            player.invulnerableTimer = 2;
          }
        });

        // NPC shoves + barks
        state.npcs.forEach((n) => {
          if (
            Math.hypot(n.position.x - player.position.x, n.position.y - player.position.y) <
            PLAYER_RADIUS + 15
          ) {
            player.hp = Math.max(0, player.hp - NPC_SHOVE_DAMAGE);
            player.isInvulnerable = true;
            player.invulnerableTimer = 2;

            if (n.dialogueCooldown <= 0) {
              const isQuebecNpc = isInQuebec(n.position);
              let bark = '';
              if (n.type === 'security')
                bark = BARKS_POLICE[Math.floor(Math.random() * BARKS_POLICE.length)];
              else if (isQuebecNpc)
                bark = BARKS_QC[Math.floor(Math.random() * BARKS_QC.length)];
              else bark = BARKS_GENERAL[Math.floor(Math.random() * BARKS_GENERAL.length)];

              const layout = calculateBubbleLayout(bark);
              state.dialogue.push({
                id: effectIdCounter.current++,
                text: bark,
                position: { ...n.position },
                life: 5,
                ...layout,
              });
              audioService.speak(bark, isQuebecNpc ? 'fr-CA' : 'en-US');
              n.dialogueCooldown = rand(8, 15);
            }
          }
        });

        // Canal cold damage in winter if no parka
        if (
          state.isWinter &&
          !player.upgrades.has('parka') &&
          WATER_BODIES.find(
            (wb) => wb.name === 'Rideau Canal' && pointInPoly(player.position, wb.polygon),
          )
        ) {
          player.hp = Math.max(0, player.hp - CANAL_COLD_DAMAGE * deltaTime);
        }
      }

      if (player.hp <= 0) {
        // Respawn at nearest bridge
        let closestBridge = BRIDGES[0];
        let minD = Infinity;
        BRIDGES.forEach((b) => {
          const d = Math.hypot(b.from.x - player.position.x, b.from.y - player.position.y);
          if (d < minD) {
            minD = d;
            closestBridge = b;
          }
        });
        player.position = { ...closestBridge.from };
        player.targetPosition = null;
        player.hp = PLAYER_MAX_HP;
        player.isInvulnerable = true;
        player.invulnerableTimer = 5;
      }

      // Traffic / NPC / dialogue updates
      state.traffic.forEach((t) => {
        const target = t.path[t.pathIndex];
        const dx = target.x - t.position.x;
        const dy = target.y - t.position.y;
        const dist = Math.hypot(dx, dy);
        if (dist < t.speed * deltaTime) {
          t.position = { ...target };
          t.pathIndex = (t.pathIndex + 1) % t.path.length;
        } else {
          t.position.x += (dx / dist) * t.speed * deltaTime;
          t.position.y += (dy / dist) * t.speed * deltaTime;
        }
      });

      state.crosswalks.forEach((cw) => {
        if (cw.active) {
          cw.timer -= deltaTime;
          if (cw.timer <= 0) cw.active = false;
        }
      });

      state.npcs.forEach((n) => {
        n.timer -= deltaTime;
        if (n.dialogueCooldown > 0) n.dialogueCooldown -= deltaTime;
        if (n.timer <= 0) {
          n.timer = rand(3, 6);
          n.position.x += rand(-50, 50);
          n.position.y += rand(-50, 50);
        }
      });

      state.dialogue = state.dialogue
        .map((d) => ({ ...d, life: d.life - deltaTime }))
        .filter((d) => d.life > 0);

      // Bridge hinting near Ontario/Quebec border
      const BORDER_PROXIMITY = BRIDGE_APPROACH_DISTANCE;
      const isNearBorder =
        (!isInQuebec(player.position) &&
          player.position.y < QUEBEC_BORDER_Y + BORDER_PROXIMITY) ||
        (isInQuebec(player.position) &&
          player.position.y > QUEBEC_BORDER_Y - BORDER_PROXIMITY);

      if (isNearBorder && !isPointOnBridge(player.position, BRIDGES)) {
        let closestBridge: Bridge | null = null;
        let minD = Infinity;
        BRIDGES.forEach((b) => {
          if (b.repairGag) return;
          const midPoint = {
            x: b.rect[0] + b.rect[2] / 2,
            y: b.rect[1] + b.rect[3] / 2,
          };
          const d = Math.hypot(midPoint.x - player.position.x, midPoint.y - player.position.y);
          if (d < minD) {
            minD = d;
            closestBridge = b;
          }
        });
        state.closestBridge = closestBridge;
      } else {
        state.closestBridge = null;
      }

      // --- Spawner ---
      const earlyGameBoost = state.gameTime < 180000 ? 0.7 : 0.5;
      if (state.collectibles.length < MAX_COLLECTIBLES && Math.random() < earlyGameBoost) {
        const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
        const zoneChance = Math.min(
          0.9,
          zone.spawnMultiplier * 0.2 * (state.gameTime < 180000 ? 1.6 : 1),
        );
        if (Math.random() < zoneChance) {
          const [zx, zy, zw, zh] = zone.rect;
          const position = {
            x: zx + Math.random() * zw,
            y: zy + Math.random() * zh,
          };
          if (!isPointInWater(position)) {
            const type = Math.random() < 0.7 ? 'can' : 'bottle';
            const imageUrl =
              CAN_IMAGE_URLS[Math.floor(Math.random() * CAN_IMAGE_URLS.length)];
            state.collectibles.push({
              id: collectibleIdCounter.current++,
              type,
              position,
              emoji: '🥫',
              spawnTime: state.gameTime,
              imageUrl,
            });
          }
        }
      }

      // --- Collectibles ---
      const collectedToday: { collectible: Collectible; zone?: Zone }[] = [];
      state.collectibles = state.collectibles.filter((c) => {
        if (
          Math.hypot(c.position.x - player.position.x, c.position.y - player.position.y) <
          PLAYER_RADIUS + COLLECTIBLE_RADIUS
        ) {
          if (player.inventory.length < player.inventoryCap) {
            const zone = ZONES.find((z) => isPointInRect(c.position, z.rect));
            collectedToday.push({ collectible: c, zone });
            return false;
          }
        }
        return state.gameTime - c.spawnTime < COLLECTIBLE_LIFESPAN;
      });

      if (collectedToday.length > 0) {
        if (!player.hasCollectedFirstCan) player.hasCollectedFirstCan = true;
        player.inventory.push(...collectedToday.map((c) => c.collectible));
        if (typeof navigator.vibrate === 'function') navigator.vibrate(50);
        audioService.playPickupSound();
        const newText: FloatingText = {
          id: effectIdCounter.current++,
          text: `+${(collectedToday.length * COLLECTIBLE_VALUE * 100).toFixed(0)}¢`,
          position: { ...player.position, y: player.position.y - 40 },
          life: 1.0,
          color: '#39FF14',
        };
        state.floatingTexts.push(newText);

        const now = state.gameTime;
        if (now - player.lastCollectTime < SPEED_BOOST_CHAIN_WINDOW) {
          player.collectChain += collectedToday.length;
        } else {
          player.collectChain = collectedToday.length;
        }
        player.lastCollectTime = now;

        if (
          collectedToday.length >= SPEED_BOOST_BATCH_TRIGGER ||
          player.collectChain >= SPEED_BOOST_CHAIN_THRESHOLD
        ) {
          player.speedBoostTimer = SPEED_BOOST_DURATION;
          state.floatingTexts.push({
            id: effectIdCounter.current++,
            text: 'Speed Boost!',
            position: { ...player.position, y: player.position.y - 70 },
            life: 1.2,
            color: '#FFD93D',
          });
          audioService.playBoostSound();
        }

        if (state.activeQuest) {
          const questItems = collectedToday.filter(
            (c) =>
              !state.activeQuest!.targetZone ||
              c.zone?.name === state.activeQuest!.targetZone,
          );
          state.activeQuest.progress += questItems.length;
        }
      }

      // --- Stash / Depot ---
      state.isPlayerNearStash =
        Math.hypot(
          player.position.x - STASH_HOUSE_POSITION.x,
          player.position.y - STASH_HOUSE_POSITION.y,
        ) < KIOSK_INTERACTION_RADIUS;

      if (state.isPlayerNearStash && player.inventory.length > 0) {
        const canMove = player.stashCap - player.stash.length;
        const toMove = player.inventory.splice(0, canMove);
        player.stash.push(...toMove);
        if (toMove.length > 0) audioService.playSingleSellPop();
        if (player.inventory.length > 0) setToast('toast_stash_full');
      }

      state.isPlayerNearDepot =
        Math.hypot(
          player.position.x - REFUND_DEPOT_POSITION.x,
          player.position.y - REFUND_DEPOT_POSITION.y,
        ) < KIOSK_INTERACTION_RADIUS;

      if (
        state.isPlayerNearDepot &&
        (player.inventory.length > 0 || player.stash.length > 0) &&
        !state.isCashingOut
      ) {
        state.isCashingOut = true;
        const totalItems = player.inventory.length + player.stash.length;
        const earnings =
          totalItems * COLLECTIBLE_VALUE * (player.upgrades.has('vest') ? 1.1 : 1);
        player.money += earnings;
        player.inventory = [];
        player.stash = [];
        audioService.playSellSound();
      }

      // Floating texts & click markers
      state.floatingTexts = state.floatingTexts
        .map((t) => ({
          ...t,
          life: t.life - 1.2 * deltaTime,
          position: { x: t.position.x, y: t.position.y - 20 * deltaTime },
        }))
        .filter((t) => t.life > 0);

      state.clickMarkers = state.clickMarkers
        .map((m) => ({ ...m, life: m.life - (1 / 0.2) * deltaTime }))
        .filter((m) => m.life > 0);

      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    },
    [setToast],
  );

  // UI update loop
  useEffect(() => {
    const uiUpdateInterval = setInterval(() => {
      const state = gameState.current;
      if (state) {
        setUiState({
          money: state.player.money,
          inventoryCount: state.player.inventory.length,
          inventoryCap: state.player.inventoryCap,
          stashCount: state.player.stash.length,
          stashCap: state.player.stashCap,
          hp: state.player.hp,
          maxHp: state.player.maxHp,
          activeQuest: state.activeQuest,
          gameTime: state.gameTime,
          language: state.language,
          flashMessageKey: state.flashMessageKey,
          isCashingOut: state.isCashingOut,
          hasCollectedFirstCan: state.player.hasCollectedFirstCan,
          isInventoryFull: state.player.inventory.length >= state.player.inventoryCap,
          purchasedUpgrades: state.player.upgrades,
          speedBoostTimer: state.player.speedBoostTimer,
        });
        if (state.flashMessageKey) {
          if (flashMessageTimeoutRef.current)
            clearTimeout(flashMessageTimeoutRef.current);
          flashMessageTimeoutRef.current = window.setTimeout(() => {
            if (gameState.current) gameState.current.flashMessageKey = null;
          }, 2500);
        }
      }
    }, 100);

    return () => clearInterval(uiUpdateInterval);
  }, []);

  useEffect(() => {
    audioService.init();
    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (gameState.current) saveService.saveGame(gameState.current);
    }, 5000);
    return () => clearInterval(saveInterval);
  }, []);

  const setTargetPosition = useCallback(
    (position: Vector2, isBridgeClick: boolean = false) => {
      const state = gameState.current;
      if (!state) return;

      if (!isBridgeClick) {
        const targetBridge = state.bridges.find(
          (b) => b.repairGag && isPointInRect(position, b.rect),
        );
        if (targetBridge) {
          setToast('toast_detour', 4000);
          return;
        }
      }

      const path = resolvePath(state.player.position, position, state.bridges);
      if (!path || path.length === 0) {
        setToast('toast_need_bridge', 4000);
        return;
      }

      const refinedPath = refinePathSegments(state.player.position, path);
      if (!refinedPath.length) {
        state.player.targetPosition = null;
        state.player.pathQueue = [];
        return;
      }

      const [first, ...rest] = refinedPath;
      state.player.targetPosition = { ...first };
      state.player.pathQueue = rest.map((node) => ({ ...node }));
      state.player.velocity.x = 0;
      state.player.velocity.y = 0;

      state.clickMarkers.push({
        id: effectIdCounter.current++,
        position: { ...position },
        life: 1.0,
      });
    },
    [setToast],
  );

  const buyUpgrade = (upgradeId: UpgradeId) => {
    const upgrade = UPGRADES[upgradeId];
    if (!upgrade) return;
    const { player } = gameState.current;
    if (upgrade.requires && !player.upgrades.has(upgrade.requires)) return;
    if (player.money >= upgrade.cost && !player.upgrades.has(upgradeId)) {
      const updatedStats = upgrade.apply(player);
      Object.assign(player, updatedStats);
      player.money -= upgrade.cost;
      player.upgrades.add(upgradeId);
      audioService.playUpgradeSound();
      setToast('toast_purchased');
    } else if (player.upgrades.has(upgradeId)) setToast('toast_owned');
    else setToast('toast_no_money');
  };

  const resetSave = () => {
    saveService.clearSave();
    window.location.reload();
  };

  const activateCrosswalk = () => {
    const state = gameState.current;
    const nearbyCrosswalk = state.crosswalks.find(
      (cw) =>
        Math.hypot(
          cw.position.x - state.player.position.x,
          cw.position.y - state.player.position.y,
        ) < 80,
    );
    if (nearbyCrosswalk) {
      nearbyCrosswalk.active = true;
      nearbyCrosswalk.timer = 5;
    }
  };

  const endCashingOut = () => {
    if (gameState.current) gameState.current.isCashingOut = false;
  };

  return {
    gameState,
    uiState,
    setTargetPosition,
    buyUpgrade,
    resetSave,
    toastMessage,
    clearToast,
    activateCrosswalk,
    endCashingOut,
  };
};
