import { Chess } from 'chess.js';
import { ChessPiece } from '@/components/ChessPiece';

interface ChessBoardProps {
  fen: string;
  flipped: boolean;
  lastMove?: { from: string; to: string } | null;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export function ChessBoard({ fen, flipped, lastMove }: ChessBoardProps) {
  const chess = new Chess(fen);
  const board = chess.board();

  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const files = flipped ? [...FILES].reverse() : FILES;

  return (
    <div className="grid grid-cols-8 grid-rows-[repeat(8,1fr)] border border-border rounded-md overflow-hidden aspect-square w-full max-w-[672px]">
      {ranks.map((rank, ri) =>
        files.map((file, fi) => {
          const r = 8 - rank;
          const c = FILES.indexOf(file);
          const sq = board[r][c];
          const isLight = (ri + fi) % 2 === 0;
          const squareName = `${file}${rank}`;
          const isHighlighted = lastMove && (squareName === lastMove.from || squareName === lastMove.to);

          return (
            <div
              key={squareName}
              className="relative flex items-center justify-center select-none aspect-square"
              style={{
                backgroundColor: isHighlighted
                  ? 'hsl(var(--board-highlight) / 0.45)'
                  : isLight
                  ? 'hsl(var(--board-light))'
                  : 'hsl(var(--board-dark))',
                boxShadow: isHighlighted ? 'inset 0 0 0 1.5px hsl(var(--board-highlight) / 0.7)' : undefined,
              }}
            >
              {fi === 0 && (
                <span
                  className="absolute top-0.5 left-0.5 text-xs leading-none font-semibold"
                  style={{ color: isLight ? 'hsl(var(--board-dark))' : 'hsl(var(--board-light))' }}
                >
                  {rank}
                </span>
              )}
              {ri === 7 && (
                <span
                  className="absolute bottom-0.5 right-0.5 text-xs leading-none font-semibold"
                  style={{ color: isLight ? 'hsl(var(--board-dark))' : 'hsl(var(--board-light))' }}
                >
                  {file}
                </span>
              )}
              {sq && (
                <ChessPiece piece={sq.type} color={sq.color} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
