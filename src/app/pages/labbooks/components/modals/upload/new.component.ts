import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import {Validators} from '@angular/forms';
import {ModalState} from '@app/enums/modal-state.enum';
import {
  CommentsService,
  FilesService,
  LabbooksService,
  NotesService,
  PicturesService
} from '@joeseln/services';
import type {
  CommentPayload,
  File,
  FileClonePayload,
  LabBook,
  LabBookElementClonePayload,
  LabBookElementPayload,
  Note,
  NotePayload,
  Picture,
  PictureClonePayload,
} from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import JSZip from 'jszip';


interface FormLabBook {
  title: FormControl<string | null>;
  isTemplate: boolean;
  description: string | null;
}

interface FormFile {
  name: string | null;
  file: FormControl<globalThis.File | string | null>;
}

@UntilDestroy()
@Component({
    selector: 'mlzeln-new-labbook-modal',
    templateUrl: './new.component.html',
    styleUrls: ['./new.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class UploadLabBookModalComponent implements OnInit {
  public initialState?: LabBook = this.modalRef.data?.initialState;

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public duplicate?: string = this.modalRef.data?.duplicate;

  public loading = false;

  public new_labbook_pk: string = '';

  public state = ModalState.Unchanged;


  public elements: LabBookElementClonePayload[] = [];

  public note_map: Map<string, [string, string]> = new Map();

  public picture_map: Map<string, Map<string, Blob | string>> = new Map();

  public file_map: Map<string, Map<string, Blob | string>> = new Map();

  public first_run_promises: Promise<Picture | File | Note>[] = [];

  public second_run_promises: Promise<LabBookElementPayload>[] = [];

  public third_run_promises: Promise<CommentPayload>[] = [];

  public old_uuid2new_uuid = new Map()


  public form = this.fb.group<FormLabBook>({
    title: this.fb.control(null, Validators.required),
    isTemplate: false,
    description: null,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly labBooksService: LabbooksService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly picturesService: PicturesService,
    private readonly filesService: FilesService,
    private readonly notesService: NotesService,
    private readonly commentService: CommentsService,
  ) {
  }

  public get f() {
    return this.form.controls;
  }

  public get labBook(): any {
    return {
      title: this.f.title.value,
      is_template: this.f.isTemplate.value,
      description: this.f.description.value ?? '',
    };
  }

  public ngOnInit(): void {
    this.initSearchInput();
    this.patchFormValues();
  }

  public initSearchInput(): void {

  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue(
        {
          title: this.initialState.title,
          isTemplate: this.initialState.is_template,
          description: this.initialState.description,
        },
        {emitEvent: false}
      );

    }
  }


  public get file_f() {
    return this.file_form.controls;
  }

  public file_form = this.fb.group<FormFile>({
    name: null,
    file: this.fb.control(null, Validators.required),
  });

  public filePlaceholder = this.translocoService.translate('file.newModal.file.placeholder');


  public onUpload(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files?.length) return;

    const button = document.getElementById('proceed_button');
    if (button) button.style.display = 'inline';

    Array.from(files).forEach(file => {
      this.filePlaceholder = file.name;
      JSZip.loadAsync(file).then(
        zip => {
          zip.forEach((relativePath, zipEntry) => {

            // skip directories
            if (zipEntry.dir) return;

            const path: string[]    = zipEntry.name.split('/');
            const is_info = zipEntry.name.endsWith('info.json');
            const is_pic  = zipEntry.name.startsWith('pictures/');
            const is_file = zipEntry.name.startsWith('files/');

            // handle outer layer json
            if (path[0].endsWith('.json')) {

              if (this.elements.length) {
                throw new Error(`Multiple elememnt json`);
              }

              zipEntry.async('string').then(data => {
                const zip_structure: any[] = JSON.parse(data);

                // handle notes objects
                const note_objs = zip_structure.filter(obj => obj.child_object_content_type_model === 'shared_elements.note');
                note_objs.forEach(obj => {
                  if (!obj.child_object_id || !obj.child_object?.subject || !obj.child_object?.content) {
                      throw new Error(`Invalid note object: Missing required fields in ${JSON.stringify(obj)}`);
                  }
                  this.note_map.set(obj.child_object_id, [obj.child_object.subject, obj.child_object.content]);
                });

                // handle elements
                zip_structure.forEach((obj) => this.elements.push(obj as LabBookElementClonePayload));
              });

            } else if (path.length != 3) {
              throw new Error(`Invalid ZIP entry: Path '${zipEntry.name}' incompatible`)

            // handle picture entries
            } else if (is_pic) {

              if (!(['bi.png', 'ri.png', 'shapes.json', 'info.json'].includes(path[2]))) {
                throw new Error(`Invalid ZIP entry: incorrect picture elememnt`)
              }
              const key = path[1];
              const mapEntry = this.picture_map.get(key) || new Map<string, string | Blob>;
              this.picture_map.set(key, mapEntry);
              zipEntry.async(is_info ? 'string' : 'blob').then(data => {
                mapEntry.set(path[2], data);
              });

            // handle file entries
            } else if (is_file) {
              const key = path[1];
              const mapEntry = this.file_map.get(key) || new Map<string, string | Blob>;
              this.file_map.set(key, mapEntry);
              zipEntry.async(is_info ? 'string' : 'blob').then(data => {
                mapEntry.set(is_info ? "info" : "path", data);
              });
            }
          });
        },
        error => {
          this.toastrService.error('Invalid Zip File');
          const button = document.getElementById('proceed_button');
          if (button) button.style.display = 'none';
        }
      );
    });

  }


  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.labBooksService
      .add(this.labBook)
      .pipe(untilDestroyed(this))
      .subscribe(
        labBook => {
          this.state = ModalState.Changed;
          if (labBook) {
            this.new_labbook_pk = labBook.pk
            this.loading = false;
            this.cdr.markForCheck();
            this.toastrService.success('New Labbook created');
          } else {
            this.toastrService.error('Labbook could not be created');
            this.modalRef.close();
          }
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onZipProceed(): void {

    if (!this.elements.length) {
      this.toastrService.error('Failed to upload Labbook');
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.picture_map.forEach((pic, key) => {
      this.clone_picture({
        background_image: pic.get('bi.png') as Blob,
        shapes_image: pic.get('shapes.json') as Blob,
        rendered_image: pic.get('ri.png') as Blob,
        info: pic.get('info.json') as string
      }, key)
    })


    this.file_map.forEach((file, key) => {
      this.clone_file({
        path: file.get('path') as Blob,
        info: file.get('info') as string,
      }, key)
    })

    this.note_map.forEach((note, key) => {
      this.clone_note({
        subject: note[0],
        content: note[1]
      }, key)
    })


    // upload note, file, picture, then create LabBookElement
    Promise.all(this.first_run_promises).then(() => {

      this.elements.forEach(elem => {

        elem.child_object_id = this.old_uuid2new_uuid.get(elem.child_object_id);
        this.clone_element(elem);
      });

      // upload LabBookElement, then create comment
      return Promise.all(this.second_run_promises);
    })
    .then(() => {

        this.elements.forEach(elem => {

          if (elem.comments) {
            elem.comments.forEach(com => {
              this.clone_comment({
                'relates_to_content_type_id': elem.child_object_content_type,
                'relates_to_pk': elem.child_object_id,
                'content': com,
              });
            });
          }
        })

        return Promise.all(this.third_run_promises);
    })
    .then(() => {
          this.toastrService.success('Labbook uploaded');
          this.modalRef.close();
    })
    .catch((error) => {
      this.toastrService.error('Failed to upload Labbook');
      this.loading = false;
      this.cdr.markForCheck();
    });
  }


  public clone_picture(cloned_picture: PictureClonePayload, key: string): void {
    this.first_run_promises.push(new Promise((resolve, reject) => {
      this.picturesService
        .clone(cloned_picture)
        .pipe(untilDestroyed(this))
        .subscribe(
          picture => {
            resolve(picture)
            if (picture) {
              this.old_uuid2new_uuid.set(key, picture.pk)
            }
          },
          () => {
          }
        );

    }))
  }

  public clone_file(cloned_file: FileClonePayload, key: string): void {
    this.first_run_promises.push(new Promise((resolve, reject) => {
      this.filesService
        .clone(cloned_file)
        .pipe(untilDestroyed(this))
        .subscribe(
          file => {
            resolve(file)
            if (file) {
              this.old_uuid2new_uuid.set(key, file.pk)
            }
          },
          () => {
          }
        );
    }))
  }

  public clone_note(cloned_note: NotePayload, key: string): void {
    this.first_run_promises.push(new Promise((resolve) => {
      this.notesService
        .add(cloned_note)
        .pipe(untilDestroyed(this))
        .subscribe(
          note => {
            resolve(note)
            if (note) {
              this.old_uuid2new_uuid.set(key, note.pk)
            }
          },
          () => {
          }
        );
    }))
  }

  public clone_element(cloned_element: LabBookElementPayload): void {
    this.second_run_promises.push(new Promise((resolve) => {
      this.labBooksService
        .addElement(this.new_labbook_pk, cloned_element)
        .pipe(untilDestroyed(this))
        .subscribe(
          elem => {
            resolve(elem)
          },
          () => {
          }
        );
    }))
  }

  public clone_comment(cloned_comment: CommentPayload): void {
    this.third_run_promises.push(new Promise((resolve) => {
      this.
        commentService.add(cloned_comment)
        .pipe(untilDestroyed(this))
        .subscribe(
          com => {
            resolve(com)
          },
          () => {
          }
        );
    }))
  }

}

