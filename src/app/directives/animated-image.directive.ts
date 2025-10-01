import { Directive, ElementRef, inject, OnDestroy, OnInit, signal } from '@angular/core';

@Directive({ selector: '[appAnimatedImage]' })
export class AnimatedImageDirective implements OnInit, OnDestroy {
  #isImageLoaded = signal(false);
  #ref = inject<ElementRef<HTMLImageElement>>(ElementRef);
  get #imageElement(): HTMLImageElement | undefined {
    return this.#ref ? this.#ref.nativeElement : undefined;
  }

  #animate(startingOpacity: number, endingOpacity: number) {
    const imgEl = this.#imageElement;
    imgEl?.animate([{ opacity: startingOpacity }, { opacity: endingOpacity }], {
      duration: 300,
      fill: 'both',
    });
  }

  #imgSrcObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        this.#isImageLoaded.set(false);
        const currentOpacity = this.#imageElement?.style.opacity;
        this.#animate(currentOpacity ? parseFloat(currentOpacity) : 1, 0);
      }
    }
  });

  ngOnInit() {
    const imgEl = this.#imageElement;
    if (!imgEl) return;
    this.#imgSrcObserver.observe(imgEl, { attributes: true });
    imgEl.addEventListener('load', () => {
      this.#isImageLoaded.set(true);
      this.#animate(0, 1);
    });
    imgEl.addEventListener('error', () => {
      this.#isImageLoaded.set(true);
      imgEl.src = 'assets/noimage.png';
      this.#animate(0, 1);
    });
  }

  ngOnDestroy() {
    this.#imgSrcObserver.disconnect();
  }
}
