import {Injectable} from '@angular/core';
import {
  Router
} from '@angular/router';
import { AuthService, WebSocketService } from '@app/services';
import {environment} from "@environments/environment";
import { UserStore, createInitialState } from '@app/services/user/user.store';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {


  constructor(
    private authService: AuthService,
    private router: Router,
    private readonly userStore: UserStore,
    private websocketService: WebSocketService,
  ) {
  }


  public logout() {
    if (this.authService.getToken()) {
      // logout for username/password
      this.userStore.update(createInitialState());
      this.authService.clearStorage()

      // logout keycloak
      if (environment.keycloak_integration && this.userStore.getValue()['user']?.oidc_user) {
        window.location.href = `${environment.apiUrl}/logout-keycloak`;
      }
      this.websocketService.close();
      void this.router.navigate(['/login']);
    }
  }

  public redirect_start_page() {
    this.router.navigate(['/'])
  }

}
