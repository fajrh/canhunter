// constants.ts
import type { Zone, Upgrade, UpgradeId, PlayerState, House, WaterBody, Bridge, Landmark, Vector2, Foliage, Quest } from './types.ts';

export const GAME_WORLD_SIZE = { width: 4000, height: 6000 };
export const MAX_COLLECTIBLES = 1500;

// --- Individual Can Sprites ---
export const CAN_IMAGE_URLS = [
  'https://i.ibb.co/B5ZLBVn2/Chat-GPT-Image-Nov-10-2025-08-47-56-AM.png',
  'https://i.ibb.co/xKdvMFnZ/Chat-GPT-Image-Nov-10-2025-08-48-57-AM.png',
  'https://i.ibb.co/4gVTSBFG/Chat-GPT-Image-Nov-10-2025-08-50-44-AM.png',
  'https://i.ibb.co/TM2CQ5cQ/Chat-GPT-Image-Nov-10-2025-08-51-45-AM.png',
  'https://i.ibb.co/gLsKPTxn/Chat-GPT-Image-Nov-10-2025-10-03-23-AM.png',
  'https://i.ibb.co/JF8jWx5G/Chat-GPT-Image-Nov-10-2025-10-04-20-AM.png',
  'https://i.ibb.co/63XC9yZ/Chat-GPT-Image-Nov-10-2025-10-06-27-AM.png',
  'https://i.ibb.co/hRpnP926/Chat-GPT-Image-Nov-10-2025-10-07-30-AM.png',
  'https://i.ibb.co/S4pHBS5J/Chat-GPT-Image-Nov-10-2025-10-08-47-AM.png',
];

// --- Gameplay Constants ---
export const PLAYER_BASE_SPEED = 200; // pixels per second
export const BASE_INVENTORY_CAP = 20;
export const PLAYER_RADIUS = 40;
export const COLLECTIBLE_RADIUS = 20;
export const COLLECTIBLE_LIFESPAN = 10 * 60 * 1000; // 10 minutes
export const COLLECTIBLE_VALUE = 0.10; // $0.10

// --- World Objects ---
export const HOME_POSITION: Vector2 = { x: 1800, y: 3700 };
export const KIOSK_POSITION: Vector2 = { x: 2000, y: 3000 };
export const KIOSK_INTERACTION_RADIUS = 150;

// --- ZONES (Areas of Ottawa) ---
export const ZONES: Zone[] = [
  { name: 'Downtown', rect: [1500, 1800, 1000, 1200], spawnMultiplier: 1.5 },
  { name: 'The Glebe', rect: [1500, 3500, 1000, 1500], spawnMultiplier: 1.2 },
  { name: 'Sandy Hill', rect: [2500, 2400, 1000, 1000], spawnMultiplier: 1.1 },
  { name: 'Hintonburg', rect: [500, 2500, 1000, 1500], spawnMultiplier: 1.0 },
  { name: 'Vanier', rect: [2500, 1500, 1000, 1000], spawnMultiplier: 0.9 },
  { name: 'Westboro', rect: [0, 2500, 500, 1500], spawnMultiplier: 0.8 },
  { name: 'Centretown', rect: [1500, 3000, 1000, 500], spawnMultiplier: 1.3 },
  { name: 'Old Ottawa South', rect: [1500, 5000, 1000, 1000], spawnMultiplier: 1.0 },
  { name: 'New Edinburgh', rect: [2800, 1700, 800, 800], spawnMultiplier: 0.9 },
  { name: 'Little Italy', rect: [1000, 3800, 400, 800], spawnMultiplier: 1.1 },
  { name: 'Chinatown', rect: [1000, 3000, 400, 800], spawnMultiplier: 1.1 },
];

export const WATER_BODIES: WaterBody[] = [
    { name: 'Rideau Canal', polygon: [{x: 1400, y: 0}, {x: 1600, y: 0}, {x: 1600, y: 6000}, {x: 1400, y: 6000}] },
    { name: 'Ottawa River', polygon: [{x: 0, y: 0}, {x: 4000, y: 0}, {x: 4000, y: 1200}, {x: 0, y: 1200}] }
];

const isPointInPolygon = (point: Vector2, polygon: Vector2[]): boolean => {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = ((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
};

export const isPointInWater = (point: Vector2): boolean => {
    return WATER_BODIES.some(wb => isPointInPolygon(point, wb.polygon));
};

// --- Houses ---
const createHouseCluster = (center: Vector2, count: number, radius: number): House[] => {
    const houses: House[] = [];
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.8;
        const distance = radius * (0.6 + Math.random() * 0.4);
        const housePos = { x: center.x + Math.cos(angle) * distance, y: center.y + Math.sin(angle) * distance };
        if (!isPointInWater(housePos)) {
             houses.push({ position: housePos });
        }
    }
    return houses;
};

export const HOUSES: House[] = [
    ...createHouseCluster({ x: 1800, y: 3700 }, 6, 150), ...createHouseCluster({ x: 2100, y: 4000 }, 5, 120),
    ...createHouseCluster({ x: 1750, y: 4400 }, 7, 160), ...createHouseCluster({ x: 2700, y: 2800 }, 8, 180),
    ...createHouseCluster({ x: 3100, y: 3100 }, 6, 140), ...createHouseCluster({ x: 800, y: 2900 }, 6, 160),
    ...createHouseCluster({ x: 1100, y: 3500 }, 5, 130), ...createHouseCluster({ x: 3000, y: 1900 }, 9, 200),
];

// --- Bridges ---
export const BRIDGES: Bridge[] = [
  { name: 'Corktown Footbridge',  from: {x:1350,y:2400}, to:{x:1650,y:2400}, rect:[1350,2380,300,40] },
  { name: 'Pretoria Bridge',      from: {x:1350,y:3800}, to:{x:1650,y:3800}, rect:[1350,3780,300,40] },
  { name: 'Bank St Bridge',       from: {x:1350,y:4500}, to:{x:1650,y:4500}, rect:[1350,4480,300,40] },
  { name: 'Chaudière Crossing',   from:{x:1100,y:1150}, to:{x:1300,y:1150}, rect:[1100,1130,200,40] },
  { name: 'Portage Bridge',       from:{x:1400,y:1100}, to:{x:1600,y:1100}, rect:[1400,1080,200,40] },
  { name: 'Alexandra Bridge',     from:{x:2200,y:1000}, to:{x:2400,y:1000}, rect:[2200, 980,200,40] },
  { name: 'Macdonald–Cartier',    from:{x:2900,y:1000}, to:{x:3100,y:1000}, rect:[2900, 980,200,40] },
  { name: 'Chief William Commanda Bridge', from:{x:1200,y:1050}, to:{x:1350,y:1050}, rect:[1200,1030,150,40] },
  { name: 'Adawe Crossing',       from:{x:2800,y:2700}, to:{x:3000,y:2700}, rect:[2800,2680,200,40] }
];

export const LANDMARKS: Landmark[] = [
  { name:'Parliament Hill',        position:{ x:1800, y:2000 }, emoji:'🏛️' },
  { name:'Peace Tower',            position:{ x:1820, y:1980 }, emoji:'🕰️' },
  { name:'Supreme Court of Canada',position:{ x:1600, y:2050 }, emoji:'⚖️' },
  { name:'National Arts Centre',   position:{ x:1900, y:2300 }, emoji:'🎭' },
  { name:'Rideau Centre',          position:{ x:2250, y:2150 }, emoji:'🛍️' },
  { name:'Shaw Centre',            position:{ x:2300, y:2200 }, emoji:'🏢' },
  { name:'Fairmont Château Laurier',position:{ x:2150, y:2100 }, emoji:'🏰' },
  { name:'Confederation Park',     position:{ x:2000, y:2300 }, emoji:'🌳' },
  { name:'Ottawa City Hall',       position:{ x:1950, y:2550 }, emoji:'🏛️' },
  { name:'ByWard Market',          position:{ x:2600, y:2200 }, emoji:'🥖' },
  { name:'Notre-Dame Cathedral',   position:{ x:2350, y:1950 }, emoji:'⛪' },
  { name:'Royal Canadian Mint',    position:{ x:2400, y:1900 }, emoji:'🪙' },
  { name:'National Gallery of Canada', position:{ x:2300, y:1800 }, emoji:'🖼️' },
  { name:'Rideau Falls',           position:{ x:3050, y:1050 }, emoji:'💧' },
  { name:'Canadian War Museum',    position:{ x:1400, y:2050 }, emoji:'🪖' },
  { name:'LeBreton Flats',         position:{ x:1350, y:2150 }, emoji:'🌾' },
  { name:'Pimisi Station',         position:{ x:1300, y:2350 }, emoji:'🚉' },
  { name:'Bayview Station',        position:{ x:1100, y:2550 }, emoji:'🚉' },
  { name:'Tunney’s Pasture',       position:{ x: 800, y:2500 }, emoji:'🏢' },
  { name:'Lansdowne Park (TD Place)', position:{ x:1800, y:4200 }, emoji:'🏟️' },
  { name:'The Glebe',              position:{ x:1850, y:3800 }, emoji:'🏘️' },
  { name:'Little Italy (Preston)', position:{ x:1450, y:4100 }, emoji:'🍝' },
  { name:'Chinatown (Somerset)',   position:{ x:1200, y:3000 }, emoji:'🏮' },
  { name:'Dow’s Lake',             position:{ x:1500, y:4600 }, emoji:'🛶' },
  { name:'Commissioners Park',     position:{ x:1550, y:4450 }, emoji:'🌷' },
  { name:'Dominion Arboretum',     position:{ x:1300, y:4700 }, emoji:'🌳' },
  { name:'Central Experimental Farm', position:{ x:1000, y:4800 }, emoji:'🌾' },
  { name:'University of Ottawa',   position:{ x:2350, y:2450 }, emoji:'🎓' },
  { name:'Carleton University',    position:{ x:1550, y:5200 }, emoji:'🎓' },
  { name:'Mooney’s Bay',           position:{ x:1600, y:5600 }, emoji:'🏖️' },
  { name:'Hog’s Back Falls',       position:{ x:1500, y:5700 }, emoji:'🌊' },
  { name:'Vincent Massey Park',    position:{ x:1750, y:5450 }, emoji:'🌲' },
  { name:'Hurdman Station',        position:{ x:2600, y:3200 }, emoji:'🚉' },
  { name:'Tremblay (Train Station)', position:{ x:2950, y:3300 }, emoji:'🚉' },
  { name:'St. Laurent Centre',     position:{ x:3300, y:3200 }, emoji:'🛍️' },
  { name:'Rockcliffe Park',        position:{ x:3200, y:1700 }, emoji:'🌲' },
  { name:'Rideau Hall',            position:{ x:3000, y:1800 }, emoji:'🏡' },
  { name:'Canada Aviation & Space Museum', position:{ x:3500, y:1850 }, emoji:'🛩️' },
  { name:'Canadian Museum of History (Gatineau)', position:{ x:2350, y:1150 }, emoji:'🏛️' },
  { name:'Chaudière Falls',        position:{ x:1200, y:1900 }, emoji:'💦' }
];

// --- Foliage ---
const isPointNearLandmark = (point: Vector2): boolean => {
    return LANDMARKS.some(lm => Math.hypot(point.x - lm.position.x, point.y - lm.position.y) < 80);
};

const generateFoliage = (): Foliage[] => {
    const foliage: Foliage[] = [];
    const treeDensity = 0.000015; // trees per square pixel (95% reduction)
    const bushDensity = 0.00002; // bushes per square pixel (95% reduction)
    const totalArea = GAME_WORLD_SIZE.width * GAME_WORLD_SIZE.height;
    
    const treeCount = Math.floor(totalArea * treeDensity);
    const bushCount = Math.floor(totalArea * bushDensity);

    for (let i = 0; i < treeCount; i++) {
        const position = {
            x: Math.random() * GAME_WORLD_SIZE.width,
            y: Math.random() * GAME_WORLD_SIZE.height
        };
        if (!isPointInWater(position) && !isPointNearLandmark(position)) {
            foliage.push({ type: 'tree', position, emoji: '🌳', variant: 1 });
        }
    }
     for (let i = 0; i < bushCount; i++) {
        const position = {
            x: Math.random() * GAME_WORLD_SIZE.width,
            y: Math.random() * GAME_WORLD_SIZE.height
        };
        if (!isPointInWater(position) && !isPointNearLandmark(position)) {
            foliage.push({ type: 'bush', position, emoji: '🌿', variant: 2 });
        }
    }
    return foliage;
};

export const FOLIAGE = generateFoliage();

// --- Critters ---
// This would be in a JSON file but since we can't add files, it's here.
export const CRITTER_ATLAS = {
  "image": "https://i.ibb.co/b3h7B5S/critters-atlas.png",
  "frames": {
    "cat_idle_0": { "x": 0,  "y": 0,  "w": 24, "h": 24 }, "cat_idle_1": { "x": 24, "y": 0,  "w": 24, "h": 24 },
    "cat_walk_0": { "x": 48, "y": 0,  "w": 24, "h": 24 }, "cat_walk_1": { "x": 72, "y": 0,  "w": 24, "h": 24 },
    "cat_walk_2": { "x": 96, "y": 0,  "w": 24, "h": 24 }, "cat_walk_3": { "x": 120,"y": 0,  "w": 24, "h": 24 },
    "pigeon_idle_0": { "x": 0,  "y": 24, "w": 24, "h": 24 }, "pigeon_idle_1": { "x": 24, "y": 24, "w": 24, "h": 24 },
    "pigeon_walk_0": { "x": 48, "y": 24, "w": 24, "h": 24 }, "pigeon_walk_1": { "x": 72, "y": 24, "w": 24, "h": 24 },
    "pigeon_walk_2": { "x": 96, "y": 24, "w": 24, "h": 24 }, "pigeon_walk_3": { "x": 120,"y": 24, "w": 24, "h": 24 }
  },
  "anims": {
    "cat_idle":   ["cat_idle_0", "cat_idle_1"], "cat_walk":   ["cat_walk_0", "cat_walk_1", "cat_walk_2", "cat_walk_3"],
    "pigeon_idle":["pigeon_idle_0", "pigeon_idle_1"], "pigeon_walk":["pigeon_walk_0", "pigeon_walk_1", "pigeon_walk_2", "pigeon_walk_3"]
  }
};
export const CRITTER_WALK_DUR = [2.5, 4.0];
export const CRITTER_IDLE_DUR = [1.5, 3.0];
export const CRITTER_FPS_IDLE = 2;
export const CRITTER_FPS_WALK = 7;
export const CRITTER_TURN_MAX = Math.PI / 6;
export const CRITTER_UPDATE_RATE = 5; // logic steps per second
export const CRITTER_AVOID_WATER = true;
export const CRITTER_SPAWNS = [
  { kind: 'cat' as const,    pos: { x: 1850, y: 3900 } }, // Glebe
  { kind: 'cat' as const,    pos: { x: 1750, y: 4100 } }, // Lansdowne
  { kind: 'pigeon' as const, pos: { x: 2000, y: 2250 } }, // Confederation Park
  { kind: 'pigeon' as const, pos: { x: 2600, y: 2200 } }, // ByWard Market
  { kind: 'pigeon' as const, pos: { x: 1810, y: 2050 } }  // Parliament
];

// --- Upgrades ---
export const UPGRADES: Record<UpgradeId, Upgrade> = {
  bag: { id: 'bag', name: 'Bigger Bag', description: 'Increases inventory capacity by 20.', cost: 25, emoji: '🎒', apply: (s: PlayerState) => ({ inventoryCap: s.inventoryCap + 20 }) },
  cart: { id: 'cart', name: 'Shopping Cart', description: 'Increases inventory capacity by 50.', cost: 100, emoji: '🛒', apply: (s: PlayerState) => ({ inventoryCap: s.inventoryCap + 50 }) },
  bell: { id: 'bell', name: 'Running Shoes', description: 'Increases your movement speed by 50%.', cost: 75, emoji: '👟', apply: (s: PlayerState) => ({ speed: s.speed * 1.5 }) },
  bicycle: { id: 'bicycle', name: 'Bicycle', description: 'Doubles your movement speed.', cost: 250, emoji: '🚲', apply: (s: PlayerState) => ({ speed: s.speed * 2 }) },
  otrain: { id: 'otrain', name: 'O-Train Pass', description: 'Occasionally triggers a multi-spawn of items.', cost: 500, emoji: '🚆', apply: (s: PlayerState) => s },
  map: { id: 'map', name: 'City Map', description: 'Shows a mini-map on your screen.', cost: 100, emoji: '🗺️', apply: (s: PlayerState) => s },
  vest: { id: 'vest', name: 'Reflector Vest', description: 'Get a 10% bonus when selling items.', cost: 300, emoji: '🦺', apply: (s: PlayerState) => s },
};

// --- Quests ---
export const QUESTS: Quest[] = [
  { id: 1, description: 'Welcome to Can Hunting! Collect 20 items to get started.', targetZone: null, targetCount: 20, reward: 10, progress: 0 },
  { id: 2, description: 'Clean up Downtown! Collect 30 items in the Downtown zone.', targetZone: 'Downtown', targetCount: 30, reward: 25, progress: 0 },
  { id: 3, description: 'Time to expand! Collect 50 items anywhere in the city.', targetZone: null, targetCount: 50, reward: 50, progress: 0 },
  { id: 4, description: 'Big spender! Earn a total of $100 to prove your skills.', targetZone: null, targetCount: 100, reward: 75, progress: 0 },
  { id: 5, description: 'Glebe Gallivanter! Collect 40 items in The Glebe.', targetZone: 'The Glebe', targetCount: 40, reward: 60, progress: 0 },
];