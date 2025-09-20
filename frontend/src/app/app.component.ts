import {Component, inject} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {FlashBannerComponent} from './shared/flash-banner/flash-banner.component';
import {AuthService} from './shared/services/auth.service';
import {SiteHeaderComponent} from './shared/app-header/app-header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FlashBannerComponent, SiteHeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'utilitywatch';
  private authSvc = inject(AuthService);
  private router = inject(Router);

  get auth() { return this.authSvc; }

  async onLogout() {
    this.authSvc.logout();
    await this.router.navigateByUrl('/');
  }
}
