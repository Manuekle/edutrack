import {
  Body,
  Button,
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

interface ClassCancellationEmailProps {
  studentName?: string;
  subjectName: string;
  teacherName: string;
  classDate: string;
  reason: string;
  supportEmail: string;
  loginUrl?: string;
}

const ClassCancellationEmail = ({
  studentName,
  subjectName,
  teacherName,
  classDate,
  reason,
  supportEmail,
  loginUrl,
}: ClassCancellationEmailProps) => {
  const previewText = `Clase cancelada: ${subjectName}`;

  const formattedDate = new Date(classDate).toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
                Clase cancelada
              </Heading>
              <Text className="text-sm text-[#93C5E0] m-0 mt-[6px] leading-[22px]">
                Notificación sobre tu clase programada
              </Text>
            </Section>

            {/* Body */}
            <Section className="px-[40px] py-[40px]">
              <Text className="text-sm text-[#4A5568] leading-[24px] m-0 mb-[32px]">
                {studentName ? `Hola, ${studentName}. ` : 'Hola, '}
                Te informamos que la siguiente clase ha sido cancelada:
              </Text>

              {/* Class details card */}
              <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-[10px] overflow-hidden mb-[24px]">
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Asignatura
                  </Text>
                  <Text className="text-sm font-semibold text-[#2D3748] m-0 leading-[22px]">
                    {subjectName}
                  </Text>
                </div>
                <Hr className="border-[#E2E8F0] m-0" />
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Docente
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">{teacherName}</Text>
                </div>
                <Hr className="border-[#E2E8F0] m-0" />
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Fecha cancelada
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">{formattedDate}</Text>
                </div>
              </div>

              {/* Reason */}
              <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[10px]">
                Motivo de la cancelación
              </Text>
              <div style={{ borderLeft: '3px solid #F59E0B', backgroundColor: '#FFFBEB', padding: '14px 16px', borderRadius: '0 8px 8px 0', marginBottom: '32px' }}>
                <Text className="text-sm text-[#92400E] m-0 leading-[24px] italic">
                  &ldquo;{reason}&rdquo;
                </Text>
              </div>

              {loginUrl && (
                <Section className="text-center">
                  <Button
                    href={loginUrl}
                    className="bg-[#2563EB] text-white text-sm font-semibold px-[32px] py-[14px] rounded-[8px] box-border inline-block no-underline leading-[24px]"
                  >
                    Ir al sistema
                  </Button>
                </Section>
              )}
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

export default ClassCancellationEmail;
