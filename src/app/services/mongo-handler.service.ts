import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { Collection } from '../enums/collection.enum';
import {
  ICompilation,
  IEntity,
  IFile,
  IUserData,
  IMetaDataDigitalEntity,
  IMetaDataInstitution,
  IMetaDataPerson,
  IMetaDataTag,
  IServerResponse,
  IStrippedUserData,
  IGroup,
} from '../interfaces';

enum ETarget {
  contact = 'contact',
  upload = 'upload',
  bugreport = 'bugreport',
}

interface ISendMailRequest {
  subject: string;
  mailbody: string;
  target?: ETarget;
}

interface IExploreRequest {
  searchEntity: boolean;
  types: string[];
  filters: {
    annotatable: boolean;
    annotated: boolean;
    restricted: boolean;
    associated: boolean;
  };
  searchText: string;
  offset: number;
}

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

  constructor(private http: HttpClient) {}

  // Override GET and POST to use HttpOptions which is needed for auth
  private async get(path: string): Promise<any> {
    return this.http
      .get(`${this.endpoint}/${path}`, this.httpOptions)
      .toPromise();
  }

  private async post(path: string, obj: any): Promise<any> {
    return this.http
      .post(`${this.endpoint}/${path}`, obj, this.httpOptions)
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

  public async getAllTags(): Promise<IMetaDataTag[]> {
    return this.get(`api/v1/get/findall/${Collection.Tag}`);
  }

  public async getEntity(
    identifier: string,
  ): Promise<IEntity & IServerResponse> {
    return this.get(`api/v1/get/find/${Collection.Entity}/${identifier}`);
  }

  public async getEntityMetadata(
    identifier: string,
  ): Promise<IMetaDataDigitalEntity & IServerResponse> {
    return this.get(
      `api/v1/get/find/${Collection.DigitalEntity}/${identifier}`,
    );
  }

  public async getAllCompilations(): Promise<ICompilation[]> {
    return this.get(`api/v1/get/findall/${Collection.Compilation}`);
  }

  public async getCompilation(
    identifier: string,
  ): Promise<ICompilation & IServerResponse> {
    return this.get(`api/v1/get/find/${Collection.Compilation}/${identifier}`);
  }

  public async getCurrentUserData(): Promise<IUserData & IServerResponse> {
    return this.get(`api/v1/get/ldata`);
  }

  public async getEuropeanaData(record_id): Promise<IServerResponse> {
    return this.get(`api/v1/get/europeana/${record_id}`);
  }

  // Account specific GETs
  public async getAccounts(): Promise<IStrippedUserData[]> {
    return this.get(`api/v1/get/users`);
  }

  public async getGroups(): Promise<IGroup[]> {
    return this.get(`api/v1/get/groups`);
  }

  public async logout(): Promise<IServerResponse> {
    return this.get(`logout`);
  }

  // POSTs
  public async explore(
    exploreRequest: IExploreRequest,
  ): Promise<Array<IEntity | ICompilation>> {
    return this.post(`api/v1/post/explore`, exploreRequest);
  }

  public async pushEntity(Entity: IEntity): Promise<IEntity & IServerResponse> {
    return this.post(`api/v1/post/push/${Collection.Entity}`, Entity);
  }

  public async pushGroup(Group: IGroup): Promise<IEntity & IServerResponse> {
    return this.post(`api/v1/post/push/${Collection.Group}`, Group);
  }

  public async pushCompilation(
    Compilation: ICompilation,
  ): Promise<ICompilation & IServerResponse> {
    return this.post(`api/v1/post/push/${Collection.Compilation}`, Compilation);
  }

  public async pushDigitalEntity(
    DigitalEntity: IMetaDataDigitalEntity,
  ): Promise<IMetaDataDigitalEntity & IServerResponse> {
    return this.post(
      `api/v1/post/push/${Collection.DigitalEntity}`,
      DigitalEntity,
    );
  }

  public async deleteRequest(
    identifier: string,
    type: string,
    username: string,
    password: string,
  ): Promise<IServerResponse> {
    return this.post(`api/v1/post/remove/${type}/${identifier}`, {
      username,
      password,
    });
  }

  // Search functions
  public async searchEntity(filter: string, offset = 0): Promise<IEntity[]> {
    return this.post(`api/v1/post/search/${Collection.Entity}`, {
      filter: filter.split(' '),
      offset,
    });
  }

  public async searchPerson(
    filter: string,
    offset = 0,
  ): Promise<IMetaDataPerson[]> {
    return this.post(`api/v1/post/search/${Collection.Person}`, {
      filter: filter.split(' '),
      offset,
    });
  }

  public async searchTags(filter: string, offset = 0): Promise<IMetaDataTag[]> {
    return this.post(`api/v1/post/search/${Collection.Tag}`, {
      filter: filter.split(' '),
      offset,
    });
  }

  public async searchCompilation(
    filter: string,
    offset = 0,
  ): Promise<ICompilation[]> {
    return this.post(`api/v1/post/search/${Collection.Compilation}`, {
      filter: filter.split(' '),
      offset,
    });
  }

  public async togglePublishedState(identifier): Promise<IServerResponse> {
    return this.post(`api/v1/post/publish`, { identifier });
  }

  public async sendUploadApplicationMail(
    mailRequest: ISendMailRequest,
  ): Promise<IServerResponse> {
    return this.post(`sendmail`, { ...mailRequest, target: ETarget.upload });
  }

  public async sendBugReportMail(
    mailRequest: ISendMailRequest,
  ): Promise<IServerResponse> {
    return this.post(`sendmail`, { ...mailRequest, target: ETarget.bugreport });
  }

  public async sendContactMail(
    mailRequest: ISendMailRequest,
  ): Promise<IServerResponse> {
    return this.post(`sendmail`, { ...mailRequest, target: ETarget.contact });
  }

  // Admin routes
  public async getAllUsers(
    username: string,
    password: string,
  ): Promise<
    IServerResponse & {
      users: IUserData[];
    }
  > {
    return this.post(`admin/getusers`, { username, password });
  }

  public async getUser(
    username: string,
    password: string,
    identifier: string,
  ): Promise<IServerResponse & IUserData> {
    return this.post(`admin/getuser/${identifier}`, { username, password });
  }

  public async promoteUser(
    username: string,
    password: string,
    identifier: string,
    role: string,
  ): Promise<IServerResponse> {
    return this.post(`admin/promoteuser`, {
      username,
      password,
      identifier,
      role,
    });
  }

  public async adminTogglePublishedState(
    username,
    password,
    identifier,
  ): Promise<IServerResponse> {
    return this.post(`admin/togglepublished`, {
      username,
      password,
      identifier,
    });
  }

  public async getMailEntries(username, password): Promise<IServerResponse> {
    return this.post(`mailer/getmailentries`, { username, password });
  }

  public async toggleMailAnswered(
    username,
    password,
    target,
    identifier,
  ): Promise<IServerResponse> {
    return this.post(`mailer/toggleanswered/${target}/${identifier}`, {
      username,
      password,
    });
  }

  // Upload
  public async completeUpload(
    UUID: string,
    type: string,
  ): Promise<{ status: string; files: IFile[] }> {
    return this.post(`uploadfinished`, { uuid: UUID, type });
  }

  public async cancelUpload(
    UUID: string,
    type: string,
  ): Promise<IServerResponse> {
    return this.post(`uploadcancel`, { uuid: UUID, type });
  }

  // Utility
  public async addEntityOwner(
    username: string,
    password: string,
    entityId: string,
    ownerUsername: string,
  ): Promise<IServerResponse> {
    return this.post(`utility/applyactiontoentityowner`, {
      username,
      password,
      command: 'add',
      entityId,
      ownerUsername,
    });
  }

  public async removeEntityOwner(
    username: string,
    password: string,
    entityId: string,
    ownerUsername: string,
  ): Promise<any> {
    return this.post(`utility/applyactiontoentityowner`, {
      username,
      password,
      command: 'remove',
      entityId,
      ownerUsername,
    });
  }

  public async countEntityUses(entityId: string): Promise<any> {
    return this.get(`utility/countentityuses/${entityId}`);
  }

  public async findEntityOwners(
    entityId: string,
  ): Promise<IServerResponse & { accounts: IStrippedUserData[] }> {
    return this.get(`utility/findentityowners/${entityId}`);
  }

  public async findUserInGroups(): Promise<
    IServerResponse & {
      groups: IGroup[];
    }
  > {
    return this.get(`utility/finduseringroups`);
  }

  public async findUserInCompilations(): Promise<
    IServerResponse & {
      compilations: ICompilation[];
    }
  > {
    return this.get(`utility/finduserincompilations`);
  }

  public async findUserInMetadata(): Promise<
    IServerResponse & {
      entities: IEntity[];
    }
  > {
    return this.get(`utility/finduserinmetadata`);
  }

  // Auth
  public async login(
    username: string,
    password: string,
  ): Promise<IUserData & IServerResponse> {
    return this.post(`login`, { username, password });
  }

  public async registerAccount(accountData: any): Promise<IServerResponse> {
    return this.post(`register`, accountData);
  }

  public async isAuthorized(): Promise<IUserData & IServerResponse> {
    return this.get(`auth`);
  }
}
