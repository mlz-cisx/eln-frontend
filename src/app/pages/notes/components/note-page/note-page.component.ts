import {HttpErrorResponse} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {Validators} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {
  CommentsComponent
} from '@app/modules/comment/components/comments/comments.component';
import {
  NewCommentModalComponent
} from '@app/modules/comment/components/modals/new/new.component';
import {
  AuthService,
  LabbooksService,
  NotesService,
  UserService,
} from '@app/services';
import type {
  Note,
  NotePayload,
  Privileges,
  Project,
  User
} from '@joeseln/types';
import {DialogConfig, DialogRef, DialogService} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {Observable, of, Subject} from 'rxjs';
import {debounceTime, map, skip, switchMap,} from 'rxjs/operators';


interface FormNote {
  subject: FormControl<string | null>;
  content: string | null;
  projects: FormControl<string[]>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-note-page',
  templateUrl: './note-page.component.html',
  styleUrls: ['./note-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotePageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public currentUser: User | null = null;

  public initialState?: Note;


  public privileges?: Privileges;


  public showSidebar = false;

  public loading = true;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();


  public refreshLinkList = new EventEmitter<boolean>();


  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public form = this.fb.group<FormNote>({
    subject: this.fb.control(null, Validators.required),
    content: null,
    projects: this.fb.control([]),
  });

  public constructor(
    public readonly notesService: NotesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly titleService: Title,
    private readonly modalService: DialogService,
    private readonly labbooksService: LabbooksService,
    private user_service: UserService,
  ) {
  }

  public get f() {
    return this.form.controls;
  }



  private get note(): NotePayload {
    return {
      subject: this.f.subject.value!,
      content: this.f.content.value ?? '',
      projects: this.f.projects.value,
    };
  }

  public ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });


    this.initSidebar();
    this.initSearchInput();
    this.initDetails();
    this.initPageTitle();
  }

  public ngOnDestroy(): void {
  }

  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        skip(1),
        debounceTime(500),
        switchMap(() => {
          this.cdr.markForCheck();
          return of([]);
        })
      )
      .subscribe();
  }

  public initSidebar(): void {

  }

  public initSearchInput(): void {

  }

  public initPageTitle(): void {

  }

  public initDetails(formChanges = true): void {

    this.notesService
      .get(this.id)
      .pipe(
        untilDestroyed(this),
        map(privilegesData => {
          const note = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.form.patchValue(
            {
              subject: note.subject,
              content: note.content,
              projects: note.projects,
            },
            {emitEvent: false}
          );

          if (!privileges.edit) {
            this.form.disable({emitEvent: false});
          }

          return privilegesData;
        }),
        switchMap(privilegesData => {

          return of(privilegesData);
        })
      )
      .subscribe(
        privilegesData => {
          const note = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = note.subject;
          // void this.pageTitleService.set(note.display);

          this.initialState = {...note};
          this.privileges = {...privileges};

          this.loading = false;

          if (formChanges) {
            this.initFormChanges();
          }

          this.cdr.markForCheck();
        },
        (error: HttpErrorResponse) => {
          if (error.status === 404) {
            void this.router.navigate(['/not-found']);
          }

          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.notesService
      .patch(this.id, this.note)
      .pipe(untilDestroyed(this))
      .subscribe(
        note => {

          this.detailsTitle = note.subject;


          this.initialState = {...note};
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshLinkList.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('note.details.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public pendingChanges(): Observable<boolean> {

    return of(true);
  }

  public onVersionChanged(): void {
    this.initDetails(false);
    this.refreshVersions.next(true);
    this.refreshChanges.next(true);
    this.refreshLinkList.next(true);
  }

  public onRefreshLinkList(): void {
    this.refreshLinkList.next(true);
  }

  public onOpenNewCommentModal(): void {
    this.modalRef = this.modalService.open(NewCommentModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        contentType: this.initialState?.content_type,
        service: this.notesService,
      },
    } as DialogConfig);

  }

  public onUpdateMetadata(): void {
  }

  public go_to_note(): void {
    this.notesService
      .get(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(d => {
        localStorage.setItem('pageVerticalposition', String((d.data.position_y) * 36));
        localStorage.setItem('note_inserted', String(1)); // indicating jump action
        localStorage.setItem('element_pk', String(this.id));
        void this.router.navigate([`/labbooks/${d.data.labbook_id}`]);
      })
  }


}
