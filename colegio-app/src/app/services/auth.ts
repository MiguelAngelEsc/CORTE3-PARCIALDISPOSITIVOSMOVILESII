import { Injectable } from '@angular/core';

export interface CurrentUser {
  id: string;
  nombre: string;
  cedula: string;
}

const API_KEY    = 'AIzaSyASgDnKNEf3K38MI7MsaptWNB-YAa6ZW7Y';
const PROJECT_ID = 'appgeolocalizacion-c8fa7';
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const STORAGE_KEY = 'colegio_user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  async login(cedula: string, password: string): Promise<CurrentUser> {
    const res = await fetch(`${FS_BASE}:runQuery?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'parientes' }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                { fieldFilter: { field: { fieldPath: 'cedula' },   op: 'EQUAL', value: { stringValue: cedula } } },
                { fieldFilter: { field: { fieldPath: 'password' }, op: 'EQUAL', value: { stringValue: password } } }
              ]
            }
          },
          limit: 1
        }
      })
    });

    const results = await res.json();
    console.log('Firestore runQuery results:', JSON.stringify(results));
    const hit = Array.isArray(results) ? results.find((r: any) => r.document) : null;
    if (!hit) throw new Error('INVALID_CREDENTIALS');

    const fields = hit.document.fields;
    const docId  = hit.document.name.split('/').pop();
    const user: CurrentUser = {
      id:     docId,
      nombre: fields.nombre?.stringValue ?? '',
      cedula: fields.cedula?.stringValue ?? cedula
    };
    this.saveSession(user);
    return user;
  }

  async register(nombre: string, cedula: string, celular: string, correo: string, password: string): Promise<CurrentUser> {
    // Verificar cédula duplicada
    const check = await fetch(`${FS_BASE}:runQuery?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'parientes' }],
          where: { fieldFilter: { field: { fieldPath: 'cedula' }, op: 'EQUAL', value: { stringValue: cedula } } },
          limit: 1
        }
      })
    });
    const checkData = await check.json();
    if (checkData.find((r: any) => r.document)) throw new Error('CEDULA_EXISTS');

    // Crear documento
    const res = await fetch(`${FS_BASE}/parientes?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          nombre:   { stringValue: nombre },
          cedula:   { stringValue: cedula },
          celular:  { stringValue: celular },
          correo:   { stringValue: correo },
          password: { stringValue: password }
        }
      })
    });

    const created = await res.json();
    if (created.error) throw new Error(created.error.message);

    const docId = created.name.split('/').pop();
    const user: CurrentUser = { id: docId, nombre, cedula };
    this.saveSession(user);
    return user;
  }

  logout() {
    localStorage.removeItem(STORAGE_KEY);
  }

  getCurrentUser(): CurrentUser | null {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(STORAGE_KEY);
  }

  private saveSession(user: CurrentUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
}
