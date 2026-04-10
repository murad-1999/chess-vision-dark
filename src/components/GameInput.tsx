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
    <div className="space-y-4 pt-5">
      <Textarea
        placeholder="Paste PGN, FEN, or a Chess.com / Lichess game link..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="min-h-[100px] bg-background/60 font-mono text-sm resize-y border-border/40 rounded-xl focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
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
      {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">{error}</p>}
    </div>
  );
}
