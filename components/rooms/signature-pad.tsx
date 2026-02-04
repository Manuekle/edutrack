'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onClear: () => void;
}

export function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);

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
        <span className="text-xs font-semibold uppercase tracking-card text-muted-foreground">Firma Digital</span>
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
      <div className="border border-dashed rounded-xl bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="h-32 w-full relative">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="currentColor"
            onEnd={save}
            canvasProps={{
              className: "signature-canvas w-full h-full cursor-crosshair text-foreground",
              style: { width: '100%', height: '100%' }
            }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center italic">La firma digital es obligatoria para la auditoría de la reserva</p>
    </div>
  );
}
