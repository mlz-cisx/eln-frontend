import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LabbooksService } from '@app/services';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { HttpClient } from '@angular/common/http';
import type { LabBookElement } from '@joeseln/types';

@UntilDestroy()
@Component({
  selector: 'eworkbench-export',
  template: `<button
    (click)="downloadFiles()"
    class="btn ewb-button-big ewb-button-primary"
  >
    Download
  </button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportComponent {
  @Input()
  public id!: string;

  constructor(
    private http: HttpClient,
    private labBooksService: LabbooksService,
  ) {}

  downloadFiles() {
    this.labBooksService
      .getElements(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        (labBookElements) => {
          this.downloadFilesAndZip(labBookElements).then((zipBlob) => {
            saveAs(zipBlob, `export-${this.id}.zip`);
          });
        },
        () => {
          console.warn('Failed to fetch elements');
        },
      );
  }

  convertToDownloadUrls(elements: LabBookElement<any>[]): string[] {
    const downloadUrls: string[] = [];
    elements.forEach((element) => {
      const childObject = element.child_object;
      const contentType = element.child_object_content_type_model;

      switch (contentType) {
        case 'pictures.picture':
          if (childObject.download_background_image) {
            downloadUrls.push(childObject.download_background_image);
          }
          if (childObject.download_rendered_image) {
            downloadUrls.push(childObject.download_rendered_image);
          }
          if (childObject.download_shapes) {
            downloadUrls.push(childObject.download_shapes);
          }
          break;
        case 'shared_elements.file':
          if (childObject.download) {
            downloadUrls.push(childObject.download);
          }
          break;
        default:
          break;
      }
    });
    return downloadUrls;
  }

  async downloadFilesAndZip(
    labbookElements: LabBookElement<any>[],
  ): Promise<Blob> {
    const zip = new JSZip();
    const folder = zip.folder('export');

    if (!folder) {
      throw new Error('Failed to create folder in ZIP');
    }

    const fileUrls = this.convertToDownloadUrls(labbookElements);

    try {
      const promises = fileUrls.map(async (url) => {
        const blob = await this.http
          .get(url, { responseType: 'blob' })
          .toPromise();
        if (!blob) {
          throw new Error(`Failed to download file from URL: ${url}`);
        }
        const fileName =
          url.replace(
            /^(https?:\/\/[^\/]+)?(\/api(\/v\d+)?\/)?(.*?)(\/)?(\?.*)?$/,
            '$4',
          ) || 'file';
        folder.file(fileName, blob);
      });

      // labbookElements as a JSON file
      folder.file('elements.json', JSON.stringify(labbookElements));

      await Promise.all(promises);
      return await zip.generateAsync({ type: 'blob' });
    } catch (error) {
      throw new Error('Failed to download or zip files');
    }
  }
}
