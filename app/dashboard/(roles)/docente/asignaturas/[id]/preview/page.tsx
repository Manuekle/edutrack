'use client';

import { Button } from '@/components/ui/button';
import { AttendanceReportPDF, TeacherReportData } from '@/lib/generar-bitacora-docente';
import { PDFViewer } from '@react-pdf/renderer';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PreviewBitacoraPage() {
  const params = useParams();
  const router = useRouter();
  const [reportData, setReportData] = useState<TeacherReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, you would fetch the report data here
    // For now, we'll use mock data to demonstrate the preview
    const fetchReportData = async () => {
      try {
        setIsLoading(true);
        // This is mock data - replace with actual API call
        const mockData = {
          teacher: {
            name: 'Nombre del Docente',
            signatureUrl: '',
          },
          subject: {
            name: 'Nombre de la Asignatura',
            code: 'COD-123',
            program: 'Nombre del Programa',
          },
          classes: [
            {
              id: '1',
              date: new Date(),
              startTime: new Date(2023, 0, 1, 14, 0),
              endTime: new Date(2023, 0, 1, 16, 0),
              topic: 'Introducción a la asignatura',
              status: 'COMPLETED',
            },
            // Add more mock classes as needed
          ],
          cancelledClasses: [],
          period: 1,
          year: 2023,
        };

        setReportData(mockData);
      } catch (err) {
        console.error('Error loading report data:', err);
        setError('Error al cargar los datos del reporte');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <div className="mt-4">
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {reportData && (
        <PDFViewer width="100%" height="100%">
          <AttendanceReportPDF data={reportData} />
        </PDFViewer>
      )}
    </div>
  );
}
