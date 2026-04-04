import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard';
import { EvalBar } from '@/components/EvalBar';
import { MoveList } from '@/components/MoveList';
import { NavigationControls } from '@/components/NavigationControls';
import { GameInput } from '@/components/GameInput';
import { detectInputType, fetchPgnFromUrl, evaluateMaterial } from '@/lib/chess-utils';

interface GameState {
  moves: string[];
  fens: string[];
  lastMoves: ({ from: string; to: string } | null)[];
  headers: Record<string, string>;
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [flipped, setFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadGame = useCallback(async (input: string) => {
    setError(null);
    setLoading(true);
    setIsPlaying(false);

    try {
      const type = detectInputType(input);
      let pgn = '';

      if (type === 'fen') {
        // Just load a FEN position, no moves
        const chess = new Chess(input.trim());
        setGameState({
          moves: [],
          fens: [chess.fen()],
          lastMoves: [null],
          headers: {},
        });
        setCurrentMoveIndex(0);
        setLoading(false);
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

      // Build FEN array for each position
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

      setGameState({ moves: moveNames, fens, lastMoves, headers });
      setCurrentMoveIndex(-1);
    } catch (e: any) {
      setError(e.message || 'Failed to load game');
    }
    setLoading(false);
  }, []);

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
  const evaluation = evaluateMaterial(currentFen);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">Chess Game Viewer</h1>

      <GameInput onLoad={loadGame} loading={loading} error={error} />

      {gameState && (
        <div className="mt-6 flex flex-col lg:flex-row gap-4 w-full max-w-4xl">
          {/* Board + Eval bar */}
          <div className="flex gap-2 justify-center">
            <EvalBar evaluation={evaluation} flipped={flipped} />
            <ChessBoard fen={currentFen} flipped={flipped} lastMove={currentLastMove} />
          </div>

          {/* Right panel: move list + controls */}
          <div className="flex flex-col gap-3 lg:w-64 w-full">
            <div className="flex-1 min-h-[200px] max-h-[400px]">
              <MoveList
                moves={gameState.moves}
                currentMoveIndex={currentMoveIndex}
                onMoveClick={goToMove}
                headers={gameState.headers}
              />
            </div>
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
      )}
    </div>
  );
};

export default Index;
