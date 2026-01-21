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

interface UnenrollStatusEmailProps {
  studentName: string;
  subjectName: string;
  isApproved: boolean;
  reason?: string;
  requestDate: string;
  decisionDate: string;
  supportEmail: string;
}

const UnenrollStatusEmail = ({
  studentName,
  subjectName,
  isApproved,
  reason = '',
  requestDate,
  decisionDate,
  supportEmail,
}: UnenrollStatusEmailProps) => {
  const previewText = `Solicitud de desmatriculación ${isApproved ? 'aprobada' : 'rechazada'}`;
  const formattedRequestDate = new Date(requestDate).toLocaleDateString('es-CO');
  const formattedDecisionDate = new Date(decisionDate).toLocaleDateString('es-CO');

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
            <Section
              className={`px-[32px] py-[24px] ${isApproved ? 'bg-green-600' : 'bg-red-600'}`}
            >
              <Heading className="text-[20px] font-semibold text-white m-0 leading-[28px]">
                Solicitud {isApproved ? 'Aprobada' : 'Rechazada'}
              </Heading>
              <Text className="text-green-100 text-xs m-0 mt-[4px] leading-[20px]">
                {isApproved
                  ? 'Tu desmatriculación ha sido procesada'
                  : 'Tu solicitud no pudo ser procesada'}
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px]">
              {/* Status Banner */}
              <Section className="mb-[32px] text-center">
                <div
                  className={`inline-flex items-center justify-center w-[64px] h-[64px] rounded-full mb-[16px] ${isApproved ? 'bg-green-100' : 'bg-red-100'}`}
                >
                  <Text
                    className={`text-[32px] m-0 ${isApproved ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {isApproved ? '✓' : '✕'}
                  </Text>
                </div>
                <Text className="text-zinc-600 text-xs leading-[24px] m-0">
                  {isApproved
                    ? 'Tu solicitud de desmatriculación ha sido aprobada exitosamente.'
                    : 'Tu solicitud de desmatriculación ha sido rechazada.'}
                </Text>
              </Section>

              {/* Request Details */}
              <Section className="mb-[24px]">
                <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[12px]">
                  Detalles de la solicitud
                </Text>
                <div className="space-y-[12px]">
                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Estudiante
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[24px]">{studentName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Asignatura
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[24px]">{subjectName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Fecha de solicitud
                    </Text>
                    <Text className="text-xs text-zinc-700 m-0 leading-[20px]">
                      {formattedRequestDate}
                    </Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Fecha de decisión
                    </Text>
                    <Text className="text-xs text-zinc-700 m-0 leading-[20px]">
                      {formattedDecisionDate}
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Rejection Reason */}
              {!isApproved && reason && (
                <Section className="mb-[24px]">
                  <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[8px]">
                    Motivo del rechazo
                  </Text>
                  <div className="bg-red-50 border-l-[4px] border-red-300 px-[16px] py-[12px]">
                    <Text className="text-xs text-red-800 leading-[20px] m-0 italic">
                      "{reason}"
                    </Text>
                  </div>
                </Section>
              )}

              <Hr className="border-zinc-200 my-[24px]" />

              {/* Status Message */}
              <Section className="mb-[24px]">
                <div
                  className={`border rounded-[8px] px-[16px] py-[12px] ${isApproved ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}
                >
                  <Text
                    className={`text-xs m-0 leading-[20px] ${isApproved ? 'text-green-800' : 'text-blue-800'}`}
                  >
                    <strong>Estado actual:</strong>{' '}
                    {isApproved
                      ? `Has sido desmatriculado exitosamente de la asignatura ${subjectName}.`
                      : 'Permaneces matriculado en la asignatura. Puedes presentar una nueva solicitud si es necesario.'}
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

export default UnenrollStatusEmail;
