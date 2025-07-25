interface State {
  listeners: (() => void)[];
  loaded: boolean;
}

export const scriptLoader = (() => {
  const state: State = {
    listeners: [],
    loaded: false,
  };

  const inject = (doc: Document, url: string, callback: () => void): void => {
    const scriptTag = doc.createElement('script');
    scriptTag.referrerPolicy = 'origin';
    scriptTag.type = 'application/javascript';
    scriptTag.src = url;

    const handler = (): void => {
      scriptTag.removeEventListener('load', handler);
      callback();
    };
    scriptTag.addEventListener('load', handler);
    doc.head.appendChild(scriptTag);
  };

  return (doc: Document, url: string, callback: () => void): void => {
    if (state.loaded) {
      callback();
    } else {
      state.listeners.push(callback);
      inject(doc, url, () => {
        state.listeners.forEach(fn => fn());
        state.loaded = true;
      });
    }
  };
})();
