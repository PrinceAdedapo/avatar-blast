// Preload critical game images into browser cache
const loaded = new Set<string>();

export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => {
      if (loaded.has(url)) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => { loaded.add(url); resolve(); };
        img.src = url;
      });
    })
  );
}

export function preloadImage(url: string): void {
  if (loaded.has(url)) return;
  const img = new Image();
  img.onload = img.onerror = () => { loaded.add(url); };
  img.src = url;
}
