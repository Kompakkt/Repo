import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-entity-interaction-menu',
    templateUrl: './entity-interaction-menu.component.html',
    styleUrls: ['./entity-interaction-menu.component.scss'],
})
export class EntityInteractionMenuComponent implements OnInit {

    @Input()
    id;

    ngOnInit() {
    }

}
