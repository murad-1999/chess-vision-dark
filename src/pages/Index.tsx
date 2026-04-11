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
import { TensionMetric } from '@/components/TensionMetric';
import { HeatmapOverlay } from '@/components/HeatmapOverlay';
import { EntropyGraph, EntropyDataPoint } from '@/components/EntropyGraph';
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

  // Dummy state variables for tension and entropy components
  const [tensionMatrix, setTensionMatrix] = useState<Record<string, number>>({});
  const [entropyData, setEntropyData] = useState<EntropyDataPoint[]>([]);
  const [currentEntropy, setCurrentEntropy] = useState<number>(0);

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
      <header className="w-full border-b border-border/60 bg-card/90 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-black/5">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
              <span className="text-2xl">♔</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Chess Game Viewer</h1>
          </div>
          <div className="flex items-center gap-3">
            {pollingTaskId && (
              <span className="text-sm text-muted-foreground animate-pulse mr-2 bg-muted/50 px-4 py-2 rounded-full">
                ⟳ Analyzing...
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title="Toggle light/dark mode"
              className="rounded-xl hover:bg-muted/80 transition-all duration-200"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        {/* Collapsible input panel */}
        <Collapsible open={inputOpen} onOpenChange={setInputOpen}>
          <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm mb-8 overflow-hidden shadow-lg shadow-black/10">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/20 transition-all duration-200">
                <span className="text-base font-medium text-foreground">
                  {gameState ? 'Load a different game' : 'Import a game'}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ease-out ${
                    inputOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-5 border-t border-border/40">
                <GameInput onLoad={loadGame} loading={loading} error={error} />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Game viewer */}
        {gameState && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Board column */}
            <div className="flex flex-col gap-3 flex-shrink-0 max-w-[672px] lg:max-w-[720px] w-full">
              {/* Captured pieces & Tension */}
              <div className="flex items-center justify-between min-h-[28px] px-2">
                <CapturedPieces fen={currentFen} />
                <TensionMetric currentEntropy={currentEntropy} />
              </div>

              <div className="flex gap-3 rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-border/60">
                <EvalBar
                  evaluation={displayEval}
                  winningChances={evalWinningChances}
                  mate={evalMate}
                  flipped={flipped}
                />
                <div className="relative flex-1">
                  <ChessBoard fen={currentFen} flipped={flipped} lastMove={currentLastMove} />
                  <HeatmapOverlay tensionMatrix={tensionMatrix} flipped={flipped} />
                </div>
              </div>

              <div className="w-full">
                <EntropyGraph data={entropyData} />
              </div>

              {/* Opening name */}
              {opening && (
                <div className="text-sm text-muted-foreground px-3 py-2.5 bg-muted/30 rounded-lg inline-block self-start">
                  <span className="font-mono text-primary/90 mr-2 font-semibold">{opening.eco}</span>
                  {opening.name}
                </div>
              )}
            </div>

            {/* Right panel — flush with board height */}
            <div className="flex flex-col lg:w-96 w-full min-w-0 max-h-[672px] lg:max-h-[720px] rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden self-stretch shadow-xl shadow-black/15">
              <MoveList
                moves={gameState.moves}
                currentMoveIndex={currentMoveIndex}
                onMoveClick={goToMove}
                headers={gameState.headers}
              />
              <div className="border-t border-border/50 bg-muted/50 p-4 shrink-0">
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
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="w-28 h-28 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 shadow-inner">
              <span className="text-7xl opacity-40">♟</span>
            </div>
            <p className="text-lg font-medium">Import a game to get started</p>
            <p className="text-base text-muted-foreground/70 mt-2">Paste PGN, FEN, or a game URL</p>
            <Button variant="secondary" size="default" className="mt-6 px-8 rounded-xl" onClick={() => setInputOpen(true)}>
              Open import panel
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
