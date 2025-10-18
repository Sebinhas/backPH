import bcrypt from 'bcryptjs';
import pool from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  try {
    console.log('🔧 Creando usuario administrador...');

    const adminData = {
      nombre: 'Administrador',
      email: 'admin@sistema.com',
      password: await bcrypt.hash('admin123', 10),
      rol: 'admin'
    };

    // Verificar si ya existe
    const [existing] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [adminData.email]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      console.log('⚠️  El usuario administrador ya existe');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Password: admin123');
      return;
    }

    // Crear administrador
    await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [adminData.nombre, adminData.email, adminData.password, adminData.rol]
    );

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar
createAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

