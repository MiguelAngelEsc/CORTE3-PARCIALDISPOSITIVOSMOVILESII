import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection, addDoc, deleteDoc, doc,
  query, where, onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { Observable } from 'rxjs';

export interface Alumno {
  id?: string;
  nombre: string;
  seccion: 'pre-escolar' | 'primaria' | 'bachillerato';
  parenteUid: string;
}

export interface Recoger {
  id?: string;
  alumnoId: string;
  alumnoNombre: string;
  seccion: string;
  carril: number;
  parenteUid: string;
  timestamp?: any;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private db = getFirestore();

  getAlumnos(parenteUid: string): Observable<Alumno[]> {
    return new Observable(observer => {
      const q = query(collection(this.db, 'alumnos'), where('parenteUid', '==', parenteUid));
      return onSnapshot(q,
        snap => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() } as Alumno))),
        err => observer.error(err)
      );
    });
  }

  async addAlumno(alumno: Alumno) {
    return addDoc(collection(this.db, 'alumnos'), alumno);
  }

  async deleteAlumno(id: string) {
    return deleteDoc(doc(this.db, 'alumnos', id));
  }

  getRecogerByParente(parenteUid: string): Observable<Recoger[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.db, 'recoger'),
        where('parenteUid', '==', parenteUid),
        where('activo', '==', true)
      );
      return onSnapshot(q,
        snap => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() } as Recoger))),
        err => observer.error(err)
      );
    });
  }

  async addRecoger(recoger: Recoger) {
    return addDoc(collection(this.db, 'recoger'), { ...recoger, timestamp: Timestamp.now() });
  }

  async removeRecoger(id: string) {
    return deleteDoc(doc(this.db, 'recoger', id));
  }
}
