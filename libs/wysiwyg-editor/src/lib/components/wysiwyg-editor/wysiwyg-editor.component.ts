import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  Self,
  ViewChild
} from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import {ControlValueAccessor, NgControl} from '@angular/forms';
import {EditorComponent} from '@tinymce/tinymce-angular';


@Component({
  selector: 'mlzeln-wysiwyg-editor',
  templateUrl: './wysiwyg-editor.component.html',
  styleUrls: ['./wysiwyg-editor.component.scss'],
})
export class WysiwygEditorComponent implements ControlValueAccessor, OnInit, AfterViewInit {
  @Input()
  public id!: string;

  @Input()
  public maxHeight: number | undefined = 500;
  @Input()
  public actual_height:  number | undefined = 500;

  public init = {
    base_url: '/tinymce',
    suffix: '.min',
    branding: false,
    promotion: false,
    license_key: 'gpl',
    max_height: this.maxHeight,
    height: this.actual_height,
    plugins: 'preview importcss searchreplace autolink autosave  directionality code visualblocks visualchars image link  codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap emoticons accordion',
    menubar: 'file edit view insert format tools table help',
    toolbar: "undo redo | accordion accordionremove | blocks fontfamily fontsize | bold italic underline strikethrough | align numlist bullist | link image | table | lineheight outdent indent| forecolor backcolor removeformat | charmap emoticons | code  preview | print | pagebreak anchor codesample | ltr rtl",
    quickbars_selection_toolbar: false,
    contextmenu: '',
    content_css: '/assets/styles/tinymce.css',
    content_style: 'img{max-width:90%;height:auto; margin-top: 10px}',
    highlight_on_focus: false,
    autosave_ask_before_unload: false,
    powerpaste_allow_local_images: true,
    file_picker_callback: (cb: any) => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');

      input.onchange = () => {
        if (input.files) {
          const file: File = input.files[0];

          const reader = new FileReader();
          reader.onload = () => {
            const id = `blobid${new Date().getTime()}`;
            const blobCache = this.editor?.editor.editorUpload.blobCache;
            if (reader.result) {
              const base64 = (reader.result as string).split(',')[1];
              const blobInfo = blobCache?.create(id, file, base64);

              if (blobInfo) {
                blobCache?.add(blobInfo);
                cb(blobInfo.blobUri(), {title: file.name});
              }
            }
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    },
  };

  @Input()
  public initialValue?: string;

  @Input()
  public inline?: boolean = false;

  private disabledSubject = new BehaviorSubject<boolean>(false);
  public disabled$ = this.disabledSubject.asObservable();
  @Input()
  set disabled(value: boolean) {
    this.disabledSubject.next(value);
  }

  @Input()
  public tagName?: string = 'div';

  @Input()
  public plugins?: string;

  @Input()
  public toolbar?: string | string[];

  @ViewChild(EditorComponent)
  public editor?: EditorComponent;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public onChanged: any = () => {
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public onTouched: any = () => {
  };

  private destroy$ = new Subject<void>();

  public constructor(@Self() public readonly ngControl: NgControl, private readonly cdr: ChangeDetectorRef) {
    ngControl.valueAccessor = this;
  }

  public ngOnInit(): void {
    this.init.max_height = this.maxHeight;
    this.init.height = this.actual_height;
  }

  public ngAfterViewInit(): void {
    this.ngControl.valueChanges?.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.writeValue(this.ngControl.value)
    });
    this.editor?.editor.mode.set(this.disabledSubject.value ? 'readonly' : 'design');
  }

  ngOnDestroy() {
     this.destroy$.next();
     this.destroy$.complete();
  }

  public writeValue(value: string): void {
    if (this.editor && this.editor.editor.initialized) {
      const cursor = this.editor.editor.selection.getBookmark(3) as any
      if (cursor['start'] && cursor['start'].startsWith('text()')) {
        // do nothing because the cursor initially jumps back to first line with 'text()'
        // while pasting in text from outside; moving to this bookmark after set content
        // creates this cursor jump which should be avoided;
        // if you paste in text from inside the editor or write text by keyboard
        // the cursor starts with a paragraph tag created by TMCE like
        // 'p[element_index]/text()[element_index]'
      } else {
        this.editor.editor.setContent(value);
        this.editor.editor.selection.moveToBookmark(cursor);
      }
    } else {
      this.initialValue = value === null ? undefined : value;
    }
  }

  public mypageload(): void {

  }

  public registerOnChange(fn: any): void {
    this.onChanged = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

}

