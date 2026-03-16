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
  const generationDate = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 600,
    color: '#395886',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin: '0 0 4px 0',
  };

  const valueStyle = {
    fontSize: '14px',
    color: '#1a1f36',
    margin: 0,
    lineHeight: '22px',
  };

  return (
    <Html lang="es" dir="ltr" style={{ colorScheme: 'light' }}>
      <Tailwind>
        <Head>
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light" />
        </Head>
        <Preview>{`Tu reporte de ${subjectName} está listo para descargar`}</Preview>

        <Body
          className="font-sans py-[40px]"
          style={{ backgroundColor: '#f0f3fa', colorScheme: 'light', margin: 0 }}
        >
          <Container
            className="mx-auto max-w-[600px] rounded-[16px] overflow-hidden"
            style={{ backgroundColor: '#ffffff', border: '1px solid #d5deef' }}
          >
            {/* Header */}
            <Section style={{ backgroundColor: '#395886', padding: '28px 36px 24px' }}>
              <Text
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#8aaee0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  margin: '0 0 12px 0',
                }}
              >
                SIRA · Sistema de Asistencias FUP
              </Text>
              <Heading
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: '0 0 6px 0',
                  lineHeight: '30px',
                }}
              >
                Reporte listo
              </Heading>
              <Text style={{ fontSize: '13px', color: '#b1c9ef', margin: 0, lineHeight: '20px' }}>
                Tu reporte de asistencia está disponible para descarga
              </Text>
            </Section>

            {/* Body */}
            <Section style={{ padding: '36px 36px 24px' }}>
              <Text
                style={{
                  fontSize: '14px',
                  color: '#1a1f36',
                  lineHeight: '24px',
                  margin: '0 0 28px 0',
                }}
              >
                Hola, <strong>{userName}</strong>. Tu reporte de asistencia ha sido generado
                exitosamente y está listo para descargar.
              </Text>

              {/* Report details card */}
              <div
                style={{
                  backgroundColor: '#f0f3fa',
                  border: '1px solid #d5deef',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '28px',
                }}
              >
                <div style={{ padding: '14px 20px' }}>
                  <Text style={labelStyle}>Asignatura</Text>
                  <Text style={{ ...valueStyle, fontWeight: 600 }}>{subjectName}</Text>
                </div>
                <Hr style={{ borderColor: '#d5deef', margin: 0 }} />
                <div style={{ padding: '14px 20px' }}>
                  <Text style={labelStyle}>Nombre del archivo</Text>
                  <Text style={valueStyle}>{reportName}</Text>
                </div>
                <Hr style={{ borderColor: '#d5deef', margin: 0 }} />
                <div style={{ padding: '14px 20px' }}>
                  <Text style={labelStyle}>Fecha de generación</Text>
                  <Text style={valueStyle}>{generationDate}</Text>
                </div>
              </div>

              {/* Download CTA */}
              <Section style={{ textAlign: 'center', marginBottom: '28px' }}>
                <Button
                  href={downloadUrl}
                  style={{
                    backgroundColor: '#638ecb',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '12px 28px',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    display: 'inline-block',
                    lineHeight: '20px',
                  }}
                >
                  Descargar reporte
                </Button>
              </Section>

              {/* Expiry notice */}
              <div
                style={{
                  backgroundColor: '#e8edf6',
                  borderLeft: '3px solid #638ecb',
                  borderRadius: '0 10px 10px 0',
                  padding: '14px 16px',
                  marginBottom: '28px',
                }}
              >
                <Text style={{ fontSize: '13px', color: '#395886', margin: 0, lineHeight: '22px' }}>
                  <strong>Importante:</strong> Este enlace estará disponible por{' '}
                  <strong>30 días</strong>. Te recomendamos descargar el reporte lo antes posible.
                </Text>
              </div>

              <Hr style={{ borderColor: '#d5deef', marginBottom: '24px' }} />

              {/* Alternative link */}
              <Text style={{ ...labelStyle, margin: '0 0 8px 0' }}>Enlace alternativo</Text>
              <Text
                style={{ fontSize: '13px', color: '#6b7a99', margin: '0 0 6px 0', lineHeight: '20px' }}
              >
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </Text>
              <Text
                style={{
                  fontSize: '13px',
                  color: '#638ecb',
                  margin: 0,
                  wordBreak: 'break-all',
                  lineHeight: '20px',
                }}
              >
                {downloadUrl}
              </Text>
            </Section>

            {/* Footer */}
            <Section
              style={{
                backgroundColor: '#f0f3fa',
                padding: '20px 36px',
                borderTop: '1px solid #d5deef',
              }}
            >
              <Text
                style={{ fontSize: '13px', color: '#6b7a99', textAlign: 'center', margin: '0 0 6px 0' }}
              >
                ¿Necesitas ayuda? Escríbenos a{' '}
                <Link href={`mailto:${supportEmail}`} style={{ color: '#638ecb', textDecoration: 'none' }}>
                  {supportEmail}
                </Link>
              </Text>
              <Text style={{ fontSize: '11px', color: '#6b7a99', textAlign: 'center', margin: 0 }}>
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
