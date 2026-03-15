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

const WelcomeUserEmail = ({
  name,
  email,
  password,
  supportEmail,
  loginUrl,
}: WelcomeUserEmailProps) => {
  const previewText = 'Bienvenido a SIRA - Sistema Integral de Registro Académico';

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
                ¡Bienvenido/a, {name}!
              </Heading>
              <Text className="text-sm text-[#93C5E0] m-0 mt-[6px] leading-[22px]">
                Tu cuenta ha sido creada exitosamente
              </Text>
            </Section>

            {/* Body */}
            <Section className="px-[40px] py-[40px]">
              <Text className="text-sm text-[#4A5568] leading-[24px] m-0 mb-[32px]">
                Un administrador ha creado una cuenta para ti en{' '}
                <strong>SIRA — Sistema Integral de Registro Académico</strong>. A continuación
                encontrarás tus credenciales de acceso.
              </Text>

              {/* Credentials card */}
              <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-[10px] overflow-hidden mb-[32px]">
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Correo electrónico
                  </Text>
                  <Text className="text-sm text-[#2D3748] m-0 leading-[22px]">{email}</Text>
                </div>
                <Hr className="border-[#E2E8F0] m-0" />
                <div className="px-[20px] py-[14px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[4px]">
                    Contraseña temporal
                  </Text>
                  <Text className="text-sm font-semibold text-[#2D3748] m-0 leading-[22px]">
                    {password}
                  </Text>
                </div>
              </div>

              {/* Security notice */}
              <div style={{ borderLeft: '3px solid #059669', backgroundColor: '#ECFDF5', padding: '14px 16px', borderRadius: '0 8px 8px 0', marginBottom: '32px' }}>
                <Text className="text-sm text-[#065F46] m-0 leading-[22px]">
                  <strong>Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña
                  después de iniciar sesión por primera vez.
                </Text>
              </div>

              {/* CTA */}
              <Section className="text-center mb-[32px]">
                <Button
                  href={loginUrl}
                  className="bg-[#059669] text-white text-sm font-semibold px-[32px] py-[14px] rounded-[8px] box-border inline-block no-underline leading-[24px]"
                >
                  Iniciar sesión ahora
                </Button>
              </Section>

              <Hr className="border-[#E2E8F0] my-[32px]" />

              {/* Next steps */}
              <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[12px]">
                Próximos pasos
              </Text>
              <Text className="text-sm text-[#4A5568] m-0 leading-[24px] mb-[6px]">
                1. Inicia sesión con las credenciales proporcionadas.
              </Text>
              <Text className="text-sm text-[#4A5568] m-0 leading-[24px] mb-[6px]">
                2. Cambia tu contraseña por una más segura desde tu perfil.
              </Text>
              <Text className="text-sm text-[#4A5568] m-0 leading-[24px]">
                3. Explora las funcionalidades de la plataforma.
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

export default WelcomeUserEmail;
