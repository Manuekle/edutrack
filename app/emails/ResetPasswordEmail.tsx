import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text
} from '@react-email/components';

interface ResetPasswordEmailProps {
  resetUrl: string;
  userEmail: string;
  supportEmail: string;
}

const ResetPasswordEmail = ({ resetUrl, userEmail, supportEmail }: ResetPasswordEmailProps) => {
  const previewText = 'Restablece tu contraseña de SIRA';

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
                Restablecer contraseña
              </Heading>
              <Text className="text-sm text-[#93C5E0] m-0 mt-[6px] leading-[22px]">
                Solicitud de cambio de contraseña
              </Text>
            </Section>

            {/* Body */}
            <Section className="px-[40px] py-[40px]">
              <Text className="text-sm text-[#4A5568] leading-[24px] m-0 mb-[32px]">
                Hemos recibido una solicitud para restablecer la contraseña de la siguiente cuenta:
              </Text>

              {/* Email display */}
              <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-[10px] overflow-hidden mb-[32px]">
                <div className="px-[20px] py-[16px]">
                  <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[6px]">
                    Cuenta
                  </Text>
                  <Text className="text-sm font-semibold text-[#2D3748] m-0">
                    {userEmail}
                  </Text>
                </div>
              </div>

              {/* CTA */}
              <Section className="text-center mb-[32px]">
                <Button
                  href={resetUrl}
                  className="bg-[#2563EB] text-white text-sm font-semibold px-[32px] py-[14px] rounded-[8px] box-border inline-block no-underline leading-[24px]"
                >
                  Restablecer contraseña
                </Button>
              </Section>

              {/* Alternative URL */}
              <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-[10px] px-[20px] py-[16px] mb-[32px]">
                <Text className="text-[11px] font-bold uppercase tracking-card text-[#718096] m-0 mb-[8px]">
                  Enlace alternativo
                </Text>
                <Text className="text-[13px] text-[#4A5568] m-0 mb-[6px] leading-[20px]">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:
                </Text>
                <Text className="text-[13px] text-[#2563EB] m-0 break-all leading-[20px]">
                  {resetUrl}
                </Text>
              </div>

              {/* Security notice */}
              <div style={{ borderLeft: '3px solid #3B82F6', backgroundColor: '#EFF6FF', padding: '14px 16px', borderRadius: '0 8px 8px 0', marginBottom: '32px' }}>
                <Text className="text-sm text-[#1E40AF] m-0 leading-[22px]">
                  <strong>Importante:</strong> Este enlace expirará en{' '}
                  <strong>24 horas</strong> por seguridad. Si no solicitaste este
                  cambio, puedes ignorar este correo con seguridad.
                </Text>
              </div>
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

export default ResetPasswordEmail;
