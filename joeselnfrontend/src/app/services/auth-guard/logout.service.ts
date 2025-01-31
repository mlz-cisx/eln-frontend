import {Injectable} from '@angular/core';
import {
  Router
} from '@angular/router';
import {AuthService} from '@app/services';
import {KeycloakService} from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {


  constructor(
    private authService: AuthService,
    private router: Router,
    protected readonly keycloak: KeycloakService
  ) {
  }

  // use this logout method if keycloak is not integrated
  public _logout() {
    window.history.pushState({}, "", "/")
    if (this.authService.getToken()) {
      // logout for username/password
      this.authService.clearStorage()
      this.router.navigate(['/login'])
    } else {
      this.router.navigate(['/login'])
    }
  }

  // use this logout method if keycloak is integrated
  public logout() {
    window.history.pushState({}, "", "/")
    if (this.authService.getToken()) {
      // logout for username/password
      this.authService.clearStorage()
      this.router.navigate(['/login'])
    } else {
      this.keycloak.logout().then(() => {
        this.router.navigate(['/login'])
      });
    }
  }

  public redirect_start_page() {
    this.router.navigate(['/'])
  }

}
