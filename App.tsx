import { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Hud from './components/Hud';
import Controls from './components/Controls';
import UpgradesModal from './components/UpgradesModal';
import Toast from './components/Toast';
import { useGameEngine } from './hooks/useGameEngine';
import { audioService } from './services/audioService';
import GameMessage from './components/IntroPrompt';
import HelpModal from './components/HelpModal';
import { t } from './services/localization';
import FlashMessage from './components/FlashMessage';
import InventoryFullPrompt from './components/InventoryFullPrompt';

export default function App() {
  const [isUpgradesOpen, setIsUpgradesOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioService.isMuted);

  const {
    gameState,
    uiState,
    setTargetPosition,
    buyUpgrade,
    resetSave,
    toastMessage,
    clearToast,
    activateCrosswalk,
  } = useGameEngine();

  const handleToggleMute = () => {
    audioService.toggleMute();
    setIsMuted(audioService.isMuted);
  };

  const handleReset = () => {
    if (window.confirm(t('reset_confirm', uiState.language))) {
      resetSave();
    }
  };

  // The game engine is not ready on the first render
  if (!uiState) {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-800 text-white font-sans select-none touch-callout-none">
      {!uiState.hasCollectedFirstCan && (
        <GameMessage text={t('intro_prompt', uiState.language)} />
      )}

      {uiState.isInventoryFull && uiState.hasCollectedFirstCan && (
        <InventoryFullPrompt
          text={t('inventory_full_prompt', uiState.language)}
        />
      )}

      <FlashMessage
        messageKey={uiState.flashMessageKey}
        language={uiState.language}
      />

      <GameCanvas
        gameStateRef={gameState}
        onSetTargetPosition={setTargetPosition}
      />

      <Hud
        money={uiState.money}
        inventoryCount={uiState.inventoryCount}
        inventoryCap={uiState.inventoryCap}
        activeQuest={uiState.activeQuest}
        gameTime={uiState.gameTime}
        language={uiState.language}
        hp={uiState.hp}
        maxHp={uiState.maxHp}
        stashCount={uiState.stashCount}
        stashCap={uiState.stashCap}
      />

      <Controls
        onUpgrades={() => setIsUpgradesOpen(true)}
        onHelp={() => setIsHelpOpen(true)}
        onMute={handleToggleMute}
        isMuted={isMuted}
        language={uiState.language}
        onCrosswalk={activateCrosswalk}
      />

      {isUpgradesOpen && (
        <UpgradesModal
          playerMoney={uiState.money}
          purchasedUpgrades={uiState.purchasedUpgrades}
          onClose={() => setIsUpgradesOpen(false)}
          onBuyUpgrade={buyUpgrade}
          onReset={handleReset}
          language={uiState.language}
        />
      )}

      {isHelpOpen && (
        <HelpModal
          onClose={() => setIsHelpOpen(false)}
          language={uiState.language}
        />
      )}

      <Toast
        messageKey={toastMessage}
        onDismiss={clearToast}
        language={uiState.language}
      />
    </div>
  );
}
