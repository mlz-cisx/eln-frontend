import {Component, OnInit} from '@angular/core';
import {setTheme} from 'ngx-bootstrap/utils';
import {WebSocketService} from './services';

@Component({
    selector: 'joeseln-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnInit {

  public constructor(private readonly websocketService: WebSocketService) {
    setTheme('bs4');
  }

  title = 'joeseln';

  public ngOnInit(): void {
    this.websocketService.connect()
  }
}
