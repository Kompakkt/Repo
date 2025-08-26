import {
  AfterViewInit,
  Component,
  ComponentRef,
  ElementRef,
  HostBinding,
  inject,
  signal,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'src/app/pipes';
import { SidenavComponent, SidenavService } from 'src/app/services/sidenav.service';

@Component({
  selector: 'app-sidenav-container',
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './sidenav-container.component.html',
  styleUrl: './sidenav-container.component.scss',
})
export class SidenavContainerComponent implements AfterViewInit {
  sidenav = inject(SidenavService);
  #elementRef = inject<ElementRef<HTMLDivElement>>(ElementRef);
  #createdComponentRef = signal<ComponentRef<SidenavComponent> | undefined>(undefined);
  viewContainerRef = viewChild.required('reference', { read: ViewContainerRef });

  #intermediateResult = signal<unknown>(undefined);

  title = signal<string>('');

  ngAfterViewInit() {
    this.sidenav.setSidenavContainer(this.#elementRef);

    this.sidenav.state$.subscribe(({ opened, component, data }) => {
      const createdComponentRef = this.#createdComponentRef();
      if (!component) {
        if (createdComponentRef) {
          createdComponentRef.hostView.destroy();
          this.#createdComponentRef.set(undefined);
        }
        return;
      }
      const componentRef = this.viewContainerRef().createComponent(component);
      this.#createdComponentRef.set(componentRef);
      componentRef.instance.resultChanged.subscribe(result => this.#intermediateResult.set(result));
      componentRef.location.nativeElement.classList.add('sidenav-component');
      if (data) componentRef.setInput('dataInput', data);
      this.title.set(componentRef.instance.title || '');
    });
  }

  public close() {
    this.sidenav.close(this.#intermediateResult());
  }
}
