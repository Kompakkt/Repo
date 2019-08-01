import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {environment} from '../../environments/environment';
import {Collection} from '../enums/collection.enum';
import {ICompilation, IEntity, IFile, ILDAPData, IMetaDataDigitalEntity, IMetaDataInstitution, IMetaDataPerson, IMetaDataTag, IServerResponse} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class MongoHandlerService {

  private endpoint = `${environment.express_server_url}:${environment.express_server_port}`;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
    withCredentials: true,
  };

  constructor(private http: HttpClient) {
  }

  // Override GET and POST to use HttpOptions which is needed for auth
  private async get(path: string): Promise<any> {
    return this.http
      .get(`${this.endpoint}/${path}`, this.httpOptions)
      .toPromise();
  }

  private async post(path: string, obj: any): Promise<any> {
    return this.http.post(`${this.endpoint}/${path}`, obj, this.httpOptions)
      .toPromise();
  }

  // GETs
  public async getAllEntities(): Promise<IEntity[]> {
    return this.get(`api/v1/get/findall/${Collection.Entity}`);
  }

  public async getAllPersons(): Promise<IMetaDataPerson[]> {
    return this.get(`api/v1/get/findall/${Collection.Person}`);
  }

  public async getAllInstitutions(): Promise<IMetaDataInstitution[]> {
    return this.get(`api/v1/get/findall/${Collection.Institution}`);
  }

  public async getEntity(identifier: string): Promise<IEntity & IServerResponse> {
    return this.get(`api/v1/get/find/${Collection.Entity}/${identifier}`);
  }

  public async getEntityMetadata(identifier: string): Promise<IMetaDataDigitalEntity & IServerResponse> {
    return this.get(`api/v1/get/find/${Collection.DigitalEntity}/${identifier}`);
  }

  public async getAllCompilations(): Promise<ICompilation[]> {
    return this.get(`api/v1/get/findall/${Collection.Compilation}`);
  }

  public async getCompilation(identifier: string): Promise<ICompilation & IServerResponse> {
    return this.get(`api/v1/get/find/${Collection.Compilation}/${identifier}`);
  }

  public async getCurrentUserData(): Promise<ILDAPData & IServerResponse> {
    return this.get(`api/v1/get/ldata`);
  }

  public async getEuropeanaData(record_id): Promise<any> {
    return this.get(`api/v1/get/europeana/${record_id}`);
  }

  public async logout(): Promise<IServerResponse> {
    return this.get(`logout`);
  }

  public async searchCompilation(filter: string): Promise<ICompilation[]> {
    return this.get(`api/v1/get/search/${Collection.Compilation}/${filter.replace(' ', '+')}`);
  }

  // POSTs
  public async pushEntity(FinishedEntity: any): Promise<any> {
    return this.post(`api/v1/post/push/${Collection.Entity}`, FinishedEntity);
  }

  public async pushCompilation(CompilationObject: any): Promise<any> {
    return this.post(`api/v1/post/push/${Collection.Compilation}`, CompilationObject);
  }

  public async pushDigitalObject(DigitalObject: any): Promise<any> {
    return this.post(`api/v1/post/push/${Collection.DigitalEntity}`, DigitalObject);
  }

  public async submitToDB(SubmitObject: any): Promise<any> {
    return this.post(`api/v1/post/submit`, SubmitObject);
  }

  public async submitEuropeanaDataToDB(EuropeanaObject: any): Promise<any> {
    return this.post(`api/v1/post/submit/europeana`, EuropeanaObject);
  }

  public async deleteRequest(identifier: string, type: string,
                             username: string, password: string): Promise<any> {
    return this.post(`api/v1/post/remove/${type}/${identifier}`, {username, password});
  }

  public async searchEntity(filter: string): Promise<string[]> {
    return this.post(`api/v1/post/search/${Collection.Entity}`, {filter: filter.split(' ')});
  }

  public async searchPerson(filter: string): Promise<IMetaDataPerson[]> {
    return this.post(`api/v1/post/search/${Collection.Person}`, {filter: filter.split(' ')});
  }

  public async searchTags(filter: string): Promise<IMetaDataTag[]> {
    return this.post(`api/v1/post/search/${Collection.Tag}`, {filter: filter.split(' ')});
  }

  public async togglePublishedState(identifier): Promise<any> {
    return this.post(`api/v1/post/publish`, {identifier});
  }

  // Admin routes
  public async getLDAP(username: string, password: string): Promise<any> {
    return this.post(`admin/getldap`, {username, password});
  }

  public async promoteUser(
    username: string, password: string,
    identifier: string, role: string): Promise<any> {
    return this.post(`admin/promoteuser`, {username, password, identifier, role});
  }

  public async adminTogglePublishedState(username, password, identifier): Promise<any> {
    return this.post(`admin/togglepublished`, {username, password, identifier});
  }

  public async getMailEntries(username, password): Promise<any> {
    return this.post(`mailer/getmailentries`, {username, password});
  }

  public async toggleMailAnswered(username, password, target, identifier): Promise<any> {
    return this.post(`mailer/toggleanswered/${target}/${identifier}`, {username, password});
  }

  // Upload
  public async completeUpload(UUID: string, type: string): Promise<{ status: string; files: IFile[] }> {
    return this.post(`uploadfinished`, {uuid: UUID, type});
  }

  public async cancelUpload(UUID: string, type: string): Promise<any> {
    return this.post(`uploadcancel`, {uuid: UUID, type});
  }

  // Utility
  public async addEntityOwner(
    username: string, password: string,
    entityId: string, ownerUsername: string): Promise<any> {
    return this.post(`utility/applyactiontoentityowner`, {
      username, password,
      command: 'add',
      entityId, ownerUsername,
    });
  }

  public async removeEntityOwner(
    username: string, password: string,
    entityId: string, ownerUsername: string): Promise<any> {
    return this.post(`utility/applyactiontoentityowner`, {
      username, password,
      command: 'remove',
      entityId, ownerUsername,
    });
  }

  public async countEntityUses(entityId: string): Promise<any> {
    return this.get(`utility/countentityuses/${entityId}`);
  }

  public async findEntityOwners(entityId: string): Promise<any> {
    return this.get(`utility/findentityowners/${entityId}`);
  }

  // Auth
  public async login(username: string, password: string): Promise<ILDAPData & IServerResponse> {
    return this.post(`login`, {username, password});
  }

  public async isAuthorized(): Promise<ILDAPData & IServerResponse> {
    return this.get(`auth`);
  }
}
