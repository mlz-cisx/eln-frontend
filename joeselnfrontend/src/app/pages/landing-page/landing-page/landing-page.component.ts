import {
  Component,
  OnInit
} from '@angular/core';
import {Test} from "@joeseln/types";
import {UntypedFormControl} from '@angular/forms';
import {Router} from '@angular/router'
import {UserService, WebSocketService} from "@app/services";
import {UserStore} from "@app/services/user/user.store";

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnInit {
  test: Test[] = []
  name = new UntypedFormControl('');
  intervalID: any;


  constructor(private router: Router,
              private user_service: UserService,
              private websocket_service: WebSocketService,
              private readonly userStore: UserStore,
  ) {
  }

  getUser(): void {
    this.user_service.getUserMe()
      .subscribe(user => {
          this.userStore.update(() => ({user, loggedIn: Boolean(user)}));
        }
      );
  }

  public ngOnInit(): void {
    this.websocket_service.connect()
    this.getUser()
    const state_url = localStorage.getItem('state_url')
    // for qr code integration
    localStorage.removeItem('state_url')
    if (state_url && state_url.startsWith('/labbooks/')) {
      this.router.navigate([state_url])
    }
  }

  public ngOnDestroy(): void {
  }

}
