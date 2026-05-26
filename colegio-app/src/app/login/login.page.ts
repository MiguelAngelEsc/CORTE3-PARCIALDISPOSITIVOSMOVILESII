import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  cedula = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  async login() {
    const cedula = String(this.cedula).trim();
    const password = String(this.password).trim();

    if (!cedula || !password) {
      const alert = await this.alertCtrl.create({
        header: 'Campos requeridos',
        message: 'Por favor ingresa tu cédula y contraseña.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Ingresando...' });
    await loading.present();

    let loginOk = false;
    try {
      await this.authService.login(cedula, password);
      loginOk = true;
    } catch (err: any) {
      (this as any)._loginErr = String(err?.message ?? err);
      console.error('Login error:', err);
    }

    await loading.dismiss();

    if (!loginOk) {
      await new Promise(r => setTimeout(r, 200));
      const alert = await this.alertCtrl.create({
        header: 'Error de login',
        message: (this as any)._loginErr || 'Cédula o contraseña incorrectos.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    await this.router.navigate(['/tabs/recoger'], { replaceUrl: true });
  }

  goToRegistrar() {
    this.router.navigate(['/registrar']);
  }
}
