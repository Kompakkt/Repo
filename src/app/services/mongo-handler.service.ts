import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {environment} from '../../environments/environment';
import {Collection} from '../enums/collection.enum';
import {ICompilation, ILDAPData, IMetaDataDigitalObject, IMetaDataInstitution, IMetaDataPerson, IMetaDataTag, IModel, IServerResponse} from '../interfaces';

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
  public async getAllModels(): Promise<IModel[]> {
    return this.get(`api/v1/get/findall/${Collection.Model}`);
  }

  public async getAllPersons(): Promise<IMetaDataPerson[]> {
    return this.get(`api/v1/get/findall/${Collection.Person}`);
  }

  public async getAllInstitutions(): Promise<IMetaDataInstitution[]> {
    return this.get(`api/v1/get/findall/${Collection.Institution}`);
  }

  public async getModel(identifier: string): Promise<IModel & IServerResponse> {
    return this.get(`api/v1/get/find/${Collection.Model}/${identifier}`);
  }

  public async getModelMetadata(identifier: string): Promise<IMetaDataDigitalObject & IServerResponse> {
    return this.get(`api/v1/get/find/${Collection.DigitalObject}/${identifier}`);
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
  public async pushModel(FinishedModel: any): Promise<any> {
    return this.post(`api/v1/post/push/${Collection.Model}`, FinishedModel);
  }

  public async pushCompilation(CompilationObject: any): Promise<any> {
    return this.post(`api/v1/post/push/${Collection.Compilation}`, CompilationObject);
  }

  public async pushDigitalObject(DigitalObject: any): Promise<any> {
    return this.post(`api/v1/post/push/${Collection.DigitalObject}`, DigitalObject);
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

  public async searchModel(filter: string): Promise<string[]> {
    return this.post(`api/v1/post/search/${Collection.Model}`, {filter: filter.split(' ')});
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
  public async completeUpload(UUID: string, type: string): Promise<{ status: string; files: string[] }> {
    return this.post(`uploadfinished`, {uuid: UUID, type});
  }

  public async cancelUpload(UUID: string, type: string): Promise<any> {
    return this.post(`uploadcancel`, {uuid: UUID, type});
  }

  // Utility
  public async addModelOwner(
    username: string, password: string,
    modelId: string, ownerUsername: string): Promise<any> {
    return this.post(`utility/applyactiontomodelowner`, {
      username, password,
      command: 'add',
      modelId, ownerUsername,
    });
  }

  public async removeModelOwner(
    username: string, password: string,
    modelId: string, ownerUsername: string): Promise<any> {
    return this.post(`utility/applyactiontomodelowner`, {
      username, password,
      command: 'remove',
      modelId, ownerUsername,
    });
  }

  public async countModelUses(modelId: string): Promise<any> {
    return this.get(`utility/countmodeluses/${modelId}`);
  }

  public async findModelOwners(modelId: string): Promise<any> {
    return this.get(`utility/findmodelowners/${modelId}`);
  }

  // Auth
  public async login(username: string, password: string): Promise<ILDAPData & IServerResponse> {
    return this.post(`login`, {username, password});
  }

  public async isAuthorized(): Promise<ILDAPData & IServerResponse> {
    return this.get(`auth`);
  }
}
