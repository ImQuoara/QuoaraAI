export type ContentPolicyDecision = {
  allowed: boolean;
  code: 'ok' | 'minor_sexual_content' | 'nonconsensual_sexual_content' | 'sexual_exploitation';
  reason?: string;
  tags: string[];
};

const SEXUAL_TERMS = [
  'sex', 'sexual', 'nude', 'naked', 'erotic', 'porn', 'nsfw', 'fetish', 'lingerie', 'topless',
  'breasts', 'nipples', 'genitals', 'blowjob', 'oral sex', 'intercourse', 'cum', 'pinup', 'explicit'
];

const MINOR_TERMS = [
  'child', 'children', 'kid', 'kids', 'minor', 'minors', 'underage', 'teen', 'teenage', 'toddler',
  'preteen', 'schoolgirl', 'schoolboy', 'little girl', 'little boy', 'barely legal', 'young teen'
];

const COERCION_TERMS = [
  'rape', 'raped', 'forced', 'force sex', 'coerced', 'coercion', 'blackmail', 'unconscious', 'sleeping',
  'drugged', 'trafficking', 'captive', 'kidnapped', 'unwilling', 'non-consensual', 'nonconsensual'
];

const EXPLOITATION_TERMS = [
  'incest', 'bestiality', 'exploit', 'abuse'
];

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function evaluateMediaPrompt(prompt: string): ContentPolicyDecision {
  const text = prompt.toLowerCase();
  const tags: string[] = [];
  const sexual = hasAny(text, SEXUAL_TERMS);
  const minor = hasAny(text, MINOR_TERMS);
  const coercion = hasAny(text, COERCION_TERMS);
  const exploitation = hasAny(text, EXPLOITATION_TERMS);

  if (sexual) tags.push('sexual');
  if (minor) tags.push('minor');
  if (coercion) tags.push('coercion');
  if (exploitation) tags.push('exploitation');

  if (sexual && minor) {
    return {
      allowed: false,
      code: 'minor_sexual_content',
      reason: 'QuoaraAi blocks sexualized content involving children or minors.',
      tags,
    };
  }

  if (sexual && coercion) {
    return {
      allowed: false,
      code: 'nonconsensual_sexual_content',
      reason: 'QuoaraAi blocks non-consensual or coercive sexual content.',
      tags,
    };
  }

  if (sexual && exploitation) {
    return {
      allowed: false,
      code: 'sexual_exploitation',
      reason: 'QuoaraAi blocks sexual exploitation and abusive content.',
      tags,
    };
  }

  return { allowed: true, code: 'ok', tags };
}
