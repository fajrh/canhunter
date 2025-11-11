import React from 'react';
import type { Quest } from '../types.ts';

interface HudProps {
  money: number;
  inventoryCount: number;
  inventoryCap: number;
  activeQuest: Quest | null;
  gameTime: number;
}

const Hud: React.FC<HudProps> = ({ money, inventoryCount, inventoryCap, activeQuest, gameTime }) => {
  const inventoryColor = inventoryCount >= inventoryCap ? 'text-red-400' : 'text-white';
  const questProgress = activeQuest ? (activeQuest.progress / activeQuest.targetCount) * 100 : 0;

  // Convert gameTime (ms) to in-game clock time (1 real sec = 1 game min)
  const formatGameTime = (time: number): string => {
    const totalGameSeconds = time / 1000;
    const gameMinutes = Math.floor(totalGameSeconds % 60);
    // Start day at 8 AM. A full 24h cycle takes 24 real minutes.
    let gameHours = (8 + Math.floor(totalGameSeconds / 60)) % 24;
    
    const ampm = gameHours >= 12 ? 'PM' : 'AM';
    gameHours = gameHours % 12;
    gameHours = gameHours ? gameHours : 12; // the hour '0' should be '12'
    
    const minutesStr = gameMinutes < 10 ? `0${gameMinutes}` : gameMinutes;
    
    return `${gameHours}:${minutesStr} ${ampm}`;
  };
  
  return (
    <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 bg-black/30 backdrop-blur-sm pointer-events-none text-outline">
      <div className="flex justify-between items-start text-lg sm:text-2xl font-bold">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <span>💰 ${money.toFixed(2)}</span>
          <span className={inventoryColor}>
            ♻️ {inventoryCount}/{inventoryCap}
          </span>
        </div>
        <div className="text-right">
          <span>{formatGameTime(gameTime)}</span>
          <p className="text-yellow-400 text-[8px] font-['Arial'] leading-none tracking-wider">v.1.2.0</p>
        </div>
      </div>
      {activeQuest && (
        <div className="mt-2">
            <p className="text-xs sm:text-sm truncate">{activeQuest.description}</p>
            <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1">
                <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${Math.min(100, questProgress)}%` }}></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Hud;
