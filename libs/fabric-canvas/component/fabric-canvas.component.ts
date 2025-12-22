import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import * as fabric from 'fabric';
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {HttpClient} from "@angular/common/http";
import {debounceTime, Subject} from 'rxjs';
import {FaIconComponent, FaIconLibrary} from '@fortawesome/angular-fontawesome';
import {fas} from '@fortawesome/free-solid-svg-icons';
import {PicturesService, WebSocketService} from "@app/services";
import {PicturePayload} from "@joeseln/types";
import {v4 as uuidv4} from 'uuid';
import {ToastrService} from "ngx-toastr";
import {TranslocoService} from '@jsverse/transloco';
import * as pdfjsLib from "pdfjs-dist";
import {environment} from "@environments/environment";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;


@Component({
  selector: 'app-fabric-canvas',
  templateUrl: './fabric-canvas.component.html',
  styleUrls: ['./fabric-canvas.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent]
})
export class FabricCanvasComponent implements AfterViewInit {


  constructor(private cdr: ChangeDetectorRef,
              private http: HttpClient,
              private library: FaIconLibrary,
              public readonly picturesService: PicturesService,
              private readonly websocketService: WebSocketService,
              private eRef: ElementRef,
              private readonly toastrService: ToastrService,
              private readonly translocoService: TranslocoService,
  ) {
    this.storeSubject.pipe(debounceTime(10)).subscribe(() => {
      this.onSubmit()
    });
    library.addIconPacks(fas);
  }


  @ViewChild('fabricCanvas', {static: true}) canvasElement!: ElementRef<HTMLCanvasElement>;

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    if (this.showConfirm && !this.eRef.nativeElement.contains(event.target)) {
      this.showConfirm = false;
    }
  }

  @Input() backgroundUrl: string | null = null;
  @Input() uuid!: string;
  @Input() editor_loaded = false;
  @Input() allowSelection = false;
  @Input() canvasContent: any;   // JSON or stringified Fabric canvas
  @Input() preview = false;      // render small if true
  @Input() viewerMode = true

  @Output() canvasStored = new EventEmitter<string>();

  public readonly BASE_WIDTH: number = 1000;
  public readonly BASE_HEIGHT: number = 750;


  private storeSubject = new Subject<string>();

  canvas!: fabric.Canvas;
  backgroundImages: fabric.Image[] = [];
  backgroundEditable = true;

  fontSize: number = 20;

  background_color = '#F8F8FF';

  zoomScale = 1;   // default 100%, parent can override


  fontFamily = 'Arial';

  clientId = uuidv4();


  penSize = 2;
  penColor = '#000000';
  isDrawing = false;

  drawingMode: 'rectangle' | 'circle' | 'text' | null = null;
  tempShape: fabric.Object | null = null;
  startPoint: { x: number; y: number } | null = null;

  pointModeActive = false;

  points: { x: number; y: number }[] = [];
  shapeType: 'polyline' | 'polygon' | 'arrow' = 'polyline';
  vertexCircles: fabric.Circle[] = [];




  fillColor: string = '#ffffff';   // default white
  strokeColor: string = '#000000'; // default black
  strokeWidth: number = 1;

  public async restoreCanvasContent(): Promise<void> {
    await this.loadCanvasFromJson();
    this.viewerMode = true;
    this.setViewerMode(this.viewerMode);
  }

  async ngAfterViewInit(): Promise<void> {
    this.canvas = new fabric.Canvas(this.canvasElement.nativeElement, {
      backgroundColor: this.background_color,
      width: this.BASE_WIDTH,
      height: this.BASE_HEIGHT
    });


    if (this.canvasContent) {
      const json = typeof this.canvasContent === 'string'
        ? JSON.parse(this.canvasContent)
        : this.canvasContent;
      await this.canvas.loadFromJSON(json);
      this.canvas.renderAll();
      const objs = this.canvas.getObjects();

      if (this.preview) {
        const scale = 0.25; // shrink to 25%
        this.canvas.setZoom(scale);
        // Optionally resize the canvas element itself
        this.canvas.setWidth(this.BASE_WIDTH * scale);
        this.canvas.setHeight(this.BASE_HEIGHT * scale);
        // disable all interactions
        this.canvas.selection = false;

        this.canvas.forEachObject(obj => {
          obj.selectable = false;
          obj.evented = false;
          obj.hasControls = false;
        });
        this.canvas.discardActiveObject();
        this.canvas.renderAll();

      }

    } else {
      // Set up free drawing brush
      this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
      this.updatePenSettings();
      this.bindEvents()


      await this.loadCanvasFromJson();

      const objs = this.canvas.getObjects();
      objs.forEach(obj => {
        obj.set({
          selectable: this.allowSelection,
          evented: this.allowSelection,
          hasControls: this.allowSelection
        });

        if ((obj as any).alwaysOnTop) {
          const idx = this.canvas._objects.indexOf(obj);
          if (idx > -1) {
            this.canvas._objects.splice(idx, 1);
            this.canvas._objects.push(obj); // put at end (top of stack)
          }
        }
      });
      this.canvas.selection = false;
      this.canvas.discardActiveObject();
      this.canvas.renderAll();

      this.websocketService.elements.pipe().subscribe(async (data: any) => {
        if (data.model_pk === this.uuid) {
          if (data.model_name === 'picture_title' || data.model_name === 'comments') {
            return
          }
          if (data.origin === this.clientId) return;
          await this.loadCanvasFromJson()
          const objs = this.canvas.getObjects();
          objs.forEach(obj => {
            obj.set({
              selectable: false,
              evented: false,
              hasControls: false
            });

            if ((obj as any).alwaysOnTop) {
              const idx = this.canvas._objects.indexOf(obj);
              if (idx > -1) {
                this.canvas._objects.splice(idx, 1);
                this.canvas._objects.push(obj); // put at end (top of stack)
              }
            }
          });
          this.canvas.selection = false;
          this.canvas.discardActiveObject();
          this.canvas.renderAll();
        }
      })
    }

  }

  /** Public method to resize canvas based on zoom scale */
  public setCanvasSize(width: number): void {
    this.zoomScale = 0.95 * width / this.BASE_WIDTH;
    this.applyZoom(this.zoomScale);
  }

  private applyZoom(scale: number): void {
    // resize physical canvas
    this.canvas.setWidth(this.BASE_WIDTH * scale);
    this.canvas.setHeight(this.BASE_HEIGHT * scale);

    // zoom logical coordinate system
    this.canvas.setZoom(scale);

    // disable interactions in preview mode
    if (this.preview) {
      this.canvas.selection = false;
      this.canvas.forEachObject(obj => {
        obj.selectable = false;
        obj.evented = false;
        obj.hasControls = false;
      });
      this.canvas.discardActiveObject();
    }

    this.canvas.renderAll();
  }


  private loadContent(content: any): void {
    const json = typeof content === 'string' ? JSON.parse(content) : content;
    this.canvas.loadFromJSON(json, () => {
      this.canvas.renderAll();
    });
  }

  exportAsImage(title: any): void {
    const exportWidth = this.BASE_WIDTH;
    const exportHeight = this.BASE_HEIGHT;

    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();

    const scaleX = exportWidth / canvasWidth;
    const scaleY = exportHeight / canvasHeight;
    const scale = Math.min(scaleX, scaleY);

    // Save original transforms
    this.canvas.getObjects().forEach(obj => {
      obj.scaleX! *= scale;
      obj.scaleY! *= scale;
      obj.left! *= scale;
      obj.top! *= scale;
      obj.setCoords();
    });

    this.canvas.renderAll();

    // Export with target size
    const dataUrl = this.canvas.toDataURL({
      format: 'png',
      quality: 1,
      width: exportWidth,
      height: exportHeight,
      multiplier: 1
    });

    // Restore original transforms
    this.canvas.getObjects().forEach(obj => {
      obj.scaleX! /= scale;
      obj.scaleY! /= scale;
      obj.left! /= scale;
      obj.top! /= scale;
      obj.setCoords();
    });

    this.canvas.setWidth(canvasWidth);
    this.canvas.setHeight(canvasHeight);
    this.canvas.renderAll();

    // Trigger download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = title;
    link.click();
  }

public bringToFrontAndSubmit(): void {
  const activeObj = this.canvas.getActiveObject();
  this.canvas.getObjects().forEach(obj => {
    (obj as any).alwaysOnTop = false;
  });

  if (activeObj) {
    (activeObj as any).alwaysOnTop = true;
    // manually move to end of stack
    const idx = this.canvas._objects.indexOf(activeObj);
    if (idx > -1) {
      this.canvas._objects.splice(idx, 1);
      this.canvas._objects.push(activeObj);
    }
    // persist flag in JSON
    activeObj.toObject = (function (toObject) {
      return function (this: fabric.Object) {
        return {
          ...toObject.call(this),
          alwaysOnTop: (this as any).alwaysOnTop || false
        };
      };
    })(activeObj.toObject);

    this.canvas.discardActiveObject();
    this.canvas.renderAll();
    this.storeCanvas();
  }
}

  startDrawing(): void {
    this.isDrawing = true;
    this.canvas.isDrawingMode = true;
    this.canvas.selection = false;
  }

  finishDrawing(): void {
    this.isDrawing = false;
    this.canvas.isDrawingMode = false;

    // Collect all paths drawn during this session
    const paths = this.canvas.getObjects('path');

    if (paths.length > 1) {
      const group = new fabric.Group(paths, {
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true
      });

      // Remove individual paths and add the group
      paths.forEach(p => this.canvas.remove(p));
      this.canvas.add(group);
      this.canvas.setActiveObject(group);
    }

    this.canvas.selection = true;
    this.canvas.renderAll();
  }




  private syncToolbarWithSelection(e: any): void {
    const obj = e.selected[0];
    if (obj) {
      this.fillColor = obj.fill && obj.fill !== 'transparent' ? obj.fill : '#ffffff';
      this.strokeColor = obj.stroke || '#000000';
      this.strokeWidth = obj.strokeWidth || 1;

      if (obj.type === 'textbox') {
        this.fontSize = (obj as fabric.Textbox).fontSize || 20;
        this.fontFamily = (obj as fabric.Textbox).fontFamily || 'Arial';
      }

      this.cdr.detectChanges();
    }
  }

  private resetToolbarDefaults(): void {
    this.fillColor = '#ffffff';
    this.strokeColor = '#000000';
    this.strokeWidth = 1;
  }


  showConfirm = false;

  toggleConfirm(): void {
    this.showConfirm = !this.showConfirm;
  }

  confirmClear(): void {
    this.canvas.clear();
    this.canvas.backgroundColor = this.background_color;
    this.canvas.renderAll();
    this.showConfirm = false;
  }

  cancelClear(): void {
    this.showConfirm = false;
  }

  uploadBackground(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      // timeout for camera
      setTimeout(
        async () => {
          try {
            const originalDataUrl = reader.result as string;
            // create offscreen canvas

            const imgEl = new Image();
            imgEl.src = originalDataUrl;

            imgEl.onload = async () => {
              const canvasW = this.canvas.getWidth();
              const canvasH = this.canvas.getHeight();

              // original image dimensions
              const imgW = imgEl.width;
              const imgH = imgEl.height;

              // scale factor to fit inside canvas while preserving ratio
              const scale = Math.min(canvasW / imgW, canvasH / imgH);

              const drawW = imgW * scale;
              const drawH = imgH * scale;

              // center the image
              const offsetX = (canvasW - drawW) / 2;
              const offsetY = (canvasH - drawH) / 2;

              // offscreen canvas
              const offCanvas = document.createElement('canvas');
              const ctx = offCanvas.getContext('2d')!;
              offCanvas.width = canvasW;
              offCanvas.height = canvasH;

              ctx.clearRect(0, 0, canvasW, canvasH);
              ctx.drawImage(imgEl, offsetX, offsetY, drawW, drawH);

              const compressedDataUrl = offCanvas.toDataURL('image/png');

              const fabricImg = await this.loadImage(compressedDataUrl);


              // center in Fabric canvas
              fabricImg.set({
                left: offsetX,
                top: offsetY,
                originX: 'left',
                originY: 'top',
                selectable: false,
                evented: false,
                hasControls: false
              });

              this.backgroundImages.push(fabricImg);
              this.canvas.add(fabricImg);
              this.canvas.sendObjectBackwards(fabricImg, true);
              this.setBackgroundEditMode(this.backgroundEditable);
              this.canvas.renderAll();
            };
          } catch (err) {
            console.error(err);
          }
        }, 50
      )
    };
    reader.readAsDataURL(file);
  }


  public async uploadPdf(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    // Wrap FileReader in a Promise so we can await it
    const arrayBuffer: ArrayBuffer = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    try {
      const pdfData = new Uint8Array(arrayBuffer);

      // Load PDF
      const pdf = await pdfjsLib.getDocument({data: pdfData}).promise;

      // Render first page
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({scale: 1.5});

      // Offscreen canvas for pdf.js rendering
      const offCanvas = document.createElement("canvas");
      const ctx = offCanvas.getContext("2d")!;
      offCanvas.width = viewport.width;
      offCanvas.height = viewport.height;

      await page.render({canvasContext: ctx, viewport}).promise;

      // Convert to DataURL
      const dataUrl = offCanvas.toDataURL("image/jpeg", 0.7);

      // Await Fabric.js image creation (Promise-based API in v5+)
      const fabricImg: fabric.Image = await fabric.Image.fromURL(dataUrl);

      const canvasW = this.canvas.getWidth();
      const canvasH = this.canvas.getHeight();

      const imgW = fabricImg.width!;
      const imgH = fabricImg.height!;

      // Scale to fit
      const scale = Math.min(canvasW / imgW, canvasH / imgH);
      fabricImg.scale(scale);

      // Center
      fabricImg.set({
        left: (canvasW - imgW * scale) / 2,
        top: (canvasH - imgH * scale) / 2,
        originX: "left",
        originY: "top",
        selectable: true,
        evented: true,
        hasControls: true,
      });

      this.canvas.add(fabricImg);
      this.canvas.sendObjectBackwards(fabricImg, true);
      this.canvas.renderAll();

    } catch (err) {
      console.error("PDF render error:", err);
    }
  }

  public storeCanvas(): void {
    const json = JSON.stringify(this.canvas.toJSON());
    this.storeSubject.next(json);
  }

  async loadImage(url: string, options?: any): Promise<fabric.Image> {
    return await fabric.Image.fromURL(url, options);
  }

  toggleBackgroundEditMode(): void {
    this.backgroundEditable = !this.backgroundEditable;
    this.setBackgroundEditMode(this.backgroundEditable);
  }

  private bindEvents() {
    this.canvas.on('path:created', (opt) => {
      const path = opt.path;
      path.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true
      });
      this.canvas.setActiveObject(path);
      this.canvas.renderAll();
    });

    // Sync toolbar when selecting shapes
    this.canvas.on('selection:created', (e) => this.syncToolbarWithSelection(e));
    this.canvas.on('selection:updated', (e) => this.syncToolbarWithSelection(e));
    this.canvas.on('selection:cleared', () => this.resetToolbarDefaults());
    // In your component initialization

    this.canvas.on('mouse:down', (e) => {
      // If no target was clicked (background click)
      if (!e.target) {
        const objs = this.canvas.getObjects();
        objs.forEach(obj => {
          if ((obj as any).alwaysOnTop) {
            const idx = this.canvas._objects.indexOf(obj);
            if (idx > -1) {
              this.canvas._objects.splice(idx, 1);
              this.canvas._objects.push(obj); // move to end (top)
            }
          }
        });
        this.canvas.renderAll();
      }
    });

  }


  private setBackgroundEditMode(editable: boolean): void {
    this.backgroundImages.forEach(img => {
      img.set({
        selectable: editable,
        evented: editable,
        hasControls: editable,
        lockMovementX: !editable,
        lockMovementY: !editable,
        lockRotation: !editable,
        lockScalingX: !editable,
        lockScalingY: !editable
      });
      this.canvas.sendObjectBackwards(img, true);
    });

    // ✅ Reorder all other shapes so they stay above backgrounds
    this.canvas.getObjects().forEach(obj => {
      if (!this.backgroundImages.includes(obj as fabric.Image)) {
        this.canvas.bringObjectForward(obj, true);
      }
    });

    // If backgrounds are locked, clear any active selection
    if (!editable) {
      this.canvas.discardActiveObject();
    }

    this.canvas.renderAll();
  }


  toggleDrawingMode(mode: 'rectangle' | 'circle' | 'pencil' | null): void {
    // Reset state
    this.drawingMode = null;
    this.canvas.isDrawingMode = false;

    if (mode === 'rectangle' || mode === 'circle') {
      // Custom shape drawing handled by your mouse events
      this.drawingMode = mode;
      this.enableDrawing(); // your rectangle/circle logic
    } else if (mode === 'pencil') {
      // Fabric free‑drawing mode
      this.canvas.isDrawingMode = true;
      this.updatePenSettings(); // applies brush settings
    }
  }


  updatePenSettings(): void {
    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.width = this.penSize;
      this.canvas.freeDrawingBrush.color = this.penColor;
    }
  }

  startPointMode(): void {
    this.pointModeActive = true;
    // Clear any previous drawing mode
    this.drawingMode = null;
    this.canvas.isDrawingMode = false; // disable free-draw brush if active
    this.canvas.off('mouse:down');
    this.canvas.off('mouse:move');
    this.canvas.off('mouse:up');

    this.points = [];
    this.vertexCircles.forEach(c => this.canvas.remove(c));
    this.vertexCircles = [];

    this.canvas.on('mouse:down', (opt) => {
      const pointer = this.canvas.getPointer(opt.e);
      const point = {x: pointer.x, y: pointer.y};
      this.points.push(point);

      // Draw a draggable circle at the vertex
      const circle = new fabric.Circle({
        left: point.x,
        top: point.y,
        radius: 5,
        fill: '#FF0000',
        stroke: '#000000',
        strokeWidth: 1,
        hasControls: false,
        hasBorders: false,
        originX: 'center',
        originY: 'center'
      });

      circle.on('moving', () => {
        const idx = this.vertexCircles.indexOf(circle);
        if (idx >= 0) {
          this.points[idx] = {x: circle.left!, y: circle.top!};
          this.redrawShapePreview();
        }
      });

      this.vertexCircles.push(circle);
      this.canvas.add(circle);
      this.redrawShapePreview();
    });
  }

  finishShape(): void {
    this.pointModeActive = false;
    // Stop adding new points
    this.canvas.off('mouse:down');

    // Remove vertex circles
    this.vertexCircles.forEach(c => this.canvas.remove(c));
    this.vertexCircles = [];

    // Remove preview shape (identified by customType)
    const preview = this.canvas.getObjects().find(obj => (obj as any).customType === 'preview-shape');
    if (preview) this.canvas.remove(preview);

    if (this.points.length < 2) {
      this.canvas.renderAll();
      return;
    }

    // Create final permanent shape
    let shape: fabric.Object;
    if (this.shapeType === 'polyline') {
      shape = new fabric.Polyline(this.points, {
        fill: 'transparent',
        stroke: '#0000FF',
        strokeWidth: 2,
        selectable: true,
        evented: true
      });
    } else if (this.shapeType === 'polygon') {
      shape = new fabric.Polygon(this.points, {
        fill: '#d3fcd3',
        stroke: '#497049',
        strokeWidth: 2,
        selectable: true,
        evented: true
      });
    } else {
      // Arrow: use first two points
      const [p1, p2] = this.points;
      const line = new fabric.Line([p1.x, p1.y, p2.x, p2.y], {
        stroke: '#000000',
        strokeWidth: 2
      });
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      const head = new fabric.Triangle({
        left: p2.x,
        top: p2.y,
        originX: 'center',
        originY: 'center',
        width: 10,
        height: 15,
        fill: '#000000',
        angle: angle + 90
      });
      shape = new fabric.Group([line, head], {
        selectable: true,
        evented: true
      });

    }

    // Add final shape to canvas
    this.canvas.add(shape);
    this.canvas.sendObjectBackwards(shape, true);
    this.canvas.renderAll();

    // Reset points for next shape
    this.points = [];
  }

  isActive(mode: 'polyline' | 'polygon' | 'arrow' | 'point' | 'finish'): boolean {
    if (mode === 'polyline' || mode === 'polygon' || mode === 'arrow') {
      return this.shapeType === mode;
    }
    if (mode === 'point') {
      return this.pointModeActive; // true in startPointMode(), false in finishShape()
    }
    if (mode === 'finish') {
      return (
        !this.pointModeActive &&
        !this.drawingMode ||
        this.drawingMode === 'rectangle' ||
        this.drawingMode === 'circle'
      );
    }
    return false;
  }


  toggleShapeType(): void {
    if (this.shapeType === 'polyline') {
      this.shapeType = 'polygon';
    } else if (this.shapeType === 'polygon') {
      this.shapeType = 'arrow';
    } else {
      this.shapeType = 'polyline';
    }
    this.redrawShapePreview();
  }


  private redrawShapePreview(): void {
    // Remove only the current preview shape
    const preview = this.canvas.getObjects().find(obj => (obj as any).customType === 'preview-shape');
    if (preview) this.canvas.remove(preview);

    if (this.points.length < 2) {
      this.canvas.renderAll();
      return;
    }

    let shape: fabric.Object;
    if (this.shapeType === 'polyline') {
      shape = new fabric.Polyline(this.points, {
        fill: 'transparent',
        stroke: '#0000FF',
        strokeWidth: 2,
        selectable: false,
        evented: false
      });
    } else if (this.shapeType === 'polygon') {
      shape = new fabric.Polygon(this.points, {
        fill: '#d3fcd3',
        stroke: '#497049',
        strokeWidth: 2,
        selectable: false,
        evented: false
      });
    } else {
      const [p1, p2] = this.points;
      const line = new fabric.Line([p1.x, p1.y, p2.x, p2.y], {
        stroke: '#000000',
        strokeWidth: 2,
        selectable: false,
        evented: false
      });
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      const head = new fabric.Triangle({
        left: p2.x,
        top: p2.y,
        originX: 'center',
        originY: 'center',
        width: 10,
        height: 15,
        fill: '#000000',
        angle: angle + 90,
        selectable: false,
        evented: false
      });
      shape = new fabric.Group([line, head], {
        selectable: false,
        evented: false
      });
    }

    // Attach custom metadata
    (shape as any).customType = 'preview-shape';

    this.canvas.add(shape);
    this.canvas.sendObjectBackwards(shape, true);
    this.canvas.renderAll();
  }

  removeSelected(): void {
    const activeObject = this.canvas.getActiveObject();
    const activeGroup = this.canvas.getActiveObjects();

    if (activeGroup && activeGroup.length > 1) {
      // Remove all objects in a multi-selection
      activeGroup.forEach(obj => this.canvas.remove(obj));
      this.canvas.discardActiveObject();
    } else if (activeObject) {
      // Remove single selected object (shapes or images)
      this.canvas.remove(activeObject);

      // If you track background images separately, also update that list
      const idx = this.backgroundImages.indexOf(activeObject as fabric.Image);
      if (idx >= 0) {
        this.backgroundImages.splice(idx, 1);
      }

      this.canvas.discardActiveObject();
    }

    this.canvas.renderAll();
  }


  toggleViewerMode(): void {
    this.viewerMode = !this.viewerMode;
    this.setViewerMode(this.viewerMode);
  }

  private setViewerMode(enabled: boolean): void {
    if (enabled) {
      // Lock backgrounds too
      this.backgroundEditable = false;
      this.setBackgroundEditMode(false);

      // Finish any in-progress shape
      if (this.points.length > 1 || this.vertexCircles.length > 0) {
        this.finishShape();
      }

      // Disable editing for all objects
      this.canvas.getObjects().forEach(obj => {
        obj.set({
          selectable: false,
          evented: false,
          hasControls: false
        });
      });

      this.canvas.selection = false;
      this.canvas.discardActiveObject();
    } else {
      // Restore normal background edit state
      this.setBackgroundEditMode(this.backgroundEditable);

      // Re-enable shapes (except locked backgrounds)
      this.canvas.getObjects().forEach(obj => {
        const isBackground = this.backgroundImages.includes(obj as fabric.Image);
        obj.set({
          selectable: !isBackground,
          evented: !isBackground,
          hasControls: !isBackground
        });
      });

      this.canvas.selection = true;
    }

    this.canvas.renderAll();
  }


  startRectangleMode(): void {
    this.drawingMode = 'rectangle';
    this.enableDrawing();
  }

  startCircleMode(): void {
    this.drawingMode = 'circle';
    this.enableDrawing();
  }

  private enableDrawing(): void {
    this.canvas.off('mouse:down');
    this.canvas.off('mouse:move');
    this.canvas.off('mouse:up');

    this.canvas.on('mouse:down', (opt) => {
      const pointer = this.canvas.getPointer(opt.e);
      this.startPoint = {x: pointer.x, y: pointer.y};

      if (this.drawingMode === 'rectangle') {
        this.tempShape = new fabric.Rect({
          left: this.startPoint.x,
          top: this.startPoint.y,
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 1,
          selectable: false,
          evented: false
        });
      } else if (this.drawingMode === 'circle') {
        this.tempShape = new fabric.Circle({
          left: this.startPoint.x,
          top: this.startPoint.y,
          radius: 0,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 1,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false
        });
      }

      if (this.tempShape) {
        this.canvas.add(this.tempShape);
      }
    });

    this.canvas.on('mouse:move', (opt) => {
      if (!this.startPoint || !this.tempShape) return;
      const pointer = this.canvas.getPointer(opt.e);

      if (this.drawingMode === 'rectangle') {
        const rect = this.tempShape as fabric.Rect;
        rect.set({
          left: Math.min(this.startPoint.x, pointer.x),
          top: Math.min(this.startPoint.y, pointer.y),
          width: Math.abs(pointer.x - this.startPoint.x),
          height: Math.abs(pointer.y - this.startPoint.y)
        });
      } else if (this.drawingMode === 'circle') {
        const circle = this.tempShape as fabric.Circle;
        const radius = Math.sqrt(
          Math.pow(pointer.x - this.startPoint.x, 2) +
          Math.pow(pointer.y - this.startPoint.y, 2)
        ) / 2;
        circle.set({
          radius,
          left: (this.startPoint.x + pointer.x) / 2,
          top: (this.startPoint.y + pointer.y) / 2
        });
      }

      this.canvas.renderAll();
    });

    this.canvas.on('mouse:up', () => {
      if (this.tempShape) {
        // Make final shape selectable/editable
        this.tempShape.set({
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true
        });

        // Optional: clear preview flags if you used them
        (this.tempShape as any).customType = 'final-shape';
        // Immediately select the new shape
        this.canvas.setActiveObject(this.tempShape);
        this.tempShape = null;
      }

      this.startPoint = null;
      this.drawingMode = null;

      // Remove temporary listeners
      this.canvas.off('mouse:move');
      this.canvas.off('mouse:up');

      this.canvas.renderAll();
    });

  }

  updateFill(): void {
    const obj = this.canvas.getActiveObject();
    if (obj) {
      obj.set({fill: this.fillColor});
      this.canvas.renderAll();
    }
  }

  removeFill(): void {
    const obj = this.canvas.getActiveObject();
    if (obj) {
      obj.set({fill: 'transparent'});
      this.canvas.renderAll();
    }
  }

  updateStrokeColor(): void {
    const obj = this.canvas.getActiveObject();
    if (!obj) return;

    if (obj.type === 'group') {
      (obj as fabric.Group).getObjects().forEach(child => {
        // Line uses stroke, triangle uses fill
        if (child.type === 'line') {
          child.set({stroke: this.strokeColor});
        } else if (child.type === 'triangle') {
          child.set({fill: this.strokeColor});
        }
      });
    } else {
      obj.set({stroke: this.strokeColor});
    }

    this.canvas.renderAll();
  }

  updateStrokeWidth(): void {
    const obj = this.canvas.getActiveObject();
    if (!obj) return;

    if (obj.type === 'group') {
      (obj as fabric.Group).getObjects().forEach(child => {
        if (child.type === 'line') {
          child.set({strokeWidth: this.strokeWidth});
        }
        // optional: scale triangle size with stroke width
        if (child.type === 'triangle') {
          child.set({
            width: this.strokeWidth * 5,
            height: this.strokeWidth * 7
          });
        }
      });
    } else {
      obj.set({strokeWidth: this.strokeWidth});
    }

    this.canvas.renderAll();
  }

  startTextMode(): void {
    this.drawingMode = 'text';
    this.enableTextInsertion();
  }

  loadBackgroundFromStorage(): void {
    if (!this.backgroundUrl) return;
    fetch(this.backgroundUrl, {method: 'GET'})
      .then(response => response.blob())
      .then(blob => this.blobToBase64(blob))   // convert blob → base64
      .then(base64 => {
        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        imgEl.src = base64;
        imgEl.onload = () => {
          const canvasW = this.canvas.getWidth();
          const canvasH = this.canvas.getHeight();

          const imgW = imgEl.width;
          const imgH = imgEl.height;

          // scale factor to fit inside canvas while preserving ratio
          const scale = Math.min(canvasW / imgW, canvasH / imgH);
          const drawW = imgW * scale;
          const drawH = imgH * scale;
          // center the image
          const offsetX = (canvasW - drawW) / 2;
          const offsetY = (canvasH - drawH) / 2;
          // offscreen canvas
          const offCanvas = document.createElement('canvas');
          const ctx = offCanvas.getContext('2d')!;
          offCanvas.width = canvasW;
          offCanvas.height = canvasH;
          ctx.clearRect(0, 0, canvasW, canvasH);
          ctx.drawImage(imgEl, offsetX, offsetY, drawW, drawH);
          const compressedDataUrl = offCanvas.toDataURL('image/png');

          fabric.Image.fromURL(compressedDataUrl, {crossOrigin: 'anonymous'})
            .then((img: fabric.Image) => {
              // no need to scale again — already resized in offscreen canvas
              img.set({
                left: 0,
                top: 0,
                originX: 'left',
                originY: 'top',
                selectable: false,
                evented: false,
                hasControls: false
              });

              this.backgroundImages.push(img);
              this.canvas.add(img);
              (this.canvas as any).sendObjectBackwards(img, true);
              this.setBackgroundEditMode(true);
              this.canvas.renderAll();
            }).catch(err => {
            console.info('No background image');
          });
        };
      })
      .catch(err => {
        console.error('Failed to fetch background image:', err);
      });
  }


  updateFontFamily(): void {
    const obj = this.canvas.getActiveObject();
    if (obj && (obj.type === 'textbox' || obj.type === 'i-text')) {
      const textbox = obj as fabric.IText;

      // Apply font family only to the selected range
      textbox.setSelectionStyles(
        {fontFamily: this.fontFamily},
        textbox.selectionStart,
        textbox.selectionEnd
      );

      textbox.dirty = true; // mark object dirty so Fabric re-renders
      this.canvas.requestRenderAll();
    }
  }


  updateFontSize(): void {
    const obj = this.canvas.getActiveObject();
    if (obj && (obj.type === 'textbox' || obj.type === 'i-text')) {
      const textbox = obj as fabric.IText;

      // Apply font size only to the selected range
      textbox.setSelectionStyles(
        {fontSize: this.fontSize},
        textbox.selectionStart,
        textbox.selectionEnd
      );

      textbox.dirty = true;
      this.canvas.requestRenderAll();
    }
  }

  toggleBold(): void {
    const obj = this.canvas.getActiveObject();
    if (obj && (obj.type === 'textbox' || obj.type === 'i-text')) {
      const textbox = obj as fabric.IText;

      // Toggle bold on selected range
      textbox.setSelectionStyles(
        {fontWeight: 'bold'},
        textbox.selectionStart,
        textbox.selectionEnd
      );

      // Force re-render
      textbox.dirty = true;
      this.canvas.requestRenderAll();
    }
  }


  toggleItalic(): void {
    const obj = this.canvas.getActiveObject();
    if (obj && (obj.type === 'textbox' || obj.type === 'i-text')) {
      const textbox = obj as fabric.IText;

      textbox.setSelectionStyles(
        {fontStyle: 'italic'},
        textbox.selectionStart,
        textbox.selectionEnd
      );

      textbox.dirty = true;
      this.canvas.requestRenderAll();
    }
  }


  private loadCanvasFromJson(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.picturesService
        .get_content(this.uuid)
        .pipe()
        .subscribe({
          next: (data) => {
            try {
              if (!data || !data.canvas_content) {
                console.warn('No canvas_content found in response');
                resolve();
                return;
              }


              const parsed = JSON.parse(data.canvas_content);

              if (Array.isArray(parsed.objects) && parsed.objects.length === 0) {
                this.canvas.clear()
                // Empty canvas: apply background and render manually
                if (parsed.background) {
                  this.canvas.backgroundColor = parsed.background;
                }
                this.canvas.renderAll();
                // console.log('Canvas loaded and rendered (empty)');
                resolve();
              } else {
                // Non-empty: let Fabric load objects, then callback fires
                this.canvas.loadFromJSON(parsed, () => {
                  this.canvas.requestRenderAll();
                  // console.log('Canvas loaded and rendered');
                  this.canvas.once('after:render', () => {
                    this.canvas.getObjects().forEach(obj => {
                      obj.set({
                        selectable: this.allowSelection,
                        evented: this.allowSelection,
                        hasControls: this.allowSelection
                      });
                    });
                    this.canvas.selection = false;
                    this.canvas.discardActiveObject();
                    resolve();
                  });
                });
              }

            } catch (err) {
              console.error('Error loading canvas JSON', err);
              reject(err);
            }
          },
          error: (err) => {
            console.error('Error fetching canvas content', err);
            reject(err);
          }
        });
    });
  }

  private enableTextInsertion(): void {
    this.canvas.off('mouse:down');
    this.canvas.on('mouse:down', (opt) => {
      if (this.drawingMode !== 'text') return;

      const pointer = this.canvas.getPointer(opt.e);

      const textbox = new fabric.Textbox('...', {
        left: pointer.x,
        top: pointer.y,
        fontSize: this.fontSize,
        fill: '#000000',
        editable: true,
        selectable: true,
        evented: true,
        width: 100 // initial width
      });

      this.canvas.add(textbox);
      this.canvas.setActiveObject(textbox);

      // Enter editing mode immediately
      textbox.enterEditing();
      textbox.hiddenTextarea?.focus();

      // select all so input overwrite placeholader
      textbox.selectAll();

      // Custom key handling
      textbox.hiddenTextarea?.addEventListener('keydown', (e: KeyboardEvent) => {
        // Ignore control keys that shouldn't expand width
        const ignoredKeys = [
          'Shift', 'Control', 'Alt', 'Meta',
          'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
          'Backspace', 'Delete', 'Tab', 'Enter', 'Escape'
        ];

        if (ignoredKeys.includes(e.key)) {
          return; // skip non-character keys
        }

        // Check if cursor is at end of text
        const cursorPos = textbox.selectionStart;
        const text = textbox.text || '';
        if (cursorPos === text.length) {
          // Grow textbox width instead of wrapping
          textbox.set({width: textbox.width! + this.fontSize});
          this.canvas.requestRenderAll();
        }
      });

      // When clicking outside, commit text
      this.canvas.on('mouse:down', (evt) => {
        const target = this.canvas.findTarget(evt.e);
        if (target !== textbox) {
          textbox.exitEditing();
          this.canvas.off('mouse:down'); // remove this temporary listener
        }
      });

      this.drawingMode = null; // reset mode
    });
  }

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob); // converts to base64 string
    });
  }

  private get picture(): Pick<PicturePayload, 'canvas_content'> {
    return {
      canvas_content: JSON.stringify(this.canvas.toJSON())
    };
  }

  public onSubmit(): void {
    const byteSize = new Blob([this.picture.canvas_content as string]).size;
    const maxSize = environment.noteMaximumSize ?? 1024; // Default to 1024 KB if not set
    if (byteSize > (maxSize << 10)) {
      this.toastrService.error('Content exceeds the maximum allowed size.');
      return;
    }

    this.picturesService
      .patch_content(this.uuid!, {
        ...this.picture,
        origin: this.clientId   // attach origin
      })
      .pipe()
      .subscribe(
        picture => {
          this.translocoService
            .selectTranslate('picture.details.toastr.success')
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.cdr.markForCheck();
        }
      );
  }


}

