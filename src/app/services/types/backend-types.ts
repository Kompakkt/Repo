// Derived types from the OpenAPI specification

import {
  RequestBody,
  PathParams,
  QueryParams,
  Response,
  Endpoint,
  paths,
} from '@kompakkt/server-openapi';

export type GetAllOfCollectionResponse = Response<
  Endpoint<'get', '/server/api/v1/get/findall/{collection}'>
>;
export type GetSingleDocumentResponse = Response<
  Endpoint<'get', '/server/api/v1/get/find/{collection}/{identifier}'>
>;

export type GetProfileByIdResponse = Response<
  Endpoint<'get', '/server/api/v2/profile/via-id/{id}'>
>;
export type GetUserOfProfileResponse = Response<
  Endpoint<'get', '/server/api/v2/profile/user-of-profile/{id}'>
>;
export type GetCurrentUserProfileResponse = Response<
  Endpoint<'get', '/server/api/v2/profile/user'>
>;

export type UpdateProfileUserResponse = Response<Endpoint<'post', '/server/api/v2/profile/user'>>;
export type UpdateProfileOranizationResponse = Response<
  Endpoint<'post', '/server/api/v2/profile/organization'>
>;
export type UpdateProfileOranizationByIdResponse = Response<
  Endpoint<'post', '/server/api/v2/profile/organization/{id}'>
>;
export type UpdateProfileResponse =
  | UpdateProfileUserResponse
  | UpdateProfileOranizationResponse
  | UpdateProfileOranizationByIdResponse;

export type UpdateProfileUserRequestBody = RequestBody<
  Endpoint<'post', '/server/api/v2/profile/user'>
>;
export type UpdateProfileOrganizationRequestBody = RequestBody<
  Endpoint<'post', '/server/api/v2/profile/organization'>
>;
export type UpdateProfileOrganizationByIdRequestBody = RequestBody<
  Endpoint<'post', '/server/api/v2/profile/organization/{id}'>
>;
export type UpdateProfileRequestBody =
  | UpdateProfileUserRequestBody
  | UpdateProfileOrganizationRequestBody
  | UpdateProfileOrganizationByIdRequestBody;

export type GetUsersResponse = Response<Endpoint<'get', '/server/api/v1/get/users'>>;

export type LogoutResponse = Response<Endpoint<'post', '/server/user-management/logout'>>;

export type ExploreRequestBody = RequestBody<Endpoint<'post', '/server/api/v2/explore'>>;
export type ExploreResponse = Response<Endpoint<'post', '/server/api/v2/explore'>>;

export type PushSingleDocumentRequestBody = RequestBody<
  Endpoint<'post', '/server/api/v1/post/push/{collection}'>
>;
export type PushSingleDocumentResponse = Response<
  Endpoint<'post', '/server/api/v1/post/push/{collection}'>
>;

export type RemoveSelfFromAccessResponse = Response<
  Endpoint<'post', '/server/api/v2/remove-self-from-access/{collection}/{identifier}'>
>;

export type SendMailRequestBody = RequestBody<Endpoint<'post', '/server/mail/sendmail'>>;
export type SendMailResponse = Response<Endpoint<'post', '/server/mail/sendmail'>>;

export type AdminGetUsersResponse = Response<Endpoint<'post', '/server/admin/getusers'>>;
export type AdminGetUserByIdResponse = Response<
  Endpoint<'post', '/server/admin/getuser/{identifier}'>
>;
