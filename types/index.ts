export interface GasEntry {
  gas_id?: number;
  gas_Fecha: string | Date;
  gas_Suplidor: string;
  gas_Factura: string;
  gas_Inicio: number;
  gas_Fin: number;
  gas_Dias: number;
  gas_Usuario?: string;
  gas_Registrado?: string | Date;
  gas_Consumido?: number;
  gas_Comprado?: number;
  gas_Tiempo?: string;
  gas_Indice?: number;
  gas_Cambio?: number;
}

export interface GasRecord {
  gas_id: number;
  gas_Fecha: string;
  gas_Consumido: number;
  gas_Comprado: number;
  gas_Tiempo: string;
  gas_Indice: number;
  gas_Cambio: number;
}

export type DateRange = '90days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'all';

