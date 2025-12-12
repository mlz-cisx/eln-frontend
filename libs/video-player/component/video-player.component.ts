import { Component, ElementRef, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import videojs from "video.js";

@Component({
  selector: "app-video-js-player",
  template: `
    <video
      #target
      class="video-js vjs-default-skin"
      controls
      preload="auto"
      [attr.width]="width"
      [attr.height]="height"
      [poster]="poster"
    ></video>
  `,
  standalone: false,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ["../../../node_modules/video.js/dist/video-js.css"],
})
export class VideoJsPlayerComponent implements OnInit, OnDestroy, OnChanges {
  private player: any;

  @ViewChild("target", { static: true }) target!: ElementRef;
  @Input() src!: string;
  @Input() type!: string;
  @Input() width?: number;
  @Input() height?: number;
  @Input() poster?: string;
  @Input() fluid: boolean = false;

  ngOnInit() {
    console.log(this.src)
    this.initializePlayer();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['src'] && !changes['src'].firstChange) {
      this.player.src({ src: this.src });
      this.player.load();
    }
  }

  ngOnDestroy() {
    if (this.player) {
      this.player.dispose();
    }
  }

  private initializePlayer() {
    this.player = videojs(this.target.nativeElement, {
      sources: [{ src: this.src, type: this.type }],
      width: this.width,
      height: this.height,
      poster: this.poster,
      fluid: this.fluid,
    });
  }
}
