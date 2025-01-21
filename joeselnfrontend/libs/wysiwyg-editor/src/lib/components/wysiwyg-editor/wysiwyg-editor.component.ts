import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  Self,
  ViewChild
} from '@angular/core';
import {ControlValueAccessor, NgControl} from '@angular/forms';
import {EditorComponent} from '@tinymce/tinymce-angular';

@Component({
  selector: 'eworkbench-wysiwyg-editor',
  templateUrl: './wysiwyg-editor.component.html',
  styleUrls: ['./wysiwyg-editor.component.scss'],
})
export class WysiwygEditorComponent implements ControlValueAccessor, OnInit, AfterViewInit {
  @Input()
  public id!: string;

  @Input()
  public maxHeight: number | undefined = 500;

  public init = {
    base_url: '/tinymce',
    suffix: '.min',
    branding: false,
    promotion: false,
    max_height: this.maxHeight,
    plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons accordion',
    menubar: 'file edit view insert format tools table help',
    toolbar: "undo redo | accordion accordionremove | blocks fontfamily fontsize | bold italic underline strikethrough | align numlist bullist | link image | table media | lineheight outdent indent| forecolor backcolor removeformat | charmap emoticons | code fullscreen preview | save print | pagebreak anchor codesample | ltr rtl",
    quickbars_selection_toolbar:
      'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
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

  @Input()
  public disabled?: boolean = false;

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

  public constructor(@Self() public readonly ngControl: NgControl, private readonly cdr: ChangeDetectorRef) {
    ngControl.valueAccessor = this;
  }

  public ngOnInit(): void {
    this.init.max_height = this.maxHeight;
    // this.init.inline = true;
  }

  public ngAfterViewInit(): void {
    this.ngControl.valueChanges?.subscribe(() => {
      this.cdr.markForCheck();
    });

    // this.editor?.editor.mode.set(this.disabled ? 'readonly' : 'design');
  }

  public writeValue(value: string | null): void {
    if (this.ngControl.value !== value) {
      this.onChanged(value);
    }
  }

  public mypageload(): void {
    console.log('nearly loaded')
  }

  public registerOnChange(fn: any): void {
    this.onChanged = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

