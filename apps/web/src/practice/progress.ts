export interface PracticeProgress { readonly completed: readonly string[]; readonly recent?: string }
const key="kodergarden.practice.progress";
export const emptyProgress=():PracticeProgress=>({completed:[]});
export const loadProgress=():PracticeProgress=>{try{const value=JSON.parse(localStorage.getItem(key)??"");return Array.isArray(value.completed)?value:emptyProgress();}catch{return emptyProgress();}};
export const saveProgress=(progress:PracticeProgress):void=>localStorage.setItem(key,JSON.stringify(progress));
export const completeChallenge=(progress:PracticeProgress,id:string):PracticeProgress=>({completed:[...new Set([...progress.completed,id])],recent:id});
export const isUnlocked=(order:number,progress:PracticeProgress,ids:readonly string[]):boolean=>order===1||progress.completed.includes(ids[order-2]??"");
