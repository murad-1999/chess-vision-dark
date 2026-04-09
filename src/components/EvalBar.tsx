interface EvalBarProps {
  evaluation: number | null;
  winningChances?: number | null;
  mate?: number | null;
  flipped: boolean;
}

export function EvalBar({ evaluation, winningChances, mate, flipped }: EvalBarProps) {
  let whitePercent = 50;
  let displayText = '0.0';

  if (mate != null && mate !== 0) {
    // Mate: bar fully one side
    whitePercent = mate > 0 ? 100 : 0;
    displayText = `M${Math.abs(mate)}`;
  } else if (winningChances != null) {
    // Winning chances: 0 = black wins, 1 = white wins, 0.5 = equal
    whitePercent = winningChances * 100;
    if (evaluation != null) {
      const sign = evaluation > 0 ? '+' : '';
      displayText = `${sign}${evaluation.toFixed(1)}`;
    }
  } else if (evaluation != null) {
    // Fallback: material-based
    const clamped = Math.max(-10, Math.min(10, evaluation));
    whitePercent = 50 + (clamped / 10) * 50;
    const sign = evaluation > 0 ? '+' : '';
    displayText = Math.abs(evaluation) >= 10
      ? (evaluation > 0 ? '+10' : '-10')
      : `${sign}${evaluation.toFixed(1)}`;
  }

  const displayPercent = flipped ? 100 - whitePercent : whitePercent;
  const favorsWhite = mate != null && mate !== 0 ? mate > 0 : (evaluation != null ? evaluation >= 0 : true);

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
        {!favorsWhite && (
          <span className="text-[9px] font-mono text-muted-foreground mt-1">{displayText}</span>
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
        {favorsWhite && (
          <span className="text-[9px] font-mono text-foreground/80 mb-1" style={{ color: 'hsl(220 15% 15%)' }}>
            {displayText}
          </span>
        )}
      </div>
    </div>
  );
}
