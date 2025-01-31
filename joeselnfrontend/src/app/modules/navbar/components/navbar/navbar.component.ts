import {Component} from '@angular/core';
import {UntilDestroy} from '@ngneat/until-destroy';
import {LogoutService} from "@app/services";


@UntilDestroy()
@Component({
  selector: 'joeseln-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})


export class NavbarComponent {
  constructor(
    private authguard: LogoutService
  ) {
  }

  public logout() {
    this.authguard.logout()
  }

}
