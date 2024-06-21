import {
  Component,
  OnInit
} from '@angular/core';
import {Test} from "@joeseln/types";
import {FormControl} from '@angular/forms';
import {Router} from '@angular/router'

@Component({
  selector: 'app-help-page',
  templateUrl: './help-page.component.html',
  styleUrls: ['./help-page.component.scss'],
})
export class HelpPageComponent implements OnInit {
  test: Test[] = []
  name = new FormControl('');
  intervalID: any;


  constructor(private router: Router) {
  }

  public ngOnInit(): void {
    const state_url = localStorage.getItem('state_url')
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
