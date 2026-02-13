import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { PasswordChangeRequest } from '@/types';
import crypto from 'crypto';

function hashPassword(password: string): string {
  // Using SHA-256 with salt for better security
  // In production, consider using bcrypt with proper salt rounds
  const salt = process.env.PASSWORD_SALT || 'default-salt-change-in-production';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body: PasswordChangeRequest = await request.json();
    const { username, oldPassword, newPassword } = body;

    if (!username || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Username and new password are required' },
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
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.recordset[0];
    const isFirstLogin = !user.usr_Clave || user.usr_Clave === '';

    // If not first login, verify old password
    if (!isFirstLogin && oldPassword) {
      const hashedOldPassword = hashPassword(oldPassword);
      if (user.usr_Clave !== hashedOldPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 401 }
        );
      }
    }

    // Update password and reset usr_Cambiar flag
    const hashedNewPassword = hashPassword(newPassword);
    await dbRequest
      .input('username', sql.VarChar(50), username)
      .input('newPassword', sql.VarChar(255), hashedNewPassword)
      .query(`
        UPDATE usuarios
        SET usr_Clave = @newPassword,
            usr_Cambiar = 0
        WHERE usr_Nombre = @username
      `);

    return NextResponse.json({ 
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while changing password' },
      { status: 500 }
    );
  }
}

