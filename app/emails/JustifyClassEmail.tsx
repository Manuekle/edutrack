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
  const previewText = `Justificación de ausencia de ${studentName} - ${subjectName}`;

  const formattedClassDate = new Date(classDate).toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedSubmissionDate = submissionDate
    ? new Date(submissionDate).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  return (
    <Html lang="es" dir="ltr">
      <Tailwind>
        <Head>
          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
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
              <Heading className="sm:text-3xl text-2xl font-semibold text-white m-0 leading-[28px]">
                Justificación Recibida
              </Heading>
              <Text className="text-[#9CD5FF] text-xs m-0 mt-[4px] leading-[20px]">
                Nueva justificación de ausencia registrada
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px]">
              {/* Status Message */}
              <Section className="mb-[32px] text-center">
                <Heading className="sm:text-3xl text-2xl font-semibold text-[#355872] m-0 mb-[8px] leading-[32px]">
                  Justificación Registrada
                </Heading>
                <Text className="text-[#7AAACE] text-xs leading-[24px] m-0">
                  El estudiante <strong>{studentName}</strong> ha justificado su ausencia a la
                  clase.
                </Text>
              </Section>

              {/* Student Info */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[12px]">
                  Información del estudiante
                </Text>
                <div className="bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[16px] py-[16px]">
                  <Text className="text-xs font-medium text-[#355872] m-0 leading-[20px]">
                    {studentName}
                  </Text>
                </div>
              </Section>

              {/* Class Details */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[12px]">
                  Detalles de la clase
                </Text>
                <div className="bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[16px] py-[16px] space-y-[12px]">
                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Asignatura
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[20px]">{subjectName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Clase
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[20px]">{className}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Fecha de la clase
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[20px]">
                      {formattedClassDate}
                    </Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Horario
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[20px]">{classTime}</Text>
                  </div>
                </div>
              </Section>

              {/* Justification */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[12px]">
                  Motivo de la justificación
                </Text>
                <div className="bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[16px] py-[16px]">
                  <Text className="text-xs text-[#355872] m-0 leading-[22px] whitespace-pre-wrap">
                    {justification}
                  </Text>
                </div>
              </Section>

              {/* Submission Details */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[12px]">
                  Detalles de la solicitud
                </Text>
                <div className="bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[16px] py-[16px] space-y-[8px]">
                  <div className="flex items-center">
                    <Text className="text-xs font-medium text-[#355872] m-0">
                      Justificación enviada exitosamente
                    </Text>
                  </div>
                  <Text className="text-xs text-[#7AAACE] m-0 leading-[16px]">
                    Fecha de envío: {formattedSubmissionDate}
                  </Text>
                </div>
              </Section>

              {/* Next Steps */}
              <Section className="mb-[32px]">
                <div className="bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[16px] py-[12px]">
                  <Text className="text-xs text-[#355872] m-0 leading-[20px]">
                    <strong>Próximos pasos:</strong> Esta justificación será revisada por el
                    profesor de la asignatura. El estudiante será notificado sobre el estado de su
                    solicitud.
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

export default JustifyClassEmail;
