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
  const previewText = `Cancelación de clase: ${subjectName}`;

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
              <Heading className="text-[20px] font-semibold text-white m-0 leading-[28px]">
                Clase Cancelada
              </Heading>
              <Text className="text-[#9CD5FF] text-xs m-0 mt-[4px] leading-[20px]">
                Notificación importante sobre tu clase programada
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px]">
              <Text className="text-[#7AAACE] text-xs leading-[24px] m-0 mb-[24px]">
                {studentName ? `Hola, ${studentName}. ` : 'Hola, '}te informamos que la siguiente
                clase ha sido cancelada:
              </Text>

              {/* Class Details Card */}
              <Section className="mb-[24px]">
                <div className="space-y-[12px]">
                  <div>
                    <Text className="text-xs font-semibold text-[#355872] tracking-normal m-0 mb-[4px]">
                      Asignatura
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[24px]">{subjectName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-semibold text-[#355872] tracking-normal m-0 mb-[4px]">
                      Docente
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[24px]">{teacherName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-semibold text-[#355872] tracking-normal m-0 mb-[4px]">
                      Fecha
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[24px]">
                      {new Date(classDate).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Reason */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-semibold text-[#355872] tracking-normal m-0 mb-[8px]">
                  Motivo de la cancelación
                </Text>
                <Text className="text-xs text-[#355872] leading-[24px] m-0 py-[12px] italic bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[12px]">
                  "{reason}"
                </Text>
              </Section>

              {loginUrl && (
                <Section className="mb-[24px] text-center">
                  <Button
                    href={loginUrl}
                    className="bg-[#355872] text-white text-xs font-semibold px-[24px] py-[12px] rounded-[8px] box-border inline-block text-center no-underline leading-[20px]"
                  >
                    Ir al sistema
                  </Button>
                </Section>
              )}

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

export default ClassCancellationEmail;
