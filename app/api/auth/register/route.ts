import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { RegisterRequest, RegisterResponse } from '@/types';
import crypto from 'crypto';

function hashPassword(password: string): string {
  // Using SHA-256 with salt for better security
  // In production, consider using bcrypt with proper salt rounds
  const salt = process.env.PASSWORD_SALT || 'default-salt-change-in-production';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  if (password.length > 50) {
    return { valid: false, error: 'Password must be less than 50 characters' };
  }
  // Optional: Add more complex password requirements
  // if (!/[A-Z]/.test(password)) {
  //   return { valid: false, error: 'Password must contain at least one uppercase letter' };
  // }
  // if (!/[0-9]/.test(password)) {
  //   return { valid: false, error: 'Password must contain at least one number' };
  // }
  return { valid: true };
}

function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Username is required' };
  }
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }
  if (username.length > 50) {
    return { valid: false, error: 'Username must be less than 50 characters' };
  }
  // Check for valid characters (alphanumeric and underscore)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { username, password, confirmPassword } = body;

    // Validate input
    if (!username || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { success: false, error: usernameValidation.error },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    const dbRequest = pool.request();

    // Check if username already exists
    const existingUserResult = await dbRequest
      .input('username', sql.VarChar(50), username.trim())
      .query(`
        SELECT usr_id
        FROM usuarios
        WHERE usr_Nombre = @username
      `);

    if (existingUserResult.recordset.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create user with default permissions (all set to 0 - no access by default)
    // Admin must grant permissions after registration
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();

      // Insert user
      const userResult = await transaction.request()
        .input('username', sql.VarChar(50), username.trim())
        .input('password', sql.VarChar(50), hashedPassword)
        .query(`
          INSERT INTO usuarios (usr_Nombre, usr_Clave, usr_Cambiar, usr_Activo)
          VALUES (@username, @password, 0, 1);
          SELECT SCOPE_IDENTITY() AS usr_id;
        `);

      const newUserId = userResult.recordset[0].usr_id;

      // Create default permissions record (all permissions set to 0)
      await transaction.request()
        .input('usr_id', sql.Int, newUserId)
        .query(`
          INSERT INTO permisos (usr_id, usr_DashBoard, usr_DataEntry, usr_Report, usr_Settings, usr_UserManagement)
          VALUES (@usr_id, 0, 0, 0, 0, 0);
        `);

      await transaction.commit();

      const response: RegisterResponse = {
        success: true,
        message: 'Account created successfully. Please wait for an administrator to grant you permissions.',
      };

      return NextResponse.json(response, { status: 201 });
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Error during registration:', error);
    
    // Handle unique constraint violation
    if (error.number === 2627 || error.message?.includes('UNIQUE')) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

