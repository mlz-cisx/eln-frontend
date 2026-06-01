import { BreakpointObserver } from '@angular/cdk/layout';
import { HttpParams } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
} from '@angular/core';
import { forkJoin } from 'rxjs';
import { FormBuilder } from '@ngneat/reactive-forms';
import { FilesService, NotesService, PicturesService, ContentTypeModelService } from '@app/services';
import type { Note, Picture, File, ContentTypeModels } from '@joeseln/types';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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

  public isMobileMode = false;

  public offsetHeader = 0;

  public offsetMargin = 15;

  public sidebarPosition = 'sticky';

  public loading = false;

  public form = this.fb.group<FromSearch>({
    search: null,
    note: false,
    file: false,
    picture: false,
  });

  public selectedContentTypes: string[] = [];

  @Input()
  labook_id: string = '';

  results: any[] = [];

  public constructor(
    private readonly breakpointObserver: BreakpointObserver,
    private readonly cdr: ChangeDetectorRef,
    private readonly el: ElementRef,
    private readonly fb: FormBuilder,
    private readonly filesService: FilesService,
    private readonly notesService: NotesService,
    private readonly picturesService: PicturesService,
    private readonly contentTypeModelService: ContentTypeModelService,
  ) {
  }

  public get f() {
    return this.form.controls;
  }

  public ngOnInit(): void {
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
    let params = new HttpParams().set('deleted', 'true').set('labbook_id', String(this.labook_id));

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

    forkJoin(fetchObservables).subscribe((resultsArray: any) => {
      resultsArray.forEach((d: any) => {
        this.results = this.results.concat(d.data);
      });
      this.cdr.markForCheck();
    });
  }

  onDragStart(event: DragEvent, result: any) {
    const data = JSON.stringify({ child_object_id: result.pk, child_object_content_type: result.content_type });
    event.dataTransfer?.setData('application/json', data);
  }
}
