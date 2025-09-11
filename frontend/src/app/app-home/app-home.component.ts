import {Component, inject} from '@angular/core';
import {CanActivateFn, Router, RouterLink, RouterOutlet} from '@angular/router';
import {AuthService} from '../shared/services/auth.service';
import {TokenService} from '../shared/services/token.service';
import {CommonModule} from '@angular/common';
import {SiteHeaderComponent} from '../shared/app-header/app-header.component';
import {LogoComponent} from '../shared/logo/logo.component';
export const landingRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated()
    ? router.createUrlTree(['/user-account'])   // account home
    : router.createUrlTree(['/login']); // login screen
};
@Component({
  selector: 'app-app-home',
  imports: [
    RouterLink,
    RouterOutlet,
    CommonModule,
    SiteHeaderComponent,
    LogoComponent
  ],
  templateUrl: './app-home.component.html',
  styleUrl: './app-home.component.css'
})


export class AppHomeComponent {


}
