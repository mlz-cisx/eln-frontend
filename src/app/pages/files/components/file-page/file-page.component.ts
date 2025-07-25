import {HttpErrorResponse} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {Validators} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {ProjectSidebarItem} from '@app/enums/project-sidebar-item.enum';
import {
  CommentsComponent
} from '@app/modules/comment/components/comments/comments.component';
import {
  NewCommentModalComponent
} from '@app/modules/comment/components/modals/new/new.component';
import {
  AuthService,
  FilesService,
  UserService,
  WebSocketService
} from '@app/services';
import type {
  Directory,
  Drive,
  File,
  FilePayload,
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


interface FormFile {
  title: FormControl<string | null>;
  name: FormControl<string | null>;
  storage: string | null;
  projects: FormControl<string[]>;
}

@UntilDestroy()
@Component({
  templateUrl: './file-page.component.html',
  styleUrls: ['./file-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilePageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public sidebarItem = ProjectSidebarItem.Files;

  public currentUser: User | null = null;

  public initialState?: File;


  public privileges?: Privileges;

  public modified = false;

  public showSidebar = false;

  public loading = true;

  public modalRef?: DialogRef;

  public readonly dateFormat = "yyyy-MM-dd HH':'mm";


  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();


  public refreshLinkList = new EventEmitter<boolean>();


  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public storages: Drive[] = [];

  public directories: Directory[] = [];


  @ViewChild('uploadInput')
  public uploadInput!: ElementRef;

  public form = this.fb.group<FormFile>({
    title: this.fb.control(null, Validators.required),
    name: this.fb.control(null, Validators.required),
    storage: null,
    projects: this.fb.control([]),
  });

  public constructor(
    public readonly filesService: FilesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly titleService: Title,
    private readonly modalService: DialogService,
    private user_service: UserService,
  ) {
  }

  public get f() {
    return this.form.controls;
  }



  public get descriptionTranslationKey(): string {
    return this.initialState?.description ? 'file.details.description.edit' : 'file.details.description.add';
  }

  private get file(): Omit<FilePayload, 'path'> {
    const payload: Omit<FilePayload, 'path'> = {
      title: this.f.title.value!,
      name: this.f.name.value!,
      projects: this.f.projects.value,
    };

    if (this.privileges?.fullAccess && this.directories.length) {
      payload.directory_id = this.f.storage.value ?? null;
    }

    return payload;
  }

  public ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
      if (data.element_changed?.model_pk === this.id) {
        this.cdr.detectChanges();
      }
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
        skip(2),
        debounceTime(500),
        switchMap(() => {
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

    this.filesService
      .get(this.id)
      .pipe(
        untilDestroyed(this),
        map(privilegesData => {
          const file = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.form.patchValue(
            {
              title: file.title,
              name: file.name,
              storage: file.directory_id,
              projects: file.projects,
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
        }),
      )
      .subscribe(
        privilegesData => {
          const file = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = file.title;

          this.initialState = {...file};
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

  public onUpload(event: Event): void {
  }

  public onSubmit(): void {
  }

  public canDeactivate(): Observable<boolean> {
    return of(true);
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
        service: this.filesService,
      },
    } as DialogConfig);
  }

  public onOpenDescriptionModal(): void {
  }

  public initDirectoryDetails(): void {
  }


  public go_to_file(): void {
    this.filesService
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
