'use client';

import { Button } from '@/components/ui/button';
import { useCallback } from 'react';

type DownloadPdfButtonProps = {
  targetId: string;
  label?: string;
};

export function DownloadPdfButton({
  targetId,
  label = 'Generar Bitacora',
}: DownloadPdfButtonProps) {
  const handleDownloadPDF = useCallback(() => {
    const element = document.getElementById(targetId);
    if (!element) return;

    const content = element.cloneNode(true) as HTMLElement;
    const newWindow = window.open('', '_blank');
    if (!newWindow) return;

    // 🔥 Copiar estilos actuales
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          // Algunos estilos externos bloquean acceso por CORS
          return '';
        }
      })
      .join('\n');

    newWindow.document.write(`
      <html>
        <head>
          <title>Documento</title>
          <style>${styles}</style>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>${content.outerHTML}</body>
      </html>
    `);

    newWindow.document.close();
    newWindow.focus();
    newWindow.print();
  }, [targetId]);

  return (
    <Button variant="default" onClick={handleDownloadPDF}>
      {label}
    </Button>
  );
}
