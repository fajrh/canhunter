import type { Language } from '../types';

const translations: Record<string, Record<Language, string>> = {
  // Prompts
  'intro_prompt': {
    en: 'Click to move. Stash your cans in Ottawa (📦), then cross to Québec to sell at the depot (🏪)!',
    fr: 'Cliquez pour vous déplacer. Stockez vos canettes à Ottawa (📦), puis traversez au Québec pour vendre au dépôt (🏪) !',
  },
  'inventory_full_prompt': {
    en: 'Inventory Full! Find the stash house (📦) to store more, or go to the depot (🏪) to sell.',
    fr: 'Inventaire plein ! Trouvez la planque (📦) pour stocker plus, ou allez au dépôt (🏪) pour vendre.',
  },
  'reset_confirm': {
    en: 'Are you sure you want to reset all your progress? This cannot be undone.',
    fr: 'Êtes-vous sûr de vouloir réinitialiser toute votre progression ? Cette action est irréversible.',
  },
  'loading_assets': { en: 'Loading Assets...', fr: 'Chargement des ressources...' },
  'flash_welcome_quebec': { en: 'Welcome to Québec!', fr: 'Bienvenue au Québec !' },
  'flash_welcome_ontario': { en: 'Welcome to Ontario!', fr: 'Bienvenue en Ontario !' },
  'flash_o_train_ticker': { en: 'O-Train: Service interruption resolved (?)', fr: "O-Train : Interruption de service résolue (?)"},
  'flash_can_run': { en: 'Can run started! Ride safe.', fr: 'Course de canettes lancée ! Roulez prudemment.' },
  'flash_can_run_complete': { en: 'Can run complete! Great haul!', fr: 'Course de canettes terminée ! Super récolte !' },

  // Map Labels
  'quebec_label': { en: 'Québec', fr: 'Québec' },
  'ontario_label': { en: 'Ontario', fr: 'Ontario' },
  'bridge_repair_gag': { en: '(Under Repair... again)', fr: '(En réparation... encore)'},
  'bridge_label': { en: 'Bridge', fr: 'Pont' },

  // HUD
  'quest_1_desc': { en: 'Welcome! Collect 20 items to get started.', fr: 'Bienvenue ! Ramassez 20 objets pour commencer.' },
  'quest_2_desc': { en: 'Clean up the ByWard Market! Collect 30 items there.', fr: 'Nettoyez le Marché By ! Ramassez-y 30 objets.' },
  'quest_3_desc': { en: 'Time to expand! Collect 50 items anywhere in the city.', fr: "C'est l'heure de l'expansion ! Ramassez 50 objets." },
  'quest_4_desc': { en: 'Big spender! Earn a total of $100 to prove your skills.', fr: 'Grand dépensier ! Gagnez 100 $ pour prouver vos compétences.' },
  'quest_5_desc': { en: 'Glebe Gallivanter! Collect 40 items in The Glebe.', fr: 'Vadrouilleur du Glebe ! Ramassez 40 objets dans le Glebe.' },
  'hud_boost': { en: 'Boost', fr: 'Turbo' },
  'can_run_button': { en: 'Can Run', fr: 'Course au dépôt' },
  
  // Controls
  'upgrades_button': { en: 'Upgrades', fr: 'Amélios' },
  'toggle_mute': { en: 'Toggle Mute', fr: 'Activer/Désactiver le son' },
  'help_button': { en: 'Help', fr: 'Aide' },
  'crosswalk_button': { en: 'Crosswalk', fr: 'Traverse' },
  
  // Upgrades Modal
  'upgrades_title': { en: 'Upgrades', fr: 'Améliorations' },
  'owned_button': { en: 'OWNED', fr: 'ACQUIS' },
  'requires_button': { en: 'REQUIRES', fr: 'REQUIERT'},
  'reset_button': { en: 'Reset Save Data', fr: 'Réinitialiser la sauvegarde' },
  'upgrade_bag_name': { en: 'Bigger Bag', fr: 'Plus Grand Sac' },
  'upgrade_bag_desc': { en: 'Increases inventory capacity by 20.', fr: "Augmente la capacité de l'inventaire de 20." },
  'upgrade_cart_name': { en: 'Shopping Cart', fr: "Panier d'épicerie" },
  'upgrade_cart_desc': { en: 'Increases inventory capacity by 50.', fr: "Augmente la capacité de l'inventaire de 50." },
  'upgrade_shoes_name': { en: 'Running Shoes', fr: 'Chaussures de course' },
  'upgrade_shoes_desc': { en: 'Increases your movement speed by 50%.', fr: 'Augmente votre vitesse de 50%.' },
  'upgrade_bicycle_name': { en: 'Bicycle', fr: 'Bicyclette' },
  'upgrade_bicycle_desc': { en: '+35% speed, +10 carry capacity.', fr: '+35% vitesse, +10 capacité.' },
  'upgrade_bikeTrailer_name': { en: 'Bike Trailer', fr: 'Remorque de vélo' },
  'upgrade_bikeTrailer_desc': { en: '+60 carry capacity, -5% speed. Requires Bicycle.', fr: '+60 capacité, -5% vitesse. Requiert Bicyclette.' },
  'upgrade_parka_name': { en: 'Parka', fr: 'Parka' },
  'upgrade_parka_desc': { en: 'Prevents cold damage near the Canal in winter.', fr: 'Prévient les dégâts de froid près du Canal en hiver.' },
  'upgrade_otrain_name': { en: 'O-Train Pass', fr: "Passe d'O-Train" },
  'upgrade_otrain_desc': { en: 'Occasionally triggers a multi-spawn of items.', fr: 'Déclenche parfois une apparition multiple d’objets.' },
  'upgrade_map_name': { en: 'City Map', fr: 'Carte de la ville' },
  'upgrade_map_desc': { en: 'Shows a mini-map on your screen.', fr: 'Affiche une mini-carte sur votre écran.' },
  'upgrade_vest_name': { en: 'Reflector Vest', fr: 'Veste réfléchissante' },
  'upgrade_vest_desc': { en: 'Get a 10% bonus when selling items.', fr: 'Obtenez un bonus de 10% lors de la vente.' },

  // Help Modal
  'help_title': { en: 'How to Play', fr: 'Comment Jouer' },
  'help_goal_title': { en: 'Goal:', fr: 'Objectif :' },
  'help_goal_desc': { en: 'Collect cans in Ottawa, store them at your stash house (📦), then cross a bridge to Québec to sell them at the refund depot (🏪) for cash!', fr: 'Ramassez des canettes à Ottawa, stockez-les dans votre planque (📦), puis traversez un pont vers le Québec pour les vendre au dépôt de remboursement (🏪) contre de l\'argent !', },
  'help_controls_title': { en: 'Controls:', fr: 'Contrôles :' },
  'help_controls_desc': { en: 'Click/tap to move. Use the 🚶 button to activate crosswalks near roads.', fr: 'Cliquez/appuyez pour vous déplacer. Utilisez le bouton 🚶 pour activer les traverses piétonnes près des routes.', },
  'help_hazards_title': { en: 'Hazards:', fr: 'Dangers :'},
  'help_hazards_desc': { en: 'Watch out for traffic and grumpy locals! Getting hit will lower your HP. If it reaches zero, you respawn.', fr: 'Attention à la circulation et aux habitants grincheux ! Être heurté diminuera vos PV. S\'ils atteignent zéro, vous réapparaissez.'},
  'help_rules_title': { en: 'The Rules:', fr: 'Les règles :'},
  'help_rules_desc': { en: "Just like real life, Québec has a better deposit system. That's why you have to cross the river to get your refunds!", fr: 'Tout comme dans la vraie vie, le Québec a un meilleur système de consigne. C\'est pourquoi vous devez traverser la rivière pour obtenir vos remboursements !'},
  
  // Toasts
  'toast_purchased': { en: 'Purchased!', fr: 'Acheté !' },
  'toast_owned': { en: 'Already purchased!', fr: 'Déjà acheté !' },
  'toast_no_money': { en: 'Not enough money!', fr: "Pas assez d'argent !" },
  'toast_reset': { en: 'Game progress has been reset.', fr: 'La progression du jeu a été réinitialisée.' },
  'toast_detour': { en: 'Detour! Alexandra Bridge is under repair.', fr: 'Détour ! Le pont Alexandra est en réparation.' },
  'toast_need_bridge': { en: 'Find a bridge to cross the river!', fr: 'Trouvez un pont pour traverser la rivière !' },
  'toast_stash_full': { en: 'Stash is full!', fr: 'La planque est pleine !' },
  'toast_quest_complete': { en: 'Quest complete! Reward collected.', fr: 'Quête terminée ! Récompense obtenue.' },

  // Landmarks
  'landmark_parliament': { en: 'Parliament Hill', fr: 'Colline du Parlement' },
  'landmark_byward_market': { en: 'ByWard Market', fr: 'Marché By' },
  'landmark_national_gallery': { en: 'National Gallery', fr: 'Musée des beaux-arts' },
  'landmark_rideau_centre': { en: 'Rideau Centre', fr: 'Centre Rideau' },
  'landmark_shaw_centre': { en: 'Shaw Centre', fr: 'Centre Shaw' },
  'landmark_uottawa': { en: 'uOttawa', fr: 'uOttawa' },
  'landmark_confederation_park': { en: 'Confederation Park', fr: 'Parc de la Confédération' },
  'landmark_lansdowne': { en: 'Lansdowne Park', fr: 'Parc Lansdowne' },
  'landmark_dows_lake': { en: 'Dow’s Lake', fr: 'Lac Dow' },
  'landmark_little_italy': { en: 'Little Italy', fr: 'Petite Italie' },
  'landmark_hintonburg': { en: 'Hintonburg', fr: 'Hintonburg' },
  'landmark_westboro': { en: 'Westboro', fr: 'Westboro' },
  'landmark_war_museum': { en: 'War Museum', fr: 'Musée de la guerre' },
  'landmark_supreme_court': { en: 'Supreme Court', fr: 'Cour suprême' },
  'landmark_chateau_laurier': { en: 'Château Laurier', fr: 'Château Laurier' },
  'landmark_chinatown': { en: 'Chinatown', fr: 'Quartier chinois' },
  'landmark_glebe': { en: 'The Glebe', fr: 'The Glebe' },
  'landmark_tunneys_pasture': { en: 'Tunney’s Pasture', fr: 'Pré Tunney' },
  'landmark_bayview': { en: 'Bayview Stn', fr: 'Stn Bayview' },
  'landmark_pimisi': { en: 'Pimisi Stn', fr: 'Stn Pimisi' },
  'landmark_history_museum': { en: 'Museum of History', fr: "Musée de l'histoire" },
  'landmark_jacques_cartier_park': { en: 'Jacques-Cartier Park', fr: 'Parc Jacques-Cartier' },

  // Bridges
  'bridge_macdonald_cartier': { en: 'Macdonald-Cartier Bridge', fr: 'Pont Macdonald-Cartier'},
  'bridge_alexandra': { en: 'Alexandra Bridge', fr: 'Pont Alexandra'},
  'bridge_portage': { en: 'Portage Bridge', fr: 'Pont du Portage'},
  'bridge_chaudiere': { en: 'Chaudière Crossing', fr: 'Passage Chaudière'},
  'bridge_champlain': { en: 'Champlain Bridge', fr: 'Pont Champlain'},
};

export const t = (key: string, lang: Language): string => {
  return translations[key]?.[lang] || key;
};