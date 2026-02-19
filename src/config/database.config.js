// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// Archivo de configuración para la conexión a MySQL
// ============================================

/**
 * Configuración de conexión a la base de datos MySQL
 * IMPORTANTE: En producción, estas credenciales deben estar en variables de entorno
 */
export const dbConfig = {
  // Host del servidor de base de datos
  host: process.env.DB_HOST || 'localhost',
  
  // Puerto de MySQL (por defecto 3306)
  port: process.env.DB_PORT || 3306,
  
  // Nombre de usuario de la base de datos
  user: process.env.DB_USER || 'root',
  
  // Contraseña del usuario
  password: process.env.DB_PASSWORD || '020614',
  
  // Nombre de la base de datos
  database: process.env.DB_NAME || 'inventario_reactivos',
  
  // Configuraciones adicionales para el pool de conexiones
  connectionLimit: 10, // Número máximo de conexiones simultáneas
  waitForConnections: true, // Esperar si no hay conexiones disponibles
  queueLimit: 0, // Sin límite de cola
  
  // Manejo de fechas y zona horaria
  timezone: 'Z', // UTC
  dateStrings: true, // Convertir fechas a strings
  
  // Configuración de charset
  charset: 'utf8mb4',
  
  // Opciones de seguridad
  multipleStatements: false, // Prevenir SQL injection con múltiples statements
};

/**
 * Configuración para el servidor backend (Node.js + Express)
 */
export const serverConfig = {
  // Puerto del servidor backend
  port: process.env.PORT || 3001,
  
  // URL base de la API
  apiPrefix: '/api',
  
  // CORS origins permitidos
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'],
  
  // Configuración de sesiones (si se implementa autenticación)
  session: {
    secret: process.env.SESSION_SECRET || 'tu_secreto_super_seguro_cambiar_en_produccion',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
  }
};

/**
 * Configuración para el almacenamiento de archivos (códigos QR)
 */
export const storageConfig = {
  // Directorio para guardar las imágenes QR generadas
  qrImagesPath: process.env.QR_IMAGES_PATH || './public/qr-codes',
  
  // URL pública para acceder a las imágenes QR
  qrImagesUrl: process.env.QR_IMAGES_URL || '/qr-codes',
  
  // Tamaño de los códigos QR generados (en píxeles)
  qrSize: 300,
  
  // Nivel de corrección de errores del QR (L, M, Q, H)
  qrErrorCorrectionLevel: 'M'
};

export default {
  dbConfig,
  serverConfig,
  storageConfig
};