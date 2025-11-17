import React from 'react';

export type AmbientCard = {
  id: number;
  url: string;
  size?: 'sm' | 'md';
  expiresAt?: number;
};

interface AmbientImagesProps {
  cards: AmbientCard[];
}

const AmbientImages: React.FC<AmbientImagesProps> = ({ cards }) => {
  if (!cards.length) return null;
  return (
    <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none z-30">
      {cards.map((card) => (
        <div
          key={card.id}
          className="rounded-lg overflow-hidden shadow-lg border border-white/40 bg-black/50 backdrop-blur-sm"
          style={{ width: (card.size === 'md' ? 160 : 120) * 2.5 }}
        >
          <img
            src={card.url}
            alt="celebration"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

export default AmbientImages;
