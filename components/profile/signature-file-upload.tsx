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
      className={`flex flex-col min-h-[150px] w-full items-center justify-center p-5 sm:p-6 space-y-3 cursor-pointer transition-all duration-200 ${isDragActive ? 'bg-primary/5' : 'bg-transparent'}`}
    >
      <input {...getInputProps()} />
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${isDragActive ? 'bg-primary/15 text-primary' : 'bg-muted/80 text-muted-foreground'
          }`}
      >
        <UploadCloud className="h-7 w-7" />
      </div>
      <p className="sm:text-sm text-xs font-medium text-center text-foreground">
        {isDragActive ? 'Suelta la imagen aquí' : 'Seleccionar archivo'}
      </p>
      <p className="text-xs text-muted-foreground text-center">
        Arrastra y suelta, o haz clic para elegir · PNG (máx. 2MB)
      </p>
    </div>
  );
}
