import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  Collection,
  ICompilation,
  IDigitalEntity,
  IEntity,
  IFile,
  IGroup,
  IInstitution,
  IPerson,
  IStrippedUserData,
  ITag,
  IUserData,
  ProfileType,
} from 'src/common';
import {
  IPublicProfile,
  IUserDataWithoutData,
  UserDataCollectionDocumentType,
} from 'src/common/interfaces';
import { environment } from 'src/environment';

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

export enum SortOrder {
  name = 'name',
  popularity = 'popularity',
  usage = 'usage',
  annotations = 'annotations',
  newest = 'newest',
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
  sortBy: SortOrder;
  reversed: boolean;
}

interface IExploreV2Request {
  searchText: string;
  filterBy: string;
  mediaTypes: string[];
  annotations: string[];
  access: string[];
  licences: string[];
  misc: string[];
  offset: number;
  limit: number;
  reversed: boolean;
  sortBy: SortOrder;
}

export interface IDownloadOptions {
  zipStats: {
    raw: number;
    processed: number;
  };
  rawSize: number;
  processedSize: number;
  hasCompressedFiles: boolean;
  rawFileTypes: string[];
  processedFileTypes: string[];
}

type SketchfabLicense = {
  fullName: string;
  label: string;
  requirements: string;
  uri: string;
  url: string;
  slug: string;
};

export type SketchfabModel = {
  uid: string;
  isDownloadable: boolean;
  name: string;
  description: string;
  license: SketchfabLicense | (Omit<SketchfabLicense, 'url'> & { url: string | null });
  thumbnails: {
    images: Array<
      Partial<{
        url: string;
        width: number;
        height: number;
      }>
    >;
  };
};

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  #endpoint = environment.server_url;
  #http = inject(HttpClient);

  public async get(path: string): Promise<any> {
    return firstValueFrom(this.#http.get(`${this.#endpoint}${path}`));
  }

  public async post(path: string, obj: any): Promise<any> {
    return firstValueFrom(this.#http.post(`${this.#endpoint}${path}`, obj));
  }

  // GETs
  public async getAllEntities(): Promise<IEntity[]> {
    return this.get(`api/v1/get/findall/${Collection.entity}`);
  }

  public async getAllPersons(): Promise<IPerson[]> {
    return this.get(`api/v1/get/findall/${Collection.person}`);
  }

  public async getAllInstitutions(): Promise<IInstitution[]> {
    return this.get(`api/v1/get/findall/${Collection.institution}`);
  }

  public async getAllTags(): Promise<ITag[]> {
    return this.get(`api/v1/get/findall/${Collection.tag}`);
  }

  public async getEntity(identifier: string): Promise<IEntity> {
    return this.get(`api/v1/get/find/${Collection.entity}/${identifier}`);
  }

  public async getEntityMetadata(identifier: string): Promise<IDigitalEntity> {
    return this.get(`api/v1/get/find/${Collection.digitalentity}/${identifier}`);
  }

  public async getAllCompilations(): Promise<ICompilation[]> {
    return this.get(`api/v1/get/findall/${Collection.compilation}`);
  }

  // PROFILE ROUTES
  public async getProfileByIdOrName({
    idOrName,
    type,
  }: {
    idOrName: string | number;
    type: string;
  }): Promise<IPublicProfile> {
    return this.get(`api/v2/profile/${type}/${idOrName}`);
  }

  public async getCurrentUserProfile(): Promise<IPublicProfile> {
    return this.get('api/v2/profile/user');
  }

  public async updateProfile(
    profileData: Omit<IPublicProfile, '_id'> & { _id?: string | undefined },
  ): Promise<IPublicProfile> {
    if (profileData.type === ProfileType.user) {
      return this.post('api/v2/profile/user', profileData);
    } else if (profileData.type === ProfileType.organization) {
      return profileData?._id
        ? this.post(`api/v2/profile/organization/${profileData._id}`, profileData)
        : this.post('api/v2/profile/organization', profileData);
    } else {
      throw new Error('Invalid profile type');
    }
  }

  /**
   * Fetch a resolved compilation by it's identifier
   * @param  {string |        ObjectId}  identifier Database _id of the compilation
   * @param  {string}  password   (Optional) Password of the compilation
   * @param  {[type]}             [description]
   * @return {Promise}            Returns the compilation or null if it's password protected
   */
  public async getCompilation(identifier: string, password?: string): Promise<ICompilation | null> {
    return password
      ? this.get(`api/v1/get/find/${Collection.compilation}/${identifier}/${password}`)
      : this.get(`api/v1/get/find/${Collection.compilation}/${identifier}`);
  }

  // Account specific GETs
  public async getAccounts(): Promise<IStrippedUserData[]> {
    return this.get('api/v1/get/users');
  }

  public async getGroups(): Promise<IGroup[]> {
    return this.get('api/v1/get/groups');
  }

  public async logout(): Promise<void> {
    return this.get('user-management/logout');
  }

  // POSTs
  public async explore(exploreRequest: IExploreRequest): Promise<{
    requestTime: number;
    results: Array<IEntity | ICompilation>;
    suggestions: string[];
  }> {
    return this.post('api/v1/post/explore', exploreRequest);
  }

  public async exploreV2(exploreRequest: IExploreV2Request): Promise<{
    requestTime: number;
    results: Array<IEntity | ICompilation>;
    suggestions: string[];
    count: number;
  }> {
    return this.post('api/v2/explore', exploreRequest);
  }

  public async pushEntity(entity: IEntity): Promise<IEntity> {
    return this.post(`api/v1/post/push/${Collection.entity}`, entity);
  }

  public async pushPerson(person: IPerson): Promise<IPerson> {
    return this.post(`api/v1/post/push/${Collection.person}`, person);
  }

  public async pushInstitution(institution: IInstitution): Promise<IInstitution> {
    return this.post(`api/v1/post/push/${Collection.institution}`, institution);
  }

  public async pushGroup(group: IGroup): Promise<IGroup> {
    return this.post(`api/v1/post/push/${Collection.group}`, group);
  }

  public async pushCompilation(Compilation: ICompilation): Promise<ICompilation> {
    return this.post(`api/v1/post/push/${Collection.compilation}`, Compilation);
  }

  public async pushDigitalEntity(DigitalEntity: IDigitalEntity): Promise<IDigitalEntity> {
    return this.post(`api/v1/post/push/${Collection.digitalentity}`, DigitalEntity);
  }

  public async deleteRequest(
    identifier: string,
    type: string,
    username: string,
    password: string,
  ): Promise<string> {
    return this.post(`api/v1/post/remove/${type}/${identifier}`, {
      username,
      password,
    });
  }

  public async leaveGroup(identifier: string): Promise<string> {
    return this.post(`api/v2/leave-group/${identifier}`, null);
  }

  public async removeSelfFromAccess(name: string, identifier: string): Promise<string> {
    return this.post(`api/v2/remove-self-from-access/${name}/${identifier}`, {});
  }

  public async sendUploadApplicationMail(mailRequest: ISendMailRequest): Promise<string> {
    return this.post('mail/sendmail', {
      ...mailRequest,
      target: ETarget.upload,
    });
  }

  public async sendBugReportMail(mailRequest: ISendMailRequest): Promise<string> {
    return this.post('mail/sendmail', {
      ...mailRequest,
      target: ETarget.bugreport,
    });
  }

  public async sendContactMail(mailRequest: ISendMailRequest): Promise<string> {
    return this.post('mail/sendmail', {
      ...mailRequest,
      target: ETarget.contact,
    });
  }

  // Admin routes
  public async getAllUsers(username: string, password: string): Promise<IUserData[]> {
    return this.post('admin/getusers', { username, password });
  }

  public async getUser(username: string, password: string, identifier: string): Promise<IUserData> {
    return this.post(`admin/getuser/${identifier}`, { username, password });
  }

  public async getDigest(
    username: string,
    password: string,
    params: { from: number; to: number; finished?: boolean; restricted?: boolean },
  ): Promise<IEntity<{}, false>[]> {
    let path = `admin/digest?from=${params.from}&to=${params.to}`;
    if (params.finished) path += `&finished=${params.finished}`;
    if (params.restricted) path += `&restricted=${params.restricted}`;
    return this.post(path, { username, password });
  }

  public async promoteUser(
    username: string,
    password: string,
    identifier: string,
    role: string,
  ): Promise<string> {
    return this.post('admin/promoteuser', {
      username,
      password,
      identifier,
      role,
    });
  }

  // TODO: Mail entry interface
  public async getMailEntries(
    username: string,
    password: string,
  ): Promise<{ [key: string]: any[] }> {
    return this.post('mail/getmailentries', { username, password });
  }

  // TODO: Mail entry interface
  public async toggleMailAnswered(
    username: string,
    password: string,
    target: string,
    identifier: string,
  ): Promise<any> {
    return this.post(`mail/toggleanswered/${target}/${identifier}`, {
      username,
      password,
    });
  }

  // Upload / Download
  public async completeUpload(uuid: string, type: string): Promise<{ files: IFile[] }> {
    return this.post('upload/finish', { uuid, type });
  }

  public async cancelUpload(uuid: string, type: string): Promise<string> {
    return this.post('upload/cancel', { uuid, type });
  }

  public async processUpload(
    uuid: string,
    type: string,
  ): Promise<{ status: string; type: string; uuid: string; requiresProcessing: boolean }> {
    return this.post('upload/process/start', { uuid, type });
  }

  public async processInfo(
    uuid: string,
    type: string,
  ): Promise<{ status: string; type: string; uuid: string; progress: number }> {
    return this.post('upload/process/info', { uuid, type });
  }

  public async getEntityDownloadStats(id: string): Promise<IDownloadOptions> {
    return this.get(`download/options/${id}`);
  }

  public prepareEntityDownload(id: string, type: 'raw' | 'processed') {
    return this.#http.get(`${this.#endpoint}download/prepare/${id}/${type}`, {
      responseType: 'text',
      observe: 'events',
      reportProgress: true,
    });
  }

  // Utility
  public async addEntityOwner(
    username: string,
    password: string,
    entityId: string,
    ownerUsername: string,
  ): Promise<void> {
    return this.post('utility/applyactiontoentityowner', {
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
  ): Promise<void> {
    return this.post('utility/applyactiontoentityowner', {
      username,
      password,
      command: 'remove',
      entityId,
      ownerUsername,
    });
  }

  public async countEntityUses(entityId: string): Promise<{
    occurences: number;
    compilations: ICompilation[];
  }> {
    return this.get(`utility/countentityuses/${entityId}`);
  }

  public async findEntityOwners(entityId: string): Promise<IStrippedUserData[]> {
    return this.get(`utility/findentityowners/${entityId}`);
  }

  public async findUserInGroups(): Promise<IGroup[]> {
    return this.get('utility/finduseringroups');
  }

  public async findUserInCompilations(): Promise<ICompilation[]> {
    return this.get('utility/finduserincompilations');
  }

  public async findUserInMetadata(): Promise<IEntity[]> {
    return this.get('utility/finduserinmetadata');
  }

  public async findEntitiesWithAccessRole(accessRole: string): Promise<IEntity[]> {
    return this.get(`api/v2/user-data/entities-with-access/${accessRole}`);
  }

  public async transferOwnerShip(entityId: string, targetUserId): Promise<IEntity> {
    return this.post(`api/v2/user-data/transfer-ownership`, { entityId, targetUserId });
  }

  public async checkIfChecksumExists(checksum: string): Promise<{
    checksum: string;
    existing: string | undefined;
  }> {
    return this.post('utility/checksumexists', { checksum });
  }

  // User-management
  public async login(username: string, password: string): Promise<IUserDataWithoutData> {
    return this.post('user-management/login', { username, password });
  }

  public async registerAccount(accountData: any): Promise<string> {
    return this.post('user-management/register', accountData);
  }

  public async isAuthorized(): Promise<IUserDataWithoutData> {
    return this.get('user-management/auth');
  }

  public async requestPasswordReset(username: string): Promise<any> {
    return this.post('user-management/help/request-reset', { username });
  }

  public async confirmPasswordResetRequest(
    username: string,
    token: string,
    password: string,
  ): Promise<any> {
    return this.post('user-management/help/confirm-reset', { username, token, password });
  }

  public async forgotUsername(mail: string): Promise<any> {
    return this.post('user-management/help/forgot-username', { mail });
  }

  // API V2
  public async getUserDataCollection<
    C extends Collection,
    T extends UserDataCollectionDocumentType<C>,
  >(collection: C, options?: { depth?: number } | { full?: boolean }): Promise<T[]> {
    const params = options
      ? Object.entries(options)
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
      : '';
    return this.get(`api/v2/user-data/${collection}` + (params ? `?${params}` : ''));
  }

  public async getPopularExploreSeachTerms(
    collection: 'entity' | 'compilation',
  ): Promise<[string, number][]> {
    return this.get(`api/v2/explore-popular-searches?collection=${collection}`).catch(() => []);
  }

  // Sketchfab Import
  public async getSketchfabModels(
    token: string,
  ): Promise<{ models: SketchfabModel[] } | undefined> {
    return this.post('sketchfab-import/get-models', { token });
  }

  public async getSketchfabModelDetails(modelId: string): Promise<SketchfabModel | undefined> {
    return this.get(`sketchfab-import/model-info/${modelId}`);
  }

  public async downloadAndPrepareSketchfabModel(
    token: string,
    modelId: string,
  ): Promise<IFile | undefined> {
    return this.post('sketchfab-import/download-and-prepare-model', { token, modelId });
  }
}
