import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import {Validators} from '@angular/forms';
import {ModalState} from '@app/enums/modal-state.enum';
import {FilesService, LabbooksService, UserService} from '@joeseln/services';
import type {
  File,
  LabBook,
  LabBookElementPayload,
  PageEntry,
  PageList,
} from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@jsverse/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import JSZip from 'jszip';
import {Subject} from "rxjs";


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
  selector: 'mlzeln-new-labbook-lxf-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class UploadLabBookLxfModalComponent implements OnInit {
  public initialState?: LabBook = this.modalRef.data?.initialState;

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public duplicate?: string = this.modalRef.data?.duplicate;

  public loading = false;

  public new_labbook_pk: string = '';

  public state = ModalState.Unchanged;

  public file_map: Map<string, Map<string, Blob | string>> = new Map();


  public form = this.fb.group<FormLabBook>({
    title: this.fb.control(null, Validators.required),
    isTemplate: false,
    description: null,
  });
  public file_form = this.fb.group<FormFile>({
    name: null,
    file: this.fb.control(null, Validators.required),
  });
  public filePlaceholder = this.translocoService.translate('file.newModal.file.placeholder');
  file_zipPromises: Promise<void>[] = [];
  element_Promises: Promise<void>[] = [];
  public elements: PageEntry[] = [];
  private unsubscribe$ = new Subject<void>();

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly labBooksService: LabbooksService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly filesService: FilesService,
    private _user: UserService,
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

  public get file_f() {
    return this.file_form.controls;
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

            const path: string[] = zipEntry.name.split('/');
            const is_file = zipEntry.name.startsWith('pages/');

            // handle outer layer json
            if (path[0].endsWith('manifest.json')) {

              if (this.elements.length) {
                throw new Error(`Multiple element json`);
              }

              const p = zipEntry.async('string').then(data => {
                const zip_structure: PageList = JSON.parse(data)
                zip_structure.pages.forEach((obj) => this.elements.push(obj as PageEntry));
              });
              this.element_Promises.push(p);

            } else if (is_file) {
              const key = path[1].replace(/.pdf$/, "")
              const mapEntry = this.file_map.get(key) || new Map<string, string | Blob>();
              this.file_map.set(key, mapEntry);
              const p = zipEntry.async('blob').then(data => {
                mapEntry.set('content', data);
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
    await Promise.all(this.element_Promises);

    const clonePromises = this.elements.map((entry, index) => {
      const title =
        entry.title && entry.title.trim().length > 0
          ? entry.title
          : `Element ${index}`;

      const created_at =
        entry.created_at && entry.created_at.trim().length > 0
          ? entry.created_at
          : new Date().toISOString();

      const info = {
        uuid: entry.uuid,
        title,
        created_at,
      };

      return this.clone_lxf_file({
        path: this.file_map.get(entry.uuid)?.get('content') as Blob,
        info: JSON.stringify(info)
      });
    });

    // Wait for all clone operations to finish
    const results = await Promise.allSettled(clonePromises);
    const hasError = results.some(r => r.status === "rejected");

    if (hasError) {
      this.toastrService.error("Some files could not be imported..");
      this.loading = false;
      this.cdr.markForCheck();
    } else {
      this.toastrService.success("All files imported successfully!");
      this.modalRef.close();
    }

  }

  public async clone_lxf_file(cloned_file: { path: Blob, info: string }): Promise<File> {
    const path_b64 = await this.blobToBase64(cloned_file.path);

    const payload = {
      path_b64,
      info: cloned_file.info
    };

    return new Promise<File>((resolve, reject) => {
      this.filesService
        .lxf_clone(payload)
        .pipe(untilDestroyed(this))
        .subscribe(
          async file => {
            try {
              await this.createElement(50, file.pk);
              resolve(file);
            } catch (err) {
              reject(err);
            }
          },
          error => reject(error)
        );
    });
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

  private createElement(child_object_content_type: number, child_object_id: string, width: number = 10, height: number = 15): Promise<any> {
    if (!this.new_labbook_pk) return Promise.resolve(null);
    const elem: LabBookElementPayload = {
      child_object_content_type: child_object_content_type,
      child_object_id: child_object_id,
      width: width,
      height: height,
    }
    return new Promise((resolve, reject) => {
      this.labBooksService
        .addElementBottom(this.new_labbook_pk, elem)
        .subscribe(resolve, reject);
    });
  }

}

