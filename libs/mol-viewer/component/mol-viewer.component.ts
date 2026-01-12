import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

declare var $3Dmol: any; // Declare global 3Dmol object

interface Atom {
  elem: string;
  x: number;
  y: number;
  z: number;

  [key: string]: any; // allow extra fields
}

interface Viewer {
  addLabel(text: string, options: any): void;

  removeAllLabels(): void;

  render(): void;

  zoomTo(sel?: any): void;

  setStyle(sel: any, style: any): void;

  addSurface(
    type: number,
    style: any,
    selection?: any,
    surfaceCallback?: (surf: any) => void
  ): void;

  addModel(data: string, format: string): any;

  removeAllModels(): void;

  setClickable(
    sel: any,
    clickable: boolean,
    onClick: (atom: Atom, viewer: Viewer) => void
  ): void;

  resize(): void;

  setDimensions(width: number, height: number): void;
}


@Component({
  selector: 'app-mol-viewer',
  templateUrl: './mol-viewer.component.html',
  styleUrls: ['./mol-viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})

export class MolViewerComponent implements AfterViewInit, OnChanges {

  constructor(
    private elementRef: ElementRef,
    private readonly cdr: ChangeDetectorRef,
  ) {
  }

  @Input() plotContent: string = '';
  @Input() model: string = '';
  @ViewChild('molCanvas', {static: false}) molCanvas!: ElementRef<HTMLDivElement>;

  errorDisplay: boolean = false;

  private viewer: Viewer | null = null;
  private backgroundColor = '#fafaf7'

  viewerStyles = ['Stick', 'Line', 'Cross', 'Sphere'];
  viewerStylesSelected = 'Stick';

  async ngAfterViewInit(): Promise<void> {
    const element = this.molCanvas.nativeElement;
    this.viewer = $3Dmol.createViewer(element, {backgroundColor: this.backgroundColor});

    if (this.plotContent && this.model) {
      try {
        this.loadAndRenderModel(this.plotContent, this.model);
      } catch (error) {
        this.errorDisplay = true;
        this.cdr.detectChanges();
      }
    }
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if ((changes['plotContent'] || changes['model']) && this.viewer) {
      this.loadAndRenderModel(this.plotContent, this.model);
    }
  }

  private loadAndRenderModel(data: string, format: string): void {
    if (!this.viewer) return;
    this.viewer.removeAllModels();
    this.viewer.removeAllLabels();

    this.viewer.addModel(data, format);

    if (format === 'pdb' || format === 'cif') {
      this.viewer.setStyle({}, {
        cartoon: {color: 'spectrum'},
        stick: {}
      });
    } else if (format === 'xyz') {
      this.viewer.setStyle({}, {sphere: {radius: 0.3}, stick: {radius: 0.2}});
    }

    let atomClicked = false;

    this.viewer!.setClickable({}, true, (atom: Atom, viewer: Viewer) => {
      atomClicked = true
      viewer.removeAllLabels();
      viewer.addLabel(
        `${atom.elem} (${atom.x.toFixed(2)}, ${atom.y.toFixed(2)}, ${atom.z.toFixed(2)})`,
        {
          position: {x: atom.x, y: atom.y, z: atom.z},
          backgroundColor: 'white',
          fontColor: 'black',
          fontSize: 12
        }
      );
      viewer.render();
    });

    this.viewer.zoomTo();
    this.viewer.render();
  }

  // Listen for clicks anywhere in the document
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.viewer) return;
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.viewer.removeAllLabels();
      this.viewer.render();
    }
  }

  onChangeStyle() {
    if (!this.viewer) return;

    switch(this.viewerStylesSelected) {
      case "Stick":
        this.viewer.setStyle({}, {
          stick: {}
        });
        break;

      case "Line":
        this.viewer.setStyle({}, {
          line: {}
        });
        break;

      case "Cross":
        this.viewer.setStyle({}, {
          cross: {
            linewidth: 2
          }
        });
        break;

      case "Sphere":
        this.viewer.setStyle({}, {
          sphere: {}
        });
        break;

      default:
        break;
    }
    this.viewer.removeAllLabels();
    this.viewer.render();
  }

}



