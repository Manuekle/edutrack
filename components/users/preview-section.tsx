'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, Loader2 } from 'lucide-react';

export interface UserPreviewItem {
  data: {
    name: string;
    document: string;
    correoPersonal: string;
    correoInstitucional?: string;
    role: string;
    password?: string;
  };
  status: 'success' | 'warning' | 'error';
  message: string;
}

interface FinalResult {
  document: string;
  name: string;
  status: 'created' | 'skipped' | 'error';
  message: string;
}

interface UsersPreviewSectionProps {
  isLoading: boolean;
  isPreview: boolean;
  previewData: UserPreviewItem[];
  finalResults: FinalResult[] | null;
  onUpload: () => void;
  onNewUpload: () => void;
  isConfirming?: boolean;
}

export function UsersPreviewSection({
  isLoading,
  isPreview,
  previewData,
  finalResults,
  onUpload,
  onNewUpload,
  isConfirming = false,
}: UsersPreviewSectionProps) {
  const successCount = previewData.filter(item => item.status === 'success').length;
  const warningCount = previewData.filter(item => item.status === 'warning').length;
  const errorCount = previewData.filter(item => item.status === 'error').length;

  return (
    <div className="lg:col-span-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold tracking-card">
            Previsualización y Confirmación
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Revisa los datos antes de confirmar la carga. Las filas con errores no serán procesadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && !isPreview && !finalResults ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : finalResults && finalResults.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-12 w-12 text-primary" />
              <div className="text-center space-y-1">
                <h3 className="text-2xl tracking-card font-semibold">Carga completada</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="font-semibold text-primary">
                      {finalResults.filter(r => r.status === 'created').length}
                    </span>{' '}
                    {finalResults.filter(r => r.status === 'created').length === 1
                      ? 'usuario creado'
                      : 'usuarios creados'}{' '}
                    con éxito.
                  </p>
                  {finalResults.filter(r => r.status !== 'created').length > 0 && (
                    <p>
                      <span className="font-semibold text-destructive">
                        {finalResults.filter(r => r.status !== 'created').length}
                      </span>{' '}
                      {finalResults.filter(r => r.status !== 'created').length === 1
                        ? 'usuario no fue creado'
                        : 'usuarios no fueron creados'}{' '}
                      (omitidos o con errores).
                    </p>
                  )}
                </div>
              </div>
              {finalResults.filter(r => r.status === 'error').length > 0 && (
                <div className="w-full max-w-md space-y-2">
                  <p className="text-xs font-medium text-destructive">Errores:</p>
                  <div className="bg-muted rounded-md p-3 max-h-32 overflow-y-auto">
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {finalResults
                        .filter(r => r.status === 'error')
                        .map((result, index) => (
                          <li key={index}>
                            • {result.name} ({result.document}): {result.message}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}
              <Button onClick={onNewUpload} className="mt-2">
                Cargar otro archivo
              </Button>
            </div>
          ) : isPreview && previewData.length > 0 ? (
            <div className="space-y-3">
              {/* Summary badges */}
              <div className="flex items-center gap-2 pb-2 border-b">
                {successCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {successCount} {successCount === 1 ? 'válido' : 'válidos'}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                    {warningCount} {warningCount === 1 ? 'advertencia' : 'advertencias'}
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {errorCount} {errorCount === 1 ? 'error' : 'errores'}
                  </Badge>
                )}
              </div>

              {/* Users list */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {previewData.map((item, index) => (
                  <div key={index} className="space-y-2 border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{item.data.name}</span>
                          <Badge
                            variant={
                              item.status === 'success'
                                ? 'outline'
                                : item.status === 'warning'
                                  ? 'outline'
                                  : 'destructive'
                            }
                            className={`text-xs ${
                              item.status === 'warning' ? 'text-yellow-600 border-yellow-600' : ''
                            }`}
                          >
                            {item.status === 'success'
                              ? 'Listo'
                              : item.status === 'warning'
                                ? 'Advertencia'
                                : 'Error'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{item.data.document}</span>
                          <span>•</span>
                          <span>{item.data.correoPersonal}</span>
                          {item.data.correoInstitucional && (
                            <>
                              <span>•</span>
                              <span>{item.data.correoInstitucional}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="lowercase">{item.data.role}</span>
                        </div>
                        {(item.message || item.status !== 'success') && (
                          <p
                            className={`text-xs mt-1 ${
                              item.status === 'error'
                                ? 'text-destructive'
                                : item.status === 'warning'
                                  ? 'text-yellow-600'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {item.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {successCount > 0 &&
                    `${successCount} ${successCount === 1 ? 'usuario listo' : 'usuarios listos'}`}
                </p>
                <Button
                  onClick={onUpload}
                  disabled={isLoading || isConfirming || successCount === 0}
                  size="sm"
                >
                  {isConfirming || isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Confirmar Carga'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
              <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-xs text-muted-foreground text-center max-w-md">
                Sube un archivo Excel (.xlsx) o CSV (.csv) para ver la previsualización aquí.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
