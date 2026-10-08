import { dynamicLabDefinitions, simulateDynamicGarden } from "./DynamicGardenLab.js";

const assert = (value: boolean, message: string): void => { if (!value) throw new Error(message); };
const key = ({x,y}:{readonly x:number;readonly y:number}) => `${x},${y}`;

for (const definition of dynamicLabDefinitions) {
  const first=simulateDynamicGarden(definition); const second=simulateDynamicGarden(definition);
  assert(JSON.stringify(first)===JSON.stringify(second),`${definition.id} is deterministic`);
  assert(first.at(-1)?.type==="completed",`${definition.id} reference program completes`);
  for(const event of first.filter((candidate)=>candidate.type==="worldChanged")){
    if(event.type!=="worldChanged")continue;
    assert(key(event.snapshot.obstacle)!==key(event.snapshot.robot),`${definition.id} obstacle never occupies Pip's cell`);
    assert(key(event.snapshot.obstacle)!==key(definition.goal),`${definition.id} obstacle never occupies the battery`);
    assert(!definition.fixed.some((cell)=>key(cell)===key(event.snapshot.obstacle)),`${definition.id} obstacle never occupies a fixed hedge`);
  }
}

const triggered=simulateDynamicGarden(dynamicLabDefinitions.find((item)=>item.id==="triggered")!);
const triggerMove=triggered.findIndex((event)=>event.type==="moved"&&event.snapshot.robot.x===2&&event.snapshot.robot.y===4);
const gateMove=triggered.findIndex((event)=>event.type==="worldChanged"&&event.cause==="pressure-tile");
const nextSense=triggered.findIndex((event,index)=>index>gateMove&&event.type==="condition");
assert(triggerMove>=0&&gateMove===triggerMove+1&&nextSense>gateMove,"triggered gate moves after arrival and before the next condition");

const pushed=simulateDynamicGarden(dynamicLabDefinitions.find((item)=>item.id==="pushable")!);
assert(pushed.some((event)=>event.type==="worldChanged"&&event.cause==="pushed-by-pip"&&event.to.x===3&&event.to.y===3),"planter is pushed exactly one cell");
assert(pushed.filter((event)=>event.type==="worldChanged").length===1,"planter cannot be pushed into the fixed hedge");

console.log("dynamic garden lab: 13 tests passed");
