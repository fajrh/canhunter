import React, { useState, useMemo, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import Hud from './components/Hud';
import Controls from './components/Controls';
import UpgradesModal from './components/UpgradesModal';
import Toast from './components/Toast';
import { useGameEngine } from './hooks/useGameEngine';
import { audioService } from './services/audioService';
import GameMessage from './components/IntroPrompt';
import HelpModal from './components/HelpModal';


export default function App() {
  const [isUpgradesOpen, setIsUpgradesOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioService.isMuted);

  const {
    gameState,
    setTargetPosition,
    buyUpgrade,
    panCamera,
    resetSave,
    toastMessage,
    clearToast,
  } = useGameEngine();

  const isInventoryFull = gameState.player.inventory.length >= gameState.player.inventoryCap;

  const handleToggleMute = () => {
    audioService.toggleMute();
    setIsMuted(audioService.isMuted);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
      resetSave();
    }
  };

  const MemoizedGameCanvas = useMemo(() => (
    <GameCanvas
      gameState={gameState}
      onSetTargetPosition={setTargetPosition}
      onPan={panCamera}
      isInventoryFull={isInventoryFull}
    />
  ), [gameState, setTargetPosition, panCamera, isInventoryFull]);

  return (
    <div className="w-full h-full bg-gray-800 text-white font-sans select-none touch-callout-none">
      {!gameState.player.hasCollectedFirstCan && <GameMessage text="Click to move. Walk near items to collect!" />}
      {isInventoryFull && gameState.player.hasCollectedFirstCan && <GameMessage text="Inventory Full! Go to the kiosk 🏪 to sell." />}
      
      {MemoizedGameCanvas}

      <Hud
        money={gameState.player.money}
        inventoryCount={gameState.player.inventory.length}
        inventoryCap={gameState.player.inventoryCap}
        activeQuest={gameState.activeQuest}
        gameTime={gameState.gameTime}
      />

      <Controls
        onUpgrades={() => setIsUpgradesOpen(true)}
        onHelp={() => setIsHelpOpen(true)}
        onMute={handleToggleMute}
        isMuted={isMuted}
      />

      {isUpgradesOpen && (
        <UpgradesModal
          playerMoney={gameState.player.money}
          purchasedUpgrades={gameState.player.upgrades}
          onClose={() => setIsUpgradesOpen(false)}
          onBuyUpgrade={buyUpgrade}
          onReset={handleReset}
        />
      )}

      {isHelpOpen && (
          <HelpModal onClose={() => setIsHelpOpen(false)} />
      )}

      <Toast message={toastMessage} onDismiss={clearToast} />
    </div>
  );
}