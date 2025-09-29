import {Component} from '@angular/core';
import {UntilDestroy} from '@ngneat/until-destroy';
import {LogoutService} from "@app/services";


@UntilDestroy()
@Component({
    selector: 'joeseln-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    standalone: false
})


export class NavbarComponent {
  constructor(
    private logoutService: LogoutService
  ) {
  }

  public logout() {
    this.logoutService.logout()
  }

}
