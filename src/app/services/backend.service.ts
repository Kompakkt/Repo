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
  IStrippedUserData,
  IGroup,
  ObjectId,
} from '@kompakkt/shared';

import { ProgressBarService } from './progress-bar.service';

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
export class BackendService {
  private endpoint = `${environment.express_server_url}:${environment.express_server_port}`;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
    withCredentials: true,
  };

  constructor(private http: HttpClient, private progress: ProgressBarService) {}

  // Override GET and POST to use HttpOptions which is needed for auth
  private async get(path: string, textResponse = false): Promise<any> {
    this.progress.changeProgressState(true);

    const request = this.http
      .get(`${this.endpoint}/${path}`, {
        ...this.httpOptions,
        responseType: textResponse ? ('text' as 'json') : 'json',
      })
      .toPromise();

    request.finally(() => this.progress.changeProgressState(false));

    return request;
  }

  private async post(path: string, obj: any): Promise<any> {
    this.progress.changeProgressState(true);

    let request = this.http
      .post(`${this.endpoint}/${path}`, obj, this.httpOptions)
      .toPromise();

    if (path.includes('explore')) {
      request = request.then(result => ({
        requestTime: Date.now(),
        array: result,
      }));
    }

    request.finally(() => this.progress.changeProgressState(false));

    return request;
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

  public async getEntity(identifier: string): Promise<IEntity> {
    return this.get(`api/v1/get/find/${Collection.Entity}/${identifier}`);
  }

  public async getEntityMetadata(
    identifier: string | ObjectId,
  ): Promise<IMetaDataDigitalEntity> {
    return this.get(
      `api/v1/get/find/${Collection.DigitalEntity}/${identifier}`,
    );
  }

  public async getAllCompilations(): Promise<ICompilation[]> {
    return this.get(`api/v1/get/findall/${Collection.Compilation}`);
  }

  /**
   * Fetch a resolved compilation by it's identifier
   * @param  {string |        ObjectId}  identifier Database _id of the compilation
   * @param  {string}  password   (Optional) Password of the compilation
   * @param  {[type]}             [description]
   * @return {Promise}            Returns the compilation or null if it's password protected
   */
  public async getCompilation(
    identifier: string | ObjectId,
    password?: string,
  ): Promise<ICompilation | null> {
    return password
      ? this.get(
          `api/v1/get/find/${Collection.Compilation}/${identifier}/${password}`,
        )
      : this.get(`api/v1/get/find/${Collection.Compilation}/${identifier}`);
  }

  public async getCurrentUserData(): Promise<IUserData> {
    return this.get(`api/v1/get/ldata`);
  }

  // Account specific GETs
  public async getAccounts(): Promise<IStrippedUserData[]> {
    return this.get(`api/v1/get/users`);
  }

  public async getGroups(): Promise<IGroup[]> {
    return this.get(`api/v1/get/groups`);
  }

  public async logout(): Promise<void> {
    return this.get(`logout`);
  }

  // POSTs
  public async explore(
    exploreRequest: IExploreRequest,
  ): Promise<{ requestTime: number; array: Array<IEntity | ICompilation> }> {
    return this.post(`api/v1/post/explore`, exploreRequest);
  }

  public async pushEntity(entity: IEntity): Promise<IEntity> {
    return this.post(`api/v1/post/push/${Collection.Entity}`, entity);
  }

  public async pushPerson(person: IMetaDataPerson): Promise<IMetaDataPerson> {
    return this.post(`api/v1/post/push/${Collection.Person}`, person);
  }

  public async pushInstitution(
    institution: IMetaDataInstitution,
  ): Promise<IMetaDataInstitution> {
    return this.post(`api/v1/post/push/${Collection.Institution}`, institution);
  }

  public async pushGroup(group: IGroup): Promise<IGroup> {
    return this.post(`api/v1/post/push/${Collection.Group}`, group);
  }

  public async pushCompilation(
    Compilation: ICompilation,
  ): Promise<ICompilation> {
    return this.post(`api/v1/post/push/${Collection.Compilation}`, Compilation);
  }

  public async pushDigitalEntity(
    DigitalEntity: IMetaDataDigitalEntity,
  ): Promise<IMetaDataDigitalEntity> {
    return this.post(
      `api/v1/post/push/${Collection.DigitalEntity}`,
      DigitalEntity,
    );
  }

  public async deleteRequest(
    identifier: string | ObjectId,
    type: string,
    username: string,
    password: string,
  ): Promise<string> {
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

  public async togglePublishedState(
    identifier: string | ObjectId,
  ): Promise<IEntity> {
    return this.post(`api/v1/post/publish`, { identifier });
  }

  public async sendUploadApplicationMail(
    mailRequest: ISendMailRequest,
  ): Promise<string> {
    return this.post(`sendmail`, { ...mailRequest, target: ETarget.upload });
  }

  public async sendBugReportMail(
    mailRequest: ISendMailRequest,
  ): Promise<string> {
    return this.post(`sendmail`, { ...mailRequest, target: ETarget.bugreport });
  }

  public async sendContactMail(mailRequest: ISendMailRequest): Promise<string> {
    return this.post(`sendmail`, { ...mailRequest, target: ETarget.contact });
  }

  // Admin routes
  public async getAllUsers(
    username: string,
    password: string,
  ): Promise<IUserData[]> {
    return this.post(`admin/getusers`, { username, password });
  }

  public async getUser(
    username: string,
    password: string,
    identifier: string | ObjectId,
  ): Promise<IUserData> {
    return this.post(`admin/getuser/${identifier}`, { username, password });
  }

  public async promoteUser(
    username: string,
    password: string,
    identifier: string | ObjectId,
    role: string,
  ): Promise<string> {
    return this.post(`admin/promoteuser`, {
      username,
      password,
      identifier,
      role,
    });
  }

  public async adminTogglePublishedState(
    username: string,
    password: string,
    identifier: string | ObjectId,
  ): Promise<IEntity> {
    return this.post(`admin/togglepublished`, {
      username,
      password,
      identifier,
    });
  }

  // TODO: Mail entry interface
  public async getMailEntries(
    username: string,
    password: string,
  ): Promise<{ [key: string]: any[] }> {
    return this.post(`mailer/getmailentries`, { username, password });
  }

  // TODO: Mail entry interface
  public async toggleMailAnswered(
    username: string,
    password: string,
    target: string,
    identifier: string | ObjectId,
  ): Promise<any> {
    return this.post(`mailer/toggleanswered/${target}/${identifier}`, {
      username,
      password,
    });
  }

  // Upload
  public async completeUpload(UUID: string, type: string): Promise<IFile[]> {
    return this.post(`uploadfinished`, { uuid: UUID, type });
  }

  public async cancelUpload(UUID: string, type: string): Promise<string> {
    return this.post(`uploadcancel`, { uuid: UUID, type });
  }

  // Utility
  public async addEntityOwner(
    username: string,
    password: string,
    entityId: string | ObjectId,
    ownerUsername: string,
  ): Promise<void> {
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
    entityId: string | ObjectId,
    ownerUsername: string,
  ): Promise<void> {
    return this.post(`utility/applyactiontoentityowner`, {
      username,
      password,
      command: 'remove',
      entityId,
      ownerUsername,
    });
  }

  public async countEntityUses(
    entityId: string | ObjectId,
  ): Promise<{
    occurences: number;
    compilations: ICompilation[];
  }> {
    return this.get(`utility/countentityuses/${entityId}`);
  }

  public async findEntityOwners(
    entityId: string | ObjectId,
  ): Promise<IStrippedUserData[]> {
    return this.get(`utility/findentityowners/${entityId}`);
  }

  public async findUserInGroups(): Promise<IGroup[]> {
    return this.get(`utility/finduseringroups`);
  }

  public async findUserInCompilations(): Promise<ICompilation[]> {
    return this.get(`utility/finduserincompilations`);
  }

  public async findUserInMetadata(): Promise<IEntity[]> {
    return this.get(`utility/finduserinmetadata`);
  }

  // Auth
  public async login(username: string, password: string): Promise<IUserData> {
    return this.post(`login`, { username, password });
  }

  public async registerAccount(accountData: any): Promise<string> {
    return this.post(`register`, accountData);
  }

  public async isAuthorized(): Promise<IUserData> {
    return this.get(`auth`);
  }
}
