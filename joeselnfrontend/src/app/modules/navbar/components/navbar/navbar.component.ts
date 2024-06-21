import {Component} from '@angular/core';
import {UntilDestroy} from '@ngneat/until-destroy';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot
} from "@angular/router";
import {AuthService} from "@app/services";
import {AuthGuardService} from "@app/services";

@UntilDestroy()
@Component({
  selector: 'joeseln-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})


export class NavbarComponent {
  constructor(
    private authguard: AuthGuardService
  ) {
  }

  public logout() {
    this.authguard.logout()
  }

}
