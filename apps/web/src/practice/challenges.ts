import { evaluatePracticeChallenge, practiceChallenges, type PracticeChallengeDefinition } from "@kodergarden/shared";

export type PracticeChallenge = PracticeChallengeDefinition;
export const challenges = practiceChallenges;
export const evaluateChallenge = evaluatePracticeChallenge;
export const availableTools=(challenge:PracticeChallenge)=>challenge.allowed;
