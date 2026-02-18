import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root' 
})
export class TokenService {

  constructor() { }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  createAuthHeaders(options?: { excludeContentType?: boolean }): HttpHeaders {
    const token = this.getToken();
    
    const headersConfig: { [name: string]: string | string[] } = {};
  
    // Por defecto incluir Content-Type: application/json
    // a menos que se especifique excludeContentType: true
    if (!options?.excludeContentType) {
      headersConfig['Content-Type'] = 'application/json';
    }
  
    if (token) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }
  
    return new HttpHeaders(headersConfig);
  }
}