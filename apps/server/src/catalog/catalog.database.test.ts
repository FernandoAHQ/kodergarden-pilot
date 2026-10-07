import { DataSource } from "typeorm";
import { catalogEntities, CampaignEntity, CampaignRevisionEntity } from "./catalog.entities.js";
import { InitialCatalogSchema1791394000000 } from "../migrations/1791394000000-InitialCatalogSchema.js";
import { seedCatalog } from "./seed-catalog.js";
import { CatalogService } from "./catalog.service.js";

const url = process.env.DATABASE_URL ?? "";
if (!/kodergarden_test(?:\?|$)/.test(url)) throw new Error("Database tests require a DATABASE_URL whose database is named kodergarden_test");
const dataSource = new DataSource({ type: "postgres", url, entities: catalogEntities, migrations: [InitialCatalogSchema1791394000000], synchronize: false });
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
  console.log("catalog database: migration, seed, constraints, and mapping passed");
} finally { await dataSource.destroy(); }
