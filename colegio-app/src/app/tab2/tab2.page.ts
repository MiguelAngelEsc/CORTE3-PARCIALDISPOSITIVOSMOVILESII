import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth';
import { FirestoreService, Alumno } from '../services/firestore';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit, OnDestroy {
  nombreAlumno = '';
  seccionSeleccionada: 'pre-escolar' | 'primaria' | 'bachillerato' = 'pre-escolar';
  alumnos: Alumno[] = [];
  private sub = new Subscription();

  constructor(
    private authService: AuthService,
    private firestoreService: FirestoreService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.sub = this.firestoreService.getAlumnos(user.id).subscribe(a => this.alumnos = a);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  async guardar() {
    if (!this.nombreAlumno.trim()) {
      const alert = await this.alertCtrl.create({
        header: 'Campo requerido',
        message: 'Ingresa el nombre del alumno.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) return;

    await this.firestoreService.addAlumno({
      nombre: this.nombreAlumno.trim(),
      seccion: this.seccionSeleccionada,
      parenteUid: user.id
    });

    this.nombreAlumno = '';
    this.seccionSeleccionada = 'pre-escolar';
  }

  async eliminar(alumno: Alumno) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: `¿Eliminar a ${alumno.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => {
          if (alumno.id) this.firestoreService.deleteAlumno(alumno.id);
        }}
      ]
    });
    await alert.present();
  }

  getSeccionLabel(seccion: string): string {
    const labels: Record<string, string> = {
      'pre-escolar': 'Pre-escolar',
      'primaria': 'Primaria',
      'bachillerato': 'Bachillerato'
    };
    return labels[seccion] || seccion;
  }

  getSeccionColor(seccion: string): string {
    const colors: Record<string, string> = {
      'pre-escolar': 'warning',
      'primaria': 'danger',
      'bachillerato': 'success'
    };
    return colors[seccion] || 'medium';
  }
}
