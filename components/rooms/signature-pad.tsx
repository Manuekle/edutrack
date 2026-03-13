'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onClear: () => void;
}

/** Colores de trazo visibles en ambos temas (canvas no usa currentColor) */
const PEN_COLOR_LIGHT = '#171717';
const PEN_COLOR_DARK = '#fafafa';

export function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const penColor = isDark ? PEN_COLOR_DARK : PEN_COLOR_LIGHT; // canvas no usa CSS currentColor

  const clear = () => {
    sigCanvas.current?.clear();
    onClear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return;
    const data = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (data) onSave(data);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-card text-muted-foreground">
          Firma Digital
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
          type="button"
        >
          <Trash2 className="h-3 w-3" />
          Limpiar
        </Button>
      </div>
      <div className="border border-dashed rounded-xl border-border bg-card overflow-hidden">
        <div className="h-32 w-full relative touch-none select-none">
          <SignatureCanvas
            ref={sigCanvas}
            penColor={penColor}
            onEnd={save}
            velocityFilterWeight={0.7}
            minWidth={2}
            maxWidth={4}
            throttle={16}
            canvasProps={{
              className:
                'signature-canvas w-full h-full cursor-crosshair touch-none bg-transparent',
              style: { width: '100%', height: '100%', touchAction: 'none' },
            }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center italic">
        La firma digital es obligatoria para la auditoría de la reserva
      </p>
    </div>
  );
}
