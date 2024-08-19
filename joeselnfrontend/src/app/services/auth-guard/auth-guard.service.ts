import {Injectable} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthService} from '@app/services';
import {KeycloakAuthGuard, KeycloakService} from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService extends KeycloakAuthGuard {
  constructor(
    private _authService: AuthService,
    private _router: Router,
    protected readonly keycloak: KeycloakService
  ) {
    super(_router, keycloak);
  }


  public async isAccessAllowed(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) {
    if (this._authService.getToken()) {
      this.authenticated = true
    }
    // Force the user to log in if currently unauthenticated
    if (!this.authenticated) {
      localStorage.setItem('state_url', state.url);
      this._router.navigate(['/login'])
    }
    return this.authenticated;
  }

  public logout() {
    // TODO maybe another way to clear some history
    window.history.pushState({}, "", "/")
    if (this._authService.getToken()) {
      // logout for username/password
      this._authService.clearStorage()
      this.authenticated = false
      window.location.reload()
    } else {
      if (this.authenticated) {
        this.authenticated = false
        this.keycloak.logout().then(() => {
          window.location.reload()
        });
      }
    }
  }

  public redirect_start_page(){
    this._router.navigate(['/'])
  }

}
