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

interface WelcomeUserEmailProps {
  name: string;
  email: string;
  password: string;
  supportEmail: string;
  loginUrl: string;
}

const WelcomeUserEmail = ({ name, email, password, supportEmail, loginUrl }: WelcomeUserEmailProps) => {
  return (
    <Html lang="es" dir="ltr" style={{ colorScheme: 'light' }}>
      <Tailwind>
        <Head>
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light" />
        </Head>
        <Preview>Bienvenido/a a SIRA — tu cuenta ha sido creada</Preview>

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
                ¡Bienvenido/a, {name}!
              </Heading>
              <Text style={{ fontSize: '13px', color: '#b1c9ef', margin: 0, lineHeight: '20px' }}>
                Tu cuenta ha sido creada exitosamente
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
                Un administrador ha creado una cuenta para ti en{' '}
                <strong>SIRA — Sistema Integral de Registro Académico</strong>. A continuación
                encontrarás tus credenciales de acceso.
              </Text>

              {/* Credentials card */}
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
                    Correo electrónico
                  </Text>
                  <Text style={{ fontSize: '14px', color: '#1a1f36', margin: 0, lineHeight: '22px' }}>
                    {email}
                  </Text>
                </div>
                <Hr style={{ borderColor: '#d5deef', margin: 0 }} />
                <div style={{ padding: '14px 20px' }}>
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
                    Contraseña temporal
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
                    {password}
                  </Text>
                </div>
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
                  <strong>Importante:</strong> Por seguridad, cambia tu contraseña después de
                  iniciar sesión por primera vez.
                </Text>
              </div>

              {/* CTA */}
              <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
                <Button
                  href={loginUrl}
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
                  Iniciar sesión ahora
                </Button>
              </Section>

              <Hr style={{ borderColor: '#d5deef', marginBottom: '24px' }} />

              {/* Next steps */}
              <Text
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#395886',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: '0 0 12px 0',
                }}
              >
                Próximos pasos
              </Text>
              <Text style={{ fontSize: '14px', color: '#1a1f36', margin: '0 0 6px 0', lineHeight: '24px' }}>
                1. Inicia sesión con las credenciales proporcionadas.
              </Text>
              <Text style={{ fontSize: '14px', color: '#1a1f36', margin: '0 0 6px 0', lineHeight: '24px' }}>
                2. Cambia tu contraseña por una más segura desde tu perfil.
              </Text>
              <Text style={{ fontSize: '14px', color: '#1a1f36', margin: 0, lineHeight: '24px' }}>
                3. Explora las funcionalidades de la plataforma.
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

export default WelcomeUserEmail;
