'use client';

export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'SIRA - Sistema Integral de Registro Académico',
    'url': 'https://sira-fup.online',
    'description': 'Sistema Integral de Registro Académico para la gestión automatizada de asistencias mediante códigos QR.',
    'applicationCategory': 'EducationApplication',
    'operatingSystem': 'Web, Android, iOS',
    'author': {
      '@type': 'Organization',
      'name': 'Fundación Universitaria de Popayán (FUP)',
      'url': 'https://fup.edu.co'
    },
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'COP'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
