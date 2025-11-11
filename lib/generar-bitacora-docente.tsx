import ReportReadyEmail from '@/app/emails/ReportReadyEmail';
import { db } from '@/lib/prisma';
import { ReportStatus } from '@prisma/client';
import { Document, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import React, { ReactElement } from 'react';
import { sendEmail } from './email';

declare module '@react-pdf/renderer' {
  interface PDFOptions {
    updateContainer: (element: ReactElement) => void;
  }
}

// 🎨 Estilos mejorados basados en el diseño anterior
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#333',
  },

  // Header styles
  pageHeader: {
    marginBottom: 25,
  },
  headerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#005a9c',
    borderBottomStyle: 'solid',
  },
  logoContainer: {
    width: '25%',
  },
  logo: {
    width: 80,
    height: 80,
  },
  titleContainer: {
    width: '50%',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 13,
    color: '#003366',
    fontWeight: 'normal',
  },
  metaContainer: {
    width: '25%',
    alignItems: 'flex-end',
  },
  metaTable: {
    borderWidth: 1,
    borderColor: '#005a9c',
    borderStyle: 'solid',
    borderBottomWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#005a9c',
    borderBottomStyle: 'solid',
    padding: 4,
  },
  metaText: {
    fontSize: 8,
  },
  metaBold: {
    fontSize: 8,
    fontWeight: 'bold',
  },

  // Info section styles
  infoGrid: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #ECEEDF',
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLeft: {
    width: '50%',
    flexDirection: 'row',
    paddingRight: 10,
  },
  infoRight: {
    width: '50%',
    flexDirection: 'row',
    paddingLeft: 10,
  },
  infoLabel: {
    fontWeight: 'bold',
    fontSize: 9,
    marginRight: 5,
  },
  infoValue: {
    fontSize: 9,
  },

  // Table styles
  mainTable: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ECEEDF',
    width: '100%',
    fontSize: 7,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEDF',
    borderBottomStyle: 'solid',
    minHeight: 20,
  },
  tableHeader: {
    backgroundColor: '#d9d9d9',
    fontWeight: 'bold',
  },
  tableHeaderSecondary: {
    backgroundColor: '#f2f2f2',
  },

  // 🔧 ENCABEZADO PRINCIPAL - Estilo según imagen de referencia
  headerCellNo: {
    width: '5%',
    backgroundColor: '#005a9c',
    borderRightWidth: 1,
    borderRightColor: '#ECEEDF',
    borderStyle: 'solid',
    padding: '4px 1px',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: '#eee',
    fontWeight: 'bold',
    fontSize: 8,
  },
  headerCellFecha: {
    width: '11%',
    backgroundColor: '#005a9c',
    borderRightWidth: 1,
    borderRightColor: '#ECEEDF',
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCellHora: {
    width: '14%',
    backgroundColor: '#005a9c',
    borderRightWidth: 1,
    borderRightColor: '#ECEEDF',
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCellTema: {
    width: '50%',
    backgroundColor: '#005a9c',
    borderRightWidth: 1,
    borderRightColor: '#ECEEDF',
    borderStyle: 'solid',
    padding: '4px 1px',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: '#eee',
    fontWeight: 'bold',
    fontSize: 8,
  },
  headerCellHoras: {
    width: '7%',
    backgroundColor: '#005a9c',
    borderRightWidth: 1,
    borderRightColor: '#ECEEDF',
    borderStyle: 'solid',
    padding: '4px 1px',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: '#eee',
    fontWeight: 'bold',
    fontSize: 8,
  },
  headerCellFirma: {
    width: '13%',
    backgroundColor: '#005a9c',
    padding: '4px 1px',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: '#eee',
    fontWeight: 'bold',
    fontSize: 8,
  },

  // 🔧 SUB-ENCABEZADOS - Estilo según imagen de referencia
  subHeaderCell: {
    flex: 1, // Para que ocupen el espacio disponible
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2px 1px',
  },
  subHeaderCellDDMM: {
    width: '50%', // Para que DD y MM se dividan el 11% de la fecha

    padding: '2px 1px',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subHeaderCellInicioFinal: {
    width: '50%', // Para que Inicio y Final se dividan el 14% de la hora
    padding: '2px 1px',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 🔧 DATA CELLS CORREGIDOS - MISMO ANCHO QUE HEADERS
  cellNo: {
    width: '5%',
    borderRightWidth: 1,
    borderRightColor: '#ECEEDF',
    borderStyle: 'solid',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  cellFecha: {
    width: '11%',
    flexDirection: 'row', // Importante para alinear DD y MM en la misma fila
    borderRightWidth: 1,
    borderRightColor: '#ECEEDF',
    borderRightStyle: 'solid',
  },
  cellFechaDD: {
    width: '50%', // 50% de 11% = 5.5%
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellFechaMM: {
    width: '50%', // 50% de 11% = 5.5%
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1, // Agregamos un borde interno
    borderLeftColor: '#ECEEDF',
    borderLeftStyle: 'solid',
  },
  cellHora: {
    width: '14%',
    flexDirection: 'row', // Importante para alinear Inicio y Final en la misma fila
    borderRightWidth: 1,
    borderRightColor: '#ECEEDF',
    borderRightStyle: 'solid',
  },
  cellHoraInicio: {
    width: '50%', // 50% de 14% = 7%
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellHoraFinal: {
    width: '50%', // 50% de 14% = 7%
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1, // Agregamos un borde interno
    borderLeftColor: '#ECEEDF',
    borderLeftStyle: 'solid',
  },
  cellTema: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: '#ECEEDF',
    borderRightStyle: 'solid',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellHoras: {
    width: '7%',
    borderRightWidth: 1,
    borderRightColor: '#ECEEDF',
    borderRightStyle: 'solid',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellFirma: {
    width: '13%',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
  },
  cellContent: {
    fontSize: 8,
    textAlign: 'center',
    color: '#495057',
  },
  cellTextLeft: {
    fontSize: 8,
    textAlign: 'left',
  },
  cellTextCenter: {
    fontSize: 8,
    textAlign: 'center',
  },

  // 🔧 DATA CELLS CORREGIDOS - MISMO ANCHO QUE HEADERS

  // Text styles
  headerText: {
    fontSize: 8,
    color: '#eee',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  cellText: {
    fontSize: 8,
    textAlign: 'center',
    padding: 2,
  },

  // Section styles
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
    color: '#2c3e50',
    borderBottom: '1px solid #e9ecef',
    paddingBottom: 5,
  },

  // Signature styles
  signatureImage: {
    maxWidth: '100%',
    maxHeight: 45,
    objectFit: 'contain',
  },

  // Striped rows
  evenRow: {
    backgroundColor: '#f8f9fa',
  },
  oddRow: {
    backgroundColor: '#ffffff',
  },
});

// 📌 Interfaces
export interface ClassData {
  id: string;
  date: Date;
  startTime?: Date | null;
  endTime?: Date | null;
  topic?: string | null;
  status: string;
  cancellationReason?: string | null;
}

export interface TeacherReportData {
  teacher: {
    name: string;
    signatureUrl?: string;
  };
  subject: {
    name: string;
    code: string;
    program?: string;
  };
  classes: ClassData[];
  cancelledClasses: ClassData[];
  period: number;
  year: number;
  logoDataUri?: string;
  signatureDataUri?: string;
}

// 📄 Componente PDF mejorado
export const AttendanceReportPDF: React.FC<{ data: TeacherReportData }> = ({ data }) => {
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return { day, month };
  };

  const formatTime = (date: Date | null | undefined) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const calculateHours = (startTime: Date | null | undefined, endTime: Date | null | undefined) => {
    if (!startTime || !endTime) return '2';
    const diff = endTime.getTime() - startTime.getTime();
    return Math.round(diff / (1000 * 60 * 60)).toString();
  };

  const realizedClasses = data.classes.filter(c => c.status === 'REALIZADA');
  const currentDate = new Date();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header mejorado */}

        <View style={styles.pageHeader}>
          <View style={styles.headerGrid}>
            {/* Logo */}

            <View style={styles.logoContainer}>
              {data.logoDataUri && <Image style={styles.logo} src={data.logoDataUri} />}
            </View>

            {/* Títulos */}

            <View style={styles.titleContainer}>
              <Text style={styles.mainTitle}>REGISTRO DE CLASES Y ASISTENCIA</Text>

              <Text style={styles.subTitle}>DOCENCIA</Text>
            </View>

            {/* Meta información */}

            <View style={styles.metaContainer}>
              <View style={styles.metaTable}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaBold}>Código: </Text>

                  <Text style={styles.metaText}>FO-DO-005</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaBold}>Versión: </Text>

                  <Text style={styles.metaText}>08</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaBold}>Fecha: </Text>

                  <Text style={styles.metaText}>
                    {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        {/* ... (Header y sección de información) */}
        {/* Sección de información mejorada */}

        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>NOMBRE DEL DOCENTE:</Text>

              <Text style={styles.infoValue}>{data.teacher.name || 'N/A'}</Text>
            </View>

            <View style={styles.infoRight}>
              <Text style={styles.infoLabel}>PROGRAMA:</Text>

              <Text style={styles.infoValue}>{data.subject.program || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>ASIGNATURA:</Text>

              <Text style={styles.infoValue}>{data.subject.name}</Text>
            </View>

            <View style={styles.infoRight}>
              <Text style={styles.infoLabel}>AÑO:</Text>

              <Text style={styles.infoValue}>{data.year}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>CÓDIGO:</Text>

              <Text style={styles.infoValue}>{data.subject.code}</Text>
            </View>

            <View style={styles.infoRight}>
              <Text style={styles.infoLabel}>PERIODO:</Text>

              <Text style={styles.infoValue}>{data.period}</Text>
            </View>
          </View>
        </View>

        {/* 🔧 TABLA PRINCIPAL CORREGIDA */}
        <View style={styles.mainTable}>
          {/* Header principal */}
          <View style={[styles.tableRow, { height: 35 }]}>
            <View style={styles.headerCellNo}>
              <Text style={styles.headerText}>No.</Text>
            </View>
            <View style={styles.headerCellFecha}>
              <Text style={styles.headerText}>FECHA</Text>
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <View style={styles.subHeaderCellDDMM}>
                  <Text style={styles.headerText}>DD</Text>
                </View>
                <View style={styles.subHeaderCellDDMM}>
                  <Text style={styles.headerText}>MM</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerCellHora}>
              <Text style={styles.headerText}>HORA</Text>
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <View style={styles.subHeaderCellInicioFinal}>
                  <Text style={styles.headerText}>INICIO</Text>
                </View>
                <View style={[styles.subHeaderCellInicioFinal, { borderRightWidth: 0 }]}>
                  <Text style={styles.headerText}>FINAL</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerCellTema}>
              <Text style={styles.headerText}>TEMA</Text>
            </View>
            <View style={styles.headerCellHoras}>
              <Text style={styles.headerText}>TOTAL{'\n'}HORAS</Text>
            </View>
            <View style={styles.headerCellFirma}>
              <Text style={styles.headerText}>FIRMA{'\n'}DOCENTE</Text>
            </View>
          </View>

          {/* Filas de datos */}
          {realizedClasses.map((classItem, index) => {
            const dateInfo = formatDate(classItem.date);
            const isEven = index % 2 === 1;
            return (
              <View
                key={classItem.id}
                style={[styles.tableRow, ...(isEven ? [styles.evenRow] : [])]}
              >
                <View style={styles.cellNo}>
                  <Text style={styles.cellContent}>{index + 1}</Text>
                </View>
                <View style={styles.cellFecha}>
                  <View style={styles.cellFechaDD}>
                    <Text style={styles.cellContent}>{dateInfo.day}</Text>
                  </View>
                  <View style={styles.cellFechaMM}>
                    <Text style={styles.cellContent}>{dateInfo.month}</Text>
                  </View>
                </View>
                <View style={styles.cellHora}>
                  <View style={styles.cellHoraInicio}>
                    <Text style={styles.cellContent}>{formatTime(classItem.startTime)}</Text>
                  </View>
                  <View style={styles.cellHoraFinal}>
                    <Text style={styles.cellContent}>{formatTime(classItem.endTime)}</Text>
                  </View>
                </View>
                <View style={styles.cellTema}>
                  <Text style={styles.cellTextCenter}>
                    {classItem.topic || `Sesión ${index + 1}`}
                  </Text>
                </View>
                <View style={styles.cellHoras}>
                  <Text style={styles.cellContent}>
                    {calculateHours(classItem.startTime, classItem.endTime)}
                  </Text>
                </View>
                <View style={styles.cellFirma}>
                  {data.signatureDataUri && (
                    <Image style={styles.signatureImage} src={data.signatureDataUri} />
                  )}
                </View>
              </View>
            );
          })}

          {/* Filas vacías */}
          {/* {Array.from({ length: Math.max(0, 15 - realizedClasses.length) }).map((_, index) => {
            const isEven = (realizedClasses.length + index) % 2 === 1;
            return (
              <View
                key={`empty-${index}`}
                style={[styles.tableRow, ...(isEven ? [styles.evenRow] : [])]}
              >
                <View style={styles.cellNo}>
                  <Text style={styles.cellContent}>{realizedClasses.length + index + 1}</Text>
                </View>
                <View style={styles.cellFecha}>
                  <View style={styles.cellFechaDD}>
                    <Text style={styles.cellContent}></Text>
                  </View>
                  <View style={styles.cellFechaMM}>
                    <Text style={styles.cellContent}></Text>
                  </View>
                </View>
                <View style={styles.cellHora}>
                  <View style={styles.cellHoraInicio}>
                    <Text style={styles.cellContent}></Text>
                  </View>
                  <View style={styles.cellHoraFinal}>
                    <Text style={styles.cellContent}></Text>
                  </View>
                </View>
                <View style={styles.cellTema}>
                  <Text style={styles.cellTextLeft}></Text>
                </View>
                <View style={styles.cellHoras}>
                  <Text style={styles.cellContent}></Text>
                </View>
                <View style={styles.cellFirma}>
                  <Text style={styles.cellContent}></Text>
                </View>
              </View>
            );
          })} */}
        </View>

        {/* Sección de clases canceladas corregida */}
        {/* {data.cancelledClasses.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>CLASES CANCELADAS</Text>
            <View style={styles.mainTable}>
             
              <View style={[styles.tableRow, { height: 35 }]}>
                <View style={styles.headerCellNo}>
                  <Text style={styles.headerText}>No.</Text>
                </View>
                <View style={styles.headerCellFecha}>
                  <Text style={styles.headerText}>FECHA</Text>
                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    <View style={styles.subHeaderCellDDMM}>
                      <Text style={styles.headerText}>DD</Text>
                    </View>
                    <View style={styles.subHeaderCellDDMM}>
                      <Text style={styles.headerText}>MM</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.headerCellHora}>
                  <Text style={styles.headerText}>HORA</Text>
                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    <View style={styles.subHeaderCellInicioFinal}>
                      <Text style={styles.headerText}>INICIO</Text>
                    </View>
                    <View style={[styles.subHeaderCellInicioFinal, { borderRightWidth: 0 }]}>
                      <Text style={styles.headerText}>FINAL</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.headerCellTema}>
                  <Text style={styles.headerText}>RAZÓN DE{'\n'}CANCELACIÓN</Text>
                </View>
                <View style={styles.headerCellHoras}>
                  <Text style={styles.headerText}>TOTAL{'\n'}HORAS</Text>
                </View>
                <View style={styles.headerCellFirma}>
                  <Text style={styles.headerText}>FIRMA{'\n'}DOCENTE</Text>
                </View>
              </View>

             
              {data.cancelledClasses.map((cancelledClass, index) => {
                const dateInfo = formatDate(cancelledClass.date);
                const isEven = index % 2 === 1;
                return (
                  <View
                    key={cancelledClass.id}
                    style={[styles.tableRow, ...(isEven ? [styles.evenRow] : [])]}
                  >
                    <View style={styles.cellNo}>
                      <Text style={styles.cellContent}>{index + 1}</Text>
                    </View>
                    <View style={styles.cellFecha}>
                      <View style={styles.cellFechaDD}>
                        <Text style={styles.cellContent}>{dateInfo.day}</Text>
                      </View>
                      <View style={styles.cellFechaMM}>
                        <Text style={styles.cellContent}>{dateInfo.month}</Text>
                      </View>
                    </View>
                    <View style={styles.cellHora}>
                      <View style={styles.cellHoraInicio}>
                        <Text style={styles.cellContent}>
                          {formatTime(cancelledClass.startTime)}
                        </Text>
                      </View>
                      <View style={styles.cellHoraFinal}>
                        <Text style={styles.cellContent}>{formatTime(cancelledClass.endTime)}</Text>
                      </View>
                    </View>
                    <View style={styles.cellTema}>
                      <Text style={styles.cellTextLeft}>
                        {cancelledClass.cancellationReason || 'Sin especificar'}
                      </Text>
                    </View>
                    <View style={styles.cellHoras}>
                      <Text style={styles.cellContent}>
                        {calculateHours(cancelledClass.startTime, cancelledClass.endTime)}
                      </Text>
                    </View>
                    <View style={styles.cellFirma}>
                      {data.signatureDataUri && (
                        <Image style={styles.signatureImage} src={data.signatureDataUri} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )} */}
      </Page>
    </Document>
  );
};

// 🚀 Generador de PDF mejorado
export async function generateAttendanceReportPDF(
  subjectId: string,
  teacherId: string,
  period: number,
  year: number,
  reportId?: string,
  requestedBy?: { id: string; name: string; correoPersonal: string | null } | null
): Promise<{ buffer: Buffer; fileName: string }> {
  try {
    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      include: {
        teacher: {
          select: {
            name: true,
            signatureUrl: true,
          },
        },
        classes: {
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    if (!subject) throw new Error('Asignatura no encontrada');
    if (subject.teacherId !== teacherId) throw new Error('No autorizado');

    const startDate = new Date(year, period === 1 ? 0 : 6, 1);
    const endDate = new Date(year, period === 1 ? 5 : 11, 31);

    const periodClasses = subject.classes.filter(
      cls => cls.date >= startDate && cls.date <= endDate
    );

    const realizedClasses = periodClasses.filter(cls => cls.status === 'REALIZADA');
    const cancelledClasses = periodClasses.filter(cls => cls.status === 'CANCELADA');

    // Obtener logo de la institución
    let logoDataUri: string | undefined;
    try {
      const logoUrl =
        'https://fup.edu.co/wp-content/uploads/Logo-FUP-2018-Isotipo-01-300x300-1.png';
      const response = await fetch(logoUrl);
      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        logoDataUri = `data:image/png;base64,${imageBase64}`;
      }
    } catch (error) {
      // Could not get logo
    }

    // Procesar firma del docente
    let signatureDataUri: string | undefined;
    if (subject.teacher?.signatureUrl) {
      try {
        if (subject.teacher.signatureUrl.startsWith('http')) {
          const response = await fetch(subject.teacher.signatureUrl);
          if (response.ok) {
            const imageBuffer = await response.arrayBuffer();
            const imageBase64 = Buffer.from(imageBuffer).toString('base64');
            const mimeType = response.headers.get('content-type') || 'image/png';
            signatureDataUri = `data:${mimeType};base64,${imageBase64}`;
          }
        }
      } catch (error) {
        // Could not process signature
      }
    }

    const reportData: TeacherReportData = {
      teacher: {
        name: subject.teacher?.name || 'Sin nombre',
        signatureUrl: subject.teacher?.signatureUrl || undefined,
      },
      subject: {
        name: subject.name,
        code: subject.code,
        program: subject.program || undefined,
      },
      classes: realizedClasses,
      cancelledClasses: cancelledClasses,
      period,
      year,
      logoDataUri,
      signatureDataUri,
    };

    // Crear el documento PDF
    const pdfDoc = <AttendanceReportPDF data={reportData} />;
    const pdfInstance = pdf(pdfDoc);
    const stream = await pdfInstance.toBlob();
    const arrayBuffer = await stream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `registro-clases-${subject.code}-${period}-${year}-${Date.now()}.pdf`;

    // Enviar notificación por correo si se proporcionó el ID del reporte y el solicitante
    if (reportId && requestedBy?.correoPersonal) {
      try {
        await sendEmail({
          to: requestedBy.correoPersonal,
          subject: `Reporte de asistencia generado - ${subject.name}`,
          react: ReportReadyEmail({
            subjectName: subject.name,
            reportName: fileName,
            downloadUrl: '', // La URL de descarga debería ser proporcionada por el sistema de almacenamiento
            userName: requestedBy.name || 'Docente',
            supportEmail: 'soporte@institucion.edu.co',
          }),
        });

        //Actualizar el estado del reporte si se proporcionó un ID
        if (reportId) {
          await db.report.update({
            where: { id: reportId },
            data: { status: ReportStatus.COMPLETADO },
          });
        }
      } catch (emailError) {
        if (reportId) {
          await db.report.update({
            where: { id: reportId },
            data: {
              status: ReportStatus.FALLIDO,
              error:
                'El reporte se generó correctamente, pero hubo un error al enviar la notificación por correo.',
            },
          });
        }
      }
    }

    return { buffer, fileName };
  } catch (error) {
    throw error;
  }
}
