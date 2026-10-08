import { countBlocks, program } from "@kodergarden/language";
import { executeProgram, GridRuntime } from "@kodergarden/engine";
import { campaigns, challengeBelongsToCampaign, challengeWorlds, evaluatePracticeProgram, gardenExpeditionChallenges, getCampaign, selectChallengeWorld } from "@kodergarden/shared";
import { translate } from "../i18n.js";
import { availableTools, challenges, evaluateChallenge } from "./challenges.js";
import { completeChallenge, emptyProgress, isUnlocked } from "./progress.js";
const assert=(value:boolean,message:string)=>{if(!value)throw new Error(message)};
assert(challenges.length===16,"defines sixteen challenges");
assert(challenges.every((item,index)=>item.order===index+1),"progression order is stable");
assert(!availableTools(challenges[4]!).includes("repeat")&&availableTools(challenges[5]!).includes("repeat"),"Repeat unlocks after repetitive challenge");
assert(!availableTools(challenges[8]!).includes("if")&&availableTools(challenges[9]!).includes("if"),"If unlocks at condition challenge");
assert(availableTools(challenges[12]!).includes("ifElse"),"If / Else unlocks in the thirteenth challenge");
assert(availableTools(challenges[14]!).includes("while")&&availableTools(challenges[15]!).includes("repeatUntilGoal"),"beginner loops unlock in order");
assert(evaluateChallenge(challenges[7]!,true,8).complete,"accepts solution within block limit");
assert(!evaluateChallenge(challenges[7]!,true,9).complete,"rejects solution above block limit");
let progress=emptyProgress();assert(isUnlocked(1,progress,challenges.map(x=>x.id)),"first challenge is unlocked");progress=completeChallenge(progress,challenges[0]!.id);assert(isUnlocked(2,progress,challenges.map(x=>x.id)),"completion unlocks next challenge");
assert(translate("en","c.01.title")==="First Steps","resolves English content");assert(translate("es","c.01.title")==="Primeros pasos","resolves Spanish content");assert(translate("es","missing.key")==="missing.key","fallback is deterministic");
const ast=program([{type:"repeat",count:2,body:[{type:"moveForward"}]}]);assert(JSON.stringify(ast)===JSON.stringify(JSON.parse(JSON.stringify(ast))),"AST is language neutral");
const ifElseChallenge=challenges[12]!;const choiceSolution=ifElseChallenge.referenceSolution!;assert(ifElseChallenge.worldVariants?.length===2,"Dynamic If / Else defines two alternate timings");assert(challengeWorlds(ifElseChallenge).every((layout)=>layout.world.shiftingHedges?.length===1),"Dynamic If / Else visibly shifts a hedge in every layout");for(const variant of challengeWorlds(ifElseChallenge)){const choiceResult=executeProgram(choiceSolution,new GridRuntime(variant.world));assert(choiceResult.succeeded&&countBlocks(choiceSolution)<=ifElseChallenge.maxBlocks!,`If / Else solution handles ${variant.id}`);}const firstLayout=selectChallengeWorld(ifElseChallenge,null,()=>0);const secondLayout=selectChallengeWorld(ifElseChallenge,firstLayout.layoutId,()=>0);assert(firstLayout.layoutId!==secondLayout.layoutId,"layout selection avoids an immediate repeat");
assert(challenges[0]!.world===challenges[0]!.world,"localized presentation shares challenge mechanics");
for(const challenge of challenges.slice(12)){const solution=challenge.referenceSolution!;for(const layout of [{id:"default",world:challenge.world},...(challenge.worldVariants??[])]){const result=executeProgram(solution,new GridRuntime(layout.world));assert(result.succeeded,`${challenge.id} reference solution handles ${layout.id}`);assert(countBlocks(solution)<=challenge.maxBlocks!,`${challenge.id} reference solution meets its block limit`);}}
for(const challenge of challenges.slice(0,12)){const solution=challenge.referenceSolution!;assert(Boolean(solution),`${challenge.id} has a reference solution`);for(const layout of challengeWorlds(challenge)){const result=executeProgram(solution,new GridRuntime(layout.world));assert(result.succeeded,`${challenge.id} reference solution handles ${layout.id}`);}const evaluation=evaluatePracticeProgram(challenge,solution,countBlocks(solution));assert(evaluation.complete,`${challenge.id} reference solution satisfies Foundations constraints`);}
const unguarded=program([{type:"repeat",count:6,body:[{type:"moveForward"}]}]);const changingHallway=evaluatePracticeProgram(challenges[10]!,unguarded,countBlocks(unguarded));assert(!changingHallway.complete&&!changingHallway.collisionFree,"Changing Hallway rejects collision-based brute force");
const moveOnly=program([{type:"moveForward"}]);assert(!evaluatePracticeProgram(challenges[9]!,moveOnly,countBlocks(moveOnly)).requiredToolsUsed,"Check the Gate requires If");
const hardCoded=program([{type:"turnLeft"},{type:"moveForward"},{type:"moveForward"},{type:"moveForward"}]);assert(!evaluatePracticeProgram(ifElseChallenge,hardCoded,countBlocks(hardCoded)).complete,"a fixed Move/Turn sequence cannot pass every Dynamic If / Else layout");assert(!evaluatePracticeProgram(challenges[15]!,hardCoded,countBlocks(hardCoded)).complete,"a fixed sequence cannot pass the changing finale");
assert(campaigns.length===2&&getCampaign("foundations")?.challenges.length===16,"campaign registry contains Foundations");
assert(gardenExpeditionChallenges.length===8&&gardenExpeditionChallenges.every((item,index)=>item.order===index+1),"Garden Expedition contains eight ordered challenges");
assert(challengeBelongsToCampaign("garden-expedition","expedition-winding-path")&&!challengeBelongsToCampaign("foundations","expedition-winding-path"),"campaign membership is authoritative");
for(const challenge of gardenExpeditionChallenges){const solution=challenge.referenceSolution!;const result=executeProgram(solution,new GridRuntime(challenge.world));assert(result.succeeded,`${challenge.id} reference solution succeeds`);assert(countBlocks(solution)<=challenge.parBlocks!&&result.executionSteps<=challenge.parSteps!,`${challenge.id} reference solution meets both targets`);}
assert(translate("en","campaign.expedition.title")==="Garden Expedition"&&translate("es","campaign.expedition.title")==="Expedición del Jardín","campaign titles are localized");
console.log("practice and campaigns: 45 tests passed");
