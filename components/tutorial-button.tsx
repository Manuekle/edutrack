'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTutorial } from '@/hooks/use-tutorial';
import { Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function TutorialButton() {
  const pathname = usePathname();
  const { hasTutorial, startTutorial } = useTutorial(pathname);

  if (!hasTutorial) return null;

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={startTutorial}
            aria-label="Ver tutorial interactivo de esta pantalla"
            className="group inline-flex items-center gap-1.5 h-8 pl-2 pr-2.5 sm:pr-3 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 hover:border-primary/35 transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 shrink-0">
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="hidden sm:inline text-[11px] font-semibold tracking-wide">
              TUTORIAL
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          sideOffset={8}
          className="font-sans p-0 overflow-hidden border-0 shadow-lg"
        >
          <div className="flex flex-col gap-1 px-3 py-2.5 max-w-[200px]">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="h-3 w-3 text-primary shrink-0" />
              <p className="text-xs font-semibold">¿Cómo usar esta pantalla?</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Inicia un recorrido guiado paso a paso por las funciones de esta sección.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
