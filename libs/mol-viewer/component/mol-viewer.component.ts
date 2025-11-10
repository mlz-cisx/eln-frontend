import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
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
  standalone: true
})

export class MolViewerComponent implements AfterViewInit, OnChanges {

  constructor(private elementRef: ElementRef) {
  }

  @Input() plotContent: string = '';
  @Input() model: string = '';
  @ViewChild('molCanvas', {static: false}) molCanvas!: ElementRef<HTMLDivElement>;

  private viewer: Viewer | null = null;
  private backgroundColor = '#fafaf7'

  async ngAfterViewInit(): Promise<void> {
    const element = this.molCanvas.nativeElement;
    this.viewer = $3Dmol.createViewer(element, {backgroundColor: this.backgroundColor});

    if (this.plotContent && this.model) {
      this.loadAndRenderModel(this.plotContent, this.model);
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
        stick: {radius: 0.2}
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

}



