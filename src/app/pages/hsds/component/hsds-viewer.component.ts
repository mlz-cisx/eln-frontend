import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {ModalState} from "@app/enums/modal-state.enum";
import {buildBasicAuthHeader, createBasicFetcher} from '@h5web/app';
import {environment} from "@environments/environment";
import domtoimage from 'dom-to-image-more';

@Component({
  selector: 'app-hsds-page',
  templateUrl: './hsds-viewer.component.html',
  styleUrl: './hsds-viewer.component.css',
  standalone: false,
})
export class HSDSViewerComponent implements OnDestroy {

  @ViewChild('hsdsContainer', {static: true})
  private container!: ElementRef<HTMLDivElement>;

  public state = ModalState.Unchanged;


  public url: string = environment.hsds_url;
  public username: string = environment.hsds_username;
  public password: string = environment.hsds_password;
  public domain: string = environment.hsds_domain;

  // filename must be inserted manually by the user
  public filename: string = ''


  private root: ReturnType<typeof createRoot> | null = null;

  ngOnInit(): void {
    this.normalizeInputs();
  }


  ngOnDestroy(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  public async renderReactComponent(): Promise<void> {
    this.normalizeInputs();

    const filepath = `${this.domain}/${this.filename}`;

    const fetcher = createBasicFetcher({
      headers: buildBasicAuthHeader(this.username, this.password),
    });

    if (!this.container?.nativeElement) {
      return;
    }

    if (!this.root) {
      this.root = createRoot(this.container.nativeElement);
    }

    const [{App, HsdsProvider}] = await Promise.all([
      import('@h5web/app')
    ]);

    const element = createElement(
      HsdsProvider,
      {url: this.url, filepath, fetcher},
      createElement(App, {sidebarOpen: false})
    );

    this.root.render(element);
    // Wait for React to finish rendering
    setTimeout(() => {
      this.installDownloadBlockerObserver();
    }, 0);
  }

  private normalizeInputs(): void {
    // strip whitespace
    this.url = this.url.trim();
    this.username = this.username.trim();
    this.password = this.password.trim();
    this.domain = this.domain.trim();
    this.filename = this.filename.trim();

    // normalize url: no trailing slash
    if (this.url) {
      this.url = this.url.replace(/\/+$/, '');
    }

    // normalize domain: leading slash, no trailing slash
    if (this.domain) {
      this.domain =
        '/' +
        this.domain
          .replace(/^\/+/, '')   // remove leading slashes
          .replace(/\/+$/, '');  // remove trailing slashes
    }

    // normalize filename: no leading slash
    if (this.filename) {
      this.filename = this.filename.replace(/^\/+/, '');
    }
  }

  public async downloadH5webPng(): Promise<void> {
    const dataUrl = await this.captureH5web();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${this.filename}.png`;
    link.click();
  }

  private async captureH5web(): Promise<string | null> {
    const container = this.container?.nativeElement;
    if (!container) return null;

    try {
      const rect = container.getBoundingClientRect();

      return await domtoimage.toPng(container, {
        bgcolor: '#ffffff',
        quality: 1,
        width: rect.width,
        height: rect.height,
        style: {} // no transform!
      });

    } catch (err) {
      console.error('Failed to capture H5Web viewer', err);
      return null;
    }
  }

  private installDownloadBlockerObserver(): void {
    const container = this.container?.nativeElement;
    if (!container) return;

    let scheduled = false;

    const observer = new MutationObserver(() => {
      if (!scheduled) {
        scheduled = true;

        queueMicrotask(() => {
          scheduled = false;
          this.scanAndDisableDownloadElements();
        });
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });
  }

  private scanAndDisableDownloadElements(): void {
    const container = this.container?.nativeElement;
    if (!container) return;

    //
    // 1. Disable <a download>
    //
    const anchorsDownload = container.querySelectorAll('a[download]');
    anchorsDownload.forEach((el) => this.disableAnchor(el as HTMLAnchorElement));

    //
    // 2. Disable <a href="data:*">
    //
    const anchorsData = container.querySelectorAll('a[href^="data:"]');
    anchorsData.forEach((el) => this.disableAnchor(el as HTMLAnchorElement));

    //
    // 3. Disable export buttons (Snapshot, Export slice, Export data, etc.)
    //
    const exportButtons = container.querySelectorAll('button');

    exportButtons.forEach((btnEl) => {
      const btn = btnEl as HTMLButtonElement;

      // Already patched?
      if (btn.dataset['blocked'] === '1') return;

      const text = btn.textContent?.toLowerCase() ?? '';

      // Match H5Web export buttons
      if (
        text.includes('export') ||
        text.includes('snapshot') ||
        text.includes('slice')
      ) {
        btn.dataset['blocked'] = '1';

        const clone = btn.cloneNode(true) as HTMLButtonElement;
        btn.replaceWith(clone);

        clone.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          console.warn('H5Web internal export button disabled');
        });
      }
    });
  }

  private disableAnchor(a: HTMLAnchorElement): void {
    if (a.dataset['blocked'] === '1') return;
    a.dataset['blocked'] = '1';

    const clone = a.cloneNode(true) as HTMLAnchorElement;
    a.replaceWith(clone);

    clone.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      console.warn('H5Web internal anchor download disabled');
    });
  }


}

