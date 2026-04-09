import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SAMPLE_PGN } from '@/lib/chess-utils';
import { Upload, Sparkles } from 'lucide-react';

interface GameInputProps {
  onLoad: (input: string) => void;
  loading: boolean;
  error: string | null;
}

export function GameInput({ onLoad, loading, error }: GameInputProps) {
  const [input, setInput] = useState('');

  return (
    <div className="space-y-3 pt-4">
      <Textarea
        placeholder="Paste PGN, FEN, or a Chess.com / Lichess game link..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="min-h-[80px] bg-background/50 font-mono text-sm resize-y border-border/50 focus:border-primary/50"
      />
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => onLoad(input)} disabled={loading || !input.trim()} size="sm">
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          {loading ? 'Loading...' : 'Load Game'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setInput(SAMPLE_PGN);
            onLoad(SAMPLE_PGN);
          }}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Load Sample (Immortal Game)
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
