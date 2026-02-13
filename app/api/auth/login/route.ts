import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { LoginRequest, LoginResponse } from '@/types';
import crypto from 'crypto';

function hashPassword(password: string): string {
  // Using SHA-256 with salt for better security
  // In production, consider using bcrypt with proper salt rounds
  const salt = process.env.PASSWORD_SALT || 'default-salt-change-in-production';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    const dbRequest = pool.request();

    // Get user from database
    const userResult = await dbRequest
      .input('username', sql.VarChar(50), username)
      .query(`
        SELECT 
          usr_id,
          usr_Nombre,
          usr_Clave,
          usr_Cambiar,
          usr_Activo
        FROM usuarios
        WHERE usr_Nombre = @username AND usr_Activo = 1
      `);

    if (userResult.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const user = userResult.recordset[0];
    const hashedPassword = hashPassword(password);

    // Check if user has no password (first login) or password matches
    const isFirstLogin = !user.usr_Clave || user.usr_Clave === '';
    const passwordMatches = user.usr_Clave === hashedPassword;

    if (!isFirstLogin && !passwordMatches) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if password change is required
    const requiresPasswordChange = user.usr_Cambiar === 1 || isFirstLogin;

    // Get user permissions
    const permissionsResult = await dbRequest
      .input('usr_id', sql.Int, user.usr_id)
      .query(`
        SELECT 
          usr_id,
          usr_DashBoard AS Dashboard,
          usr_DataEntry AS DataEntry,
          usr_Report AS Report,
          usr_Settings AS Settings,
          usr_UserManagement AS UserManagement
        FROM permisos
        WHERE usr_id = @usr_id
      `);

    const permissions = permissionsResult.recordset.length > 0 
      ? permissionsResult.recordset[0]
      : null;

    const response: LoginResponse = {
      success: true,
      user: {
        usr_id: user.usr_id,
        usr_Nombre: user.usr_Nombre,
        usr_Cambiar: user.usr_Cambiar,
        usr_Activo: user.usr_Activo,
      },
      permissions: permissions || undefined,
      requiresPasswordChange,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred during login' },
      { status: 500 }
    );
  }
}

