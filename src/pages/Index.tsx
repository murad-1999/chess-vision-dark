import { useState, useCallback, useEffect, useRef } from 'react';
import { Sun, Moon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chess } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard';
import { EvalBar } from '@/components/EvalBar';
import { MoveList } from '@/components/MoveList';
import { NavigationControls } from '@/components/NavigationControls';
import { GameInput } from '@/components/GameInput';
import { CapturedPieces } from '@/components/CapturedPieces';
import { detectInputType, fetchPgnFromUrl, evaluateMaterial } from '@/lib/chess-utils';
import { detectOpening } from '@/lib/openings';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const ENGINE_BASE_URL = 'http://localhost:8000';

interface EngineEval {
  centipawns?: number;
  winning_chances?: number;
  mate?: number | null;
}

interface GameState {
  moves: string[];
  fens: string[];
  lastMoves: ({ from: string; to: string } | null)[];
  headers: Record<string, string>;
  engineEvals: EngineEval[];
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [flipped, setFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingTaskId, setPollingTaskId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [inputOpen, setInputOpen] = useState(true);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleTheme = useCallback(() => {
    document.documentElement.classList.toggle('dark');
    setIsDark(d => !d);
  }, []);

  const loadGame = useCallback(async (input: string) => {
    setError(null);
    setLoading(true);
    setIsPlaying(false);
    setPollingTaskId(null);

    try {
      const type = detectInputType(input);
      let pgn = '';

      if (type === 'fen') {
        const chess = new Chess(input.trim());
        setGameState({
          moves: [],
          fens: [chess.fen()],
          lastMoves: [null],
          headers: {},
          engineEvals: [],
        });
        setCurrentMoveIndex(0);
        setLoading(false);
        setInputOpen(false);
        return;
      }

      if (type === 'chess.com' || type === 'lichess') {
        pgn = await fetchPgnFromUrl(input.trim(), type);
      } else if (type === 'pgn') {
        pgn = input.trim();
      } else {
        throw new Error('Could not detect input format');
      }

      const chess = new Chess();
      chess.loadPgn(pgn);
      const headers = chess.header() as unknown as Record<string, string>;
      const history = chess.history({ verbose: true });

      const fens: string[] = [];
      const lastMoves: ({ from: string; to: string } | null)[] = [];
      const moveNames: string[] = [];

      const replay = new Chess();
      fens.push(replay.fen());
      lastMoves.push(null);

      for (const move of history) {
        replay.move(move.san);
        fens.push(replay.fen());
        lastMoves.push({ from: move.from, to: move.to });
        moveNames.push(move.san);
      }

      setGameState({ moves: moveNames, fens, lastMoves, headers, engineEvals: [] });
      setCurrentMoveIndex(-1);
      setInputOpen(false);

      // Submit to engine for analysis
      try {
        const resp = await fetch(`${ENGINE_BASE_URL}/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pgn_string: pgn }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.task_id) {
            setPollingTaskId(data.task_id);
          }
        }
      } catch {
        // Engine not available, silently fall back to material eval
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load game');
    }
    setLoading(false);
  }, []);

  // Poll engine task
  useEffect(() => {
    if (!pollingTaskId) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const resp = await fetch(`${ENGINE_BASE_URL}/task/${pollingTaskId}`);
        if (!resp.ok) {
          setPollingTaskId(null);
          return;
        }
        const data = await resp.json();
        if (data.status === 'completed' && data.results) {
          setGameState(prev => prev ? { ...prev, engineEvals: data.results } : prev);
          setPollingTaskId(null);
          return;
        }
        if (data.status === 'failed') {
          setPollingTaskId(null);
          return;
        }
      } catch {
        setPollingTaskId(null);
        return;
      }
      if (!cancelled) {
        setTimeout(poll, 1000);
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [pollingTaskId]);

  // Navigation
  const goToMove = useCallback((idx: number) => {
    if (!gameState) return;
    const clamped = Math.max(-1, Math.min(idx, gameState.moves.length - 1));
    setCurrentMoveIndex(clamped);
  }, [gameState]);

  const goFirst = useCallback(() => goToMove(-1), [goToMove]);
  const goPrev = useCallback(() => goToMove(currentMoveIndex - 1), [goToMove, currentMoveIndex]);
  const goNext = useCallback(() => goToMove(currentMoveIndex + 1), [goToMove, currentMoveIndex]);
  const goLast = useCallback(() => {
    if (gameState) goToMove(gameState.moves.length - 1);
  }, [goToMove, gameState]);

  // Auto-play
  useEffect(() => {
    if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    if (isPlaying && gameState) {
      playIntervalRef.current = setInterval(() => {
        setCurrentMoveIndex((prev) => {
          if (prev >= gameState.moves.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, speed, gameState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); goPrev(); break;
        case 'ArrowRight': e.preventDefault(); goNext(); break;
        case 'Home': e.preventDefault(); goFirst(); break;
        case 'End': e.preventDefault(); goLast(); break;
        case ' ': e.preventDefault(); setIsPlaying((p) => !p); break;
        case 'f': case 'F': setFlipped((f) => !f); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goFirst, goPrev, goNext, goLast]);

  const currentFenIndex = gameState ? currentMoveIndex + 1 : 0;
  const currentFen = gameState ? gameState.fens[currentFenIndex] || gameState.fens[0] : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const currentLastMove = gameState ? gameState.lastMoves[currentFenIndex] : null;

  // Engine eval for current position
  const currentEngineEval = gameState?.engineEvals?.[currentFenIndex];
  const evalCentipawns = currentEngineEval?.centipawns != null ? currentEngineEval.centipawns / 100 : null;
  const evalWinningChances = currentEngineEval?.winning_chances ?? null;
  const evalMate = currentEngineEval?.mate ?? null;

  // Fallback to material eval if no engine data
  const materialEval = evaluateMaterial(currentFen);
  const displayEval = evalCentipawns ?? materialEval;

  // Opening detection
  const currentMoves = gameState ? gameState.moves.slice(0, currentMoveIndex + 1) : [];
  const opening = detectOpening(currentMoves);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg">♔</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Chess Game Viewer</h1>
          </div>
          <div className="flex items-center gap-2">
            {pollingTaskId && (
              <span className="text-xs text-muted-foreground animate-pulse mr-2">
                ⟳ Analyzing...
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title="Toggle light/dark mode"
              className="rounded-full"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6">
        {/* Collapsible input panel */}
        <Collapsible open={inputOpen} onOpenChange={setInputOpen}>
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm mb-6 overflow-hidden">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors">
                <span className="text-sm font-medium text-foreground">
                  {gameState ? 'Load a different game' : 'Import a game'}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    inputOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-4 border-t border-border/50">
                <GameInput onLoad={loadGame} loading={loading} error={error} />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Game viewer */}
        {gameState && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Board column */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {/* Captured pieces (top) */}
              <div className="flex items-center gap-2 min-h-[24px] px-1">
                <CapturedPieces fen={currentFen} />
              </div>

              <div className="flex gap-2">
                <EvalBar
                  evaluation={displayEval}
                  winningChances={evalWinningChances}
                  mate={evalMate}
                  flipped={flipped}
                />
                <ChessBoard fen={currentFen} flipped={flipped} lastMove={currentLastMove} />
              </div>

              {/* Opening name */}
              {opening && (
                <div className="text-xs text-muted-foreground mt-1 px-1">
                  <span className="font-mono text-primary/80 mr-1">{opening.eco}</span>
                  {opening.name}
                </div>
              )}
            </div>

            {/* Right panel — flush with board height */}
            <div className="flex flex-col lg:w-80 w-full min-w-0 rounded-xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden self-stretch">
              <MoveList
                moves={gameState.moves}
                currentMoveIndex={currentMoveIndex}
                onMoveClick={goToMove}
                headers={gameState.headers}
              />
              <div className="border-t border-border bg-muted/40 p-3 shrink-0">
                <NavigationControls
                  onFirst={goFirst}
                  onPrev={goPrev}
                  onNext={goNext}
                  onLast={goLast}
                  onFlip={() => setFlipped((f) => !f)}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying((p) => !p)}
                  speed={speed}
                  onSpeedChange={setSpeed}
                  canPrev={currentMoveIndex > -1}
                  canNext={currentMoveIndex < gameState.moves.length - 1}
                />
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!gameState && !inputOpen && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <span className="text-5xl mb-4 opacity-30">♟</span>
            <p className="text-sm">Import a game to get started</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setInputOpen(true)}>
              Open import panel
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
