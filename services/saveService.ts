import type { GameState } from '../types';

const SAVE_KEY = 'canHunterOttawaSave';

type StorableGameState = Omit<GameState, 'player'> & {
    player: Omit<GameState['player'], 'upgrades'> & {
        upgrades: string[];
    };
};

class SaveService {
  saveGame(state: GameState) {
    try {
        const storableState: StorableGameState = {
            ...state,
            player: {
                ...state.player,
                upgrades: Array.from(state.player.upgrades),
            },
        };
      localStorage.setItem(SAVE_KEY, JSON.stringify(storableState));
    } catch (error) {
      console.error("Failed to save game state:", error);
    }
  }

  loadGame(): GameState | null {
    try {
      const savedData = localStorage.getItem(SAVE_KEY);
      if (savedData) {
        const parsed: StorableGameState = JSON.parse(savedData);
        // We only return the parsed data. The useGameEngine hook will reconstruct the Set.
        return parsed as any; // Cast because the hook will fix the Set
      }
      return null;
    } catch (error) {
      console.error("Failed to load game state:", error);
      return null;
    }
  }

  clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (error) {
      console.error("Failed to clear save data:", error);
    }
  }
}

export const saveService = new SaveService();