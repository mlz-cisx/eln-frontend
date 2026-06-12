import {NgModule} from '@angular/core';
import {VideoJsPlayerComponent} from "./component/video-player.component";

@NgModule({
  imports: [VideoJsPlayerComponent],
  exports: [VideoJsPlayerComponent]
})
export class VideoJsPlayerModule {
}
