import { ComponentRef, EnvironmentInjector, createComponent } from '@angular/core';
import type { Editor } from 'tinymce';
import { TexPreviewComponent } from './tex-preview.component';

export function registerTexInsert(editor: Editor, environmentInjector: EnvironmentInjector): void {
  const openTexDialog = () => {
    let preview: ComponentRef<TexPreviewComponent> | undefined;
    const updatePreview = (tex: string) => {
      preview?.setInput('formula', formatTexHtml(tex) ?? '');
      preview?.changeDetectorRef.detectChanges();
    };
    return editor.windowManager.open({
      title: 'MathJax Editor',
      size: 'medium',
      body: {
        type: 'panel',
        items: [{
          type: 'grid',
          columns: 2,
          items: [
            { type: 'textarea', name: 'tex', label: 'MathJax formula' },
            {
              type: 'htmlpanel',
              html: '<div><span class="tox-label">Live preview</span><div class="tex-insert-output" role="region" aria-label="Formula preview"></div></div>',
              onInit: element => {
                element.closest('.tox-dialog')?.classList.add('tex-insert-dialog');
                const hostElement = element.querySelector<HTMLElement>('[role="region"]');
                if (hostElement) {
                  preview = createComponent(TexPreviewComponent, { environmentInjector, hostElement });
                  preview.changeDetectorRef.detectChanges();
                }
              }
            }
          ]
        }]
      },
      initialData: { tex: '' },
      buttons: [
        { type: 'cancel', text: 'Cancel' },
        { type: 'submit', text: 'Insert', primary: true }
      ],
      onChange: (dialog, details) => {
        if (details.name === 'tex') {
          updatePreview(dialog.getData().tex);
        }
      },
      onSubmit: dialog => {
        const html = formatTexHtml(dialog.getData().tex);
        if (html === undefined) {
          return;
        }
        editor.insertContent(html);
        dialog.close();
      },
      onClose: () => preview?.destroy()
    });
  };
  // 'MathJax' icon
  editor.ui.registry.addIcon('tex', '<svg xmlns="http://w3.org" width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="2.5" y="2.5" width="27" height="27" rx="6.5" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5" /><path d="M6.75 18l2.5 4.5 4-13.25h12" stroke="#0284C7" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /><path d="M16.75 15.25l5.25 6.75M22 15.25l-5.25 6.75" stroke="#0F172A" stroke-width="2.6" stroke-linecap="round" /></svg>');
  editor.ui.registry.addButton('texeditor', {
    icon: 'tex',
    tooltip: 'MathJax Editor',
    onAction: openTexDialog
  });
}

// HTML tags should not affect MathJax parsing.
function formatTexHtml(text: string): string | undefined {
  let formula = text.trim();
  if (!formula) {
    return undefined;
  }

  const alreadyWrapped = (formula.startsWith('$$') && formula.endsWith('$$'))
    || (formula.startsWith('\\[') && formula.endsWith('\\]'))
    || (formula.startsWith('\\(') && formula.endsWith('\\)'));
  if (!alreadyWrapped) {
    formula = `\\[${formula}\\]`;
  }

  return formula
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
