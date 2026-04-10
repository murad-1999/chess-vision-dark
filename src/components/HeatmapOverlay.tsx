import React from 'react';

interface HeatmapOverlayProps {
  tensionMatrix: Record<string, number>;
  flipped?: boolean;
}

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = React.memo(({ tensionMatrix, flipped = false }) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = flipped ? [...files].reverse() : files;
  const displayRanks = flipped ? [...ranks].reverse() : ranks;

  return (
    <div className="absolute inset-0 pointer-events-none grid grid-cols-8 grid-rows-8 z-10">
      {displayRanks.map(rank =>
        displayFiles.map(file => {
          const square = `${file}${rank}`;
          const value = tensionMatrix[square] || 0;
          return (
            <div
              key={square}
              className="w-full h-full"
              style={{
                backgroundColor: value > 0 ? `rgba(239, 68, 68, ${value})` : 'transparent',
              }}
            />
          );
        })
      )}
    </div>
  );
});
