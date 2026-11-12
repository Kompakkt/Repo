import { Component, inject, computed } from '@angular/core';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { RouterLink } from '@angular/router';
import { CustomBrandingPlugin } from '@kompakkt/plugins/custom-branding';
import { LanguageDropdownComponent } from '../../language-dropdown/language-dropdown.component';
import { ExtenderSlotDirective } from 'src/app/directives/extender-slot.directive';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [RouterLink, NgxFluentPipe, LanguageDropdownComponent, ExtenderSlotDirective],
})
export class FooterComponent {
  #customBrandingPlugin = inject<CustomBrandingPlugin>(CustomBrandingPlugin.providerToken, {
    optional: true,
  });
  customCopyRightText = computed(() => {
    const settings = this.#customBrandingPlugin?.settings();
    return settings?.copyRightText;
  });

  currentYear = new Date().getFullYear();
}
