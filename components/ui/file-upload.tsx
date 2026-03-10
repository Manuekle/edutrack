'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import { CircleCheck, Trash2, UploadCloud, XCircle } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { useId, useRef, useState } from 'react';

/**
 * Returns a human-readable file size.
 * @param bytes - The size of the file in bytes.
 * @returns A string representing the file size in a human-readable format.
 */
export const getReadableFileSize = (bytes: number) => {
  if (bytes === 0) return '0 KB';

  const suffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.floor(bytes / Math.pow(1024, i)) + ' ' + suffixes[i];
};

interface FileUploadDropZoneProps {
  /** The class name of the drop zone. */
  className?: string;
  /**
   * A hint text explaining what files can be dropped.
   */
  hint?: string;
  /**
   * Disables dropping or uploading files.
   */
  isDisabled?: boolean;
  /**
   * Specifies the types of files that the server accepts.
   * Examples: "image/*", ".pdf,image/*", "image/*,video/mpeg,application/pdf"
   */
  accept?: string;
  /**
   * Allows multiple file uploads.
   */
  allowsMultiple?: boolean;
  /**
   * Maximum file size in bytes.
   */
  maxSize?: number;
  /**
   * Callback function that is called with the list of dropped files
   * when files are dropped on the drop zone.
   */
  onDropFiles?: (files: FileList) => void;
  /**
   * Callback function that is called with the list of unaccepted files
   * when files are dropped on the drop zone.
   */
  onDropUnacceptedFiles?: (files: FileList) => void;
  /**
   * Callback function that is called with the list of files that exceed
   * the size limit when files are dropped on the drop zone.
   */
  onSizeLimitExceed?: (files: FileList) => void;
}

export const FileUploadDropZone = ({
  className,
  hint,
  isDisabled,
  accept,
  allowsMultiple = true,
  maxSize,
  onDropFiles,
  onDropUnacceptedFiles,
  onSizeLimitExceed,
}: FileUploadDropZoneProps) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const isFileTypeAccepted = (file: File): boolean => {
    if (!accept) return true;

    // Split the accept string into individual types
    const acceptedTypes = accept.split(',').map(type => type.trim());

    return acceptedTypes.some(acceptedType => {
      // Handle file extensions (e.g., .pdf, .doc)
      if (acceptedType.startsWith('.')) {
        const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        return extension === acceptedType.toLowerCase();
      }

      // Handle wildcards (e.g., image/*)
      if (acceptedType.endsWith('/*')) {
        const typePrefix = acceptedType.split('/')[0];
        return file.type.startsWith(`${typePrefix}/`);
      }

      // Handle exact MIME types (e.g., application/pdf)
      return file.type === acceptedType;
    });
  };

  const handleDragIn = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOut = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const processFiles = (files: File[]): void => {
    // Reset the invalid state when processing files.
    setIsInvalid(false);

    const acceptedFiles: File[] = [];
    const unacceptedFiles: File[] = [];
    const oversizedFiles: File[] = [];

    // If multiple files are not allowed, only process the first file
    const filesToProcess = allowsMultiple ? files : files.slice(0, 1);

    filesToProcess.forEach(file => {
      // Check file size first
      if (maxSize && file.size > maxSize) {
        oversizedFiles.push(file);
        return;
      }

      // Then check file type
      if (isFileTypeAccepted(file)) {
        acceptedFiles.push(file);
      } else {
        unacceptedFiles.push(file);
      }
    });

    // Handle oversized files
    if (oversizedFiles.length > 0 && typeof onSizeLimitExceed === 'function') {
      const dataTransfer = new DataTransfer();
      oversizedFiles.forEach(file => dataTransfer.items.add(file));

      setIsInvalid(true);
      onSizeLimitExceed(dataTransfer.files);
    }

    // Handle accepted files
    if (acceptedFiles.length > 0 && typeof onDropFiles === 'function') {
      const dataTransfer = new DataTransfer();
      acceptedFiles.forEach(file => dataTransfer.items.add(file));
      onDropFiles(dataTransfer.files);
    }

    // Handle unaccepted files
    if (unacceptedFiles.length > 0 && typeof onDropUnacceptedFiles === 'function') {
      const unacceptedDataTransfer = new DataTransfer();
      unacceptedFiles.forEach(file => unacceptedDataTransfer.items.add(file));

      setIsInvalid(true);
      onDropUnacceptedFiles(unacceptedDataTransfer.files);
    }

    // Clear the input value to ensure the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    handleDragOut(event);
    processFiles(Array.from(event.dataTransfer.files));
  };

  const handleInputFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(event.target.files || []));
  };

  return (
    <div
      data-dropzone
      onDragOver={handleDragIn}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragEnd={handleDragOut}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center gap-3 cursor-pointer rounded-lg border border-dashed border-muted-foreground/25 bg-background px-6 py-8 text-center transition-colors hover:bg-muted/50',
        isDraggingOver && 'border bg-primary/5 cursor-grabbing',
        isDisabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-1 text-center">
        <div className="flex justify-center gap-1 text-center">
          <input
            ref={inputRef}
            id={id}
            type="file"
            className="sr-only"
            disabled={isDisabled}
            accept={accept}
            multiple={allowsMultiple}
            onChange={handleInputFileChange}
          />
          <label htmlFor={id} className="flex cursor-pointer text-xs">
            <Button
              variant="link"
              size="sm"
              disabled={isDisabled}
              onClick={() => inputRef.current?.click()}
              className="p-0 h-auto font-normal"
            >
              Click para subir <span className="md:hidden">y adjuntar archivos</span>
            </Button>
          </label>
          <span className="text-xs text-muted-foreground max-md:hidden">o arrastrar y soltar</span>
        </div>
        <p
          className={cn(
            'text-xs text-muted-foreground transition-colors',
            isInvalid && 'text-destructive'
          )}
        >
          {hint || 'SVG, PNG, JPG or GIF (max. 800x400px)'}
        </p>
      </div>
    </div>
  );
};

export interface FileListItemProps {
  /** The name of the file. */
  name: string;
  /** The size of the file. */
  size: number;
  /** The upload progress of the file. */
  progress: number;
  /** Whether the file failed to upload. */
  failed?: boolean;
  /** The class name of the file list item. */
  className?: string;
  /** The function to call when the file is deleted. */
  onDelete?: () => void;
  /** The function to call when the file upload is retried. */
  onRetry?: () => void;
}

export const FileListItemProgressBar = ({
  name,
  size,
  progress,
  failed,
  onDelete,
  onRetry,
  className,
}: FileListItemProps) => {
  const isComplete = progress === 100;

  return (
    <motion.li
      layout="position"
      className={cn(
        'relative flex gap-3 rounded-lg border bg-card p-4 shadow-sm',
        failed && 'border-destructive',
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        width="40"
        height="40"
        viewBox="0 0 48 48"
        className="shrink-0 text-muted-foreground"
      >
        <rect width="16" height="9" x="28" y="15" fill="#21a366"></rect>
        <path fill="#185c37" d="M44,24H12v16c0,1.105,0.895,2,2,2h28c1.105,0,2-0.895,2-2V24z"></path>
        <rect width="16" height="9" x="28" y="24" fill="#107c42"></rect>
        <rect width="16" height="9" x="12" y="15" fill="#3fa071"></rect>
        <path fill="#33c481" d="M42,6H28v9h16V8C44,6.895,43.105,6,42,6z"></path>
        <path fill="#21a366" d="M14,6h14v9H12V8C12,6.895,12.895,6,14,6z"></path>
        <path
          d="M22.319,13H12v24h10.319C24.352,37,26,35.352,26,33.319V16.681C26,14.648,24.352,13,22.319,13z"
          opacity=".05"
        ></path>
        <path
          d="M22.213,36H12V13.333h10.213c1.724,0,3.121,1.397,3.121,3.121v16.425	C25.333,34.603,23.936,36,22.213,36z"
          opacity=".07"
        ></path>
        <path
          d="M22.106,35H12V13.667h10.106c1.414,0,2.56,1.146,2.56,2.56V32.44C24.667,33.854,23.52,35,22.106,35z"
          opacity=".09"
        ></path>
        <linearGradient
          id="flEJnwg7q~uKUdkX0KCyBa_UECmBSgBOvPT_gr1"
          x1="4.725"
          x2="23.055"
          y1="14.725"
          y2="33.055"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#18884f"></stop>
          <stop offset="1" stopColor="#0b6731"></stop>
        </linearGradient>
        <path
          fill="url(#flEJnwg7q~uKUdkX0KCyBa_UECmBSgBOvPT_gr1)"
          d="M22,34H6c-1.105,0-2-0.895-2-2V16c0-1.105,0.895-2,2-2h16c1.105,0,2,0.895,2,2v16	C24,33.105,23.105,34,22,34z"
        ></path>
        <path
          fill="#fff"
          d="M9.807,19h2.386l1.936,3.754L16.175,19h2.229l-3.071,5l3.141,5h-2.351l-2.11-3.93L11.912,29H9.526	l3.193-5.018L9.807,19z"
        ></path>
      </svg>

      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="flex w-full max-w-full min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-normal">{name}</p>

            <div className="mt-1 flex items-center gap-2">
              <p className="truncate text-xs text-muted-foreground whitespace-nowrap">
                {getReadableFileSize(size)}
              </p>

              <div className="h-4 w-px bg-border" />

              <div className="flex items-center gap-1">
                {isComplete && <CircleCheck className="h-4 w-4 text-success" />}
                {isComplete && <p className="text-xs font-normal">100%</p>}

                {!isComplete && !failed && (
                  <UploadCloud className="h-4 w-4 text-muted-foreground" />
                )}
                {!isComplete && !failed && (
                  <p className="text-xs text-muted-foreground">Subiendo...</p>
                )}

                {failed && <XCircle className="h-4 w-4 text-destructive" />}
                {failed && <p className="text-xs font-normal text-destructive">Error</p>}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 -mt-1 -mr-1 self-start"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {failed && (
          <div className="mt-2 flex gap-3">
            <Button
              variant="link"
              size="sm"
              onClick={onRetry}
              className="h-auto p-0 text-destructive text-xs"
            >
              Intentar de nuevo
            </Button>
          </div>
        )}
      </div>
    </motion.li>
  );
};

export const FileListItemProgressFill = ({
  name,
  size,
  progress,
  failed,
  onDelete,
  onRetry,
  className,
}: FileListItemProps) => {
  const isComplete = progress === 100;

  return (
    <motion.li
      layout="position"
      className={cn('relative flex gap-3 overflow-hidden rounded-lg border bg-card p-4', className)}
    >
      <div className="absolute inset-0 z-0">
        <div
          className={cn(
            'h-full w-full origin-left bg-success/10 transition-transform',
            failed && 'bg-destructive/10'
          )}
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        width="40"
        height="40"
        viewBox="0 0 48 48"
        className="relative shrink-0 text-muted-foreground"
      >
        <rect width="16" height="9" x="28" y="15" fill="#21a366"></rect>
        <path fill="#185c37" d="M44,24H12v16c0,1.105,0.895,2,2,2h28c1.105,0,2-0.895,2-2V24z"></path>
        <rect width="16" height="9" x="28" y="24" fill="#107c42"></rect>
        <rect width="16" height="9" x="12" y="15" fill="#3fa071"></rect>
        <path fill="#33c481" d="M42,6H28v9h16V8C44,6.895,43.105,6,42,6z"></path>
        <path fill="#21a366" d="M14,6h14v9H12V8C12,6.895,12.895,6,14,6z"></path>
        <path
          d="M22.319,13H12v24h10.319C24.352,37,26,35.352,26,33.319V16.681C26,14.648,24.352,13,22.319,13z"
          opacity=".05"
        ></path>
        <path
          d="M22.213,36H12V13.333h10.213c1.724,0,3.121,1.397,3.121,3.121v16.425	C25.333,34.603,23.936,36,22.213,36z"
          opacity=".07"
        ></path>
        <path
          d="M22.106,35H12V13.667h10.106c1.414,0,2.56,1.146,2.56,2.56V32.44C24.667,33.854,23.52,35,22.106,35z"
          opacity=".09"
        ></path>
        <linearGradient
          id="flEJnwg7q~uKUdkX0KCyBb_UECmBSgBOvPT_gr2"
          x1="4.725"
          x2="23.055"
          y1="14.725"
          y2="33.055"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#18884f"></stop>
          <stop offset="1" stopColor="#0b6731"></stop>
        </linearGradient>
        <path
          fill="url(#flEJnwg7q~uKUdkX0KCyBb_UECmBSgBOvPT_gr2)"
          d="M22,34H6c-1.105,0-2-0.895-2-2V16c0-1.105,0.895-2,2-2h16c1.105,0,2,0.895,2,2v16	C24,33.105,23.105,34,22,34z"
        ></path>
        <path
          fill="#fff"
          d="M9.807,19h2.386l1.936,3.754L16.175,19h2.229l-3.071,5l3.141,5h-2.351l-2.11-3.93L11.912,29H9.526	l3.193-5.018L9.807,19z"
        ></path>
      </svg>

      <div className="relative flex min-w-0 flex-1 flex-col items-start">
        <div className="flex w-full max-w-full min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-normal">{name}</p>

            <div className="mt-1 flex items-center gap-2">
              <p className="truncate text-xs text-muted-foreground whitespace-nowrap">
                {getReadableFileSize(size)}
              </p>

              <div className="h-4 w-px bg-border" />

              <div className="flex items-center gap-1">
                {isComplete && <CircleCheck className="h-4 w-4 text-success" />}
                {isComplete && <p className="text-xs font-normal">100%</p>}

                {!isComplete && !failed && (
                  <UploadCloud className="h-4 w-4 text-muted-foreground" />
                )}
                {!isComplete && !failed && (
                  <p className="text-xs text-muted-foreground">Subiendo...</p>
                )}

                {failed && <XCircle className="h-4 w-4 text-destructive" />}
                {failed && <p className="text-xs font-normal text-destructive">Error</p>}
              </div>
            </div>
          </div>

          <AnimatePresence>
            <motion.div
              key="delete-button"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="relative h-8 w-8 p-0 -mt-1 -mr-1 self-start"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>

        {failed && (
          <div className="relative mt-2 flex gap-3">
            <Button
              variant="link"
              size="sm"
              onClick={onRetry}
              className="h-auto p-0 text-destructive text-xs"
            >
              Intentar de nuevo
            </Button>
          </div>
        )}
      </div>
    </motion.li>
  );
};

const FileUploadRoot = (props: ComponentPropsWithRef<'div'>) => (
  <div {...props} className={cn('flex flex-col gap-4', props.className)} />
);

const FileUploadList = (props: HTMLMotionProps<'ul'>) => (
  <AnimatePresence>
    <motion.ul {...props} className={cn('flex flex-col gap-3', props.className)} />
  </AnimatePresence>
);

export const FileUpload = {
  Root: FileUploadRoot,
  List: FileUploadList,
  DropZone: FileUploadDropZone,
  ListItemProgressBar: FileListItemProgressBar,
  ListItemProgressFill: FileListItemProgressFill,
};
