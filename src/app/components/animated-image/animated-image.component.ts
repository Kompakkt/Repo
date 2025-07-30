import { Component, effect, ElementRef, input, signal, viewChild } from '@angular/core';

@Component({
  selector: 'anim-img',
  templateUrl: './animated-image.component.html',
  styleUrls: ['./animated-image.component.scss'],
  standalone: true,
})
export class AnimatedImageComponent {
  public src = input.required<string | undefined>();
  public alt = input<string | undefined>('Image');

  imageElement = viewChild.required<ElementRef<HTMLImageElement>>('imageElement');
  isLoaded = signal(false);

  srcChangedEffet = effect(() => {
    const newSrc = this.src();
    if (newSrc) this.isLoaded.set(false);
  });

  public imgLoadedEvent() {
    this.isLoaded.set(true);
  }

  public imgNotFoundEvent() {
    this.isLoaded.set(true);
    this.imageElement().nativeElement.src = 'assets/noimage.png';
  }
}
