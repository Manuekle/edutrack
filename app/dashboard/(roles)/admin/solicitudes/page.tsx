'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { LoadingPage } from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import type { UnenrollRequestStatus } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type UnenrollRequest = {
  id: string;
  reason: string;
  status: UnenrollRequestStatus;
  createdAt: string;
  student: {
    name: string | null;
    correoInstitucional: string | null;
  };
  subject: {
    name: string;
  };
  requestedBy: {
    name: string | null;
    correoInstitucional: string | null;
  };
};

export default function UnenrollRequestsPage() {
  const [requests, setRequests] = useState<UnenrollRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/solicitudes');
      const data = await response.json();
      if (response.ok) {
        setRequests(Array.isArray(data) ? data : []);
      } else {
        throw new Error(data.message || 'Error al cargar las solicitudes');
      }
    } catch (error) {
      toast.error('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: true }));
      const response = await fetch('/api/admin/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action,
          reason: rejectReason[requestId] || '',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar la solicitud');
      }

      toast.success(`Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} correctamente`);
      await fetchRequests();
      setShowRejectDialog(null);
    } catch (error) {
      toast.error(`No se pudo ${action === 'approve' ? 'aprobar' : 'rechazar'} la solicitud`);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const getStatusBadge = (status: UnenrollRequestStatus) => {
    switch (status) {
      case 'PENDIENTE':
        return (
          <Badge variant="outline" className="text-xs font-normal">
            pendiente
          </Badge>
        );
      case 'APROBADO':
        return (
          <Badge variant="outline" className="text-xs font-normal">
            aprobado
          </Badge>
        );
      case 'RECHAZADO':
        return (
          <Badge variant="outline" className="text-xs font-normal">
            rechazado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs font-normal">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  const pendingRequests = (requests || []).filter(req => req.status === 'PENDIENTE');

  return (
    <div className="mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <CardHeader className="p-0 w-full mb-8">
          <CardTitle className="text-2xl font-semibold tracking-card">
            Solicitudes de Desmatriculación
          </CardTitle>
          <CardDescription className="text-xs">
            Gestiona las solicitudes de desmatriculación de los estudiantes
          </CardDescription>
        </CardHeader>
      </div>

      {(requests || []).length === 0 ? (
        <Alert>
          <AlertDescription>
            No hay solicitudes de desmatriculación en este momento.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-card">Solicitudes Pendientes</h2>
                <Badge variant="secondary" className="text-xs font-normal">
                  {pendingRequests.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingRequests.map(request => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2">
                          <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl font-semibold tracking-card">
                              {request.student.name || 'Estudiante'}
                            </span>
                            <span className="text-xs font-normal">
                              {getStatusBadge(request.status)}
                            </span>
                          </CardTitle>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Fecha: {format(new Date(request.createdAt), 'PPp', { locale: es })}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground">
                              Materia:{' '}
                              <span className="text-foreground">{request.subject.name}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Solicitado por:{' '}
                              <span className="text-foreground">{request.requestedBy.name}</span>
                              {request.requestedBy.correoInstitucional && (
                                <span className="ml-1">
                                  ({request.requestedBy.correoInstitucional})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium">Motivo de la solicitud:</h4>
                        <div className="p-2 bg-muted/50 rounded-md">
                          <p className="text-xs leading-relaxed">{request.reason}</p>
                        </div>
                      </div>

                      {request.status === 'PENDIENTE' && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRejectReason(prev => ({ ...prev, [request.id]: '' }));
                              setShowRejectDialog(request.id);
                            }}
                            disabled={processing[request.id]}
                            className="font-sans"
                          >
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(request.id, 'approve')}
                            disabled={processing[request.id]}
                            className="font-sans"
                          >
                            {processing[request.id] ? <>Procesando...</> : <>Aprobar</>}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!showRejectDialog} onOpenChange={open => !open && setShowRejectDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="tracking-card text-xl">Rechazar solicitud</DialogTitle>
            <DialogDescription className="text-xs">
              Por favor, proporciona un motivo detallado para el rechazo de esta solicitud.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs font-normal">
                Motivo del rechazo
              </Label>
              <Textarea
                id="reason"
                placeholder="Describe el motivo del rechazo..."
                value={showRejectDialog ? rejectReason[showRejectDialog] || '' : ''}
                onChange={e =>
                  showRejectDialog &&
                  setRejectReason(prev => ({
                    ...prev,
                    [showRejectDialog]: e.target.value,
                  }))
                }
                rows={6}
                className="text-xs resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(null)}
              disabled={processing[showRejectDialog || '']}
              className="font-sans"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={
                !showRejectDialog ||
                !rejectReason[showRejectDialog]?.trim() ||
                processing[showRejectDialog || '']
              }
              onClick={async () => {
                if (showRejectDialog) {
                  await handleAction(showRejectDialog, 'reject');
                }
              }}
              className="font-sans"
            >
              {processing[showRejectDialog || ''] ? <>Procesando...</> : 'Confirmar rechazo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
