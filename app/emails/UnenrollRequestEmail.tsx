import {
  Body,
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

interface UnenrollRequestEmailProps {
  studentName: string;
  studentEmail: string;
  subjectName: string;
  reason: string;
  requestDate: string;
  supportEmail: string;
}

const UnenrollRequestEmail = ({
  studentName,
  studentEmail,
  subjectName,
  reason,
  requestDate,
  supportEmail,
}: UnenrollRequestEmailProps) => {
  const previewText = `Nueva solicitud de desmatriculación - ${subjectName}`;

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
              <Heading className="text-[20px] font-semibold text-white m-0 leading-[28px]">
                Solicitud de Desmatriculación
              </Heading>
              <Text className="text-zinc-300 text-xs m-0 mt-[4px] leading-[20px]">
                Nueva solicitud pendiente de revisión
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px]">
              <Text className="text-zinc-600 text-xs leading-[24px] m-0 mb-[24px]">
                Se ha recibido una nueva solicitud de desmatriculación que requiere su revisión.
              </Text>

              {/* Student Details Card */}
              <Section className="mb-[24px]">
                <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[12px]">
                  Detalles del estudiante
                </Text>
                <div className="space-y-[12px]">
                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Nombre completo
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[24px]">{studentName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Correo electrónico
                    </Text>
                    <Text className="text-xs text-zinc-700 m-0 leading-[20px]">{studentEmail}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Asignatura
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[24px]">{subjectName}</Text>
                  </div>
                </div>
              </Section>

              <Hr className="border-zinc-200 my-[24px]" />

              {/* Request Details */}
              <Section className="mb-[24px]">
                <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[12px]">
                  Detalles de la solicitud
                </Text>
                <div className="space-y-[12px]">
                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Fecha de solicitud
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[20px]">
                      {new Date(requestDate).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Reason */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[8px]">
                  Motivo de la solicitud
                </Text>
                <div className="bg-zinc-50 border-l-[4px] border-zinc-300 px-[16px] py-[12px]">
                  <Text className="text-xs text-zinc-700 leading-[20px] m-0 italic">
                    "{reason}"
                  </Text>
                </div>
              </Section>

              {/* Action Required */}
              <Section className="mb-[24px]">
                <div className="bg-blue-50 border border-blue-200 rounded-[8px] px-[16px] py-[12px]">
                  <Text className="text-xs text-blue-800 m-0 leading-[20px]">
                    <strong>Acción requerida:</strong> Por favor, ingrese al sistema para revisar y
                    gestionar esta solicitud de desmatriculación.
                  </Text>
                </div>
              </Section>

              <Hr className="border-zinc-200 my-[24px]" />

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

export default UnenrollRequestEmail;
