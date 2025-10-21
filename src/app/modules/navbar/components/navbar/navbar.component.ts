import {Component} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LogoutService, UserService } from '@app/services';
import type { User } from '@joeseln/types';


@UntilDestroy()
@Component({
    selector: 'joeseln-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    standalone: false
})


export class NavbarComponent {
  public currentUser: User | null = null;

  constructor(
    private logoutService: LogoutService,
    private userService: UserService,
  ) {}

  public ngOnInit(): void {
    this.userService.user$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.currentUser = state.user;
    });
  }

  public logout() {
    this.logoutService.logout();
  }

}
