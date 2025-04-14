import { Component, inject, computed } from '@angular/core';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { RouterLink } from '@angular/router';
import { ExtenderSlotDirective } from '@kompakkt/extender';
import { CustomBrandingPlugin } from '@kompakkt/plugins/custom-branding';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [RouterLink, TranslatePipe, ExtenderSlotDirective],
})
export class FooterComponent {
  #customBrandingPlugin = inject<CustomBrandingPlugin>(CustomBrandingPlugin.providerToken, {
    optional: true,
  });
  customCopyRightText = computed(() => {
    const settings = this.#customBrandingPlugin?.settings();
    return settings?.copyRightText;
  });

  public currentYear = new Date().getFullYear();
}
