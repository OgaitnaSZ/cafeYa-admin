export interface UserLogin {
    email: string;
    password: string;
}

export interface User {
    id: string;
    nombre: string;
    email: string;
    password: string;
    rol: UserRole;
}

export type UserRole = 'admin' | 'encargado' | 'cocina';