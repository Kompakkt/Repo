import { Component, inject, computed } from '@angular/core';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { RouterLink } from '@angular/router';
import { ExtenderSlotManager } from '@kompakkt/plugins/extender';
import { CustomBrandingPlugin } from '@kompakkt/plugins/custom-branding';
import { LanguageDropdownComponent } from '../../language-dropdown/language-dropdown.component';
import { OnInit } from '@angular/core';
import { viewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [RouterLink, TranslatePipe, LanguageDropdownComponent],
})
export class FooterComponent implements OnInit {
  #customBrandingPlugin = inject<CustomBrandingPlugin>(CustomBrandingPlugin.providerToken, {
    optional: true,
  });
  customCopyRightText = computed(() => {
    const settings = this.#customBrandingPlugin?.settings();
    return settings?.copyRightText;
  });

  public currentYear = new Date().getFullYear();

  languageDropdownSlotRef = viewChild.required<ElementRef<HTMLElement>>('languageDropdownSlot');
  #viewContainerRef = inject(ViewContainerRef);
  ngOnInit() {
    console.log('FooterComponent', {
      elementRef: this.languageDropdownSlotRef,
    });
    ExtenderSlotManager.registerSlot({
      slotName: 'language-dropdown',
      slotBehaviour: 'replace',
      elementRef: this.languageDropdownSlotRef(),
      viewContainerRef: this.#viewContainerRef,
    });
  }
}
