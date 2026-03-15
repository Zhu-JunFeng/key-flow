// Common word lists for typing games
export const EASY_WORDS = [
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
  'how', 'its', 'may', 'new', 'now', 'old', 'see', 'way', 'who', 'did',
  'let', 'say', 'she', 'too', 'use', 'big', 'run', 'set', 'try', 'ask',
  'men', 'put', 'end', 'far', 'hand', 'help', 'home', 'keep', 'last',
  'long', 'make', 'much', 'name', 'only', 'over', 'such', 'take', 'than',
  'them', 'very', 'when', 'come', 'each', 'just', 'like', 'look', 'many',
  'most', 'must', 'same', 'tell', 'also', 'back', 'been', 'call', 'down',
  'find', 'give', 'good', 'have', 'high', 'know', 'left', 'life', 'live',
  'made', 'more', 'move', 'need', 'next', 'open', 'part', 'play', 'read',
];

export const MEDIUM_WORDS = [
  'about', 'after', 'again', 'being', 'below', 'could', 'every', 'first',
  'found', 'great', 'house', 'large', 'learn', 'might', 'never', 'often',
  'other', 'place', 'point', 'right', 'small', 'sound', 'spell', 'still',
  'think', 'under', 'water', 'where', 'which', 'world', 'write', 'young',
  'begin', 'black', 'built', 'carry', 'clean', 'close', 'color', 'cover',
  'early', 'earth', 'eight', 'field', 'force', 'front', 'green', 'group',
  'heavy', 'human', 'light', 'money', 'music', 'north', 'order', 'paper',
  'power', 'quick', 'river', 'round', 'short', 'shown', 'since', 'sleep',
  'south', 'space', 'stand', 'start', 'story', 'study', 'table', 'three',
  'today', 'until', 'watch', 'white', 'whole', 'woman', 'usual', 'voice',
];

export const HARD_WORDS = [
  'accept', 'across', 'almost', 'always', 'amount', 'animal', 'answer',
  'appear', 'become', 'before', 'behind', 'better', 'beyond', 'button',
  'change', 'charge', 'choice', 'church', 'client', 'common', 'couple',
  'create', 'danger', 'decide', 'design', 'detail', 'during', 'effect',
  'enough', 'entire', 'expect', 'family', 'figure', 'finger', 'follow',
  'friend', 'future', 'garden', 'global', 'ground', 'growth', 'happen',
  'health', 'impact', 'import', 'indeed', 'inside', 'island', 'itself',
  'manage', 'market', 'matter', 'member', 'method', 'minute', 'modern',
  'moment', 'motion', 'nation', 'nature', 'normal', 'notice', 'number',
  'object', 'office', 'option', 'output', 'parent', 'people', 'period',
  'person', 'police', 'policy', 'pretty', 'public', 'rather', 'reason',
  'record', 'reduce', 'remain', 'remove', 'report', 'result', 'return',
  'screen', 'search', 'season', 'second', 'secret', 'senior', 'series',
  'server', 'should', 'simple', 'single', 'social', 'source', 'street',
  'strong', 'summer', 'supply', 'system', 'toward', 'travel', 'unique',
  'update', 'weight', 'window', 'winter', 'wonder', 'worker', 'yellow',
];

export function getRandomWord(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): string {
  const list = difficulty === 'easy' ? EASY_WORDS : difficulty === 'hard' ? HARD_WORDS : MEDIUM_WORDS;
  return list[Math.floor(Math.random() * list.length)];
}

export function getRandomWords(count: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): readonly string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(getRandomWord(difficulty));
  }
  return result;
}
