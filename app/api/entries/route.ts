import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { GasEntry } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: GasEntry = await request.json();
    const pool = await getConnection();

    const dbRequest = pool.request();
    
    // Insert new entry
    const result = await dbRequest
      .input('gas_Fecha', sql.DateTime, new Date(body.gas_Fecha))
      .input('gas_Suplidor', sql.VarChar(100), body.gas_Suplidor)
      .input('gas_Factura', sql.VarChar(20), body.gas_Factura)
      .input('gas_Inicio', sql.Numeric(10, 4), body.gas_Inicio)
      .input('gas_Fin', sql.Numeric(10, 4), body.gas_Fin)
      .input('gas_Dias', sql.Numeric(7, 2), body.gas_Dias)
      .input('gas_Usuario', sql.VarChar(10), body.gas_Usuario || 'System')
      .query(`
        INSERT INTO bitacora (gas_Fecha, gas_Suplidor, gas_Factura, gas_Inicio, gas_Fin, gas_Dias, gas_Usuario)
        VALUES (@gas_Fecha, @gas_Suplidor, @gas_Factura, @gas_Inicio, @gas_Fin, @gas_Dias, @gas_Usuario);
        SELECT SCOPE_IDENTITY() AS gas_id;
      `);

    return NextResponse.json({ 
      success: true, 
      id: result.recordset[0].gas_id 
    });
  } catch (error: any) {
    console.error('Error inserting entry:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'all';
    
    const pool = await getConnection();
    const dbRequest = pool.request();
    
    let query = `
      SELECT 
        gas_id,
        gas_Fecha,
        ISNULL(gas_Consumido, 0) AS gas_Consumido,
        ISNULL(gas_Comprado, 0) AS gas_Comprado,
        ISNULL(gas_Tiempo, '') AS gas_Tiempo,
        ISNULL(gas_Indice, 0) AS gas_Indice,
        ISNULL(gas_Cambio, 0) AS gas_Cambio
      FROM bitacora
    `;
    
    const now = new Date();
    
    switch (dateRange) {
      case '90days':
        const days90 = new Date(now);
        days90.setDate(days90.getDate() - 90);
        query += ' WHERE gas_Fecha >= @startDate';
        dbRequest.input('startDate', sql.DateTime, days90);
        break;
      case 'thisMonth':
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        query += ' WHERE gas_Fecha >= @startDate';
        dbRequest.input('startDate', sql.DateTime, thisMonthStart);
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        query += ' WHERE gas_Fecha >= @startDate AND gas_Fecha <= @endDate';
        dbRequest.input('startDate', sql.DateTime, lastMonthStart);
        dbRequest.input('endDate', sql.DateTime, lastMonthEnd);
        break;
      case 'thisYear':
        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        query += ' WHERE gas_Fecha >= @startDate';
        dbRequest.input('startDate', sql.DateTime, thisYearStart);
        break;
      case 'lastYear':
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        query += ' WHERE gas_Fecha >= @startDate AND gas_Fecha <= @endDate';
        dbRequest.input('startDate', sql.DateTime, lastYearStart);
        dbRequest.input('endDate', sql.DateTime, lastYearEnd);
        break;
      default:
        // No filter for 'all'
        break;
    }
    
    query += ' ORDER BY gas_Fecha DESC';
    
    const result = await dbRequest.query(query);

    return NextResponse.json({ 
      success: true, 
      data: result.recordset 
    });
  } catch (error: any) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

