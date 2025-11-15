import React from 'react';
import type { Quest, Language } from '../types.ts';
import { t } from '../services/localization.ts';
import { SPEED_BOOST_DURATION } from '../constants.ts';

interface HudProps {
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
  speedBoostTimer: number;
}

const Hud: React.FC<HudProps> = ({ money, inventoryCount, inventoryCap, stashCount, stashCap, hp, maxHp, activeQuest, gameTime, language, speedBoostTimer }) => {
  const inventoryColor = inventoryCount >= inventoryCap ? 'text-red-400' : 'text-white';
  const stashColor = stashCount >= stashCap ? 'text-red-400' : 'text-white';
  const hpColor = hp / maxHp < 0.3 ? 'bg-red-500' : 'bg-green-500';
  const boostPercent = Math.min(100, (speedBoostTimer / SPEED_BOOST_DURATION) * 100);

  const formatGameTime = (time: number): string => {
    const totalGameSeconds = time / 1000;
    const gameMinutes = Math.floor(totalGameSeconds % 60);
    let gameHours = (8 + Math.floor(totalGameSeconds / 60)) % 24;
    const ampm = gameHours >= 12 ? 'PM' : 'AM';
    gameHours = gameHours % 12; gameHours = gameHours ? gameHours : 12;
    const minutesStr = gameMinutes < 10 ? `0${gameMinutes}` : gameMinutes;
    return `${gameHours}:${minutesStr} ${ampm}`;
  };
  
  return (
    <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 bg-black/30 backdrop-blur-sm pointer-events-none text-outline">
      <div className="flex justify-between items-start text-base sm:text-xl font-bold">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <span>💰 ${money.toFixed(2)}</span>
          <span className={inventoryColor}>🎒 {inventoryCount}/{inventoryCap}</span>
          <span className={stashColor}>📦 {stashCount}/{stashCap}</span>
        </div>
        <div className="text-right">
          <span>{formatGameTime(gameTime)}</span>
           <p className="text-yellow-400 text-[8px] font-['Arial'] leading-none tracking-wider">v.1.3.2</p>
        </div>
      </div>
      <div className="mt-2">
        <div className="flex items-center">
            <span className="text-sm font-bold mr-2">HP</span>
            <div className="w-24 bg-gray-600 rounded-full h-4 border-2 border-black/50">
                <div className={`${hpColor} h-full rounded-full`} style={{ width: `${(hp / maxHp) * 100}%` }}></div>
            </div>
        </div>
      </div>
      {activeQuest && (
        <div className="mt-2">
            <p className="text-xs sm:text-sm truncate">{t(activeQuest.descriptionKey, language)} ({activeQuest.progress}/{activeQuest.targetCount})</p>
            <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1">
                <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${Math.min(100, (activeQuest.progress / activeQuest.targetCount) * 100)}%` }}></div>
            </div>
        </div>
      )}
      {speedBoostTimer > 0 && (
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-xs sm:text-sm text-yellow-300 font-semibold">⚡ {t('hud_boost', language)}</span>
          <div className="flex-1 bg-gray-600 rounded-full h-2.5">
            <div className="bg-yellow-300 h-2.5 rounded-full transition-all" style={{ width: `${boostPercent}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hud;