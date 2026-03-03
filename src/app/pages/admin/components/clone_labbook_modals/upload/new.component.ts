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
  LabBook,
  LabBookElementClonePayload,
  LabBookElementPayload,
  Note,
  NotePayload,
  Picture,
} from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import JSZip from 'jszip';
import {Gzip} from "fflate";


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

  file_zipPromises: Promise<void>[] = [];
  pic_zipPromises: Promise<void>[] = [];

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
                  if (!obj.child_object_id || !obj.child_object?.subject) {
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

              if (!(['bi.png', 'info.json'].includes(path[2]))) {
                throw new Error(`Invalid ZIP entry: incorrect picture elememnt`)
              }
              const key = path[1];
              const mapEntry = this.picture_map.get(key) || new Map<string, string | Blob>;
              this.picture_map.set(key, mapEntry);
              const p = zipEntry.async(is_info ? 'string' : 'blob').then(data => {
                mapEntry.set(path[2], data);
              });
              this.pic_zipPromises.push(p);

              // handle file entries
            } else if (is_file) {
              const key = path[1];
              const mapEntry = this.file_map.get(key) || new Map<string, string | Blob>();
              this.file_map.set(key, mapEntry);
              const p = zipEntry.async(is_info ? 'string' : 'blob').then(data => {
                mapEntry.set(is_info ? 'info' : 'path', data);
              });
              this.file_zipPromises.push(p);
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

  public async onZipProceed(): Promise<void> {

    await Promise.all(this.file_zipPromises);
    await Promise.all(this.pic_zipPromises);

    if (!this.elements.length) {
      this.toastrService.error('Labbook upload failed. Please try again — it may contain too many elements.');
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    const filePromises: Promise<any>[] = [];

    for (const [key, file] of this.file_map.entries()) {
      const infoText = file.get('info') as string;
      const compressedInfo = this.compressJson(infoText);

      filePromises.push(
        this.clone_file({
          path: file.get('path') as Blob,
          info: compressedInfo
        }, key)
      );
    }

    await Promise.all(filePromises);


    for (const [key, pic] of this.picture_map.entries()) {
      const infoText = pic.get('info.json') as string;
      const compressedInfo = this.compressJson(infoText);

      await this.clone_picture({
        background_image: pic.get('bi.png') as Blob,
        info: compressedInfo
      }, key);
    }

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

  public compressJson(json: string): Blob {
    const encoder = new TextEncoder();
    const chunks: Uint8Array<any>[] = [];
    const gzip = new Gzip((chunk) => {
      chunks.push(chunk);
    });
    gzip.push(encoder.encode(json), true); // true = finalize
    return new Blob(chunks, {type: "application/gzip"});
  }



  public async clone_picture(cloned_picture: { background_image: Blob, info: Blob }, key: string): Promise<Picture> {
    const background_image_b64 = await this.blobToBase64(cloned_picture.background_image);
    const info_gzip_b64 = await this.blobToBase64(cloned_picture.info);

    const payload = {
      background_image_b64,
      info_gzip_b64
    };

    const p = new Promise<Picture>((resolve, reject) => {
      this.picturesService
        .clone(payload)
        .pipe(untilDestroyed(this))
        .subscribe(
          picture => {
            this.old_uuid2new_uuid.set(key, picture.pk);
            resolve(picture);
          },
          error => reject(error)
        );
    });

    this.first_run_promises.push(p);
    return p;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }


  public async clone_file(cloned_file: { path: Blob, info: Blob }, key: string): Promise<File> {
    const path_b64 = await this.blobToBase64(cloned_file.path);
    const info_gzip_b64 = await this.blobToBase64(cloned_file.info);

    const payload = {
      path_b64,
      info_gzip_b64
    };

    const p = new Promise<File>((resolve, reject) => {
      this.filesService
        .clone(payload)
        .pipe(untilDestroyed(this))
        .subscribe(
          file => {
            this.old_uuid2new_uuid.set(key, file.pk);
            resolve(file);
          },
          error => reject(error)
        );
    });

    this.first_run_promises.push(p);
    return p;
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

