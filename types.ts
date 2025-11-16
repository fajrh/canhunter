export interface Vector2 {
  x: number;
  y: number;
}

export interface Zone {
  name: string;
  rect: [number, number, number, number];
  spawnMultiplier: number;
}

export interface House {
  position: Vector2;
}

export type CollectibleType = 'can' | 'bottle' | 'bin';

export interface Collectible {
  id: number;
  type: CollectibleType;
  position: Vector2;
  emoji: string;
  spawnTime: number;
  imageUrl?: string;
}

export type UpgradeId = 'bag' | 'cart' | 'bell' | 'otrain' | 'map' | 'vest' | 'bicycle' | 'bikeTrailer' | 'parka';

export interface Upgrade {
  id: UpgradeId;
  nameKey: string;
  descriptionKey: string;
  cost: number;
  emoji: string;
  requires?: UpgradeId;
  apply: (playerState: PlayerState) => Partial<PlayerState>;
}

export interface Quest {
  id: number;
  descriptionKey: string;
  targetZone: string | null;
  targetCount: number;
  reward: number;
  progress: number;
}

export interface PlayerState {
  position: Vector2;
  targetPosition: Vector2 | null;
  pathQueue: Vector2[];
  speed: number;
  velocity: Vector2;
  inventory: Collectible[];
  inventoryCap: number;
  money: number;
  upgrades: Set<UpgradeId>;
  hasCollectedFirstCan: boolean;
  speedBoostTimer: number;
  collectChain: number;
  lastCollectTime: number;
  hp: number;
  maxHp: number;
  stash: Collectible[];
  stashCap: number;
  isInvulnerable: boolean;
  invulnerableTimer: number;
}

export interface RoadSegment {
  id: string;
  from: Vector2;
  to: Vector2;
  width: number;
}

export type WaterBody = {
  name: string;
  polygon: Vector2[]; // world-space polygon
  fill?: string;      // optional color
};

export type Bridge = {
  name: string;
  nameKey: string;
  from: Vector2;
  to: Vector2;
  rect: [number, number, number, number]; // for collision detection
  repairGag?: boolean;
};

export type Landmark = {
  nameKey: string;
  position: Vector2;
  emoji?: string;
  imageUrl?: string;
};

export interface FlyingCan {
  id: number;
  start: Vector2;
  end: Vector2;
  progress: number;
  imageUrl?: string;
  emoji?: string;
}

export interface Foliage {
    type: 'tree' | 'bush' | 'other';
    position: Vector2;
    emoji: string;
    variant: number;
}

export interface FloatingText {
    id: number;
    text: string;
    position: Vector2;
    life: number; // starts at 1, goes to 0
    color: string;
}

export interface ChatBubble {
    id: number;
    text: string;
    position: Vector2;
    life: number; // duration in seconds
    lines: string[];
    width: number;
    height: number;
}

export interface ClickMarker {
    id: number;
    position: Vector2;
    life: number; // starts at 1, goes to 0
}

export type FrameRect = { x:number; y:number; w:number; h:number };
export type AnimMap = Record<string, string[]>;
export type CritterKind = 'cat' | 'pigeon';
export type CritterState = 'IDLE' | 'WALK';
export interface Critter {
  id: number;
  kind: CritterKind;
  pos: Vector2;
  state: CritterState;
  dir: number;          // radians
  speed: number;        // px/s
  tState: number;       // seconds in current state
  tAnim: number;        // seconds in current anim
  anim: string;         // 'cat_idle' | 'cat_walk' etc.
  bbox: { w:number; h:number };
  nextGoal?: Vector2;
}

export type TrafficVehicleType = 'car' | 'bus';
export interface TrafficVehicle {
    id: number;
    type: TrafficVehicleType;
    position: Vector2;
    speed: number;
    path: Vector2[];
    pathIndex: number;
    emoji: string;
}

export type NPCType = 'security' | 'complainer' | 'general';
export interface NPC {
    id: number;
    type: NPCType;
    position: Vector2;
    emoji: string;
    state: 'idle' | 'chasing';
    timer: number;
    dialogueCooldown: number;
}

export interface Crosswalk {
    position: Vector2;
    rect: [number, number, number, number];
    active: boolean;
    timer: number;
}

export type Language = 'en' | 'fr';

export interface GameState {
  player: PlayerState;
  collectibles: Collectible[];
  refundDepot: Vector2;
  stashHouse: Vector2;
  isPlayerNearDepot: boolean;
  isPlayerNearStash: boolean;
  zones: Zone[];
  camera: Vector2;
  gameTime: number;
  activeQuest: Quest | null;
  houses: House[];
  waterBodies: WaterBody[];
  bridges: Bridge[];
  landmarks: Landmark[];
  lastSellTime: number;
  flyingCans: FlyingCan[];
  flyingCanIdCounter: number;
  foliage: Foliage[];
  floatingTexts: FloatingText[];
  clickMarkers: ClickMarker[];
  critters: Critter[];
  language: Language;
  flashMessageKey: string | null;
  traffic: TrafficVehicle[];
  npcs: NPC[];
  crosswalks: Crosswalk[];
  isWinter: boolean;
  dialogue: ChatBubble[];
  closestBridge: Bridge | null;
}

// Separate state for UI to avoid re-rendering the whole app on every frame
export interface UIState {
    money: number;
    inventoryCount: number;
    inventoryCap: number;
    stashCount: number;
    stashCap: number;
    hp: number;
    maxHp: number;
    activeQuest: Quest | null;
    gameTime: number;
    language: Language;
    flashMessageKey: string | null;
    hasCollectedFirstCan: boolean;
    isInventoryFull: boolean;
    purchasedUpgrades: Set<UpgradeId>;
}
