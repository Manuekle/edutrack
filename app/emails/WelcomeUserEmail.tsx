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
              <Heading className="sm:text-3xl text-2xl font-semibold text-white m-0 leading-[28px]">
                ¡Bienvenido/a!
              </Heading>
              <Text className="text-[#9CD5FF] text-xs m-0 mt-[4px] leading-[20px]">
                Tu cuenta ha sido creada exitosamente
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px]">
              {/* Welcome Message */}
              <Section className="mb-[32px] text-center">
                <div className="inline-flex items-center justify-center w-[64px] h-[64px] rounded-full bg-[#F7F8F0] mb-[16px]">
                  <Text className="sm:text-3xl text-2xl text-[#355872] m-0">👋</Text>
                </div>
                <Heading className="sm:text-3xl text-2xl font-semibold text-[#355872] m-0 mb-[8px] leading-[32px]">
                  Hola, {name}
                </Heading>
                <Text className="text-[#7AAACE] text-xs leading-[24px] m-0">
                  Un administrador ha creado una cuenta para ti en SIRA - Sistema Integral de
                  Registro Académico.
                </Text>
              </Section>

              {/* Credentials */}
              <Section className="mb-[32px]">
                <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[12px]">
                  Credenciales de acceso
                </Text>
                <div className="bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[16px] py-[16px] space-y-[12px]">
                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Correo electrónico
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[20px]">{email}</Text>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[4px]">
                      Contraseña temporal
                    </Text>
                    <Text className="text-xs text-[#355872] m-0 leading-[20px]">{password}</Text>
                  </div>
                </div>
              </Section>

              {/* Security Notice */}
              <Section className="mb-[32px]">
                <div className="bg-[#F7F8F0] border border-[#7AAACE] rounded-[8px] px-[16px] py-[12px]">
                  <Text className="text-xs text-[#355872] m-0 leading-[20px]">
                    <strong>Importante:</strong> Por seguridad, te recomendamos cambiar tu
                    contraseña después de iniciar sesión por primera vez.
                  </Text>
                </div>
              </Section>

              {/* CTA Button */}
              <Section className="mb-[32px] text-center">
                <Button
                  href={loginUrl}
                  className="bg-[#355872] text-white text-xs font-medium px-[24px] py-[12px] rounded-[8px] box-border inline-block text-center no-underline leading-[20px]"
                >
                  Iniciar sesión ahora
                </Button>
              </Section>

              <Hr className="border-[#7AAACE] my-[24px]" />

              {/* Next Steps */}
              <Section className="mb-[24px]">
                <Text className="text-xs font-medium text-[#355872] tracking-normal m-0 mb-[12px]">
                  Próximos pasos
                </Text>
                <div className="space-y-[8px]">
                  <Text className="text-xs text-[#355872] m-0 leading-[20px]">
                    • Inicia sesión con las credenciales proporcionadas
                  </Text>
                  <Text className="text-xs text-[#355872] m-0 leading-[20px]">
                    • Cambia tu contraseña por una más segura
                  </Text>
                  <Text className="text-xs text-[#355872] m-0 leading-[20px]">
                    • Explora las funcionalidades de la plataforma
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

export default WelcomeUserEmail;
