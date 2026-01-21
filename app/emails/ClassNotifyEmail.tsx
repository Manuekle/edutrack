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

        <Body className="bg-zinc-50 font-sans py-[40px]">
          <Container className="mx-auto max-w-[580px] bg-white border border-zinc-200 rounded-[12px] overflow-hidden">
            {/* Header */}
            <Section className="bg-black px-[32px] py-[24px]">
              <Heading className="sm:text-3xl text-2xl font-semibold text-white m-0 leading-[28px]">
                Clase en Curso
              </Heading>
              <Text className="text-zinc-300 text-xs m-0 mt-[4px] leading-[20px]">
                La clase ha iniciado - Registra tu asistencia
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px]">
              {/* Welcome Message */}
              <Section className="mb-[32px] text-center">
                <Heading className="sm:text-3xl text-2xl font-semibold text-black m-0 mb-[8px] leading-[32px]">
                  {studentName ? `Hola, ${studentName}` : 'Hola estudiante'}
                </Heading>
                <Text className="text-zinc-600 text-xs leading-[24px] m-0">
                  La clase de <strong>{subjectName}</strong> ha iniciado. Por favor, registra tu
                  asistencia.
                </Text>
              </Section>

              {/* Class Details */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[12px]">
                  Detalles de la clase
                </Text>
                <div className="bg-zinc-50 border border-zinc-200 rounded-[8px] px-[16px] py-[16px] space-y-[12px]">
                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Clase
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[20px]">{className}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Asignatura
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[20px]">{subjectName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Fecha
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[20px]">{formattedDate}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Horario
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[20px]">
                      {startTime} - {endTime}
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Status Indicator */}
              <Section className="mb-[32px]">
                <div className="bg-green-50 border border-green-200 rounded-[8px] px-[16px] py-[12px] flex items-center">
                  <div>
                    <Text className="text-xs font-medium text-green-800 m-0 mb-[4px]">
                      Clase activa
                    </Text>
                    <Text className="text-xs text-green-700 m-0 leading-[16px]">
                      El registro de asistencia está disponible ahora
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Action Section */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[16px]">
                  ¿No puedes asistir?
                </Text>
                <Text className="text-xs text-zinc-600 leading-[20px] m-0 mb-[16px]">
                  Si no puedes asistir a esta clase, puedes justificar tu ausencia haciendo clic en
                  el botón de abajo:
                </Text>

                <div className="text-center">
                  <Button
                    href={justificationLink}
                    className="bg-black text-white text-xs font-medium px-[24px] py-[12px] rounded-[8px] box-border inline-block text-center no-underline leading-[20px]"
                  >
                    Justificar Ausencia
                  </Button>
                </div>
              </Section>

              {/* Alternative Link */}
              <Section className="mb-[32px]">
                <div className="bg-blue-50 border border-blue-200 rounded-[8px] px-[16px] py-[12px]">
                  <Text className="text-xs font-medium text-blue-800 m-0 mb-[8px]">
                    Enlace alternativo
                  </Text>
                  <Text className="text-xs text-blue-700 m-0 mb-[8px] leading-[16px]">
                    Si el botón no funciona, copia y pega este enlace:
                  </Text>
                  <Text className="text-xs text-blue-600 m-0 leading-[16px] break-all">
                    {justificationLink}
                  </Text>
                </div>
              </Section>

              {/* Important Notice */}
              <Section className="mb-[32px]">
                <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-[16px] py-[12px]">
                  <Text className="text-xs text-amber-800 m-0 leading-[20px]">
                    <strong>Recordatorio:</strong> Las justificaciones deben presentarse dentro de
                    las 24 horas posteriores al inicio de la clase.
                  </Text>
                </div>
              </Section>

              <Hr className="border-zinc-200 my-[24px]" />

              {/* Support */}
              <Text className="text-xs text-zinc-500 m-0">
                Si no reconoces esta actividad o necesitas ayuda, contáctanos en{' '}
                <Link href={`mailto:${supportEmail}`} className="text-zinc-700 underline">
                  {supportEmail}
                </Link>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="bg-zinc-50 px-[32px] py-[16px] border-t border-zinc-200">
              <Text className="text-xs text-zinc-400 text-center m-0">
                Este es un correo automático, por favor no respondas a este mensaje.
              </Text>
              <Text className="text-xs text-zinc-400 text-center m-0 mt-[4px]">
                © {new Date().getFullYear()} Sistema de Gestión de Asistencias. Todos los derechos
                reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ClassNotifyEmail;
