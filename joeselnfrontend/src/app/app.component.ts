import {Component, OnInit} from '@angular/core';
import {setTheme} from 'ngx-bootstrap/utils';
import {WebSocketService, UserService,} from './services';
import {UserStore} from "@app/services/user/user.store";

@Component({
  selector: 'joeseln-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public constructor(private readonly websocketService: WebSocketService,
                     private user_service: UserService,
                     private readonly userStore: UserStore,) {
    setTheme('bs4');
  }

  title = 'joeseln';

  public ngOnInit(): void {
    // we need this for page reload for a loogged-in User
    // because createInitialState() is called initially
    this.user_service.getUserMe()
      .subscribe(user => {
          this.userStore.update(() => ({user, loggedIn: Boolean(user)}));
        }
      );
  }
}
