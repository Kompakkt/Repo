import { TestBed } from '@angular/core/testing';

import { MongoHandlerService } from './mongo-handler.service';

describe('MongohandlerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MongoHandlerService = TestBed.get(MongoHandlerService);
    expect(service).toBeTruthy();
  });
});
