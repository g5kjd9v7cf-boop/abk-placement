import ruleset from '../../data/placement-rules.json' with { type: 'json' };

export const PLACEMENT_RULES = Object.freeze(ruleset.rules.map((rule) => Object.freeze({ ...rule })));
export const PLACEMENT_NOTICE = ruleset.notice;
