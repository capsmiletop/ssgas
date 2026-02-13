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

export interface User {
  usr_id: number;
  usr_Nombre: string;
  usr_Clave?: string;
  usr_Cambiar: number;
  usr_Activo: number;
}

export interface UserPermissions {
  usr_id: number;
  Dashboard?: number;
  DataEntry?: number;
  Report?: number;
  Settings?: number;
  UserManagement?: number;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  permissions?: UserPermissions;
  requiresPasswordChange?: boolean;
  error?: string;
}

export interface PasswordChangeRequest {
  username: string;
  oldPassword?: string;
  newPassword: string;
}

