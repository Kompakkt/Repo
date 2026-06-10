import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  Collection,
  ICompilation,
  IDigitalEntity,
  IEntity,
  IInstitution,
  IPerson,
  ProfileType,
  isEntity,
  isPerson,
  isResolvedPerson,
  isResolvedCompilation,
  isResolvedInstitution,
  isTag,
  isResolvedEntity,
  isInstitution,
  isCompilation,
  isDigitalEntity,
  UserRank,
} from '@kompakkt/common';
import {
  RequestBody,
  PathParams,
  QueryParams,
  Response,
  Endpoint,
  paths,
} from '@kompakkt/server-openapi';
import { environment } from 'src/environment';
import {
  ExploreRequestBody,
  PushSingleDocumentRequestBody,
  UpdateProfileOrganizationByIdRequestBody,
  UpdateProfileOrganizationRequestBody,
  UpdateProfileRequestBody,
  UpdateProfileUserRequestBody,
} from './types/backend-types';

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

export type CountEntityUsesResponse = {
  occurences: number;
  compilations: ICompilation[];
};

@Injectable({ providedIn: 'root' })
export class BackendService {
  readonly endpoint = environment.server_url;
  readonly http = inject(HttpClient);

  // Simple methods. These are shared with Plugins using the Kompakkt Extender
  public async get<T extends unknown>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(`${this.endpoint}${path}`));
  }

  public async post<T extends unknown>(path: string, obj: any): Promise<T> {
    return firstValueFrom(this.http.post<T>(`${this.endpoint}${path}`, obj));
  }

  // Helper methods for type-safe API calls based on the OpenAPI spec provided by the backend.

  private constructPathWithParams(
    path: string,
    {
      pathParams,
      queryParams,
    }: {
      pathParams?: Record<string, string | boolean | number>;
      queryParams?: Record<string, string | boolean | number | undefined>;
    },
  ) {
    let compiledPath = path;
    if (pathParams) {
      for (const [key, value] of Object.entries(pathParams)) {
        compiledPath = compiledPath.replace(`{${key}}`, value.toString());
      }
    }
    if (queryParams) {
      const queryString = Object.entries(queryParams)
        .map(([key, value]) =>
          value !== undefined ? `${key}=${encodeURIComponent(value.toString())}` : undefined,
        )
        .filter((v): v is string => !!v)
        .join('&');
      if (queryString.length > 0) {
        compiledPath += `?${queryString}`;
      }
    }
    return compiledPath;
  }

  public createGetPromise<Path extends keyof paths>(
    path: Path,
    {
      pathParams,
      queryParams,
      options,
    }: {
      pathParams: PathParams<Endpoint<'get', Path>>;
      queryParams: QueryParams<Endpoint<'get', Path>>;
      options?: Parameters<HttpClient['get']>[1];
    },
  ) {
    const compiledPath = this.constructPathWithParams(path as string, { pathParams, queryParams });
    return this.http.get<Response<Endpoint<'get', Path>>>(compiledPath, options);
  }

  public createGet<Path extends keyof paths>(
    path: Path,
    {
      pathParams,
      queryParams,
      options,
    }: {
      pathParams: PathParams<Endpoint<'get', Path>>;
      queryParams: QueryParams<Endpoint<'get', Path>>;
      options?: Parameters<HttpClient['get']>[1];
    },
  ) {
    return firstValueFrom(this.createGetPromise(path, { pathParams, queryParams, options }));
  }

  public createPostPromise<Path extends keyof paths>(
    path: Path,
    {
      body,
      pathParams,
      queryParams,
      options,
    }: {
      body: RequestBody<Endpoint<'post', Path>>;
      pathParams: PathParams<Endpoint<'post', Path>>;
      queryParams: QueryParams<Endpoint<'post', Path>>;
      options?: Parameters<HttpClient['post']>[2];
    },
  ) {
    const compiledPath = this.constructPathWithParams(path as string, { pathParams, queryParams });
    return this.http.post<Response<Endpoint<'post', Path>>>(compiledPath, body, options);
  }

  public createPost<Path extends keyof paths>(
    path: Path,
    {
      body,
      pathParams,
      queryParams,
      options,
    }: {
      body: RequestBody<Endpoint<'post', Path>>;
      pathParams: PathParams<Endpoint<'post', Path>>;
      queryParams: QueryParams<Endpoint<'post', Path>>;
      options?: Parameters<HttpClient['post']>[2];
    },
  ) {
    return firstValueFrom(this.createPostPromise(path, { body, pathParams, queryParams, options }));
  }

  // GETs
  private async getAllOfCollection(collection: Collection) {
    return this.createGet('/server/api/v1/get/findall/{collection}', {
      pathParams: { collection },
      queryParams: {},
    });
  }
  public async getAllPersons() {
    return this.getAllOfCollection(Collection.person).then(arr => arr.filter(isResolvedPerson));
  }

  public async getAllInstitutions() {
    return this.getAllOfCollection(Collection.institution).then(arr =>
      arr.filter(isResolvedInstitution),
    );
  }

  public async getAllTags() {
    return this.getAllOfCollection(Collection.tag).then(arr => arr.filter(isTag));
  }

  private async getSingleOfCollectionById(collection: Collection, identifier: string) {
    return this.createGet('/server/api/v1/get/find/{collection}/{identifier}', {
      pathParams: { collection, identifier },
      queryParams: {},
    });
  }

  public async getEntity(identifier: string) {
    return this.getSingleOfCollectionById(Collection.entity, identifier).then(res => {
      if (isEntity(res)) return res;
      return undefined;
    });
  }

  public async getCompilation(identifier: string) {
    return this.getSingleOfCollectionById(Collection.compilation, identifier).then(res => {
      if (isCompilation(res)) return res;
      return null;
    });
  }

  // PROFILE ROUTES
  public async getProfileById(id: string) {
    return this.createGet('/server/api/v2/profile/via-id/{id}', {
      pathParams: { id },
      queryParams: {},
    });
  }

  public async getUserOfProfile(id: string) {
    return this.createGet('/server/api/v2/profile/user-of-profile/{id}', {
      pathParams: { id },
      queryParams: {},
    });
  }

  public async getCurrentUserProfile() {
    return this.createGet('/server/api/v2/profile/user', { pathParams: {}, queryParams: {} });
  }

  public async updateProfile(
    // Overwrite _id for the organization case, otherwise we'd need seperate routes
    profileData: Omit<UpdateProfileRequestBody, '_id'> & { _id?: string | undefined },
  ) {
    if (profileData.type === ProfileType.user) {
      return this.createPost('/server/api/v2/profile/user', {
        body: profileData as UpdateProfileUserRequestBody,
        pathParams: {},
        queryParams: {},
      });
    } else if (profileData.type === ProfileType.organization) {
      if (!profileData._id) {
        return this.createPost('/server/api/v2/profile/organization', {
          body: profileData as UpdateProfileOrganizationRequestBody,
          pathParams: {},
          queryParams: {},
        });
      }
      return this.createPost('/server/api/v2/profile/organization/{id}', {
        body: profileData as UpdateProfileOrganizationByIdRequestBody,
        pathParams: { id: profileData._id },
        queryParams: {},
      });
    } else {
      throw new Error('Invalid profile type');
    }
  }

  // Account specific GETs
  public async getAccounts() {
    return this.createGet('/server/api/v1/get/users', { pathParams: {}, queryParams: {} });
  }

  public async logout() {
    return this.createGet('/server/user-management/logout', { pathParams: {}, queryParams: {} });
  }

  // POSTs
  public async explore(exploreRequest: ExploreRequestBody) {
    return this.createPost('/server/api/v2/explore', {
      body: exploreRequest,
      pathParams: {},
      queryParams: {},
    });
  }

  // Uses type-guard to infer the correct return type based on the collection, since all push endpoints return the same type
  private async pushSingleDocumentToCollection<T extends PushSingleDocumentRequestBody>(
    collection: Collection,
    document: T,
    guard: (obj: unknown) => obj is T,
  ): Promise<T> {
    return this.createPost('/server/api/v1/post/push/{collection}', {
      body: document,
      pathParams: { collection },
      queryParams: {},
    }).then(res => {
      if (guard(res)) return res;
      throw new Error('Unexpected response type');
    });
  }

  public async pushEntity(entity: IEntity) {
    return this.pushSingleDocumentToCollection(Collection.entity, entity, isEntity);
  }

  public async pushPerson(person: IPerson) {
    return this.pushSingleDocumentToCollection(Collection.person, person, isPerson);
  }

  public async pushInstitution(institution: IInstitution) {
    return this.pushSingleDocumentToCollection(Collection.institution, institution, isInstitution);
  }

  public async pushCompilation(compilation: ICompilation) {
    return this.pushSingleDocumentToCollection(Collection.compilation, compilation, isCompilation);
  }

  public async pushDigitalEntity(digitalEntity: IDigitalEntity) {
    return this.pushSingleDocumentToCollection(
      Collection.digitalentity,
      digitalEntity,
      isDigitalEntity,
    );
  }

  public async deleteRequest(
    identifier: string,
    collection: Collection,
    username: string,
    password: string,
  ) {
    return this.createPost('/server/api/v1/post/remove/{collection}/{identifier}', {
      body: { username, password },
      pathParams: { collection, identifier },
      queryParams: {},
    });
  }

  public async removeSelfFromAccess(collection: Collection, identifier: string) {
    return this.createPost('/server/api/v2/remove-self-from-access/{collection}/{identifier}', {
      body: {},
      pathParams: { collection, identifier },
      queryParams: {},
    });
  }

  // Admin routes
  public async getAllUsers(username: string, password: string) {
    return this.createPost('/server/admin/getusers', {
      body: { username, password },
      pathParams: {},
      queryParams: {},
    });
  }

  public async getUser(username: string, password: string, identifier: string) {
    return this.createPost('/server/admin/getuser/{identifier}', {
      body: { username, password },
      pathParams: { identifier },
      queryParams: {},
    });
  }

  public async getDigest(
    username: string,
    password: string,
    params: { from: number; to: number; finished?: boolean; restricted?: boolean },
  ) {
    return this.createPost('/server/admin/digest', {
      body: { username, password },
      pathParams: {},
      queryParams: {
        from: params.from,
        to: params.to,
        finished: params.finished ? 'true' : undefined,
        restricted: params.restricted ? 'true' : undefined,
      },
    });
  }

  public async promoteUser(username: string, password: string, identifier: string, role: UserRank) {
    return this.createPost('/server/admin/promoteuser', {
      body: { username, password, role, identifier },
      queryParams: {},
      pathParams: {},
    });
  }

  // Upload / Download
  public async completeUpload(uuid: string, type: string) {
    return this.createPost('/server/upload/finish', {
      body: { uuid, type },
      pathParams: {},
      queryParams: {},
    });
  }

  public async cancelUpload(uuid: string, type: string) {
    return this.createPost('/server/upload/cancel', {
      body: { uuid, type },
      pathParams: {},
      queryParams: {},
    });
  }

  public async processUpload(uuid: string, type: string) {
    return this.createPost('/server/upload/process/start', {
      body: { uuid, type },
      pathParams: {},
      queryParams: {},
    });
  }

  public async processInfo(uuid: string, type: string) {
    return this.createPost('/server/upload/process/info', {
      body: { uuid, type },
      pathParams: {},
      queryParams: {},
    });
  }

  public async getEntityDownloadStats(id: string) {
    return this.createGet('/server/download/options/{entityId}', {
      pathParams: { entityId: id },
      queryParams: {},
    });
  }

  public prepareEntityDownload(id: string, type: 'raw' | 'processed') {
    return this.createGetPromise('/server/download/prepare/{entityId}/{type}', {
      pathParams: { entityId: id, type },
      queryParams: {},
      // For some reason the Angular HttpClient types do not allow the combination of responseType 'text' and observe 'events'
      // even though this is technically allowed and works.
      options: {
        responseType: 'text',
        observe: 'events',
        reportProgress: true,
      } as any,
    });
  }

  // Utility
  public async countEntityUses(entityId: string) {
    return this.createGet('/server/utility/countentityuses/{id}', {
      pathParams: { id: entityId },
      queryParams: {},
    });
  }

  public async transferOwnerShip({
    docId,
    collection,
    targetUserId,
  }: {
    docId: string;
    collection: (typeof Collection)['entity'] | (typeof Collection)['compilation'];
    targetUserId: string;
  }) {
    return this.createPost('/server/api/v2/user-data/transfer-ownership', {
      body: { collection, docId, targetUserId },
      pathParams: {},
      queryParams: {},
    });
  }

  // User-management
  public async login(username: string, password: string) {
    return this.createPost('/server/user-management/login/{strategy}', {
      body: { username, password },
      pathParams: { strategy: 'local' },
      queryParams: {},
    });
  }

  public async registerAccount(
    accountData: RequestBody<Endpoint<'post', '/server/user-management/register'>>,
  ) {
    return this.createPost('/server/user-management/register', {
      body: accountData,
      pathParams: {},
      queryParams: {},
    });
  }

  public async isAuthorized() {
    return this.createGet('/server/user-management/auth', {
      pathParams: {},
      queryParams: {},
    });
  }

  public async requestPasswordReset(username: string) {
    return this.createPost('/server/user-management/help/request-reset', {
      body: { username },
      pathParams: {},
      queryParams: {},
    });
  }

  public async confirmPasswordResetRequest(username: string, token: string, password: string) {
    return this.createPost('/server/user-management/help/confirm-reset', {
      body: { username, token, password },
      pathParams: {},
      queryParams: {},
    });
  }

  public async forgotUsername(mail: string) {
    return this.createPost('/server/user-management/help/forgot-username', {
      body: { mail },
      pathParams: {},
      queryParams: {},
    });
  }

  // API V2
  public async getUserDataPersons(options: { depth?: number; full?: boolean; profileId?: string }) {
    return this.createGet('/server/api/v2/user-data/get-collection/person', {
      pathParams: {},
      queryParams: options,
    });
  }

  public async getUserDataInstitutions(options: {
    depth?: number;
    full?: boolean;
    profileId?: string;
  }) {
    return this.createGet('/server/api/v2/user-data/get-collection/institution', {
      pathParams: {},
      queryParams: options,
    });
  }

  public async getUserDataTags(options: { depth?: number; full?: boolean; profileId?: string }) {
    return this.createGet('/server/api/v2/user-data/get-collection/tag', {
      pathParams: {},
      queryParams: options,
    });
  }

  public async getUserDataEntities(options: {
    depth?: number;
    full?: boolean;
    profileId?: string;
  }) {
    return this.createGet('/server/api/v2/user-data/get-collection/entity', {
      pathParams: {},
      queryParams: options,
    });
  }

  public async getUserDataCompilations(options: {
    depth?: number;
    full?: boolean;
    profileId?: string;
  }) {
    return this.createGet('/server/api/v2/user-data/get-collection/compilation', {
      pathParams: {},
      queryParams: options,
    });
  }

  public async getUserDataDigitalEntities(options: {
    depth?: number;
    full?: boolean;
    profileId?: string;
  }) {
    return this.createGet('/server/api/v2/user-data/get-collection/digitalentity', {
      pathParams: {},
      queryParams: options,
    });
  }

  public async getUserDataAddresses(options: {
    depth?: number;
    full?: boolean;
    profileId?: string;
  }) {
    return this.createGet('/server/api/v2/user-data/get-collection/address', {
      pathParams: {},
      queryParams: options,
    });
  }

  public async getUserDataAnnotations(options: {
    depth?: number;
    full?: boolean;
    profileId?: string;
  }) {
    return this.createGet('/server/api/v2/user-data/get-collection/annotation', {
      pathParams: {},
      queryParams: options,
    });
  }

  public async getUserDataContacts(options: {
    depth?: number;
    full?: boolean;
    profileId?: string;
  }) {
    return this.createGet('/server/api/v2/user-data/get-collection/contact', {
      pathParams: {},
      queryParams: options,
    });
  }

  public async getUserDataPhysicalEntities(options: {
    depth?: number;
    full?: boolean;
    profileId?: string;
  }) {
    return this.createGet('/server/api/v2/user-data/get-collection/physicalentity', {
      pathParams: {},
      queryParams: options,
    });
  }

  public async getPopularExploreSeachTerms(collection: 'entity' | 'compilation') {
    return this.createGet('/server/api/v2/explore-popular-searches', {
      pathParams: {},
      queryParams: { collection },
    });
  }

  public async createEmptyCompilation(
    data: Pick<ICompilation, 'name' | 'description'> & { profileId: string },
  ) {
    return this.createPost('/server/api/v2/compilation/create-empty', {
      body: data,
      pathParams: {},
      queryParams: {},
    });
  }

  public async updateCompilationMetadata(
    data: Pick<ICompilation, 'name' | 'description' | '_id'> & { profileId: string },
  ) {
    return this.createPost('/server/api/v2/compilation/update-metadata', {
      body: data,
      pathParams: {},
      queryParams: {},
    });
  }

  public async addToCompilations(data: { compilationIds: string[]; entityIds: string[] }) {
    return this.createPost('/server/api/v2/compilation/add-entities', {
      body: data,
      pathParams: {},
      queryParams: {},
    });
  }

  public async removeFromCompilation(data: { compilationId: string; entityIds: string[] }) {
    return this.createPost('/server/api/v2/compilation/remove-entities', {
      body: data,
      pathParams: {},
      queryParams: {},
    });
  }

  // Sketchfab Import
  public async getSketchfabModels(token: string) {
    return this.createPost('/server/sketchfab-import/get-models', {
      body: { token },
      pathParams: {},
      queryParams: {},
    });
  }

  public async getSketchfabModelDetails(modelId: string) {
    return this.createGet('/server/sketchfab-import/model-info/{id}', {
      pathParams: { id: modelId },
      queryParams: {},
    });
  }

  public async downloadAndPrepareSketchfabModel(token: string, modelId: string) {
    return this.createPost('/server/sketchfab-import/download-and-prepare-model', {
      body: { token, modelId },
      pathParams: {},
      queryParams: {},
    });
  }
}
