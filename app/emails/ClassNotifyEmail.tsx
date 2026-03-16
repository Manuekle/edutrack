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

interface ClassNotifyEmailProps {
  className: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  date: string;
  justificationLink: string;
  supportEmail: string;
  studentName?: string;
}

const ClassNotifyEmail = ({
  className,
  subjectName,
  startTime,
  endTime,
  date,
  justificationLink,
  supportEmail,
  studentName,
}: ClassNotifyEmailProps) => {
  const formattedDate = new Date(date).toLocaleDateString('es-CO', {
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
        <Preview>{`Clase iniciada: ${subjectName} — ${startTime}`}</Preview>

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
                Clase en curso
              </Heading>
              <Text style={{ fontSize: '13px', color: '#b1c9ef', margin: 0, lineHeight: '20px' }}>
                La clase ha iniciado — registra tu asistencia
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
                {studentName ? `Hola, ${studentName}. ` : 'Hola, '}La clase de{' '}
                <strong>{subjectName}</strong> ha comenzado. Por favor, registra tu asistencia.
              </Text>

              {/* Class details card */}
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
                  <Text style={labelStyle}>Grupo</Text>
                  <Text style={valueStyle}>{className}</Text>
                </div>
                <Hr style={{ borderColor: '#d5deef', margin: 0 }} />
                <div style={{ padding: '14px 20px' }}>
                  <Text style={labelStyle}>Fecha</Text>
                  <Text style={valueStyle}>{formattedDate}</Text>
                </div>
                <Hr style={{ borderColor: '#d5deef', margin: 0 }} />
                <div style={{ padding: '14px 20px' }}>
                  <Text style={labelStyle}>Horario</Text>
                  <Text style={valueStyle}>
                    {startTime} — {endTime}
                  </Text>
                </div>
              </div>

              <Hr style={{ borderColor: '#d5deef', marginBottom: '28px' }} />

              <Text
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#395886',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: '0 0 8px 0',
                }}
              >
                ¿No puedes asistir?
              </Text>
              <Text
                style={{
                  fontSize: '14px',
                  color: '#1a1f36',
                  lineHeight: '24px',
                  margin: '0 0 20px 0',
                }}
              >
                Si no puedes asistir a esta clase, justifica tu ausencia antes de que finalice la
                sesión:
              </Text>

              {/* CTA */}
              <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Button
                  href={justificationLink}
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
                  Justificar ausencia
                </Button>
              </Section>

              {/* Warning */}
              <div
                style={{
                  backgroundColor: '#fff7ed',
                  borderLeft: '3px solid #f59e0b',
                  borderRadius: '0 10px 10px 0',
                  padding: '14px 16px',
                }}
              >
                <Text style={{ fontSize: '13px', color: '#92400e', margin: 0, lineHeight: '22px' }}>
                  <strong>Recordatorio:</strong> Las justificaciones deben presentarse dentro de
                  las <strong>24 horas</strong> posteriores al inicio de la clase.
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

export default ClassNotifyEmail;
