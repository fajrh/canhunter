
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

export type UpgradeId = 'bag' | 'cart' | 'bell' | 'otrain' | 'map' | 'vest' | 'bicycle';

export interface Upgrade {
  id: UpgradeId;
  name: string;
  description: string;
  cost: number;
  emoji: string;
  apply: (playerState: PlayerState) => Partial<PlayerState>;
}

export interface Quest {
  id: number;
  description: string;
  targetZone: string | null;
  targetCount: number;
  reward: number;
  progress: number;
}

export interface PlayerState {
  position: Vector2;
  targetPosition: Vector2 | null;
  speed: number;
  inventory: Collectible[];
  inventoryCap: number;
  money: number;
  upgrades: Set<UpgradeId>;
  hasCollectedFirstCan: boolean;
}

export type WaterBody = {
  name: string;
  polygon: Vector2[]; // world-space polygon
  fill?: string;      // optional color
};

export type Bridge = {
  name: string;
  from: Vector2;
  to: Vector2;
  rect: [number, number, number, number]; // for collision detection
};

export type Landmark = {
  name: string;
  position: Vector2;
  emoji?: string;
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
    type: 'tree' | 'bush';
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

export interface ClickMarker {
    id: number;
    position: Vector2;
    life: number; // starts at 1, goes to 0
}

export interface GameState {
  player: PlayerState;
  collectibles: Collectible[];
  kiosk: Vector2;
  isPlayerNearKiosk: boolean;
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
}