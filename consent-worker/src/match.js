import { PLACEMENT_RULES } from './placement-rules.js';

export const PROFESSIONS = Object.freeze([
  'healthcare',
  'engineering',
  'logistics',
  'it',
  'ausbildung',
]);

export const LANGUAGE_RANK = Object.freeze({
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
});

export function languageRank(level) {
  if (typeof level !== 'string') return 0;
  return LANGUAGE_RANK[level.trim().toUpperCase()] || 0;
}

/**
 * A rule matches when the typed facts meet its profession, language,
 * experience and certificate-keyword requirements. File bytes are ignored.
 */
export function ruleMatches(facts, rule) {
  if (!facts || !rule) return false;
  if (rule.profession !== facts.profession) return false;
  if (languageRank(facts.language_level) < languageRank(rule.min_language)) return false;
  const minimum = Number(rule.min_experience_years);
  if (!Number.isInteger(facts.experience_years) || facts.experience_years < minimum) return false;
  const keywords = Array.isArray(rule.certificate_keywords) ? rule.certificate_keywords : [];
  if (keywords.length) {
    const hay = String(facts.certificates || '').toLocaleLowerCase();
    const hit = keywords.some((keyword) => {
      const needle = String(keyword || '').toLocaleLowerCase();
      return needle.length > 0 && hay.includes(needle);
    });
    if (!hit) return false;
  }
  return true;
}

export function matchPlacement(facts, rules = PLACEMENT_RULES) {
  const list = Array.isArray(rules) ? rules : [];
  for (const rule of list) {
    if (!ruleMatches(facts, rule)) continue;
    return {
      matched: true,
      rule_id: String(rule.id),
      sample: rule.sample !== false,
    };
  }
  return { matched: false, rule_id: null, sample: false };
}

export function employerContact(decision, shareWithEmployer) {
  return Boolean(decision && decision.matched && shareWithEmployer);
}
