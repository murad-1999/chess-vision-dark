import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SAMPLE_PGN } from '@/lib/chess-utils';

interface GameInputProps {
  onLoad: (input: string) => void;
  loading: boolean;
  error: string | null;
}

export function GameInput({ onLoad, loading, error }: GameInputProps) {
  const [input, setInput] = useState('');

  return (
    <div className="space-y-3 w-full max-w-2xl">
      <Textarea
        placeholder="Paste PGN, FEN, or a Chess.com / Lichess game link..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="min-h-[100px] bg-card font-mono text-sm resize-y"
      />
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => onLoad(input)} disabled={loading || !input.trim()}>
          {loading ? 'Loading...' : 'Load Game'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setInput(SAMPLE_PGN);
            onLoad(SAMPLE_PGN);
          }}
        >
          Load Sample (Immortal Game)
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
