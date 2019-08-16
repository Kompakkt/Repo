import {Component, OnInit} from '@angular/core';
import {AccountService} from "../../services/account.service";

@Component({
    selector: 'app-explore-entities',
    templateUrl: './explore.component.html',
    styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit {

    public isAuthenticated;

    constructor(private account: AccountService) {
        this.isAuthenticated = false;
        this.account.isUserAuthenticatedObservable.subscribe(
            state => (this.isAuthenticated = state),
        );
    }

    ngOnInit() {
    }
}
