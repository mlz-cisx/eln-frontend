import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {BreakpointObserver} from "@angular/cdk/layout";
import {FormBuilder} from "@ngneat/reactive-forms";
import {
  ContentTypeModelService,
  FilesService,
  NotesService,
  PicturesService,
  RestoreEventsService
} from "@app/services";
import {Overlay} from "@angular/cdk/overlay";


@Component({
  selector: 'meta-tooltip',
  templateUrl: './meta-tooltip.component.html',
  styleUrls: ['./meta-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class MetaTooltipComponent implements OnInit {
  public content: SafeHtml = '';
  public mathjax_content: string = '';
  public useNowrap = false;

  @Input() htmlMode = false;
  @Input() canvasMode = false;

  @Output() hoverState = new EventEmitter<'enter' | 'leave'>();

  @Input() elem_uuid: any;
  @Input() elem_type: any;

  public constructor(
    private readonly breakpointObserver: BreakpointObserver,
    private readonly cdr: ChangeDetectorRef,
    private readonly el: ElementRef,
    private readonly fb: FormBuilder,
    private readonly filesService: FilesService,
    private readonly notesService: NotesService,
    private readonly picturesService: PicturesService,
    private readonly contentTypeModelService: ContentTypeModelService,
    private readonly restoreEvents: RestoreEventsService,
    private overlay: Overlay,
    private sanitizer: DomSanitizer
  ) {
  }

  public ngOnInit(): void {
    if (this.elem_type === 'shared_elements.note') {
      this.notesService
        .get(this.elem_uuid)
        .pipe()
        .subscribe(privilegesData => {
          const html = privilegesData.data.content
          this.applyMathjaxContent(html)
        });

    }
    if (this.elem_type === 'shared_elements.file') {
      this.filesService
        .get(this.elem_uuid)
        .pipe()
        .subscribe(privilegesData => {
          const html = privilegesData.data.description
          this.applyHtmlContent(html)
        });
    }
  }

  private applyHtmlContent(html: string): void {
    this.content = this.sanitizer.bypassSecurityTrustHtml(html);
    const textOnly = this.extractTextOnly(html);
    const longest = this.getLongestTextLine(textOnly);
    this.useNowrap = longest.length < 250;
    this.cdr.markForCheck();
  }

  private applyMathjaxContent(html: string): void {
    this.mathjax_content = html;
    const textOnly = this.extractTextOnly(html);
    const longest = this.getLongestTextLine(textOnly);
    this.useNowrap = longest.length < 250;
    this.cdr.markForCheck();
  }

  private extractTextOnly(html: string): string {
    // Convert <br> tags to newline characters
    const normalized = html.replace(/<br\s*\/?>/gi, '\n');
    // Strip all HTML tags
    const tmp = document.createElement('div');
    tmp.innerHTML = normalized;
    return tmp.textContent || '';
  }


  private getLongestTextLine(text: string): string {
    const lines = text.split('\n');
    return lines.reduce((a, b) => (b.length > a.length ? b : a), '');
  }


}
