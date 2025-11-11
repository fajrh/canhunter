import React from 'react';
import type { UpgradeId } from '../types';
import { UPGRADES } from '../constants';

interface UpgradesModalProps {
  playerMoney: number;
  purchasedUpgrades: Set<UpgradeId>;
  onClose: () => void;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
  onReset: () => void;
}

const UpgradesModal: React.FC<UpgradesModalProps> = ({
  playerMoney,
  purchasedUpgrades,
  onClose,
  onBuyUpgrade,
  onReset,
}) => {
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Upgrades ⚙️</h2>
          <button onClick={onClose} className="text-3xl">&times;</button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <ul className="space-y-3">
            {Object.values(UPGRADES).map(upgrade => {
              const isPurchased = purchasedUpgrades.has(upgrade.id);
              const canAfford = playerMoney >= upgrade.cost;
              return (
                <li key={upgrade.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-4xl mr-4">{upgrade.emoji}</span>
                    <div>
                      <h3 className="font-bold">{upgrade.name}</h3>
                      <p className="text-sm text-gray-400">{upgrade.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onBuyUpgrade(upgrade.id)}
                    disabled={isPurchased || !canAfford}
                    className="px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50
                      enabled:bg-green-600 enabled:hover:bg-green-500 enabled:active:bg-green-700
                      disabled:bg-gray-600"
                  >
                    {isPurchased ? 'OWNED' : `$${upgrade.cost.toFixed(2)}`}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="p-4 mt-auto border-t border-gray-700">
          <button
              onClick={onReset}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
              Reset Save Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradesModal;