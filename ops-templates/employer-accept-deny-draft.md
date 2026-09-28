# Employer Accept / Deny — DRAFT ONLY (Ahmed approval required)

**Standing rule:** Do NOT auto-call or auto-email employers. Outbound waits for Ahmed’s explicit send approval.

## Accept draft (subject)
`[MEDA] Shortlist-Profil {CAND-*} · Angebot {offer_id} · bitte Accept/Deny`

## Accept draft (body)
Sehr geehrte Damen und Herren,

im Rahmen unserer Soft-Launch-Vermittlung übersenden wir das tokenisierte Profil **{CAND-*}** zu dem programmierten Angebot **{offer_id}** ({title}, {city}).

- Accept: {accept_url}
- Deny: {deny_url}

Dies ist keine Rechtsberatung und keine Visumzusage. Reine Personalvermittlung / Sprach- und Kommunikationspartner.

Mit freundlichen Grüßen  
MEDA Vermittlung  
meda-vermittlung@agentmail.to

## Ops routing
- Germany matches: set `route_flag: "Fatima"` in ops payload (documented handoff).
- PII (name/phone/email/HR email) stays in ops queue only — never in public chat replies.

## Models
Flagship-only drafting (claude-opus-5.5 / gpt-5.6-sol / grok-4.6) via CodeCraft when regenerating copy.
