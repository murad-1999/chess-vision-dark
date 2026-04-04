import { Chess } from 'chess.js';

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

export function evaluateMaterial(fen: string): number {
  const chess = new Chess(fen);
  const board = chess.board();
  let eval_ = 0;
  for (const row of board) {
    for (const sq of row) {
      if (sq) {
        const val = PIECE_VALUES[sq.type] || 0;
        eval_ += sq.color === 'w' ? val : -val;
      }
    }
  }
  return eval_;
}

export function detectInputType(input: string): 'fen' | 'pgn' | 'chess.com' | 'lichess' | 'unknown' {
  const trimmed = input.trim();
  if (trimmed.includes('chess.com')) return 'chess.com';
  if (trimmed.includes('lichess.org')) return 'lichess';
  // FEN: typically has 6 space-separated fields with slashes
  if (/^[rnbqkpRNBQKP1-8\/]+ [wb] [KQkq-]+ [a-h1-8-]+ \d+ \d+$/.test(trimmed)) return 'fen';
  if (trimmed.length > 0) return 'pgn';
  return 'unknown';
}

export async function fetchPgnFromUrl(url: string, type: 'chess.com' | 'lichess'): Promise<string> {
  if (type === 'lichess') {
    // Extract game ID from URL
    const match = url.match(/lichess\.org\/([a-zA-Z0-9]{8,12})/);
    if (!match) throw new Error('Invalid Lichess URL');
    const gameId = match[1];
    const resp = await fetch(`https://lichess.org/game/export/${gameId}?pgnInJson=true`, {
      headers: { Accept: 'application/x-chess-pgn' },
    });
    if (!resp.ok) throw new Error('Failed to fetch from Lichess');
    return resp.text();
  }

  if (type === 'chess.com') {
    // chess.com URL format: /game/live/12345 or /game/daily/12345
    // Try the public API
    const match = url.match(/chess\.com\/(?:game\/)?(?:live|daily)\/(\d+)/);
    if (!match) throw new Error('Invalid Chess.com URL. Use format: chess.com/game/live/12345');
    const gameId = match[1];
    const resp = await fetch(`https://api.chess.com/pub/game/${gameId}`);
    if (!resp.ok) throw new Error('Failed to fetch from Chess.com. The game may be private.');
    const data = await resp.json();
    return data.pgn || '';
  }

  throw new Error('Unknown URL type');
}

const PIECE_UNICODE: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

export function getPieceUnicode(color: string, type: string): string {
  return PIECE_UNICODE[color + type] || '';
}

export const SAMPLE_PGN = `[Event "Immortal Game"]
[Site "London"]
[Date "1851.06.21"]
[White "Anderssen, Adolf"]
[Black "Kieseritzky, Lionel"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`;
