// constants.ts
import type {
  Zone,
  Upgrade,
  UpgradeId,
  PlayerState,
  House,
  WaterBody,
  Bridge,
  Landmark,
  Vector2,
  Foliage,
  Quest,
  Crosswalk,
  RoadSegment
} from './types.ts';

export const GAME_WORLD_SIZE = { width: 4000, height: 6000 };
export const MAX_COLLECTIBLES = 1500;
export const INITIAL_COLLECTIBLE_TARGET = 140;

// --- Helpers (seeded RNG + geometry) ---
const mulberry32 = (seed: number) => {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const rand2 = (rng: () => number, a: number, b: number) => a + (b - a) * rng();

type Polyline = Vector2[];

const pointInPoly = (pt: Vector2, poly: Vector2[]) => {
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
  'https://i.ibb.co/S4pHBS5J/Chat-GPT-Image-Nov-10-2025-10-08-47-AM.png'
];

// --- Gameplay Constants ---
export const PLAYER_BASE_SPEED = 200; // pixels per second
export const BASE_INVENTORY_CAP = 20;
export const PLAYER_RADIUS = 30;
export const COLLECTIBLE_RADIUS = 20;
export const COLLECTIBLE_LIFESPAN = 10 * 60 * 1000; // 10 minutes
export const COLLECTIBLE_VALUE = 0.1; // $0.10
export const SPEED_BOOST_CHAIN_WINDOW = 5000; // ms
export const SPEED_BOOST_CHAIN_THRESHOLD = 5;
export const SPEED_BOOST_BATCH_TRIGGER = 3;
export const SPEED_BOOST_DURATION = 6000;
export const SPEED_BOOST_MULTIPLIER = 1.35;
export const PLAYER_MAX_HP = 100;
export const TRAFFIC_DAMAGE = 30;
export const NPC_SHOVE_DAMAGE = 10;
export const CANAL_COLD_DAMAGE = 1; // per second
export const BRIDGE_APPROACH_DISTANCE = 280;
export const BRIDGE_PATH_SAMPLES = 24;
export const BRIDGE_SNAP_PADDING = 28;

// Road texture (tiling)
export const ROAD_TEXTURE_URL =
  'https://i.ibb.co/s9V8fFRv/download.jpg'; // must end in .jpg
export const ROAD_TILE_SIZE = 64;

// --- ZONES (Areas of Ottawa) ---
// Coordinates are approximate but preserve real-world relationships:
// River at ~y=1100, Parliament around (1900,2000), ByWard NE, Glebe/Lansdowne south, etc.
export const ZONES: Zone[] = [
  // East of Parliament, north of Rideau St
  { name: 'ByWard Market', rect: [2400, 1900, 700, 600], spawnMultiplier: 1.6 },
  // Between Bronson & Elgin, south of Wellington, north of Queensway-ish
  { name: 'Centretown', rect: [1400, 2200, 1200, 1200], spawnMultiplier: 1.3 },
  // South of Queensway, along Bank & the Canal
  { name: 'The Glebe', rect: [1600, 3400, 1000, 1500], spawnMultiplier: 1.2 },
  // East of the Canal, uOttawa + Sandy Hill
  { name: 'Sandy Hill', rect: [2600, 2300, 900, 1300], spawnMultiplier: 1.1 },
  // West of downtown, around Wellington West / Hintonburg
  { name: 'Hintonburg', rect: [600, 2500, 1100, 1400], spawnMultiplier: 1.0 },
  // Further west along Richmond / Westboro
  { name: 'Westboro', rect: [0, 2400, 600, 1500], spawnMultiplier: 0.8 },
  // Preston / Little Italy near Dows Lake
  { name: 'Little Italy', rect: [1350, 3950, 600, 900], spawnMultiplier: 1.1 },
  // Chinatown around Somerset & Bronson
  { name: 'Chinatown', rect: [1100, 2950, 600, 800], spawnMultiplier: 1.1 }
];

// --- Water bodies ---
// Rideau Canal: rough centre-line from downtown to Dows Lake / south
const RIDEAU_CANAL_POLY: Vector2[] = [
  // Downtown near Parliament / Rideau Centre
  { x: 1700, y: 1300 },
  { x: 1680, y: 1600 },
  { x: 1640, y: 2100 },
  { x: 1690, y: 2600 },
  { x: 1740, y: 3200 },
  { x: 1780, y: 3800 },
  { x: 1800, y: 4400 },
  // Near Lansdowne / TD Place
  { x: 1820, y: 4800 },
  { x: 1840, y: 5200 },
  { x: 1860, y: 6000 },
  // West bank
  { x: 2000, y: 6000 },
  { x: 1980, y: 5200 },
  { x: 1960, y: 4800 },
  { x: 1940, y: 4200 },
  { x: 1920, y: 3600 },
  { x: 1880, y: 3000 },
  { x: 1840, y: 2400 },
  { x: 1820, y: 1900 },
  { x: 1800, y: 1500 },
  { x: 1780, y: 1300 }
];

// Ottawa River band across the top of the map
const OTTAWA_RIVER_POLY: Vector2[] = [
  { x: 0, y: 1080 },
  { x: 4000, y: 1080 },
  { x: 4000, y: 1280 },
  { x: 0, y: 1280 }
];

export const WATER_BODIES: WaterBody[] = [
  { name: 'Rideau Canal', polygon: RIDEAU_CANAL_POLY },
  { name: 'Ottawa River', polygon: OTTAWA_RIVER_POLY }
];

export const isPointInWater = (point: Vector2): boolean =>
  WATER_BODIES.some((wb) => pointInPoly(point, wb.polygon));

// --- Ontario/Quebec separation ---
export const QUEBEC_BORDER_Y = 1120; // just south of the river band
export const isInQuebec = (p: Vector2) => p.y < QUEBEC_BORDER_Y;

// --- World Objects ---
// Roughly Centretown / Glebe border
export const STASH_HOUSE_POSITION: Vector2 = { x: 1800, y: 3600 };
// Near Canadian Museum of History / Jacques-Cartier Park in Gatineau
export const REFUND_DEPOT_POSITION: Vector2 = { x: 2500, y: 950 };
export const KIOSK_INTERACTION_RADIUS = 150;

// --- Houses ---
const createHouseCluster = (
  center: Vector2,
  count: number,
  radius: number
): House[] => {
  const houses: House[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.8;
    const distance = radius * (0.6 + Math.random() * 0.4);
    const housePos = {
      x: center.x + Math.cos(angle) * distance,
      y: center.y + Math.sin(angle) * distance
    };
    if (!isPointInWater(housePos)) houses.push({ position: housePos });
  }
  return houses;
};

export const HOUSES: House[] = [
  // Glebe / Centretown clusters
  ...createHouseCluster({ x: 1800, y: 3600 }, 6, 150),
  ...createHouseCluster({ x: 2050, y: 3900 }, 6, 150),
  ...createHouseCluster({ x: 1700, y: 4100 }, 7, 180),
  // Sandy Hill / uOttawa
  ...createHouseCluster({ x: 2700, y: 2600 }, 8, 180),
  ...createHouseCluster({ x: 3100, y: 2900 }, 6, 160),
  // Hintonburg / Wellington West
  ...createHouseCluster({ x: 900, y: 2800 }, 7, 180),
  ...createHouseCluster({ x: 1100, y: 3200 }, 5, 140),
  // Westboro
  ...createHouseCluster({ x: 400, y: 2700 }, 7, 200)
];

// --- Bridges ---
export const BRIDGES: Bridge[] = [
  // West-to-east ordering along the river
  {
    name: 'Champlain Bridge',
    nameKey: 'bridge_champlain',
    from: { x: 600, y: 1260 },
    to: { x: 600, y: 1080 },
    rect: [580, 1080, 40, 180]
  },
  {
    name: 'Chaudière Crossing',
    nameKey: 'bridge_chaudiere',
    from: { x: 1300, y: 1260 },
    to: { x: 1300, y: 1080 },
    rect: [1280, 1080, 40, 180]
  },
  {
    name: 'Portage Bridge',
    nameKey: 'bridge_portage',
    from: { x: 1800, y: 1260 },
    to: { x: 1800, y: 1080 },
    rect: [1780, 1080, 40, 180]
  },
  {
    name: 'Alexandra Bridge',
    nameKey: 'bridge_alexandra',
    from: { x: 2350, y: 1260 },
    to: { x: 2350, y: 1080 },
    rect: [2330, 1080, 40, 180],
    repairGag: true
  },
  {
    name: 'Macdonald-Cartier Bridge',
    nameKey: 'bridge_macdonald_cartier',
    from: { x: 2900, y: 1260 },
    to: { x: 2900, y: 1080 },
    rect: [2880, 1080, 40, 180]
  }
];

// --- Landmarks ---
// Placed relative to real downtown: Parliament just south of river,
// ByWard east, Hintonburg/Westboro west, Glebe/Lansdowne south, etc.
export const LANDMARKS: Landmark[] = [
  { nameKey: 'landmark_parliament', position: { x: 1900, y: 2000 }, emoji: '🏛️' },
  { nameKey: 'landmark_byward_market', position: { x: 2600, y: 2100 }, emoji: '🥖' },
  { nameKey: 'landmark_national_gallery', position: { x: 2250, y: 1850 }, emoji: '🖼️' },
  { nameKey: 'landmark_rideau_centre', position: { x: 2250, y: 2200 }, emoji: '🛍️' },
  { nameKey: 'landmark_shaw_centre', position: { x: 2320, y: 2220 }, emoji: '🏢' },
  { nameKey: 'landmark_uottawa', position: { x: 2450, y: 2450 }, emoji: '🎓' },
  {
    nameKey: 'landmark_confederation_park',
    position: { x: 2050, y: 2250 },
    emoji: '🌳'
  },
  { nameKey: 'landmark_lansdowne', position: { x: 1850, y: 4300 }, emoji: '🏟️' },
  { nameKey: 'landmark_dows_lake', position: { x: 1650, y: 4700 }, emoji: '🛶' },
  { nameKey: 'landmark_little_italy', position: { x: 1500, y: 4100 }, emoji: '🍝' },
  { nameKey: 'landmark_hintonburg', position: { x: 900, y: 2850 }, emoji: '☕' },
  { nameKey: 'landmark_westboro', position: { x: 350, y: 2750 }, emoji: '🛍️' },
  { nameKey: 'landmark_war_museum', position: { x: 1450, y: 2050 }, emoji: '🪖' },
  { nameKey: 'landmark_supreme_court', position: { x: 1650, y: 2050 }, emoji: '⚖️' },
  { nameKey: 'landmark_chateau_laurier', position: { x: 2150, y: 2100 }, emoji: '🏰' },
  { nameKey: 'landmark_chinatown', position: { x: 1250, y: 3000 }, emoji: '🏮' },
  { nameKey: 'landmark_glebe', position: { x: 1850, y: 3700 }, emoji: '🏘️' },
  { nameKey: 'landmark_tunneys_pasture', position: { x: 800, y: 2500 }, emoji: '🏢' },
  { nameKey: 'landmark_bayview', position: { x: 1150, y: 2550 }, emoji: '🚉' },
  { nameKey: 'landmark_pimisi', position: { x: 1350, y: 2350 }, emoji: '🚉' },
  { nameKey: 'landmark_history_museum', position: { x: 2350, y: 950 }, emoji: '🏛️' },
  { nameKey: 'landmark_jacques_cartier_park', position: { x: 2600, y: 900 }, emoji: '🌲' }
];

// --- Foliage & Clutter ---
const isNearLandmark = (p: Vector2, r = 80) =>
  LANDMARKS.some(
    (lm) => Math.hypot(p.x - lm.position.x, p.y - lm.position.y) < r
  );

const generateClutter = (
  count: number,
  emoji: string,
  seed: number,
  type: Foliage['type'] = 'other'
): Foliage[] => {
  const rng = mulberry32(seed);
  const out: Foliage[] = [];
  for (let i = 0; i < count; i++) {
    const p = {
      x: rand2(rng, 0, GAME_WORLD_SIZE.width),
      y: rand2(rng, 0, GAME_WORLD_SIZE.height)
    };
    if (!isPointInWater(p) && !isNearLandmark(p, 60)) {
      out.push({ type, position: p, emoji, variant: 0 });
    }
  }
  return out;
};

export const FOLIAGE: Foliage[] = [
  ...generateClutter(120, '🌳', 1, 'tree'),
  ...generateClutter(90, '🌲', 11, 'tree'),
  ...generateClutter(150, '🌿', 2, 'bush'),
  ...generateClutter(60, '🌾', 12, 'bush'),
  ...generateClutter(40, '🌼', 5, 'other'),
  ...generateClutter(24, '🪨', 6, 'other'),
  ...generateClutter(20, '🪑', 3, 'other'),
  ...generateClutter(18, '💡', 4, 'other'),
  ...generateClutter(28, '🍁', 7, 'other'),
  // Winterlude-ish pretzel stands
  {
    position: { x: 1700, y: 4100 },
    emoji: '🥨',
    type: 'other',
    variant: 0
  } as Foliage,
  {
    position: { x: 1450, y: 2800 },
    emoji: '🥨',
    type: 'other',
    variant: 0
  } as Foliage
];

// --- Traffic ---
// Paths roughly along Elgin, Wellington, Bronson, Wellington West
export const TRAFFIC_PATHS: Vector2[][] = [
  // Elgin St: from Wellington south into Centretown
  [
    { x: 1900, y: 1900 },
    { x: 1900, y: 4800 }
  ],
  // Wellington St: west-east in front of Parliament
  [
    { x: 800, y: 2050 },
    { x: 3200, y: 2050 }
  ],
  // Bronson Ave: north-south west of downtown
  [
    { x: 1300, y: 2400 },
    { x: 1300, y: 5200 }
  ],
  // Wellington West / Holland-ish
  [
    { x: 400, y: 2850 },
    { x: 1400, y: 2850 }
  ]
];

// --- Roads ---
// These are the segments the renderer tiles with ROAD_TEXTURE_URL.
// IDs starting with "bridge_" are treated as bridge decks in GameCanvas.
export const ROADS: RoadSegment[] = [
  // Core north-south
  { id: 'elgin', from: { x: 1900, y: 1900 }, to: { x: 1900, y: 5200 }, width: 150 },
  { id: 'bank', from: { x: 1750, y: 1850 }, to: { x: 1750, y: 5200 }, width: 140 },
  { id: 'bronson', from: { x: 1300, y: 2400 }, to: { x: 1300, y: 5200 }, width: 150 },

  // Canal-side (Queen Elizabeth Driveway-ish)
  {
    id: 'queen_elizabeth',
    from: { x: 1650, y: 1500 },
    to: { x: 1650, y: 5000 },
    width: 120
  },

  // East-side Sussex / King Edward-ish
  { id: 'sussex', from: { x: 2400, y: 1500 }, to: { x: 2400, y: 2600 }, width: 120 },

  // East-west downtown
  {
    id: 'wellington',
    from: { x: 800, y: 2050 },
    to: { x: 3200, y: 2050 },
    width: 160
  },
  {
    id: 'rideau',
    from: { x: 2100, y: 2250 },
    to: { x: 2900, y: 2250 },
    width: 140
  },

  // 417 / Queensway approximation
  {
    id: 'queensway',
    from: { x: 200, y: 3000 },
    to: { x: 3800, y: 3000 },
    width: 180
  },

  // Wellington West
  {
    id: 'wellington_west',
    from: { x: 400, y: 2850 },
    to: { x: 1600, y: 2850 },
    width: 140
  },

  // Bridge road decks (used as roads but also visually align to BRIDGES)
  {
    id: 'bridge_champlain',
    from: { x: 600, y: 1600 },
    to: { x: 600, y: 900 },
    width: 140
  },
  {
    id: 'bridge_chaudiere',
    from: { x: 1300, y: 1550 },
    to: { x: 1300, y: 900 },
    width: 130
  },
  {
    id: 'bridge_portage',
    from: { x: 1800, y: 1550 },
    to: { x: 1800, y: 900 },
    width: 130
  },
  {
    id: 'bridge_alexandra',
    from: { x: 2350, y: 1550 },
    to: { x: 2350, y: 900 },
    width: 130
  },
  {
    id: 'bridge_macdonald_cartier',
    from: { x: 2900, y: 1550 },
    to: { x: 2900, y: 900 },
    width: 130
  }
];

export const CROSSWALKS: Crosswalk[] = [
  // Bank / Gladstone-ish
  {
    position: { x: 1750, y: 2600 },
    rect: [1720, 2580, 60, 40],
    active: false,
    timer: 0
  },
  // Elgin / Wellington-ish
  {
    position: { x: 1900, y: 2050 },
    rect: [1870, 2030, 60, 40],
    active: false,
    timer: 0
  }
];

// --- NPCs ---
export const NPC_SPAWNS = [
  { type: 'security' as const, pos: { x: 2200, y: 2180 } }, // Rideau Centre
  { type: 'security' as const, pos: { x: 1850, y: 2050 } }, // Near Parliament
  { type: 'complainer' as const, pos: { x: 1900, y: 3900 } }, // In The Glebe
  { type: 'general' as const, pos: { x: 2550, y: 2250 } }, // ByWard Market
  { type: 'general' as const, pos: { x: 1700, y: 2800 } }, // Centretown
  { type: 'general' as const, pos: { x: 2500, y: 850 } }, // Gatineau
  { type: 'general' as const, pos: { x: 2200, y: 1000 } } // Gatineau
];

export const BARKS_GENERAL = [
  "Careful, bud—this sidewalk’s pure slush.",
  'Ten cents a can? You’ll be rollin’ in loonies, eh.',
  'Mind the LRT… or, uh, the shuttle bus of destiny.',
  'If you see a beavertails stand, grab me a Killaloe Sunrise.',
  'ByWard’s that way; follow the tourists with mittens.',
  'Skating the Canal later? Watch for rough ice by the lights.',
  'Tulips pop soon—Commissioners Park goes nuts.',
  'Bank Street traffic’ll chirp you; keep right.',
  'Westboro? Fancy cans there—sparkly recyclables.',
  'Hintonburg hipsters tip better—true story.',
  'Rideau Centre cans vanish fast—mall guards on patrol.',
  'Watch your toes—salt chunks like meteorites.',
  'Double-double power-up at Timmy’s, two blocks south.',
  'Bluesfest nights = can jackpot, bring earplugs.',
  'Sparks Street patios spawn cans like loot drops.',
  'Carleton kids dump a motherlode after exams.',
  'uOttawa rez night? Inventory full in five.',
  "Don’t slip—black ice is Canada’s final boss.",
  'NCC says keep the Canal clean, champ.',
  "That bridge? Detour city—Alexandra’s always ‘under repair’.",
  'Elgin after 11: poutine in one hand, cans in the other.',
  'Chaudière winds will yeet your toque, careful.',
  'Mooney’s Bay is chill til the dragon boats show.',
  'Glebe garage sales = premium aluminum.',
  "Tunney’s Pasture… more like Tunney’s Tupperware at lunch.",
  'Lebreton construction: cans in, exits out.',
  'Chinatown late night—pho, pop cans, prosperity.',
  'Little Italy? Bring extra bags, nonna parties hard.',
  'Portage Bridge puffs—hold your hat, pal.',
  'Sandy Hill porches = bonus spawns after Friday.',
  'Sparks buskers = coin sounds, can sounds—music.',
  'Rideau Falls mist = soggy socks. Proceed with pride.',
  'Museum nights: fewer people, cleaner loot.',
  'Parliament selfies + energy drinks = tidy profit.',
  'Elgin bike lanes—don’t be that guy.',
  'Winterlude time? Cans freeze to the snowbank.',
  'Bayview transfer—commuters abandon bubbly by the dozen.',
  'Pimisi station? Watch for scooters and suits.',
  'Gatineau folks cross for shawarma; follow the garlic.',
  'Sparks pop-ups: artisanal soda = artisanal cans.',
  'Supreme Court steps: great view, mid cans.',
  'War Museum lawn—quiet, sneaky good on weekends.',
  'Rockcliffe dog walkers—tinny bell equals tins, eh.',
  'Hogs Back roar means you’re close to splash zone.',
  'Arboretum shade: cool cans, cooler squirrels.',
  'St. Laurent big box = cart city, can city.',
  "Weather app says ‘flurries’; Ottawa says blizzard.",
  "If it sparkles, it’s probably recyclable—probably.",
  'Got a cart upgrade? Your back will thank you.',
  'Hydro bill high? Pick more cans, become legend.'
];

export const BARKS_POLICE = [
  'Hey friend—sidewalk stays clear, collect from the curb, ok?',
  'Mind the tracks; LRT fines aren’t worth a nickel.',
  "Helmet on if you’re biking that load—bylaw’s a thing.",
  'No trespassing behind the Beer Store—use the public bins.',
  'All good—just don’t block the crosswalk, champ.',
  'Storm’s coming—plows need space. Keep to the right.',
  "That’s private property; stick to the city cans, please.",
  'Quick heads-up: bridge detour ahead, use the marked lane.',
  "Littering ticket’s no fun; bag it and you’re golden.",
  "Can count’s impressive—watch your back on Bank Street.",
  'Stay out of the Canal—rescues are pricey.',
  'You’re good to go—thanks for keeping the city tidy.'
];

export const BARKS_QC = [
  'Ben voyons, t’as une brouette? T’es en affaires, là.',
  'Va au dép—les canettes sortent vite après souper.',
  'Fais pas le fatigant, le char passe au coin, tsé.',
  'C’est slick icitte—tes bottes vont maganer.',
  'Deux-trois piasse en canettes, ça paye la poutine.',
  'T’es ben en forme, mon chum—ça ramasse en tabar… euh, pas mal!',
  'Le pont shake au vent—tiens ta tuque, là.',
  'Au parc Jacques-Cartier, y’en a plein après les shows.',
  'Prends le côté du dépanneur, c’est moins rush.',
  'Ouin, l’OTRAIN? Mieux à pied, mon vieux.',
  'Ça sent la sauce brune—laisse pas tes sacs traîner.',
  'T’es rendu dans Hull, mon ami—bienvenue, fais ça smooth.'
];

// --- Critters ---
export const CRITTER_ATLAS = {
  image: 'https://i.ibb.co/b3h7B5S/critters-atlas.png',
  frames: {
    cat_idle_0: { x: 0, y: 0, w: 24, h: 24 },
    cat_idle_1: { x: 24, y: 0, w: 24, h: 24 },
    cat_walk_0: { x: 48, y: 0, w: 24, h: 24 },
    cat_walk_1: { x: 72, y: 0, w: 24, h: 24 },
    cat_walk_2: { x: 96, y: 0, w: 24, h: 24 },
    cat_walk_3: { x: 120, y: 0, w: 24, h: 24 },
    pigeon_idle_0: { x: 0, y: 24, w: 24, h: 24 },
    pigeon_idle_1: { x: 24, y: 24, w: 24, h: 24 },
    pigeon_walk_0: { x: 48, y: 24, w: 24, h: 24 },
    pigeon_walk_1: { x: 72, y: 24, w: 24, h: 24 },
    pigeon_walk_2: { x: 96, y: 24, w: 24, h: 24 },
    pigeon_walk_3: { x: 120, y: 24, w: 24, h: 24 }
  },
  anims: {
    cat_idle: ['cat_idle_0', 'cat_idle_1'],
    cat_walk: ['cat_walk_0', 'cat_walk_1', 'cat_walk_2', 'cat_walk_3'],
    pigeon_idle: ['pigeon_idle_0', 'pigeon_idle_1'],
    pigeon_walk: [
      'pigeon_walk_0',
      'pigeon_walk_1',
      'pigeon_walk_2',
      'pigeon_walk_3'
    ]
  }
};

export const CRITTER_WALK_DUR = [2.5, 4.0];
export const CRITTER_IDLE_DUR = [1.5, 3.0];
export const CRITTER_FPS_IDLE = 2;
export const CRITTER_FPS_WALK = 7;
export const CRITTER_TURN_MAX = Math.PI / 6;
export const CRITTER_UPDATE_RATE = 5;
export const CRITTER_AVOID_WATER = true;
export const CRITTER_SPAWNS = [
  { kind: 'pigeon' as const, pos: { x: 1910, y: 2050 } }, // Parliament lawn
  { kind: 'pigeon' as const, pos: { x: 2600, y: 2200 } } // ByWard
];

// --- Upgrades ---
export const UPGRADES: Record<UpgradeId, Upgrade> = {
  bag: {
    id: 'bag',
    nameKey: 'upgrade_bag_name',
    descriptionKey: 'upgrade_bag_desc',
    cost: 25,
    emoji: '🎒',
    apply: (s: PlayerState) => ({ inventoryCap: s.inventoryCap + 20 })
  },
  cart: {
    id: 'cart',
    nameKey: 'upgrade_cart_name',
    descriptionKey: 'upgrade_cart_desc',
    cost: 100,
    emoji: '🛒',
    apply: (s: PlayerState) => ({ inventoryCap: s.inventoryCap + 50 })
  },
  bell: {
    id: 'bell',
    nameKey: 'upgrade_shoes_name',
    descriptionKey: 'upgrade_shoes_desc',
    cost: 75,
    emoji: '👟',
    apply: (s: PlayerState) => ({ speed: s.speed * 1.5 })
  },
  bicycle: {
    id: 'bicycle',
    nameKey: 'upgrade_bicycle_name',
    descriptionKey: 'upgrade_bicycle_desc',
    cost: 150,
    emoji: '🚲',
    apply: (s: PlayerState) => ({
      speed: s.speed * 1.35,
      inventoryCap: s.inventoryCap + 10
    })
  },
  bikeTrailer: {
    id: 'bikeTrailer',
    nameKey: 'upgrade_bikeTrailer_name',
    descriptionKey: 'upgrade_bikeTrailer_desc',
    cost: 200,
    emoji: '🚲',
    requires: 'bicycle',
    apply: (s: PlayerState) => ({
      inventoryCap: s.inventoryCap + 60,
      speed: s.speed * 0.95
    })
  },
  parka: {
    id: 'parka',
    nameKey: 'upgrade_parka_name',
    descriptionKey: 'upgrade_parka_desc',
    cost: 120,
    emoji: '🧥',
    apply: (s: PlayerState) => s
  },
  otrain: {
    id: 'otrain',
    nameKey: 'upgrade_otrain_name',
    descriptionKey: 'upgrade_otrain_desc',
    cost: 500,
    emoji: '🚆',
    apply: (s: PlayerState) => s
  },
  map: {
    id: 'map',
    nameKey: 'upgrade_map_name',
    descriptionKey: 'upgrade_map_desc',
    cost: 100,
    emoji: '🗺️',
    apply: (s: PlayerState) => s
  },
  vest: {
    id: 'vest',
    nameKey: 'upgrade_vest_name',
    descriptionKey: 'upgrade_vest_desc',
    cost: 300,
    emoji: '🦺',
    apply: (s: PlayerState) => s
  }
};

// --- Quests ---
export const QUESTS: Quest[] = [
  {
    id: 1,
    descriptionKey: 'quest_1_desc',
    targetZone: null,
    targetCount: 20,
    reward: 10,
    progress: 0
  },
  {
    id: 2,
    descriptionKey: 'quest_2_desc',
    targetZone: 'ByWard Market',
    targetCount: 30,
    reward: 25,
    progress: 0
  },
  {
    id: 3,
    descriptionKey: 'quest_3_desc',
    targetZone: null,
    targetCount: 50,
    reward: 50,
    progress: 0
  },
  {
    id: 4,
    descriptionKey: 'quest_4_desc',
    targetZone: null,
    targetCount: 100,
    reward: 75,
    progress: 0
  },
  {
    id: 5,
    descriptionKey: 'quest_5_desc',
    targetZone: 'The Glebe',
    targetCount: 40,
    reward: 60,
    progress: 0
  }
];
