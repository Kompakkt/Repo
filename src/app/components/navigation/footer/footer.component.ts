import { Component } from '@angular/core';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { RouterLink } from '@angular/router';
import { ExtenderSlotDirective } from '@kompakkt/extender';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    imports: [RouterLink, TranslatePipe, ExtenderSlotDirective]
})
export class FooterComponent {
  public currentYear = new Date().getFullYear();
}
