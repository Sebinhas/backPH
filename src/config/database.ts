import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('railway') 
    ? { rejectUnauthorized: false } 
    : false
});

// Verificar conexión
pool.connect()
  .then(client => {
    console.log('✅ Conexión a PostgreSQL exitosa');
    console.log(`🔗 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
    client.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a PostgreSQL:', err.message);
  });

export default pool;