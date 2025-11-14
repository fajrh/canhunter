import React from 'react';
import type { UpgradeId, Language } from '../types';
import { UPGRADES } from '../constants';
import { t } from '../services/localization';

interface UpgradesModalProps {
  playerMoney: number;
  purchasedUpgrades: Set<UpgradeId>;
  onClose: () => void;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
  onReset: () => void;
  language: Language;
}

const UpgradesModal: React.FC<UpgradesModalProps> = ({
  playerMoney,
  purchasedUpgrades,
  onClose,
  onBuyUpgrade,
  onReset,
  language,
}) => {
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold">{t('upgrades_title', language)} ⚙️</h2>
          <button onClick={onClose} className="text-3xl">&times;</button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <ul className="space-y-3">
            {Object.values(UPGRADES).map(upgrade => {
              const isPurchased = purchasedUpgrades.has(upgrade.id);
              const canAfford = playerMoney >= upgrade.cost;
              const hasRequirement = upgrade.requires ? purchasedUpgrades.has(upgrade.requires) : true;
              
              let buttonText = isPurchased ? t('owned_button', language) : `$${upgrade.cost.toFixed(2)}`;
              if (!isPurchased && !hasRequirement) {
                  buttonText = `${t('requires_button', language)} ${UPGRADES[upgrade.requires!].emoji}`;
              }

              return (
                <li key={upgrade.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-4xl mr-4">{upgrade.id === 'bikeTrailer' ? '🛺' : upgrade.emoji}</span>
                    <div>
                      <h3 className="font-bold">{t(upgrade.nameKey, language)}</h3>
                      <p className="text-sm text-gray-400">{t(upgrade.descriptionKey, language)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onBuyUpgrade(upgrade.id)}
                    disabled={isPurchased || !canAfford || !hasRequirement}
                    className="px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50
                      enabled:bg-green-600 enabled:hover:bg-green-500 enabled:active:bg-green-700
                      disabled:bg-gray-600"
                  >
                    {buttonText}
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
              {t('reset_button', language)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradesModal;
