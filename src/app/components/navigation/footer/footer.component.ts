import { Component } from '@angular/core';
import { TranslateService } from '../../../services/translate.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { LanguageDropdownComponent } from '../../language-dropdown/language-dropdown.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [RouterLink, LanguageDropdownComponent, TranslatePipe],
})
export class FooterComponent {
  public currentYear = new Date().getFullYear();
}
