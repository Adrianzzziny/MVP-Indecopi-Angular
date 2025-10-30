export const environment = {
  production: false,
  url_host: '',
  accesibilidadURL: 'https://recursos.indecopi.gob.pe/accesibilidad/',
  proyectoAccesibilidad: 'mdpvfrontend',
  externalUrls: {
    mdpVirtual: 'https://enlinea.indecopi.gob.pe/MDPVirtual2/#/inicio',
    manualesPdf: 'https://recursos.indecopi.gob.pe/mdpv/rev03/docs/Manual_Usuario_Externo.pdf',
    tutorialesPdf: 'https://recursos.indecopi.gob.pe/mdpv/rev03/docs/Manual_Usuario_Externo.pdf'
  },
  socialURL: {
    facebook: 'https://es-la.facebook.com/IndecopiOficial/',
    instagram: 'https://www.instagram.com/indecopioficial/',
    youtube: 'https://www.youtube.com/@IndecopiOficial',
    x: 'https://x.com/indecopioficial?lang=es',
    tiktok: 'https://www.tiktok.com/@indecopioficial',
    linkedin: 'https://www.linkedin.com/company/indecopi/',
    twitter: 'https://x.com/indecopioficial?lang=es'
  },
  // Configuración de la alerta importante Home
  maintenanceAlert: {
    enabled: true, // si es false, no se mostrará
    title: '¡Importante!',
    message: `
      Desde el día <strong>07/06/2025</strong> a las 00:00 hrs hasta el día
      <strong>10/06/2025</strong> a las 00:00 hrs Mesa de Partes Virtual estará en mantenimiento,
      agradecemos su comprensión.
    `
  }
};
