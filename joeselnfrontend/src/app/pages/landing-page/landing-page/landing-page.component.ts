import {
  Component,
  OnInit
} from '@angular/core';
import {Test} from "@joeseln/types";
import {FormControl} from '@angular/forms';
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
  name = new FormControl('');
  intervalID: any;


  constructor(private router: Router,
              private user_service: UserService,
              private websockket_service: WebSocketService,
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
    this.websockket_service.connect()
    this.getUser()
    const state_url = localStorage.getItem('state_url')
    // for qr code integration
    localStorage.removeItem('state_url')
    if (state_url && state_url.startsWith('/labbooks/')) {
      this.router.navigate([state_url])
    } else {
      const imgOne = '../../../../assets/images/giphy.gif';
      const imgTwo = '../../../../assets/images/lb.png';
      const imgThree = '../../../../assets/images/pumuckl.gif';
      const imgArray = [imgOne, imgTwo, imgThree];
      // @ts-ignore
      document.getElementById('bg-img').style.backgroundImage = 'url(' + imgArray[0] + ')';
      let interval = 0;
      this.intervalID = setInterval(function () {

        if (interval < (imgArray.length - 1)) {
          interval++;
        } else {
          interval = 0;
        }
        // @ts-ignore
        document.getElementById('bg-img').style.backgroundImage = 'url(' + imgArray[interval] + ')';
      }, 1450);
    }
  }

  public ngOnDestroy(): void {
    clearInterval(this.intervalID)
  }

}
