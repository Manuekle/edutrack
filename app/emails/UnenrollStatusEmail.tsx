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
        <Body className="bg-[#F7F8F0] font-sans py-[40px]">
          <Container className="mx-auto max-w-[580px] bg-white border border-[#7AAACE] rounded-[12px] overflow-hidden">
            {/* Header */}
            <Section
              className={`px-[32px] py-[24px] ${isApproved ? 'bg-[#355872]' : 'bg-[#7AAACE]'}`}
            >
              <Heading className="text-[20px] font-semibold text-white m-0 leading-[28px]">
                Solicitud {isApproved ? 'Aprobada' : 'Rechazada'}
              </Heading>
              <Text
                className={`text-${isApproved ? '[#9CD5FF]' : 'white'} text-xs m-0 mt-[4px] leading-[20px]`}
              >
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
                  className={`inline-flex items-center justify-center w-[64px] h-[64px] rounded-full mb-[16px] ${isApproved ? 'bg-[#F7F8F0]' : 'bg-[#F7F8F0]'}`}
                >
                  <Text
                    className={`text-[32px] m-0 ${isApproved ? 'text-[#355872]' : 'text-[#7AAACE]'}`}
                  >
                    {isApproved ? '✓' : '✕'}
                  </Text>
                </div>
                <Text className="text-[#7AAACE] text-xs leading-[24px] m-0">
                  {isApproved
                    ? 'Tu solicitud de desmatriculación ha sido aprobada exitosamente.'
                    : 'Tu solicitud de desmatriculación ha sido rechazada.'}
                </Text>
              </Section>

              {/* Request Details */}
              <Section className="mb-[24px]">
                <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[12px]">
                  Detalles de la solicitud
                </Text>
                <div className="space-y-[12px]">
                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Estudiante
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[24px]">{studentName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Asignatura
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[24px]">{subjectName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Fecha de solicitud
                    </Text>
                    <Text className="text-xs text-[#7AAACE] m-0 leading-[20px]">
                      {formattedRequestDate}
                    </Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Fecha de decisión
                    </Text>
                    <Text className="text-xs text-[#7AAACE] m-0 leading-[20px]">
                      {formattedDecisionDate}
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Rejection Reason */}
              {!isApproved && reason && (
                <Section className="mb-[24px]">
                  <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[8px]">
                    Motivo del rechazo
                  </Text>
                  <div className="bg-[#F7F8F0] border-l-[4px] border-[#7AAACE] px-[16px] py-[12px]">
                    <Text className="text-xs text-[#355872] leading-[20px] m-0 italic">
                      "{reason}"
                    </Text>
                  </div>
                </Section>
              )}

              <Hr className="border-[#7AAACE] my-[24px]" />

              {/* Status Message */}
              <Section className="mb-[24px]">
                <div
                  className={`border rounded-[8px] px-[16px] py-[12px] bg-[#F7F8F0] border-[#7AAACE]`}
                >
                  <Text className={`text-xs m-0 leading-[20px] text-[#355872]`}>
                    <strong>Estado actual:</strong>{' '}
                    {isApproved
                      ? `Has sido desmatriculado exitosamente de la asignatura ${subjectName}.`
                      : 'Permaneces matriculado en la asignatura. Puedes presentar una nueva solicitud si es necesario.'}
                  </Text>
                </div>
              </Section>

              <Hr className="border-[#7AAACE] my-[24px]" />

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

export default UnenrollStatusEmail;
