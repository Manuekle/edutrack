'use client';

import { UploadCloud } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface SignatureFileUploadProps {
  onFileSelect: (file: File) => void;
  file: File | null;
}

export function SignatureFileUpload({ onFileSelect }: SignatureFileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col h-full min-h-[150px] w-full items-center justify-center border border-dashed rounded-lg p-4 sm:p-6 space-y-2 cursor-pointer transition-colors ${isDragActive ? 'bg-muted/50 border' : 'hover:bg-muted/30'
        }`}
    >
      <input {...getInputProps()} />
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-xs font-semibold text-center">
        {isDragActive ? 'Suelta la imagen aquí' : 'Seleccionar archivo'}
      </p>
      <p className="text-xs text-muted-foreground text-center">
        Arrastra y suelta la imagen, o haz clic para seleccionar
      </p>
      <p className="text-xs text-muted-foreground text-center">
        PNG con fondo transparente (máx. 2MB)
      </p>
    </div>
  );
}
