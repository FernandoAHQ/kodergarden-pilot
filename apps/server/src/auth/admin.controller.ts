import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { AdminCatalogResponseV1, AdminDraftResponseV1, AdminDraftUpdateV1, AdminTeamMember, AdminTeamResponseV1, AdminValidationResponseV1, CampaignResponseV1 } from "@kodergarden/shared";
import { AdminCatalogService } from "../catalog/admin-catalog.service.js";
import { AuthService, type RequestLike } from "./auth.service.js";

@Controller("api/admin")
export class AdminController {
  constructor(private readonly auth: AuthService, private readonly catalog: AdminCatalogService) {}
  @Get("catalog") @Header("Cache-Control", "no-store")
  async catalogOverview(@Req() request: RequestLike): Promise<AdminCatalogResponseV1> {
    await this.auth.current(request);
    return this.catalog.overview();
  }
  @Post("campaigns/:slug/drafts") @Header("Cache-Control", "no-store")
  async createDraft(@Param("slug") slug:string,@Req() request:RequestLike):Promise<AdminDraftResponseV1>{const {user}=await this.auth.requireAdminCsrf(request);return this.catalog.createDraft(slug,user.id);}
  @Get("drafts/:id") @Header("Cache-Control", "no-store")
  async draft(@Param("id") id:string,@Req() request:RequestLike):Promise<AdminDraftResponseV1>{await this.auth.current(request);return this.catalog.draft(id);}
  @Patch("drafts/:id") @Header("Cache-Control", "no-store")
  async updateDraft(@Param("id") id:string,@Body() body:AdminDraftUpdateV1,@Req() request:RequestLike):Promise<AdminDraftResponseV1>{const {user}=await this.auth.requireAdminCsrf(request);return this.catalog.updateDraft(id,body,user.id);}
  @Get("drafts/:id/preview") @Header("Cache-Control", "no-store")
  async preview(@Param("id") id:string,@Query("locale") locale:string|undefined,@Req() request:RequestLike):Promise<CampaignResponseV1>{await this.auth.current(request);return this.catalog.preview(id,locale);}
  @Get("drafts/:id/validate") @Header("Cache-Control", "no-store")
  async validateDraft(@Param("id") id:string,@Req() request:RequestLike):Promise<AdminValidationResponseV1>{await this.auth.current(request);return this.catalog.validateDraft(id);}
  @Post("drafts/:id/publish") @Header("Cache-Control", "no-store")
  async publish(@Param("id") id:string,@Req() request:RequestLike):Promise<CampaignResponseV1>{const {user}=await this.auth.requireAdminCsrf(request);return this.catalog.publish(id,user.id);}
  @Post("drafts/:id/challenges") @Header("Cache-Control", "no-store")
  async duplicateChallenge(@Param("id") id:string,@Body() body:{sourceSlug?:string;slug?:string},@Req() request:RequestLike):Promise<AdminDraftResponseV1>{const {user}=await this.auth.requireAdminCsrf(request);return this.catalog.duplicateChallenge(id,body.sourceSlug??"",body.slug??"",user.id);}
  @Delete("drafts/:id/challenges/:slug") @Header("Cache-Control", "no-store")
  async removeChallenge(@Param("id") id:string,@Param("slug") slug:string,@Req() request:RequestLike):Promise<AdminDraftResponseV1>{const {user}=await this.auth.requireAdminCsrf(request);return this.catalog.removeChallenge(id,slug,user.id);}
  @Get("team") @Header("Cache-Control", "no-store")
  async team(@Req() request:RequestLike):Promise<AdminTeamResponseV1>{await this.auth.current(request);return this.auth.team();}
  @Post("team") @Header("Cache-Control", "no-store")
  async createMember(@Body() body:{email?:unknown;displayName?:unknown;password?:unknown;role?:unknown},@Req() request:RequestLike):Promise<AdminTeamMember>{await this.auth.requireAdminCsrf(request);return this.auth.createMember(body);}
  @Patch("team/:id") @Header("Cache-Control", "no-store")
  async updateMember(@Param("id") id:string,@Body() body:{role?:unknown;disabled?:unknown;password?:unknown},@Req() request:RequestLike):Promise<AdminTeamMember>{await this.auth.requireAdminCsrf(request);return this.auth.updateMember(id,body);}
}
