/**
 * LegioCert Pro - Configuración Global v2
 */
const CONFIG = {
  APP_NAME: 'LegioCert Pro',
  APP_VERSION: '2.0.0',
  APP_AUTHOR: 'Duarte Conection',
  APP_EMAIL: 'duarteconection@gmail.com',
  NORMATIVA: {
    RD_487: 'Real Decreto 487/2022',
    RD_614: 'Real Decreto 614/2024',
    UNE: 'UNE 100030:2017+A1:2018',
  },
  TEXTOS_LEGALES: {
    intro: 'El presente certificado acredita la realización del tratamiento de desinfección conforme a lo establecido en el Real Decreto 487/2022, de 21 de junio, por el que se establecen los requisitos técnico-sanitarios para la prevención y control de la legionelosis, modificado por el Real Decreto 614/2024.',
    metodo: 'El tratamiento se ha realizado según el protocolo establecido en la UNE 100030:2017+A1:2018, Guía para la prevención y control de la proliferación y diseminación de Legionella en instalaciones.',
    validez: 'Este certificado es válido como documento acreditativo del mantenimiento higiénico-sanitario realizado en la instalación descrita.',
  },
  PROTOCOLOS_CLORO: {
    MANTENIMIENTO: { ppm: 20, descripcion: 'Choque de mantenimiento', tiempoContacto: 2 },
    DESINFECCION: { ppm: 50, descripcion: 'Desinfección preventiva', tiempoContacto: 6 },
    CHOQUE: { ppm: 150, descripcion: 'Choque por Legionella positivo', tiempoContacto: 12 },
  },
  CONVERSIONES: { L_A_M3: 0.001, M3_A_L: 1000, L_A_GAL: 0.264172, GAL_A_L: 3.78541 },
  TIPOS_INSTALACION: [
    'ACS (Agua Caliente Sanitaria)', 'AFCH (Agua Fría de Consumo Humano)',
    'Depósito de agua', 'Piscina', 'SPA / Jacuzzi', 'Torre de refrigeración',
    'Humectador', 'Fuente ornamental', 'Sistema de riego', 'Otro',
  ],
  MATERIALES: ['Cobre', 'Acero inoxidable', 'PVC', 'Polietileno', 'Fibra de vidrio', 'Hierro galvanizado', 'Otro'],
  PROVINCIAS: [
    'Álava','Albacete','Alicante','Almería','Asturias','Ávila','Badajoz','Barcelona','Burgos','Cáceres',
    'Cádiz','Cantabria','Castellón','Ciudad Real','Córdoba','Cuenca','Girona','Granada','Guadalajara',
    'Guipúzcoa','Huelva','Huesca','Islas Baleares','Jaén','La Coruña','La Rioja','Las Palmas','León',
    'Lleida','Lugo','Madrid','Málaga','Murcia','Navarra','Ourense','Palencia','Pontevedra','Salamanca',
    'Santa Cruz de Tenerife','Segovia','Sevilla','Soria','Tarragona','Teruel','Toledo','Valencia',
    'Valladolid','Vizcaya','Zamora','Zaragoza','Ceuta','Melilla',
  ],
  PDF: { EMPRESA: 'Duarte Conection', EMAIL_EMPRESA: 'duarteconection@gmail.com', TELEFONO_EMPRESA: '', CIF_EMPRESA: '' },
  COSTES: { MANO_OBRA_HORA: 35, DESPLAZAMIENTO_KM: 0.35, MARGEN_DEFECTO: 30 },
};
window.CONFIG = CONFIG;
