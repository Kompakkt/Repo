import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root' 
})

export class MetadataCommunicationService {
    private metadataSubject = new BehaviorSubject<{data: any, index: number} | null>(null);
    selectedMetadata$ = this.metadataSubject.asObservable();

    selectMetadata(metadata, index) {
        this.metadataSubject.next({data: metadata, index: index});
    }
}