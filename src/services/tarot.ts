import { callDeepSeekStream } from './deepseek-client';
import { buildTarotPrompt } from '../prompts/tarot';
import { drawCardsFromDB, type TarotCardData } from '../data/tarot-deck';
import { saveTarotReading } from './db-tarot';

export type SpreadType = 'single' | 'three' | 'celtic';

export interface TarotReadingResult {
  cards: Array<{
    name: string;
    position: string;
    interpretation: string;
  }>;
  overall: string;
  action?: string;
  caution?: string;
  timing?: string;
  advice: string;
  keyMessage: string;
}

export interface DrawnCard extends TarotCardData {
  isReversed: boolean;
}

const SPREAD_CARD_COUNT: Record<SpreadType, number> = {
  single: 1,
  three: 3,
  celtic: 10,
};

export async function getSpreadCards(spreadType: SpreadType, majorOnly = true): Promise<DrawnCard[]> {
  return drawCardsFromDB(SPREAD_CARD_COUNT[spreadType], majorOnly);
}

export async function getTarotReading(
  question: string,
  cards: DrawnCard[],
  spreadType: SpreadType,
  onStream?: (partial: string) => void,
): Promise<TarotReadingResult> {
  const prompt = buildTarotPrompt(
    question,
    cards.map(c => ({ name: `${c.nameKo} (${c.name})`, isReversed: c.isReversed })),
    spreadType,
  );
  const text = await callDeepSeekStream(prompt, onStream ?? (() => {}));
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid DeepSeek response');
  const result: TarotReadingResult = JSON.parse(jsonMatch[0]);

  saveTarotReading(question, spreadType, cards, result).catch(console.warn);

  return result;
}
