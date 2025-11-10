// constants.ts
import type { Zone, Upgrade, UpgradeId, Quest, PlayerState, House, WaterBody, Bridge, Landmark, Vector2 } from './types';

export const GAME_WORLD_SIZE = { width: 4000, height: 6000 };

// --- Individual Can Sprites ---
export const CAN_IMAGE_URLS = [
  'https://i.ibb.co/B5ZLBVn2/Chat-GPT-Image-Nov-10-2025-08-47-56-AM.png',
  'https://i.ibb.co/xKdvMFnZ/Chat-GPT-Image-Nov-10-2025-08-48-57-AM.png',
  'https://i.ibb.co/4gVTSBFG/Chat-GPT-Image-Nov-10-2025-08-50-44-AM.png',
  'https://i.ibb.co/4gVTSBFG/Chat-GPT-Image-Nov-10-2025-08-50-44-AM.png',
  'https://i.ibb.co/TM2CQ5cQ/Chat-GPT-Image-Nov-10-2025-08-51-45-AM.png',
  'https://i.ibb.co/gLsKPTxn/Chat-GPT-Image-Nov-10-2025-10-03-23-AM.png',
  'https://i.ibb.co/JF8jWx5G/Chat-GPT-Image-Nov-10-2025-10-04-20-AM.png',
  'https://i.ibb.co/63XC9yZ/Chat-GPT-Image-Nov-10-2025-10-06-27-AM.png',
  'https://i.ibb.co/hRpnP926/Chat-GPT-Image-Nov-10-2025-10-07-30-AM.png',
  'https://i.ibb.co/S4pHBS5J/Chat-GPT-Image-Nov-10-2025-10-08-47-AM.png',
];

// --- Gameplay Constants ---
export const PAN_DRAG_THRESHOLD = 5;
export const PLAYER_BASE_SPEED = 200; // pixels per second
export const BASE_INVENTORY_CAP = 20;
export const PLAYER_RADIUS = 40;
export const COLLECTIBLE_RADIUS = 20;
export const COLLECTIBLE_LIFESPAN = 10 * 60 * 1000; // 10 minutes
export const COLLECTIBLE_VALUE = 0.10; // $0.10

// --- World Objects ---
export const HOME_POSITION: Vector2 = { x: 2000, y: 5500 };
export const KIOSK_POSITION: Vector2 = { x: 2000, y: 3000 };
export const KIOSK_INTERACTION_RADIUS = 150;

// --- ZONES (Areas of Ottawa) ---
// rect: [x, y, width, height]
export const ZONES: Zone[] = [
  { name: 'Downtown', rect: [1500, 2500, 1000, 1000], spawnMultiplier: 1.5 },
  { name: 'The Glebe', rect: [1500, 3500, 1000, 1500], spawnMultiplier: 1.2 },
  { name: 'Sandy Hill', rect: [2500, 2500, 1000, 1000], spawnMultiplier: 1.1 },
  { name: 'Hintonburg', rect: [500, 2500, 1000, 1500], spawnMultiplier: 1.0 },
  { name: 'Vanier', rect: [2500, 1500, 1000, 1000], spawnMultiplier: 0.9 },
  { name: 'Westboro', rect: [0, 2500, 500, 1500], spawnMultiplier: 0.8 },
  { name: 'Centretown', rect: [1500, 1500, 1000, 1000], spawnMultiplier: 1.3 },
];

export const WATER_BODIES: WaterBody[] = [
    {
        name: 'Rideau Canal',
        polygon: [
            {x: 1400, y: 0}, {x: 1600, y: 0}, {x: 1600, y: 6000}, {x: 1400, y: 6000}
        ]
    },
    {
        name: 'Ottawa River',
        polygon: [
            {x: 0, y: 0}, {x: 4000, y: 0}, {x: 4000, y: 1200}, {x: 0, y: 1200}
        ]
    }
];

// Helper to check for water collision, used during house generation
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

// Helper function to create neat clusters of houses
const createHouseCluster = (center: Vector2, count: number, radius: number): House[] => {
    const houses: House[] = [];
    for (let i = 0; i < count; i++) {
        // Distribute houses somewhat evenly in a circle with random jitter
        const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.8;
        const distance = radius * (0.6 + Math.random() * 0.4);
        const housePos = {
            x: center.x + Math.cos(angle) * distance,
            y: center.y + Math.sin(angle) * distance,
        };
        // Ensure houses don't spawn in the water
        if (!WATER_BODIES.some(wb => isPointInPolygon(housePos, wb.polygon))) {
             houses.push({ position: housePos });
        }
    }
    return houses;
};


export const HOUSES: House[] = [
    // Glebe Clusters
    ...createHouseCluster({ x: 1800, y: 3700 }, 6, 150),
    ...createHouseCluster({ x: 2100, y: 4000 }, 5, 120),
    ...createHouseCluster({ x: 1750, y: 4400 }, 7, 160),

    // Sandy Hill Clusters
    ...createHouseCluster({ x: 2700, y: 2800 }, 8, 180),
    ...createHouseCluster({ x: 3100, y: 3100 }, 6, 140),

    // Hintonburg Clusters
    ...createHouseCluster({ x: 800, y: 2900 }, 6, 160),
    ...createHouseCluster({ x: 1100, y: 3500 }, 5, 130),

    // Vanier Cluster
    ...createHouseCluster({ x: 3000, y: 1900 }, 9, 200),
];


export const BRIDGES: Bridge[] = [
    { name: 'Corktown Footbridge', from: {x: 1350, y: 2400}, to: {x: 1650, y: 2400}, rect: [1350, 2380, 300, 40] },
    { name: 'Pretoria Bridge', from: {x: 1350, y: 3800}, to: {x: 1650, y: 3800}, rect: [1350, 3780, 300, 40] },
    { name: 'Bank St Bridge', from: {x: 1350, y: 4500}, to: {x: 1650, y: 4500}, rect: [1350, 4480, 300, 40] },
];

export const LANDMARKS: Landmark[] = [
    { name: 'Parliament Hill', position: { x: 1800, y: 2000 }, emoji: '🏛️' },
    { name: 'National Gallery', position: { x: 2300, y: 1800 }, emoji: '🖼️' },
    { name: 'ByWard Market', position: { x: 2600, y: 2200 }, emoji: '🛍️' },
    { name: 'Lansdowne Park', position: { x: 1800, y: 4200 }, emoji: '🏟️' },
];

// --- Upgrades ---
export const UPGRADES: Record<UpgradeId, Upgrade> = {
  bag: {
    id: 'bag',
    name: 'Bigger Bag',
    description: 'Increases inventory capacity by 20.',
    cost: 25,
    emoji: '🎒',
    apply: (s: PlayerState) => ({ inventoryCap: s.inventoryCap + 20 }),
  },
  cart: {
    id: 'cart',
    name: 'Shopping Cart',
    description: 'Increases inventory capacity by 50.',
    cost: 100,
    emoji: '🛒',
    apply: (s: PlayerState) => ({ inventoryCap: s.inventoryCap + 50 }),
  },
  bell: {
    id: 'bell',
    name: 'Running Shoes',
    description: 'Increases your movement speed by 25%.',
    cost: 75,
    emoji: '👟',
    apply: (s: PlayerState) => ({ speed: s.speed * 1.25 }),
  },
  otrain: {
    id: 'otrain',
    name: 'O-Train Pass',
    description: 'Occasionally triggers a multi-spawn of items.',
    cost: 500,
    emoji: '🚆',
    apply: (s: PlayerState) => s, // Logic is handled in game loop
  },
  map: {
    id: 'map',
    name: 'City Map',
    description: 'Shows a mini-map on your screen.',
    cost: 100,
    emoji: '🗺️',
    apply: (s: PlayerState) => s, // Logic is handled in canvas
  },
  vest: {
    id: 'vest',
    name: 'Reflector Vest',
    description: 'Get a 10% bonus when selling items.',
    cost: 300,
    emoji: '🦺',
    apply: (s: PlayerState) => s, // Logic is handled at sell time
  },
};

// --- Quests ---
export const QUESTS: Quest[] = [
  {
    id: 1,
    description: 'Welcome to Can Hunting! Collect 20 items to get started.',
    targetZone: null,
    targetCount: 20,
    reward: 10,
    progress: 0,
  },
  {
    id: 2,
    description: 'Clean up Downtown! Collect 30 items in the Downtown zone.',
    targetZone: 'Downtown',
    targetCount: 30,
    reward: 25,
    progress: 0,
  },
  {
    id: 3,
    description: 'Time to expand! Collect 50 items anywhere in the city.',
    targetZone: null,
    targetCount: 50,
    reward: 50,
    progress: 0,
  },
  {
    id: 4,
    description: 'Big spender! Earn a total of $100 to prove your skills.',
    targetZone: null,
    targetCount: 100, // This is money
    reward: 75,
    progress: 0,
  },
  {
    id: 5,
    description: 'Glebe Gallivanter! Collect 40 items in The Glebe.',
    targetZone: 'The Glebe',
    targetCount: 40,
    reward: 60,
    progress: 0,
  },
];