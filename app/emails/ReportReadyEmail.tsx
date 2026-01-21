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

interface ReportReadyEmailProps {
  subjectName: string;
  reportName: string;
  downloadUrl: string;
  userName: string;
  supportEmail: string;
}

const ReportReadyEmail = ({
  subjectName,
  reportName,
  downloadUrl,
  userName,
  supportEmail,
}: ReportReadyEmailProps) => {
  const previewText = `Tu reporte de ${subjectName} está listo para descargar`;

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
              <Heading className="text-xl font-semibold text-white m-0 leading-[28px]">
                Reporte Listo
              </Heading>
              <Text className="text-zinc-300 text-xs m-0 mt-[4px] leading-[20px]">
                Tu reporte de asistencia está disponible para descarga
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px]">
              {/* Welcome Message */}
              <Section className="mb-[32px] text-center">
                <Heading className="text-xl font-semibold text-black m-0 mb-[8px] leading-[32px]">
                  Hola, {userName}
                </Heading>
                <Text className="text-zinc-600 text-xs leading-[24px] m-0">
                  Tu reporte de asistencia ha sido generado exitosamente y está listo para
                  descargar.
                </Text>
              </Section>

              {/* Report Details */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[12px]">
                  Detalles del reporte
                </Text>
                <div className="bg-zinc-50 border border-zinc-200 rounded-[8px] px-[16px] py-[16px] space-y-[12px]">
                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Asignatura
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[20px]">{subjectName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Nombre del archivo
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[20px]">{reportName}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[4px]">
                      Fecha de generación
                    </Text>
                    <Text className="text-xs text-black m-0 leading-[20px]">
                      {new Date().toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Download Button */}
              <Section className="mb-[32px] text-center">
                <Button
                  href={downloadUrl}
                  className="bg-black text-white text-xs font-medium px-[24px] py-[12px] rounded-[8px] box-border inline-block text-center no-underline leading-[20px]"
                >
                  Descargar Reporte
                </Button>
              </Section>

              {/* Alternative Download */}
              <Section className="mb-[32px]">
                <div className="bg-blue-50 border border-blue-200 rounded-[8px] px-[16px] py-[12px]">
                  <Text className="text-xs font-medium text-blue-800 m-0 mb-[8px]">
                    Enlace alternativo
                  </Text>
                  <Text className="text-xs text-blue-700 m-0 mb-[8px] leading-[16px]">
                    Si el botón no funciona, copia y pega este enlace en tu navegador:
                  </Text>
                  <Text className="text-xs text-blue-600 m-0 leading-[16px] break-all">
                    {downloadUrl}
                  </Text>
                </div>
              </Section>

              {/* Important Notice */}
              <Section className="mb-[32px]">
                <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-[16px] py-[12px]">
                  <Text className="text-xs text-amber-800 m-0 leading-[20px]">
                    <strong>Importante:</strong> Este enlace estará disponible por 30 días a partir
                    de hoy. Te recomendamos descargar el reporte lo antes posible.
                  </Text>
                </div>
              </Section>

              <Hr className="border-zinc-200 my-[24px]" />

              {/* Next Steps */}
              <Section className="mb-[24px]">
                <Text className="text-xs font-medium text-zinc-500 tracking-normal m-0 mb-[12px]">
                  ¿Necesitas ayuda?
                </Text>
                <div className="space-y-[8px]">
                  <Text className="text-xs text-zinc-700 m-0 leading-[20px]">
                    • Si tienes problemas para descargar el archivo
                  </Text>
                  <Text className="text-xs text-zinc-700 m-0 leading-[20px]">
                    • Si necesitas un formato diferente del reporte
                  </Text>
                  <Text className="text-xs text-zinc-700 m-0 leading-[20px]">
                    • Si requieres información adicional
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

export default ReportReadyEmail;
