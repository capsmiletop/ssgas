import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { RegisterRequest, RegisterResponse } from '@/types';
import crypto from 'crypto';

function hashPassword(password: string): string {
  // Using SHA-256 with salt for better security
  // NOTE: Database field usr_Clave is varchar(50), so we truncate to 50 chars
  // In production, consider: 1) Updating DB to varchar(255), or 2) Using bcrypt
  const salt = process.env.PASSWORD_SALT || 'default-salt-change-in-production';
  const fullHash = crypto.createHash('sha256').update(password + salt).digest('hex');
  // Truncate to 50 characters to fit database field
  // This is less secure but necessary given current DB schema
  return fullHash.substring(0, 50);
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

    // Hash password (already truncated to 50 chars in hashPassword function)
    const hashedPassword = hashPassword(password);

    // Create user with default permissions using transaction for atomicity
    const transaction = new sql.Transaction(pool);
    let transactionStarted = false;
    
    try {
      // Begin transaction
      await transaction.begin();
      transactionStarted = true;

      // Insert user
      const userRequest = transaction.request();
      const userResult = await userRequest
        .input('username', sql.VarChar(50), username.trim())
        .input('password', sql.VarChar(50), hashedPassword)
        .query(`
          INSERT INTO usuarios (usr_Nombre, usr_Clave, usr_Cambiar, usr_Activo)
          VALUES (@username, @password, 0, 1);
          SELECT SCOPE_IDENTITY() AS usr_id;
        `);

      // Validate user creation
      if (!userResult.recordset || userResult.recordset.length === 0) {
        throw new Error('Failed to create user - no recordset returned');
      }

      const newUserId = userResult.recordset[0]?.usr_id;

      if (!newUserId || newUserId <= 0) {
        throw new Error(`Invalid user ID returned from database: ${newUserId}`);
      }

      // Create default permissions record (all permissions set to 0)
      const permRequest = transaction.request();
      const permResult = await permRequest
        .input('usr_id', sql.Int, newUserId)
        .query(`
          INSERT INTO permisos (usr_id, usr_DashBoard, usr_DataEntry, usr_Report, usr_Settings, usr_UserManagement)
          VALUES (@usr_id, 0, 0, 0, 0, 0);
        `);

      // Verify permissions were inserted (rowsAffected is an array)
      const rowsAffected = permResult.rowsAffected?.[0] ?? 0;
      if (rowsAffected === 0) {
        throw new Error('Failed to create permissions record - no rows affected');
      }

      // Commit transaction
      await transaction.commit();
      transactionStarted = false;

      const response: RegisterResponse = {
        success: true,
        message: 'Account created successfully. Please wait for an administrator to grant you permissions.',
      };

      return NextResponse.json(response, { status: 201 });
    } catch (error: any) {
      // Rollback transaction if it was started
      if (transactionStarted) {
        try {
          await transaction.rollback();
        } catch (rollbackError: any) {
          console.error('Error during transaction rollback:', rollbackError);
          // Log but don't throw - we want to throw the original error
        }
      }
      // Re-throw the original error for outer catch block
      throw error;
    }
  } catch (error: any) {
    console.error('Error during registration:', error);
    console.error('Error details:', {
      message: error.message,
      number: error.number,
      state: error.state,
      class: error.class,
      serverName: error.serverName,
      procName: error.procName,
      lineNumber: error.lineNumber,
    });
    
    // Handle specific SQL Server errors
    if (error.number === 2627 || error.message?.includes('UNIQUE') || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Handle string truncation errors
    if (error.number === 8152 || error.message?.includes('String or binary data would be truncated')) {
      return NextResponse.json(
        { success: false, error: 'Data too long for database field. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Handle transaction errors
    if (error.message?.includes('Transaction') || error.message?.includes('aborted')) {
      return NextResponse.json(
        { success: false, error: 'Database transaction failed. Please try again.' },
        { status: 500 }
      );
    }

    // Generic error response
    const errorMessage = error.message || 'An error occurred during registration';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

