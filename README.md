# Gas Tracking System

A modern, responsive web application for tracking gas consumption and purchases. This application runs entirely on a local server with no internet access required, connecting to an on-premises SQL Server database.

## Features

- **Data Entry Form**: Capture gas readings including Vendor, Invoice Number, Initial Read, Final Read, and Off Days
- **Report View**: View stored records in a sortable grid with a line chart showing:
  - Date
  - Gallons Used
  - Gallons Added
  - Time Elapsed
  - Performance Index
- **Date Range Filtering**: Filter reports by 90 days, This Month, Last Month, This Year, Last Year, or All records

## Tech Stack

- **Frontend**: Next.js 14 with React 18 and TypeScript
- **Backend**: Node.js API routes
- **Database**: SQL Server (mssql)
- **Charts**: Recharts

## Prerequisites

- Node.js 18+ installed
- SQL Server database with the `dbGAS` database and `bitacora` table (see `dbGAS.sql`)
- Network access to SQL Server at `demoappgas.ddns.net:1433`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory with your database credentials:
```
DB_SERVER=demoappgas.ddns.net
DB_NAME=dbGAS
DB_USER=demo
DB_PASSWORD=demo
DB_PORT=1433
```

3. Make sure your SQL Server database is set up by running the `dbGAS.sql` script.

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## Database Schema

The application uses the `bitacora` table with the following key fields:

- **User Input Fields**:
  - `gas_Fecha`: Date/Time at reading device
  - `gas_Suplidor`: Vendor name
  - `gas_Factura`: Invoice/Receipt number
  - `gas_Inicio`: Initial Read (%)
  - `gas_Fin`: Final Read (%)
  - `gas_Dias`: Off Days

- **Auto-calculated Fields** (via database trigger):
  - `gas_Consumido`: Gallons Used
  - `gas_Comprado`: Gallons Added
  - `gas_Tiempo`: Time Elapsed
  - `gas_Indice`: Performance Index
  - `gas_Cambio`: Change indicator (↗ up, ↙ down, ≡ same)

## Usage

1. **Data Entry**: Navigate to the "Data Entry" tab and fill in the form with gas reading information. Click "Submit Entry" to save.

2. **Reports**: Navigate to the "Report" tab to view all entries. Use the date range buttons to filter data, and click column headers to sort the table. The chart below shows trends over time.

## Project Structure

```
├── app/
│   ├── api/
│   │   └── entries/
│   │       └── route.ts      # API routes for data entry and retrieval
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page with navigation
├── components/
│   ├── DataEntryForm.tsx    # Data entry form component
│   └── ReportView.tsx       # Report view with table and chart
├── lib/
│   └── db.ts                # Database connection module
├── types/
│   └── index.ts             # TypeScript type definitions
└── dbGAS.sql                # Database schema script
```

## Notes

- The database trigger automatically calculates Gallons Used, Gallons Added, Time Elapsed, and Performance Index when a new entry is inserted.
- The application is designed to work offline (no external API calls except to the local SQL Server).
- All calculations are performed by the database trigger, ensuring data consistency.

