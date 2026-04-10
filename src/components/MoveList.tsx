import { ScrollArea } from '@/components/ui/scroll-area';

interface MoveListProps {
  moves: string[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
  headers?: Record<string, string>;
}

export function MoveList({ moves, currentMoveIndex, onMoveClick, headers }: MoveListProps) {
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
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Game info header */}
      {headers && (headers.White || headers.Black || headers.Event) && (
        <div className="px-4 py-3 border-b border-border/50 bg-card/40">
          {headers.Event && <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{headers.Event}</p>}
          {(headers.White || headers.Black) && (
            <p className="text-sm font-semibold mt-0.5">
              {headers.White || '?'} <span className="text-muted-foreground font-normal">vs</span> {headers.Black || '?'}
            </p>
          )}
          {headers.Result && (
            <span className="inline-block mt-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {headers.Result}
            </span>
          )}
        </div>
      )}

      <ScrollArea className="flex-1 p-2">
        {pairs.length === 0 ? (
          <p className="text-sm text-muted-foreground p-2">No moves to display</p>
        ) : (
          <div className="space-y-px">
            {pairs.map((pair) => (
              <div key={pair.num} className="flex text-sm font-mono items-center">
                <span className="w-8 text-muted-foreground/60 text-right mr-2 shrink-0 text-xs">{pair.num}.</span>
                <button
                  className={`px-2 py-1 rounded-md text-left transition-colors text-xs ${
                    currentMoveIndex === pair.whiteIdx
                      ? 'bg-primary/15 text-primary font-semibold ring-1 ring-primary/20'
                      : 'hover:bg-accent/40'
                  }`}
                  onClick={() => onMoveClick(pair.whiteIdx)}
                >
                  {pair.white}
                </button>
                {pair.black && pair.blackIdx !== undefined && (
                  <button
                    className={`px-2 py-1 rounded-md text-left transition-colors ml-1 text-xs ${
                      currentMoveIndex === pair.blackIdx
                        ? 'bg-primary/15 text-primary font-semibold ring-1 ring-primary/20'
                        : 'hover:bg-accent/40'
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
