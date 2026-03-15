import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface JustifyClassEmailProps {
  studentName: string;
  className: string;
  subjectName: string;
  classDate: string;
  classTime: string;
  justification: string;
  supportEmail: string;
  submissionDate?: string;
}

const JustifyClassEmail = ({
  studentName,
  className,
  subjectName,
  classDate,
  classTime,
  justification,
  supportEmail,
  submissionDate,
}: JustifyClassEmailProps) => {
  const previewText = `Justificación de ausencia de ${studentName} — ${subjectName}`;

  const formattedClassDate = new Date(classDate).toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedSubmissionDate = new Date(submissionDate ?? Date.now()).toLocaleDateString(
    'es-CO',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <Html lang="es" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>{previewText}</Preview>
        <Body className="bg-[#EEF2F7] font-sans py-[48px]">
          <Container className="mx-auto max-w-[600px] bg-white border border-[#E2E8F0] rounded-[16px] overflow-hidden">

            {/* Header */}
            <Section className="bg-[#1E3A52] px-[40px] py-[32px]">
              <Text className="text-[11px] font-semibold text-[#7EC8E3] uppercase tracking-card m-0 mb-[16px]">
                SIRA · Sistema de Asistencias FUP
              </Text>
              <Heading className="text-[26px] font-bold text-white m-0 leading-[34px]">
                Justificación recibida
              </Heading>
              <Text className="text-sm text-[#93C5E0] m-0 mt-[6px] leading-[22px]">
                Nueva justificación de ausencia registrada
              </Text>
            </Section>

            {/* Body */}
            <Section className="px-[40px] py-[40px]">
              <Text className="text-sm text-[#4A5568] leading-[24px] m-0 mb-[32px]">
                El estudiante <strong>{studentName}</strong> ha enviado una justificación de
                ausencia para la siguiente clase.
              </Text>

              {/* Student + class info card */}
              <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-[10px] overflow-hidden mb-[24px]">
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Estudiante
                  </Text>
                  <Text className="text-sm font-semibold text-[#2D3748] m-0 leading-[22px]">
                    {studentName}
                  </Text>
                </div>
                <Hr className="border-[#E2E8F0] m-0" />
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Asignatura
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">{subjectName}</Text>
                </div>
                <Hr className="border-[#E2E8F0] m-0" />
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Grupo / Clase
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">{className}</Text>
                </div>
                <Hr className="border-[#E2E8F0] m-0" />
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Fecha de la clase
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">
                    {formattedClassDate}
                  </Text>
                </div>
                <Hr className="border-[#E2E8F0] m-0" />
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Horario
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">{classTime}</Text>
                </div>
              </div>

              {/* Justification text */}
              <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[10px]">
                Motivo de la justificación
              </Text>
              <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-[10px] px-[20px] py-[16px] mb-[24px]">
                <Text className="text-sm text-[#2D3748] m-0 leading-[24px] whitespace-pre-wrap">
                  {justification}
                </Text>
              </div>

              {/* Next steps notice */}
              <div style={{ borderLeft: '3px solid #3B82F6', backgroundColor: '#EFF6FF', padding: '14px 16px', borderRadius: '0 8px 8px 0', marginBottom: '32px' }}>
                <Text className="text-sm text-[#1E40AF] m-0 leading-[22px]">
                  <strong>Próximos pasos:</strong> Esta justificación debe ser revisada y aprobada
                  o rechazada desde el panel docente en SIRA.
                </Text>
              </div>

              <Hr className="border-[#E2E8F0] my-[8px]" />

              {/* Submission metadata */}
              <Text className="text-[13px] text-[#718096] m-0 mt-[24px] leading-[20px]">
                Fecha de envío: {formattedSubmissionDate}
              </Text>
            </Section>

            {/* Footer */}
            <Section className="bg-[#F7FAFC] px-[40px] py-[24px] border-t border-[#E2E8F0]">
              <Text className="text-[13px] text-[#718096] text-center m-0">
                ¿Necesitas ayuda? Escríbenos a{' '}
                <Link href={`mailto:${supportEmail}`} className="text-[#2563EB]">
                  {supportEmail}
                </Link>
              </Text>
              <Text className="text-[12px] text-[#A0AEC0] text-center m-0 mt-[8px]">
                © {new Date().getFullYear()} SIRA — Sistema Integral de Registro Académico
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default JustifyClassEmail;
