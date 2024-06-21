import {Component, OnInit} from '@angular/core';
import {UserService} from "@app/services";
import {KeykloakUser, Test} from "@joeseln/types";

@Component({
  selector: 'joeseln-profile-page',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfilePageComponent implements OnInit {
  test: Test[] = []
  user: KeykloakUser | undefined;

  constructor(private user_service: UserService) {
  }

  ngOnInit(): void {
    this.getUserMe();
  }

  getUserMe(): void {
    this.user_service.getUserMe()
      .subscribe(user => {
          this.user = user
        }
      );
  }

}
