import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-registrar',
  templateUrl: './registrar.page.html',
  styleUrls: ['./registrar.page.scss'],
  standalone: false,
})
export class RegistrarPage {
  nombre = '';
  cedula = '';
  celular = '';
  correo = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  async registrar() {
    if (!this.nombre || !this.cedula || !this.celular || !this.correo || !this.password) {
      const alert = await this.alertCtrl.create({
        header: 'Campos requeridos',
        message: 'Por favor completa todos los campos.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Registrando...' });
    await loading.present();

    try {
      await this.authService.register(this.nombre, this.cedula, this.celular, this.correo, this.password);
      await loading.dismiss();
      this.router.navigate(['/tabs/recoger']);
    } catch (error: any) {
      await loading.dismiss();
      const msg = error?.code === 'auth/email-already-in-use'
        ? 'Ya existe una cuenta con esa cédula.'
        : 'Error al registrar. Inténtalo de nuevo.';
      const alert = await this.alertCtrl.create({ header: 'Error', message: msg, buttons: ['OK'] });
      await alert.present();
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
