interface EvalBarProps {
  evaluation: number; // positive = white advantage
  flipped: boolean;
}

export function EvalBar({ evaluation, flipped }: EvalBarProps) {
  // Clamp eval to -10..10 and map to percentage
  const clamped = Math.max(-10, Math.min(10, evaluation));
  const whitePercent = 50 + (clamped / 10) * 50;
  const displayPercent = flipped ? 100 - whitePercent : whitePercent;

  const sign = evaluation > 0 ? '+' : '';
  const displayEval = Math.abs(evaluation) >= 10 ? (evaluation > 0 ? '+10' : '-10') : `${sign}${evaluation.toFixed(1)}`;

  return (
    <div className="flex flex-col items-center w-6 rounded-md overflow-hidden border border-border h-full min-h-[200px]">
      {/* Black side */}
      <div
        className="w-full transition-all duration-300 flex items-start justify-center"
        style={{
          height: `${100 - displayPercent}%`,
          backgroundColor: 'hsl(220 15% 12%)',
        }}
      >
        {evaluation < 0 && (
          <span className="text-[9px] font-mono text-muted-foreground mt-1">{displayEval}</span>
        )}
      </div>
      {/* White side */}
      <div
        className="w-full transition-all duration-300 flex items-end justify-center"
        style={{
          height: `${displayPercent}%`,
          backgroundColor: 'hsl(210 20% 88%)',
        }}
      >
        {evaluation >= 0 && (
          <span className="text-[9px] font-mono text-foreground/80 mb-1" style={{ color: 'hsl(220 15% 15%)' }}>
            {displayEval}
          </span>
        )}
      </div>
    </div>
  );
}
