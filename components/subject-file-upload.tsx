'use client';

import { FileUpload } from '@/components/ui/file-upload';
import { useState } from 'react';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  fileObject: File;
}

interface SubjectFileUploadProps {
  onFileSelect: (file: File | null) => void;
  file: File | null;
}

export function SubjectFileUpload({ onFileSelect, file }: SubjectFileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(() => {
    if (file) {
      return {
        id: 'initial-file',
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 100, // Assume already 'uploaded' to the component
        fileObject: file,
      };
    }
    return null;
  });

  const handleDropFiles = (files: FileList) => {
    const newFile = files[0];
    if (!newFile) return;

    const newFileWithId = {
      id: Math.random().toString(),
      name: newFile.name,
      size: newFile.size,
      type: newFile.type,
      progress: 100, // No real upload, just selection
      fileObject: newFile,
    };

    setUploadedFile(newFileWithId);
    onFileSelect(newFile);
  };

  const handleDropUnacceptedFiles = (files: FileList) => {
    if (files.length > 0) {
      const fileName = files[0].name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      toast.error(
        `Tipo de archivo no válido: ${fileName}. Solo se permiten archivos .csv.`
      );
    }
  };

  const handleDeleteFile = () => {
    setUploadedFile(null);
    onFileSelect(null);
  };

  return (
    <FileUpload.Root>
      <div className="flex flex-col gap-1.5">
        <FileUpload.DropZone
          accept=".csv, text/csv, application/csv"
          hint="Solo se permiten archivos .csv"
          onDropFiles={handleDropFiles}
          onDropUnacceptedFiles={handleDropUnacceptedFiles}
          className="mb-4"
        />
      </div>

      {uploadedFile && (
        <FileUpload.List>
          <FileUpload.ListItemProgressBar
            key={uploadedFile.id}
            name={uploadedFile.name}
            size={uploadedFile.size}
            progress={100}
            onDelete={handleDeleteFile}
          />
        </FileUpload.List>
      )}
    </FileUpload.Root>
  );
}
