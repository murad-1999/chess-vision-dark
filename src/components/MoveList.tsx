import { ScrollArea } from '@/components/ui/scroll-area';

interface MoveListProps {
  moves: string[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
  headers?: Record<string, string>;
}

export function MoveList({ moves, currentMoveIndex, onMoveClick, headers }: MoveListProps) {
  // Group moves into pairs (white, black)
  const pairs: { num: number; white: string; black?: string; whiteIdx: number; blackIdx?: number }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
      whiteIdx: i,
      blackIdx: i + 1 < moves.length ? i + 1 : undefined,
    });
  }

  return (
    <div className="flex flex-col h-full border border-border rounded-md bg-card overflow-hidden">
      {/* Game info header */}
      {headers && (headers.White || headers.Black || headers.Event) && (
        <div className="p-3 border-b border-border space-y-0.5">
          {headers.Event && <p className="text-xs text-muted-foreground">{headers.Event}</p>}
          {(headers.White || headers.Black) && (
            <p className="text-sm font-medium">
              {headers.White || '?'} vs {headers.Black || '?'}
            </p>
          )}
          {headers.Result && <p className="text-xs text-muted-foreground">{headers.Result}</p>}
        </div>
      )}

      <ScrollArea className="flex-1 p-2">
        {pairs.length === 0 ? (
          <p className="text-sm text-muted-foreground p-2">No moves to display</p>
        ) : (
          <div className="space-y-0.5">
            {pairs.map((pair) => (
              <div key={pair.num} className="flex text-sm font-mono">
                <span className="w-8 text-muted-foreground text-right mr-2 shrink-0">{pair.num}.</span>
                <button
                  className={`px-1.5 py-0.5 rounded text-left hover:bg-accent/50 transition-colors ${
                    currentMoveIndex === pair.whiteIdx ? 'bg-primary/20 text-primary font-semibold' : ''
                  }`}
                  onClick={() => onMoveClick(pair.whiteIdx)}
                >
                  {pair.white}
                </button>
                {pair.black && pair.blackIdx !== undefined && (
                  <button
                    className={`px-1.5 py-0.5 rounded text-left hover:bg-accent/50 transition-colors ml-1 ${
                      currentMoveIndex === pair.blackIdx ? 'bg-primary/20 text-primary font-semibold' : ''
                    }`}
                    onClick={() => onMoveClick(pair.blackIdx!)}
                  >
                    {pair.black}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
