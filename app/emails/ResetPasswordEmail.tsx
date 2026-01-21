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

interface ResetPasswordEmailProps {
  resetUrl: string;
  userEmail: string;
  supportEmail: string;
}

const ResetPasswordEmail = ({ resetUrl, userEmail, supportEmail }: ResetPasswordEmailProps) => {
  const previewText = 'Restablece tu contraseña de Sistema de Asistencias FUP';

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
              <Heading className="text-[20px] font-semibold text-white m-0 leading-[28px]">
                Restablecer Contraseña
              </Heading>
              <Text className="text-zinc-300 text-xs m-0 mt-[4px] leading-[20px]">
                Solicitud de cambio de contraseña
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-[32px] py-[32px] text-center">
              <Text className="text-zinc-600 text-xs leading-[24px] m-0 mb-[24px]">
                Hola, hemos recibido una solicitud para restablecer la contraseña de tu cuenta
                asociada a:
              </Text>

              {/* Email Display */}
              <Section className="mb-[32px]">
                <div className="bg-zinc-50 border border-zinc-200 rounded-[8px] px-[16px] py-[12px] inline-block">
                  <Text className="text-xs font-medium text-zinc-900 m-0">{userEmail}</Text>
                </div>
              </Section>

              {/* CTA Button */}
              <Section className="mb-[32px]">
                <Button
                  href={resetUrl}
                  className="bg-black text-white text-xs font-medium py-[12px] px-[24px] rounded-[8px] box-border no-underline inline-block"
                >
                  Restablecer Contraseña
                </Button>
              </Section>

              {/* Alternative URL */}
              <Section className="mb-[32px]">
                <Text className="text-zinc-500 text-xs m-0 mb-[8px]">
                  O copia y pega este enlace en tu navegador:
                </Text>
                <div className="bg-zinc-50 border border-zinc-200 rounded-[6px] px-[12px] py-[8px] text-left">
                  <Text className="text-xs text-zinc-700 m-0 break-all font-sans">{resetUrl}</Text>
                </div>
              </Section>

              <Hr className="border-zinc-200 my-[24px]" />

              {/* Security Notice */}
              <Section className="mb-[24px]">
                <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-[16px] py-[12px]">
                  <Text className="text-xs text-amber-800 m-0 leading-[18px]">
                    <strong>Importante:</strong> Este enlace expirará en 24 horas por seguridad.
                  </Text>
                </div>
              </Section>

              <Text className="text-zinc-500 text-xs leading-[20px] m-0 mb-[16px]">
                Si no solicitaste este restablecimiento, puedes ignorar este correo de manera
                segura.
              </Text>

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

export default ResetPasswordEmail;
