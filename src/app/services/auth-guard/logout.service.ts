import {Injectable} from '@angular/core';
import {
  Router
} from '@angular/router';
import {AuthService} from '@app/services';
import {environment} from "@environments/environment";
import {UserStore} from "@app/services/user/user.store";

@Injectable({
  providedIn: 'root'
})
export class LogoutService {


  constructor(
    private authService: AuthService,
    private router: Router,
    private readonly userStore: UserStore,
  ) {
  }

  // use this logout method if keycloak is never integrated
  public _logout() {
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
    if (this.authService.getToken()) {
      // logout for username/password
      this.authService.clearStorage()
      // logout keycloak
      if (environment.keycloak_integration && this.userStore.getValue()['user']?.oidc_user) {
        window.location.href = `${environment.apiUrl}/logout-keycloak`;
      }
      else {
        // for a consistent ws handling
        location.reload()
      }
    }
  }

  public redirect_start_page() {
    this.router.navigate(['/'])
  }

}
