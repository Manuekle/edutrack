'use client';

import { SubjectFileUpload } from '@/components/subject-file-upload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookOpen, CheckCircle2, Download, FileUp, Loader2, UserPlus } from 'lucide-react';
import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { sileo } from 'sileo';

interface BulkEnrollmentUser {
  id: string;
  name: string;
  document?: string | null;
  studentCode?: string | null;
}

export interface BulkEnrollmentUploadProps {
  role: 'ESTUDIANTE' | 'DOCENTE';
  allUsers: BulkEnrollmentUser[];
  currentlyAssignedIds: string[];
  onEnrollmentComplete: (mergedIds: string[]) => void;
  onUsersCreated?: () => void;
}

type MatchStatus = 'new' | 'already' | 'not_found' | 'will_create' | 'duplicate';

interface MatchedRow {
  document: string;
  name?: string;
  email?: string;
  userId?: string;
  userName?: string;
  status: MatchStatus;
  message: string;
}

export function BulkEnrollmentUpload({
  role,
  allUsers,
  currentlyAssignedIds,
  onEnrollmentComplete,
  onUsersCreated,
}: BulkEnrollmentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [matchedRows, setMatchedRows] = useState<MatchedRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const roleLabel = role === 'DOCENTE' ? 'docentes' : 'estudiantes';

  const findHeader = (headers: string[], variants: string[]) =>
    headers.find(h => variants.includes(h.toLowerCase().replace(/[\s_]+/g, '')));

  const processFile = useCallback(() => {
    if (!file) return;
    setProcessing(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const docHeader = findHeader(headers, ['documento', 'document', 'cedula', 'identificacion', 'id']);
        const nameHeader = findHeader(headers, ['nombre', 'name', 'nombrecompleto', 'nombres']);
        const emailHeader = findHeader(headers, ['correo', 'email', 'correopersonal', 'correoinstitucional']);

        if (!docHeader) {
          setMatchedRows([{
            document: '',
            status: 'not_found',
            message: `No se encontr\u00f3 columna "documento" en el CSV. Columnas: ${headers.join(', ')}`,
          }]);
          setProcessing(false);
          return;
        }

        const userByDoc = new Map<string, BulkEnrollmentUser>();
        for (const u of allUsers) {
          if (u.document) {
            userByDoc.set(u.document.toLowerCase().trim(), u);
          }
        }

        const assignedSet = new Set(currentlyAssignedIds);
        const seenDocs = new Set<string>();
        const rows: MatchedRow[] = [];

        for (const row of results.data) {
          const docRaw = (row[docHeader] || '').trim();
          if (!docRaw) continue;

          const docKey = docRaw.toLowerCase();
          const name = nameHeader ? (row[nameHeader] || '').trim() : '';
          const email = emailHeader ? (row[emailHeader] || '').trim() : '';

          if (seenDocs.has(docKey)) {
            rows.push({ document: docRaw, status: 'duplicate', message: 'Duplicado en el archivo.' });
            continue;
          }
          seenDocs.add(docKey);

          const user = userByDoc.get(docKey);
          if (!user) {
            if (name && email) {
              rows.push({
                document: docRaw,
                name,
                email,
                status: 'will_create',
                userName: name,
                message: 'Se crear\u00e1 y asignar\u00e1 al grupo.',
              });
            } else {
              rows.push({
                document: docRaw,
                status: 'not_found',
                message: name || email
                  ? 'Falta nombre o correo para crear el usuario.'
                  : 'No encontrado. Agrega nombre y correo en el CSV para crearlo.',
              });
            }
            continue;
          }

          if (assignedSet.has(user.id)) {
            rows.push({
              document: docRaw,
              userId: user.id,
              userName: user.name,
              status: 'already',
              message: 'Ya asignado a este grupo.',
            });
            continue;
          }

          rows.push({
            document: docRaw,
            userId: user.id,
            userName: user.name,
            status: 'new',
            message: 'Se asignar\u00e1 al grupo.',
          });
        }

        setMatchedRows(rows);
        setProcessing(false);
      },
      error: () => {
        setMatchedRows([{
          document: '',
          status: 'not_found',
          message: 'Error al leer el archivo CSV.',
        }]);
        setProcessing(false);
      },
    });
  }, [file, allUsers, currentlyAssignedIds]);

  const existingNewIds = matchedRows.filter(r => r.status === 'new' && r.userId).map(r => r.userId!);
  const toCreateRows = matchedRows.filter(r => r.status === 'will_create');
  const newCount = existingNewIds.length;
  const createCount = toCreateRows.length;
  const alreadyCount = matchedRows.filter(r => r.status === 'already').length;
  const notFoundCount = matchedRows.filter(r => r.status === 'not_found').length;
  const actionableCount = newCount + createCount;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      let createdIds: string[] = [];

      // Create missing users via bulk API
      if (toCreateRows.length > 0) {
        const csvContent = 'documento,nombre,correo\n' +
          toCreateRows.map(r => `${r.document},${r.name},${r.email}`).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const formData = new FormData();
        formData.append('file', blob, 'bulk_create.csv');
        formData.append('preview', 'false');

        const res = await fetch(`/api/admin/users/bulk?forceRole=${role}`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          sileo.error({ description: err.error || 'Error al crear usuarios' });
          setConfirming(false);
          return;
        }

        const result = await res.json();
        sileo.success({
          description: `${result.summary.created} usuario${result.summary.created !== 1 ? 's' : ''} creado${result.summary.created !== 1 ? 's' : ''}.`,
        });

        // Fetch updated users to get new IDs
        const usersRes = await fetch(`/api/admin/usuarios?role=${role}`);
        const usersData = await usersRes.json();
        const updatedUsers: BulkEnrollmentUser[] = usersData.users ?? [];

        // Match created documents to new IDs
        const createdDocs = new Set(toCreateRows.map(r => r.document.toLowerCase()));
        createdIds = updatedUsers
          .filter(u => u.document && createdDocs.has(u.document.toLowerCase()))
          .map(u => u.id);

        onUsersCreated?.();
      }

      const merged = [...new Set([...currentlyAssignedIds, ...existingNewIds, ...createdIds])];
      onEnrollmentComplete(merged);
      setMatchedRows([]);
      setFile(null);
    } catch {
      sileo.error({ description: 'Error al procesar la asignaci\u00f3n.' });
    } finally {
      setConfirming(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setMatchedRows([]);
  };

  return (
    <div className="space-y-4">
      {/* Instructions + Template */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-muted/30 p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-3 w-3 text-muted-foreground" />
            <span className="font-semibold text-foreground text-xs">Instrucciones</span>
          </div>
          <ol className="space-y-1.5 text-[11px] text-muted-foreground list-decimal ml-4">
            <li>Descarga la plantilla CSV</li>
            <li>Columna <strong className="text-foreground">documento</strong> (obligatoria)</li>
            <li>Columnas <strong className="text-foreground">nombre</strong> y <strong className="text-foreground">correo</strong> (opcionales: si el usuario no existe, se crear&aacute; autom&aacute;ticamente)</li>
            <li>Sube el archivo, revisa y confirma</li>
          </ol>
        </div>
        <div className="flex flex-col justify-between gap-3">
          <a href="/formatos/plantilla_asignacion.csv" download>
            <Button variant="outline" size="sm" className="w-full justify-start text-xs">
              <Download className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              Descargar Plantilla CSV
            </Button>
          </a>
          <SubjectFileUpload onFileSelect={setFile} file={file} />
        </div>
      </div>

      {/* Process button */}
      <div className="flex gap-2">
        <Button
          onClick={processFile}
          disabled={!file || processing}
          size="sm"
          className="text-xs"
        >
          {processing ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileUp className="mr-2 h-3.5 w-3.5" />
          )}
          Procesar CSV
        </Button>
        {(file || matchedRows.length > 0) && (
          <Button onClick={handleClear} variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Limpiar
          </Button>
        )}
      </div>

      {/* Preview table */}
      {matchedRows.length > 0 && (
        <div className="space-y-3">
          <div className="bg-card rounded-xl border overflow-hidden shadow-none">
            <div className="relative overflow-x-auto overflow-y-auto max-h-[300px]">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground w-10">
                      Estado
                    </TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                      Documento
                    </TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                      Usuario
                    </TableHead>
                    <TableHead className="text-xs font-normal px-4 py-2 text-muted-foreground">
                      Mensaje
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchedRows.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/50">
                      <TableCell className="text-xs px-4 py-2.5">
                        {row.status === 'new' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : row.status === 'will_create' ? (
                          <Badge
                            variant="outline"
                            className="text-[8px] bg-violet-500/10 text-violet-600 border-violet-500/20 px-1.5 py-0 h-4"
                          >
                            Nuevo
                          </Badge>
                        ) : row.status === 'already' ? (
                          <Badge
                            variant="outline"
                            className="text-[8px] bg-blue-500/10 text-blue-600 border-blue-500/20 px-1.5 py-0 h-4"
                          >
                            Ya
                          </Badge>
                        ) : row.status === 'duplicate' ? (
                          <Badge
                            variant="outline"
                            className="text-[8px] bg-amber-500/10 text-amber-600 border-amber-500/20 px-1.5 py-0 h-4"
                          >
                            Dup
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="text-[8px] px-1.5 py-0 h-4 font-normal"
                          >
                            N/E
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-2.5 font-mono">
                        {row.document}
                      </TableCell>
                      <TableCell className="text-xs px-4 py-2.5">
                        {row.userName || '\u2014'}
                      </TableCell>
                      <TableCell className="text-[10px] px-4 py-2.5 text-muted-foreground">
                        {row.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 px-1">
            <span className="text-[11px] text-muted-foreground">
              {newCount > 0 && `${newCount} existente${newCount !== 1 ? 's' : ''}`}
              {newCount > 0 && createCount > 0 && ' \u00b7 '}
              {createCount > 0 && (
                <span className="text-violet-600">
                  {createCount} se crear&aacute;{createCount !== 1 ? 'n' : ''}
                </span>
              )}
              {alreadyCount > 0 && ` \u00b7 ${alreadyCount} ya asignado${alreadyCount !== 1 ? 's' : ''}`}
              {notFoundCount > 0 && ` \u00b7 ${notFoundCount} sin datos`}
            </span>
            <Button
              onClick={handleConfirm}
              disabled={actionableCount === 0 || confirming}
              size="sm"
              className="text-xs px-5"
            >
              {confirming ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : createCount > 0 ? (
                <UserPlus className="mr-2 h-3.5 w-3.5" />
              ) : (
                <FileUp className="mr-2 h-3.5 w-3.5" />
              )}
              {confirming
                ? 'Procesando...'
                : createCount > 0
                  ? `Crear ${createCount} y asignar ${actionableCount}`
                  : `Asignar ${actionableCount} ${roleLabel}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
