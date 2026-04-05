// Common chess openings mapped by move sequence
const OPENINGS: { moves: string; name: string; eco: string }[] = [
  { moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5', name: 'Ruy Lopez', eco: 'C60' },
  { moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4', name: 'Italian Game', eco: 'C50' },
  { moves: '1.e4 e5 2.Nf3 Nc6 3.d4', name: 'Scotch Game', eco: 'C45' },
  { moves: '1.e4 e5 2.Nf3 Nf6', name: 'Petrov Defense', eco: 'C42' },
  { moves: '1.e4 e5 2.f4', name: 'King\'s Gambit', eco: 'C30' },
  { moves: '1.e4 c5 2.Nf3 d6 3.d4', name: 'Sicilian Defense: Open', eco: 'B50' },
  { moves: '1.e4 c5 2.Nf3 Nc6', name: 'Sicilian Defense: Old Sicilian', eco: 'B30' },
  { moves: '1.e4 c5 2.Nf3 e6', name: 'Sicilian Defense: French Variation', eco: 'B40' },
  { moves: '1.e4 c5', name: 'Sicilian Defense', eco: 'B20' },
  { moves: '1.e4 e6 2.d4 d5', name: 'French Defense', eco: 'C00' },
  { moves: '1.e4 e6', name: 'French Defense', eco: 'C00' },
  { moves: '1.e4 c6 2.d4 d5', name: 'Caro-Kann Defense', eco: 'B12' },
  { moves: '1.e4 c6', name: 'Caro-Kann Defense', eco: 'B10' },
  { moves: '1.e4 d5 2.exd5 Qxd5', name: 'Scandinavian Defense', eco: 'B01' },
  { moves: '1.e4 d5', name: 'Scandinavian Defense', eco: 'B01' },
  { moves: '1.e4 Nf6', name: 'Alekhine Defense', eco: 'B02' },
  { moves: '1.e4 d6 2.d4 Nf6 3.Nc3 g6', name: 'Pirc Defense', eco: 'B07' },
  { moves: '1.e4 g6', name: 'Modern Defense', eco: 'B06' },
  { moves: '1.e4 e5 2.Nf3 Nc6', name: 'King\'s Knight Opening', eco: 'C40' },
  { moves: '1.e4 e5', name: 'King\'s Pawn Game', eco: 'C20' },
  { moves: '1.e4', name: 'King\'s Pawn Opening', eco: 'B00' },
  { moves: '1.d4 d5 2.c4 e6 3.Nc3 Nf6', name: 'Queen\'s Gambit Declined', eco: 'D30' },
  { moves: '1.d4 d5 2.c4 dxc4', name: 'Queen\'s Gambit Accepted', eco: 'D20' },
  { moves: '1.d4 d5 2.c4 c6', name: 'Slav Defense', eco: 'D10' },
  { moves: '1.d4 d5 2.c4', name: 'Queen\'s Gambit', eco: 'D06' },
  { moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6', name: 'King\'s Indian Defense', eco: 'E60' },
  { moves: '1.d4 Nf6 2.c4 g6 3.Nc3 d5', name: 'Grünfeld Defense', eco: 'D80' },
  { moves: '1.d4 Nf6 2.c4 e6 3.Nc3 Bb4', name: 'Nimzo-Indian Defense', eco: 'E20' },
  { moves: '1.d4 Nf6 2.c4 e6 3.Nf3 b6', name: 'Queen\'s Indian Defense', eco: 'E12' },
  { moves: '1.d4 Nf6 2.c4 e6 3.g3', name: 'Catalan Opening', eco: 'E01' },
  { moves: '1.d4 Nf6 2.c4 c5 3.d5', name: 'Benoni Defense', eco: 'A60' },
  { moves: '1.d4 Nf6 2.c4', name: 'Indian Defense', eco: 'A50' },
  { moves: '1.d4 Nf6 2.Nf3 g6 3.g3', name: 'King\'s Indian Attack', eco: 'A07' },
  { moves: '1.d4 f5', name: 'Dutch Defense', eco: 'A80' },
  { moves: '1.d4 d5', name: 'Queen\'s Pawn Game', eco: 'D00' },
  { moves: '1.d4', name: 'Queen\'s Pawn Opening', eco: 'A40' },
  { moves: '1.c4 e5', name: 'English Opening: Reversed Sicilian', eco: 'A20' },
  { moves: '1.c4', name: 'English Opening', eco: 'A10' },
  { moves: '1.Nf3 d5 2.g3', name: 'Réti Opening', eco: 'A05' },
  { moves: '1.Nf3', name: 'Réti Opening', eco: 'A04' },
  { moves: '1.g3', name: 'Hungarian Opening', eco: 'A00' },
  { moves: '1.b3', name: 'Larsen\'s Opening', eco: 'A01' },
  { moves: '1.f4', name: 'Bird\'s Opening', eco: 'A02' },
];

export function detectOpening(moves: string[]): { name: string; eco: string } | null {
  if (moves.length === 0) return null;

  // Build move string in standard notation for matching
  let moveStr = '';
  for (let i = 0; i < moves.length; i++) {
    const moveNum = Math.floor(i / 2) + 1;
    if (i % 2 === 0) {
      moveStr += (i > 0 ? ' ' : '') + moveNum + '.' + moves[i];
    } else {
      moveStr += ' ' + moves[i];
    }
  }

  // Find the longest matching opening
  let best: { name: string; eco: string } | null = null;
  let bestLen = 0;

  for (const opening of OPENINGS) {
    if (moveStr.startsWith(opening.moves) || moveStr === opening.moves.substring(0, moveStr.length)) {
      // Check if the opening moves is a prefix of or matches our moves
      if (moveStr.startsWith(opening.moves) && opening.moves.length > bestLen) {
        best = { name: opening.name, eco: opening.eco };
        bestLen = opening.moves.length;
      }
    }
  }

  return best;
}
