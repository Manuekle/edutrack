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

interface ClassNotifyEmailProps {
  className: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  date: string;
  justificationLink: string;
  supportEmail: string;
  studentName?: string;
}

const ClassNotifyEmail = ({
  className,
  subjectName,
  startTime,
  endTime,
  date,
  justificationLink,
  supportEmail,
  studentName,
}: ClassNotifyEmailProps) => {
  const previewText = `Clase iniciada: ${subjectName} — ${startTime}`;

  const formattedDate = new Date(date).toLocaleDateString('es-CO', {
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
                Clase en curso
              </Heading>
              <Text className="text-sm text-[#93C5E0] m-0 mt-[6px] leading-[22px]">
                La clase ha iniciado — registra tu asistencia
              </Text>
            </Section>

            {/* Body */}
            <Section className="px-[40px] py-[40px]">
              <Text className="text-sm text-[#4A5568] leading-[24px] m-0 mb-[32px]">
                {studentName ? `Hola, ${studentName}. ` : 'Hola, '}
                La clase de <strong>{subjectName}</strong> ha comenzado. Por favor, registra tu
                asistencia a tiempo.
              </Text>

              {/* Class details card */}
              <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-[10px] overflow-hidden mb-[32px]">
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
                    Grupo
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">{className}</Text>
                </div>
                <Hr className="border-[#E2E8F0] m-0" />
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Fecha
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">{formattedDate}</Text>
                </div>
                <Hr className="border-[#E2E8F0] m-0" />
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Horario
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">
                    {startTime} — {endTime}
                  </Text>
                </div>
              </div>

              {/* Justify absence section */}
              <Hr className="border-[#E2E8F0] mb-[32px]" />

              <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[10px]">
                ¿No puedes asistir?
              </Text>
              <Text className="text-sm text-[#4A5568] leading-[24px] m-0 mb-[20px]">
                Si no puedes asistir a esta clase, justifica tu ausencia antes de que finalice la
                sesión:
              </Text>

              <Section className="text-center mb-[24px]">
                <Button
                  href={justificationLink}
                  className="bg-[#D97706] text-white text-sm font-semibold px-[32px] py-[14px] rounded-[8px] box-border inline-block no-underline leading-[24px]"
                >
                  Justificar ausencia
                </Button>
              </Section>

              {/* Warning notice */}
              <div style={{ borderLeft: '3px solid #F59E0B', backgroundColor: '#FFFBEB', padding: '14px 16px', borderRadius: '0 8px 8px 0' }}>
                <Text className="text-sm text-[#92400E] m-0 leading-[22px]">
                  <strong>Recordatorio:</strong> Las justificaciones deben presentarse dentro de
                  las <strong>24 horas</strong> posteriores al inicio de la clase.
                </Text>
              </div>
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

export default ClassNotifyEmail;
