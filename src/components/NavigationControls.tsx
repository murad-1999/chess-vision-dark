import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Play,
  Pause,
  ArrowUpDown,
} from 'lucide-react';

interface NavigationControlsProps {
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onFlip: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  canPrev: boolean;
  canNext: boolean;
}

export function NavigationControls({
  onFirst, onPrev, onNext, onLast, onFlip,
  isPlaying, onTogglePlay,
  speed, onSpeedChange,
  canPrev, canNext,
}: NavigationControlsProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" onClick={onFirst} disabled={!canPrev} title="First move (Home)">
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onPrev} disabled={!canPrev} title="Previous move (←)">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onTogglePlay} title="Auto-play (Space)">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onNext} disabled={!canNext} title="Next move (→)">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onLast} disabled={!canNext} title="Last move (End)">
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="ghost" size="icon" onClick={onFlip} title="Flip board (F)">
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2 px-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Speed</span>
        <Slider
          min={200}
          max={3000}
          step={100}
          value={[speed]}
          onValueChange={([v]) => onSpeedChange(v)}
          className="w-24"
        />
        <span className="text-xs text-muted-foreground w-10">{(speed / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}
