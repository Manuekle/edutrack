import {
  Body,
  Button,
  Container,
  Font,
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
  const previewText = `Clase iniciada: ${subjectName} - ${startTime}`;

  const formattedDate = new Date(date).toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Html lang="es" dir="ltr">
      <Tailwind>
        <Head>
          <Font
            fontFamily="Geist"
            fallbackFontFamily="sans-serif"
            webFont={{
              url: 'https://cdn.jsdelivr.net/npm/@vercel/style-guide@6.0.0/fonts/GeistVF.woff2',
              format: 'woff2',
            }}
            fontWeight={400}
            fontStyle="normal"
          />
        </Head>
        <Preview>{previewText}</Preview>

        <Body className="bg-[#F7F8F0] font-sans py-[40px]">
          <Container className="mx-auto max-w-[580px] bg-white border border-[#7AAACE] rounded-[12px] overflow-hidden">
            {/* Header */}
            <Section className="bg-[#355872] px-[32px] py-[24px]">
              <Heading className="sm:text-2xl text-xs font-semibold text-white m-0 leading-[28px]">
                Clase en Curso
              </Heading>
              <Text className="text-[#9CD5FF] text-xs m-0 mt-[4px] leading-[20px]">
                La clase ha iniciado - Registra tu asistencia
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px]">
              {/* Welcome Message */}
              <Section className="mb-[32px] text-center">
                <Heading className="sm:text-2xl text-xs font-semibold text-[#355872] m-0 mb-[8px] leading-[32px]">
                  {studentName ? `Hola, ${studentName}` : 'Hola estudiante'}
                </Heading>
                <Text className="text-[#7AAACE] text-xs leading-[24px] m-0">
                  La clase de <strong>{subjectName}</strong> ha iniciado. Por favor, registra tu
                  asistencia.
                </Text>
              </Section>

              {/* Class Details */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[12px]">
                  Detalles de la clase
                </Text>
                <div className="bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[16px] py-[16px] space-y-[12px]">
                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Clase
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[20px]">{className}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Asignatura
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[20px]">{subjectName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Fecha
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[20px]">
                      {formattedDate}
                    </Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Horario
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[20px]">
                      {startTime} - {endTime}
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Status Indicator */}
              <Section className="mb-[32px]">
                <div className="bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[16px] py-[12px] flex items-center">
                  <div>
                    <Text className="text-xs font-medium text-[#355872] m-0 mb-[4px]">
                      Clase activa
                    </Text>
                    <Text className="text-xs text-[#7AAACE] m-0 leading-[16px]">
                      El registro de asistencia está disponible ahora
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Action Section */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[16px]">
                  ¿No puedes asistir?
                </Text>
                <Text className="text-xs text-[#7AAACE] leading-[20px] m-0 mb-[16px]">
                  Si no puedes asistir a esta clase, puedes justificar tu ausencia haciendo clic en
                  el botón de abajo:
                </Text>

                <div className="text-center">
                  <Button
                    href={justificationLink}
                    className="bg-[#355872] text-white text-xs font-medium px-[24px] py-[12px] rounded-[8px] box-border inline-block text-center no-underline leading-[20px]"
                  >
                    Justificar Ausencia
                  </Button>
                </div>
              </Section>

              {/* Alternative Link */}
              <Section className="mb-[32px]">
                <div className="bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[16px] py-[12px]">
                  <Text className="text-xs font-medium text-[#355872] m-0 mb-[8px]">
                    Enlace alternativo
                  </Text>
                  <Text className="text-xs text-[#7AAACE] m-0 mb-[8px] leading-[16px]">
                    Si el botón no funciona, copia y pega este enlace:
                  </Text>
                  <Text className="text-xs text-[#355872] m-0 leading-[16px] break-all">
                    {justificationLink}
                  </Text>
                </div>
              </Section>

              {/* Important Notice */}
              <Section className="mb-[32px]">
                <div className="bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[16px] py-[12px]">
                  <Text className="text-xs text-[#355872] m-0 leading-[20px]">
                    <strong>Recordatorio:</strong> Las justificaciones deben presentarse dentro de
                    las 24 horas posteriores al inicio de la clase.
                  </Text>
                </div>
              </Section>

              <Hr className="border-[#7AAACE] my-[24px]" />

              {/* Support */}
              <Text className="text-xs text-[#355872] m-0">
                Si no reconoces esta actividad o necesitas ayuda, contáctanos en{' '}
                <Link href={`mailto:${supportEmail}`} className="text-[#7AAACE] underline">
                  {supportEmail}
                </Link>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="bg-[#F7F8F0] px-[32px] py-[16px] border-t border-[#7AAACE]">
              <Text className="text-xs text-[#355872] text-center m-0">
                Este es un correo automático, por favor no respondas a este mensaje.
              </Text>
              <Text className="text-xs text-[#7AAACE] text-center m-0 mt-[4px]">
                © {new Date().getFullYear()} SIRA - Sistema Integral de Registro Académico. Todos
                los derechos reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ClassNotifyEmail;
