# Employer Accept / Deny — DRAFT ONLY (Ahmed approval required)

**Standing rule:** Do NOT auto-call or auto-email employers. Outbound waits for Ahmed’s explicit send approval.

## Accept draft (subject)
`[MEDA] Shortlist-Profil {CAND-*} · Angebot {offer_id} · bitte Accept/Deny`

## Accept draft (body)
Sehr geehrte Damen und Herren,

im Rahmen unserer Soft-Launch-Vermittlung übersenden wir das tokenisierte Profil **{CAND-*}** zu dem programmierten Angebot **{offer_id}** ({title}, {city}).

- Accept: {accept_url}
- Deny: {deny_url}
- E-Sign (Arbeitgeber, Entwurf — nicht senden, bis Ahmed freigibt): {employer_sign_url}

Dies ist keine Rechtsberatung und keine Visumzusage. Reine Personalvermittlung / Sprach- und Kommunikationspartner.

Der Link `{employer_sign_url}` steht nur in der Ops-Nutzlast (`employer_sign_url` / `employer_sign_links`, Status `draft_pending_review`, `auto_send: false`). Keine E-Mail an die andere Seite, bis Ahmed den Versand freigibt.

Nach einer Unterschrift erhält die unterzeichnende Person eine speicherbare Kopie auf der Seite. Eine E-Mail an ihre eigene Adresse geht nur, wenn sie `send_signer_copy` selbst setzt. MEDA erhält die signierte Nutzlast über `/intake` an `meda-vermittlung@agentmail.to` und `MEDA-team@outlook.com`.

Wenn Ahmed den Versand an den Arbeitgeber später freigibt, öffnet der Button in dieser E-Mail `employer-sign.html`. Die Seite ist der digitale Vertrag: langfristige Zusammenarbeit mit Meda Family / MEDA Vermittlung, Auswahllisten, und eine Gebühr per gesonderter Rechnung an den Arbeitgeber. Beträge bleiben `[TODO Anwalt / Gebührentabelle]`. Kein Euro-Betrag erfinden. Bis zur Freigabe bleibt `auto_send: false`.

Mit freundlichen Grüßen  
MEDA Vermittlung  
meda-vermittlung@agentmail.to

## Ops routing
- Germany matches: set `route_flag: "Fatima"` in ops payload (documented handoff).
- PII (name/phone/email/HR email) stays in ops queue only — never in public chat replies.

## Models
Flagship-only drafting (claude-opus-5.5 / gpt-5.6-sol / grok-4.6) via CodeCraft when regenerating copy.
