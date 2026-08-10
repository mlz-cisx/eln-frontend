import {BreakpointObserver} from '@angular/cdk/layout';
import {HttpParams} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
} from '@angular/core';
import {forkJoin} from 'rxjs';
import {FormBuilder} from '@ngneat/reactive-forms';
import {
  ContentTypeModelService,
  FilesService,
  NotesService,
  PicturesService,
  RestoreEventsService
} from '@app/services';
import type {ContentTypeModels, File, Note, Picture} from '@joeseln/types';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {environment} from "@environments/environment";
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {
  MetaTooltipComponent
} from '@app/modules/labbook/components/meta-tooltip/meta-tooltip.component';
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";

interface FromSearch {
  search: string | null;
  note: boolean;
  file: boolean;
  picture: boolean;
}

type Element = Note | Picture | File

@UntilDestroy()
@Component({
  selector: 'mlzeln-labbook-restore',
  templateUrl: './restore.component.html',
  styleUrls: ['./restore.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class LabBookRestoreComponent implements OnInit {

  public readonly apiUrl = `${environment.apiUrl}`;

  public isMobileMode = false;

  public offsetHeader = 0;

  public offsetMargin = 15;

  public sidebarPosition = 'sticky';

  public loading = false;


  public form = this.fb.group<FromSearch>({
    search: null,
    note: true,
    file: true,
    picture: true,
  });

  public selectedContentTypes: string[] = [];

  @Input()
  labook_id: string = '';

  results: any[] = [];

  private overlayRef: OverlayRef | null = null;

  safeContent!: SafeHtml;
  useNowrap = false;
  private hoverList = false;
  private hoverTooltip = false;
  private tooltipOpen = false;


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

  public get f() {
    return this.form.controls;
  }

  resetFilters(): void {
    const currentSearch = this.f.search.value;
    this.form.reset({
      search: currentSearch,
      note: true,
      file: true,
      picture: true,
    });

    this.selectedContentTypes = [];
    this.results = [];

    this.cdr.markForCheck();
    this.search()
  }


  public ngOnInit(): void {
    this.restoreEvents.restored$
      .pipe(untilDestroyed(this))
      .subscribe(id => {
        this.results = this.results.filter(r => r.pk !== id);
        this.cdr.markForCheck();
      });
    this.restoreEvents.thrashed$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.resetFilters();
      });
    this.breakpointObserver
      .observe(['(max-width: 992px)'])
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        /* istanbul ignore if */
        if (res.matches) {
          this.isMobileMode = true;
          return;
        }

        this.isMobileMode = false;
      });

    // place sidebar exact below navbar
    const navBarElement = this.el.nativeElement.closest('.header');
    if (navBarElement) {
      const navBarHeight = parseInt(window.getComputedStyle(navBarElement).height, 10);
      this.offsetHeader = navBarHeight - this.offsetMargin;
    } else {
      this.offsetHeader = 40; // Fallback
    }

    this.f.search.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.search();
      });

    this.search();


  }

  @HostListener('window:scroll', ['$event'])
  public scrollEvent(event: any): void {
    this.setSidebarPosition(event.target.scrollingElement.scrollTop);
  }

  public setSidebarPosition(scrollTop: number): void {
    const offsetTop = this.offsetHeader;

    if (this.isMobileMode) {
      this.sidebarPosition = 'block';
    } else {
      this.sidebarPosition = scrollTop + this.offsetMargin > offsetTop ? 'fixed' : 'sticky';
    }

    this.cdr.markForCheck();
  }

  public onChangeFilter(event: any, contentType: ContentTypeModels): void {
    const modelName = this.contentTypeModelService.get(contentType, 'modelName');
    if (modelName) {
      if (event.target.checked) {
        this.selectedContentTypes.push(modelName);
      } else {
        const index = this.selectedContentTypes.indexOf(modelName);
        this.selectedContentTypes.splice(index, 1);
      }
      this.search();
    }
  }

  search() {

    if (!this.labook_id) return;
    this.results = [];
    let params = new HttpParams().set('deleted', 'true').set('labbook_id', String(this.labook_id)).set('hidden_deleted', 'false');


    // apply search keyword if exist
    if (this.f.search.value) {
      params = params.set('search', this.f.search.value);
    }

    let fetchObservables = [];

    if (this.f.note.value) {
      fetchObservables.push(this.notesService.getList(params));
    }

    if (this.f.picture.value) {
      fetchObservables.push(this.picturesService.getList(params));
    }

    if (this.f.file.value) {
      fetchObservables.push(this.filesService.getList(params));
    }

    if (fetchObservables.length === 0) {
      this.results = [];
      this.cdr.markForCheck();
      return;
    }

    forkJoin(fetchObservables).subscribe((resultsArray: { data: Element[] }[]) => {
      this.results = resultsArray.flatMap(r => r.data);
      this.cdr.markForCheck();
    });

  }

  onDragStart(event: DragEvent, result: any) {
    const data = JSON.stringify({ child_object_id: result.pk, child_object_content_type: result.content_type });
    event.dataTransfer?.setData('application/json', data);
  }

  hide_from_restore_list(element: HTMLElement, pk: any, model: any) {

    if (model === 'shared_elements.file') {
      this.filesService.toggle_hidden_delete(pk, true).subscribe((file)=>{
        this.search();
      })
    }
    if (model === 'pictures.picture') {
      this.picturesService.toggle_hidden_delete(pk, true).subscribe((pic) => {
        this.search()
      })
    }
    if (model === 'shared_elements.note') {
      this.notesService.toggle_hidden_delete(pk, true).subscribe((note) => {
        this.search()
      })
    }
  }

  open_element_page(element: HTMLElement, pk: any, model: any) {
    const baseUrl = window.location.origin;
    let path = '';
    switch (model) {
      case 'shared_elements.file':
        path = `/files/${pk}`;
        break;
      case 'pictures.picture':
        path = `/pictures/${pk}`;
        break;
      case 'shared_elements.note':
        path = `/notes/${pk}`;
        break;
    }
    window.location.href = `${baseUrl}${path}`;
  }


  showMetaTooltip(origin: HTMLElement, result: any) {
    if (!result || !result.pk) return;

    this.tooltipOpen = true;
    this.hoverTooltip = false;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions([
        {
          originX: 'start',
          originY: 'center',
          overlayX: 'end',
          overlayY: 'center',
          offsetX: -10 // tooltip LEFT of element
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const tooltipPortal = new ComponentPortal(MetaTooltipComponent);
    const tooltipRef = this.overlayRef.attach(tooltipPortal);

    let textOnly = ""

    tooltipRef.instance.hoverState.subscribe(state => {
      if (state === 'enter') {
        this.hoverTooltip = true;

        // Cancel pending close
        if (this.closeTimer) {
          clearTimeout(this.closeTimer);
          this.closeTimer = null;
        }

      } else {
        this.hoverTooltip = false;
        this.evaluateTooltipClose();
      }
    });

    if (result.content_type_model === 'shared_elements.file') {
      this.safeContent = this.sanitizer.bypassSecurityTrustHtml(result.description);
      textOnly = this.extractTextOnly(result.description);

      tooltipRef.instance.htmlMode = true;
      tooltipRef.instance.canvasMode = false;
    }

    if (result.content_type_model === 'pictures.picture') {
      tooltipRef.instance.canvasMode = true;
      tooltipRef.instance.htmlMode = false;
      tooltipRef.instance.pic_uuid = result.pk
      return;
    }


    if (result.content_type_model === 'shared_elements.note') {
      this.safeContent = this.sanitizer.bypassSecurityTrustHtml(result.content);
      textOnly = this.extractTextOnly(result.content);

      tooltipRef.instance.htmlMode = true;
      tooltipRef.instance.canvasMode = false;
    }


    // measure longest line
    const longest = this.getLongestTextLine(textOnly);
    this.useNowrap = longest.length < 250;

    tooltipRef.instance.content = this.safeContent;
    tooltipRef.instance.useNowrap = this.useNowrap;


  }


  hideMetaTooltip() {
    this.tooltipOpen = false;


    this.hoverList = false;
    this.hoverTooltip = false;

    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
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

  onListEnter(origin: HTMLElement, result: any) {
    if (!result || !result.pk) return;   // FIX

    this.hoverList = true;

    if (!this.tooltipOpen) {
      this.tooltipOpen = true;
      this.showMetaTooltip(origin, result);
    }
  }


  private closeTimer: any = null;

  onListLeave() {
    this.hoverList = false;

    // Start a short grace timer
    this.closeTimer = setTimeout(() => {
      this.evaluateTooltipClose();
    }, 300);
  }

  evaluateTooltipClose() {
    if (!this.hoverList && !this.hoverTooltip) {
      this.hideMetaTooltip();
    }
  }

}
