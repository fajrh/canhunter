import { useState, useEffect, useRef, useCallback } from 'react';
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
import AmbientImages, { AmbientCard } from './components/AmbientImages';
import { CELEBRATION_IMAGE_URLS } from './constants';

export default function App() {
  const [isUpgradesOpen, setIsUpgradesOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioService.isMuted);
  const [ambientCards, setAmbientCards] = useState<AmbientCard[]>([]);
  const ambientIdRef = useRef(0);

  const {
    gameState,
    uiState,
    setTargetPosition,
    buyUpgrade,
    resetSave,
    toastMessage,
    clearToast,
    startCanRun,
  } = useGameEngine();

  const queueAmbient = useCallback(
    (durationMs: number, size: AmbientCard['size'] = 'sm') => {
      const url =
        CELEBRATION_IMAGE_URLS[
          Math.floor(Math.random() * CELEBRATION_IMAGE_URLS.length)
        ];
      const id = ambientIdRef.current++;
      const expiresAt = Date.now() + durationMs;
      setAmbientCards((cards) => {
        const now = Date.now();
        const trimmed = cards.filter((c) => !c.expiresAt || c.expiresAt > now);
        return [...trimmed.slice(-4), { id, url, size, expiresAt }];
      });
    },
    [],
  );

  useEffect(() => {
    const cleanup = window.setInterval(() => {
      const now = Date.now();
      setAmbientCards((cards) => cards.filter((c) => !c.expiresAt || c.expiresAt > now));
    }, 400);
    return () => window.clearInterval(cleanup);
  }, []);

  useEffect(() => {
    queueAmbient(8000, 'md');
  }, [queueAmbient]);

  const prevFullRef = useRef(false);
  useEffect(() => {
    if (uiState?.isInventoryFull && !prevFullRef.current) {
      queueAmbient(4000, 'sm');
    }
    prevFullRef.current = !!uiState?.isInventoryFull;
  }, [queueAmbient, uiState?.isInventoryFull]);

  const depositIntervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (uiState?.isDepositing) {
      queueAmbient(4000, 'sm');
      if (depositIntervalRef.current) window.clearInterval(depositIntervalRef.current);
      depositIntervalRef.current = window.setInterval(() => queueAmbient(4000, 'sm'), 4000);
    } else if (depositIntervalRef.current) {
      window.clearInterval(depositIntervalRef.current);
      depositIntervalRef.current = null;
    }
  }, [queueAmbient, uiState?.isDepositing]);

  useEffect(() => {
    if (uiState?.canRunStage) {
      queueAmbient(8000, 'md');
      const id = window.setInterval(() => {
        queueAmbient(8000, 'md');
      }, 8000);
      return () => window.clearInterval(id);
    }
  }, [queueAmbient, uiState?.canRunStage]);

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

      <AmbientImages cards={ambientCards} />

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

      {uiState.isPlayerNearStash &&
        uiState.stashCount >= uiState.stashCap &&
        !uiState.canRunStage && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg text-sm sm:text-base font-bold border border-white/30"
              onClick={startCanRun}
            >
              🚴 {t('can_run_button', uiState.language)}
            </button>
          </div>
        )}

      <Controls
        onUpgrades={() => setIsUpgradesOpen(true)}
        onHelp={() => setIsHelpOpen(true)}
        onMute={handleToggleMute}
        isMuted={isMuted}
        language={uiState.language}
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
