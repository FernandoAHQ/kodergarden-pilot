import { DataSource } from "typeorm";
import { catalogEntities, CampaignEntity, CampaignRevisionEntity } from "./catalog.entities.js";
import { InitialCatalogSchema1791394000000 } from "../migrations/1791394000000-InitialCatalogSchema.js";
import { AdminAuthSchema1791395000000 } from "../migrations/1791395000000-AdminAuthSchema.js";
import { seedCatalog } from "./seed-catalog.js";
import { CatalogService } from "./catalog.service.js";
import { authEntities, AdminSessionEntity, AdminUserEntity } from "../auth/auth.entities.js";
import { seedAdmin } from "../auth/seed-admin.js";
import { AuthService, type ResponseLike } from "../auth/auth.service.js";

const url = process.env.DATABASE_URL ?? "";
if (!/kodergarden_test(?:\?|$)/.test(url)) throw new Error("Database tests require a DATABASE_URL whose database is named kodergarden_test");
const dataSource = new DataSource({ type: "postgres", url, entities: [...catalogEntities, ...authEntities], migrations: [InitialCatalogSchema1791394000000, AdminAuthSchema1791395000000], synchronize: false });
await dataSource.initialize();
try {
  await dataSource.dropDatabase(); await dataSource.runMigrations();
  await seedCatalog(dataSource); await seedCatalog(dataSource);
  const campaignRepo=dataSource.getRepository(CampaignEntity); const revisionRepo=dataSource.getRepository(CampaignRevisionEntity);
  const service=new CatalogService(campaignRepo,revisionRepo);
  const catalog=await service.summaries("en");
  if(catalog.campaigns.length!==2)throw new Error("seed must be idempotent");
  const foundations=(await service.campaign("foundations","es")).campaign;
  if(foundations.challenges.length!==13||foundations.challenges[12]?.worldVariants?.length!==4)throw new Error("seeded catalog must preserve challenges and dynamic layouts");
  if(!foundations.revisionId)throw new Error("published campaign must expose a revision id");
  let duplicateRejected=false;try{await dataSource.query(`INSERT INTO campaign_revisions(campaign_id,version,status,kind,display_order) SELECT campaign_id,version,status,kind,display_order FROM campaign_revisions LIMIT 1`);}catch{duplicateRejected=true;}if(!duplicateRejected)throw new Error("revision uniqueness constraint missing");
  if(await seedAdmin(dataSource,"TEAM@EXAMPLE.COM","correct-horse-battery-staple","Team Admin")!=="created")throw new Error("first admin must be created");
  if(await seedAdmin(dataSource,"team@example.com","different-password","Ignored")!=="exists")throw new Error("admin seed must be idempotent");
  const auth=new AuthService(dataSource.getRepository(AdminUserEntity),dataSource.getRepository(AdminSessionEntity));
  let cookie="";const response:ResponseLike={cookie:(name,value)=>{cookie=`${name}=${value}`;},clearCookie:()=>{cookie="";}};
  const session=await auth.login("team@example.com","correct-horse-battery-staple",{headers:{},ip:"127.0.0.1"},response);
  if(!cookie||session.user.email!=="team@example.com")throw new Error("admin login must issue a session cookie");
  const request={headers:{cookie,"x-kodergarden-csrf":session.csrfToken},ip:"127.0.0.1"};
  if((await auth.current(request)).user.id!==session.user.id)throw new Error("issued admin session must authenticate");
  await auth.logout(request,response);
  let rejected=false;try{await auth.current(request);}catch{rejected=true;}if(!rejected)throw new Error("logout must revoke the admin session");
  console.log("database: catalog and admin migration, seed, constraints, mapping, and session lifecycle passed");
} finally { await dataSource.destroy(); }
