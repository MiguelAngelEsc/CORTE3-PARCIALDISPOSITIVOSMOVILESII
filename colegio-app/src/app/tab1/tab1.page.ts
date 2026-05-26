import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';
import { AuthService } from '../services/auth';
import { FirestoreService, Alumno, Recoger } from '../services/firestore';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit, OnDestroy {
  carrilSeleccionado = '1';
  alumnos: Alumno[] = [];
  yaLlego = false;
  recogersActivos: Recoger[] = [];
  nombreUsuario = '';
  private subs = new Subscription();

  constructor(
    private authService: AuthService,
    private firestoreService: FirestoreService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.nombreUsuario = user.nombre;

    this.subs.add(
      this.firestoreService.getAlumnos(user.id).subscribe(a => this.alumnos = a)
    );
    this.subs.add(
      this.firestoreService.getRecogerByParente(user.id).subscribe(r => {
        this.recogersActivos = r;
        this.yaLlego = r.length > 0;
        if (r.length > 0) this.carrilSeleccionado = String(r[0].carril);
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async llegue() {
    if (this.alumnos.length === 0) {
      const alert = await this.alertCtrl.create({
        header: 'Sin alumnos',
        message: 'No tienes alumnos registrados. Ve a "Registrar Alumno" primero.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Verificando ubicación...' });
    await loading.present();

    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const dist = this.calcularDistancia(
        pos.coords.latitude, pos.coords.longitude,
        environment.school.lat, environment.school.lng
      );
      await loading.dismiss();

      if (dist > environment.school.radiusMeters) {
        const alert = await this.alertCtrl.create({
          header: 'Fuera del colegio',
          message: `Debes estar dentro del colegio.\nDistancia actual: ${Math.round(dist)} m`,
          buttons: ['OK']
        });
        await alert.present();
        return;
      }

      await this.registrarLlegada();
    } catch {
      await loading.dismiss();
      // En browser de escritorio el GPS puede fallar — preguntar si saltar validación para demo
      const alert = await this.alertCtrl.create({
        header: 'GPS no disponible',
        message: '¿Registrar llegada de todas formas? (solo para pruebas de escritorio)',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Sí, registrar', handler: () => this.registrarLlegada() }
        ]
      });
      await alert.present();
    }
  }

  private async registrarLlegada() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const loading = await this.loadingCtrl.create({ message: 'Registrando llegada...' });
    await loading.present();

    try {
      for (const alumno of this.alumnos) {
        await this.firestoreService.addRecoger({
          alumnoId: alumno.id || '',
          alumnoNombre: alumno.nombre,
          seccion: alumno.seccion,
          carril: parseInt(this.carrilSeleccionado),
          parenteUid: user.id,
          activo: true
        });
      }
      await loading.dismiss();
    } catch {
      await loading.dismiss();
    }
  }

  async listo() {
    const loading = await this.loadingCtrl.create({ message: 'Procesando...' });
    await loading.present();

    try {
      for (const r of this.recogersActivos) {
        if (r.id) await this.firestoreService.removeRecoger(r.id);
      }
      await loading.dismiss();
      this.carrilSeleccionado = '1';
    } catch {
      await loading.dismiss();
    }
  }

  async salir() {
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  getColorChip(seccion: string): string {
    const map: Record<string, string> = {
      'pre-escolar': 'warning',
      'primaria': 'danger',
      'bachillerato': 'success'
    };
    return map[seccion] || 'medium';
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number { return deg * Math.PI / 180; }
}
