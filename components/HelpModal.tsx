
import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold">How to Play ❓</h2>
          <button onClick={onClose} className="text-3xl">&times;</button>
        </div>
        <div className="p-6 space-y-4 text-gray-300 overflow-y-auto">
            <p><strong>Goal:</strong> Clean up the streets of Ottawa by collecting cans and bottles, then sell them for cash at the refund kiosk 🏪!</p>
            <p><strong>Controls:</strong> Click or tap anywhere on the map to move your character.</p>
            <p><strong>Collecting:</strong> Simply walk near cans 🥤 and bottles 🍾 to automatically pick them up.</p>
            <p><strong>Recycling Bins:</strong> Walk near recycling bins ♻️ that appear near houses to break them open for a bunch of extra items!</p>
            <p><strong>Selling:</strong> Walk near the kiosk 🏪 and you will automatically sell your inventory one item at a time.</p>
            <p><strong>Upgrades:</strong> Use your earnings to buy powerful upgrades from the "Upgrades" menu to improve your speed, capacity, and more!</p>
            <p><strong>Navigation:</strong> A yellow arrow › will point you towards your quest objective or the kiosk if you're lost.</p>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
