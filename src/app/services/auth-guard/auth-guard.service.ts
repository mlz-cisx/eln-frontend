import {inject, Injectable} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import {AuthService} from '@app/services';

@Injectable({
  providedIn: 'root',
})

class AuthGuardService {

  public authenticated = false;

  constructor(private router: Router,
              private readonly authService: AuthService,
  ) {
  }


  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.getToken()) {
      this.authenticated = true
    }
    // Force the user to log in if currently unauthenticated
    if (!this.authenticated) {
      localStorage.setItem('state_url', state.url);
      this.router.navigate(['/login'])
    }
    return this.authenticated;
  }

}

export const AuthGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(AuthGuardService).canActivate(next, state);
}


