'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTutorial } from '@/hooks/use-tutorial';
import { CircleHelp } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function TutorialButton() {
  const pathname = usePathname();
  const { hasTutorial, startTutorial } = useTutorial(pathname);

  if (!hasTutorial) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={startTutorial}
            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary transition-colors duration-200"
            aria-label="Iniciar tutorial de esta página"
          >
            <CircleHelp className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          className="font-sans text-xs bg-popover border text-popover-foreground shadow-sm"
        >
          <p className="font-semibold">¿Cómo usar esta pantalla?</p>
          <p className="text-muted-foreground">Ver tutorial interactivo</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
