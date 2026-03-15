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

  const generationDate = new Date().toLocaleDateString('es-CO', {
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
                Reporte listo
              </Heading>
              <Text className="text-sm text-[#93C5E0] m-0 mt-[6px] leading-[22px]">
                Tu reporte de asistencia está disponible para descarga
              </Text>
            </Section>

            {/* Body */}
            <Section className="px-[40px] py-[40px]">
              <Text className="text-sm text-[#4A5568] leading-[24px] m-0 mb-[32px]">
                Hola, <strong>{userName}</strong>. Tu reporte de asistencia ha sido generado
                exitosamente y está listo para descargar.
              </Text>

              {/* Report details card */}
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
                    Nombre del archivo
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">{reportName}</Text>
                </div>
                <Hr className="border-[#E2E8F0] m-0" />
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Fecha de generación
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">{generationDate}</Text>
                </div>
              </div>

              {/* Download CTA */}
              <Section className="text-center mb-[32px]">
                <Button
                  href={downloadUrl}
                  className="bg-[#059669] text-white text-sm font-semibold px-[32px] py-[14px] rounded-[8px] box-border inline-block no-underline leading-[24px]"
                >
                  Descargar reporte
                </Button>
              </Section>

              {/* Expiry notice */}
              <div style={{ borderLeft: '3px solid #059669', backgroundColor: '#ECFDF5', padding: '14px 16px', borderRadius: '0 8px 8px 0', marginBottom: '32px' }}>
                <Text className="text-sm text-[#065F46] m-0 leading-[22px]">
                  <strong>Importante:</strong> Este enlace estará disponible por{' '}
                  <strong>30 días</strong>. Te recomendamos descargar el reporte lo antes posible.
                </Text>
              </div>

              <Hr className="border-[#E2E8F0] mb-[24px]" />

              {/* Alternative link */}
              <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[8px]">
                Enlace alternativo
              </Text>
              <Text className="text-[13px] text-[#4A5568] m-0 mb-[6px] leading-[20px]">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </Text>
              <Text className="text-[13px] text-[#2563EB] m-0 break-all leading-[20px]">
                {downloadUrl}
              </Text>
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

export default ReportReadyEmail;
