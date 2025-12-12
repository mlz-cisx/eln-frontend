import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {VideoJsPlayerComponent} from "./component/video-player.component";

@NgModule({
  declarations: [VideoJsPlayerComponent],
  imports: [CommonModule],
  exports: [VideoJsPlayerComponent]
})
export class VideoJsPlayerModule {
}
