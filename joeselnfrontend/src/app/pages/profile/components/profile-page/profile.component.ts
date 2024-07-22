import {Component, OnInit} from '@angular/core';
import {UserService} from "@app/services";
import {KeykloakUser, User, Test} from "@joeseln/types";
import {UserStore} from "@app/services/user/user.store";

@Component({
  selector: 'joeseln-profile-page',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfilePageComponent implements OnInit {
  test: Test[] = []
  user: User | undefined;

  constructor(private user_service: UserService,
              private readonly userStore: UserStore
  ) {
  }

  ngOnInit(): void {
    this.getUserMe();
  }

  getUserMe(): void {
    this.user_service.getUserMe()
      .subscribe(user => {
          this.user = user
          this.userStore.update(() => ({user, loggedIn: Boolean(user)}));
        }
      );
  }

}
