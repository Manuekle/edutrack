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

interface ResetPasswordEmailProps {
  resetUrl: string;
  userEmail: string;
  supportEmail: string;
}

const ResetPasswordEmail = ({ resetUrl, userEmail, supportEmail }: ResetPasswordEmailProps) => {
  return (
    <Html lang="es" dir="ltr" style={{ colorScheme: 'light' }}>
      <Tailwind>
        <Head>
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light" />
        </Head>
        <Preview>Restablece tu contraseña de SIRA</Preview>

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
                Restablecer contraseña
              </Heading>
              <Text style={{ fontSize: '13px', color: '#b1c9ef', margin: 0, lineHeight: '20px' }}>
                Solicitud de cambio de contraseña
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
                Hemos recibido una solicitud para restablecer la contraseña de la cuenta asociada a:
              </Text>

              {/* Email display */}
              <div
                style={{
                  backgroundColor: '#f0f3fa',
                  border: '1px solid #d5deef',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '28px',
                }}
              >
                <Text
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#395886',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    margin: '0 0 4px 0',
                  }}
                >
                  Cuenta
                </Text>
                <Text
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1a1f36',
                    margin: 0,
                    lineHeight: '22px',
                  }}
                >
                  {userEmail}
                </Text>
              </div>

              {/* CTA */}
              <Section style={{ textAlign: 'center', marginBottom: '28px' }}>
                <Button
                  href={resetUrl}
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
                  Restablecer contraseña
                </Button>
              </Section>

              {/* Alternative URL */}
              <div
                style={{
                  backgroundColor: '#f0f3fa',
                  border: '1px solid #d5deef',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '28px',
                }}
              >
                <Text
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#395886',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    margin: '0 0 6px 0',
                  }}
                >
                  Enlace alternativo
                </Text>
                <Text
                  style={{ fontSize: '13px', color: '#6b7a99', margin: '0 0 6px 0', lineHeight: '20px' }}
                >
                  Si el botón no funciona, copia y pega este enlace:
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
                  {resetUrl}
                </Text>
              </div>

              {/* Security notice */}
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
                  <strong>Importante:</strong> Este enlace expirará en{' '}
                  <strong>24 horas</strong>. Si no solicitaste este cambio, ignora este correo.
                </Text>
              </div>
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

export default ResetPasswordEmail;
