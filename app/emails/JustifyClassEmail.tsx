import {
  Body,
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

interface JustifyClassEmailProps {
  studentName: string;
  className: string;
  subjectName: string;
  classDate: string;
  classTime: string;
  justification: string;
  supportEmail: string;
  submissionDate?: string;
}

const JustifyClassEmail = ({
  studentName,
  className,
  subjectName,
  classDate,
  classTime,
  justification,
  supportEmail,
  submissionDate,
}: JustifyClassEmailProps) => {
  const formattedClassDate = new Date(classDate).toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedSubmissionDate = new Date(submissionDate ?? Date.now()).toLocaleDateString(
    'es-CO',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

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
        <Preview>{`Justificación de ausencia de ${studentName} — ${subjectName}`}</Preview>

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
                Justificación recibida
              </Heading>
              <Text style={{ fontSize: '13px', color: '#b1c9ef', margin: 0, lineHeight: '20px' }}>
                Nueva justificación de ausencia registrada
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
                El estudiante <strong>{studentName}</strong> ha enviado una justificación de
                ausencia para la siguiente clase.
              </Text>

              {/* Info card */}
              <div
                style={{
                  backgroundColor: '#f0f3fa',
                  border: '1px solid #d5deef',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '24px',
                }}
              >
                <div style={{ padding: '14px 20px' }}>
                  <Text style={labelStyle}>Estudiante</Text>
                  <Text style={{ ...valueStyle, fontWeight: 600 }}>{studentName}</Text>
                </div>
                <Hr style={{ borderColor: '#d5deef', margin: 0 }} />
                <div style={{ padding: '14px 20px' }}>
                  <Text style={labelStyle}>Asignatura</Text>
                  <Text style={valueStyle}>{subjectName}</Text>
                </div>
                <Hr style={{ borderColor: '#d5deef', margin: 0 }} />
                <div style={{ padding: '14px 20px' }}>
                  <Text style={labelStyle}>Grupo / Clase</Text>
                  <Text style={valueStyle}>{className}</Text>
                </div>
                <Hr style={{ borderColor: '#d5deef', margin: 0 }} />
                <div style={{ padding: '14px 20px' }}>
                  <Text style={labelStyle}>Fecha de la clase</Text>
                  <Text style={valueStyle}>{formattedClassDate}</Text>
                </div>
                <Hr style={{ borderColor: '#d5deef', margin: 0 }} />
                <div style={{ padding: '14px 20px' }}>
                  <Text style={labelStyle}>Horario</Text>
                  <Text style={valueStyle}>{classTime}</Text>
                </div>
              </div>

              {/* Justification text */}
              <Text style={{ ...labelStyle, margin: '0 0 10px 0' }}>
                Motivo de la justificación
              </Text>
              <div
                style={{
                  backgroundColor: '#f0f3fa',
                  border: '1px solid #d5deef',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                }}
              >
                <Text
                  style={{
                    fontSize: '14px',
                    color: '#1a1f36',
                    margin: 0,
                    lineHeight: '24px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {justification}
                </Text>
              </div>

              {/* Next steps notice */}
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
                  <strong>Próximos pasos:</strong> Esta justificación debe ser revisada y aprobada
                  o rechazada desde el panel docente en SIRA.
                </Text>
              </div>

              <Text style={{ fontSize: '13px', color: '#6b7a99', margin: 0, lineHeight: '20px' }}>
                Fecha de envío: {formattedSubmissionDate}
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

export default JustifyClassEmail;
