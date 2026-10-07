(function () {
  'use strict';

  var RULES = window.MEDA_ESIGN_RULES;
  var LANGS = ['de', 'en', 'fr', 'ar'];
  var COPY = {
    de: {
      skip: 'Zum Inhalt',
      navEmployers: 'Für Arbeitgeber',
      navContact: 'Kontakt',
      footerNote: 'Vorläufig · Keine Rechtsberatung · Kopie nur an Sie und an MEDA',
      pageTitleCandidate: 'Interessensbekundung unterschreiben — MEDA Vermittlung',
      pageTitleEmployer: 'Arbeitgeber-Unterschrift — MEDA Vermittlung',
      kickerCandidate: 'Vertragsentwurf · vorläufige Unterschrift',
      kickerEmployer: 'Arbeitgeber-Link · vorläufige Unterschrift',
      h1Candidate: 'Interesse mit Unterschrift bestätigen',
      h1Employer: 'Entwurf prüfen und unterschreiben',
      leadCandidate: 'Lesen Sie den Entwurf zuerst. Er ist noch nicht bindend. Ihre Kontaktdaten gehen erst nach Prüfung durch MEDA an einen Arbeitgeber.',
      leadEmployer: 'Dieser Link ist der digitale Vertrag. Eine E-Mail an Arbeitgeber geht erst nach Freigabe durch MEDA hinaus. Die Unterschrift ist noch nicht bindend.',
      stepReview: 'Prüfen',
      stepDetails: 'Angaben',
      stepSign: 'Unterschrift',
      summaryDoc: 'Vertragstext ansehen',
      badge: 'Vorläufig · nicht bindend',
      docTitleCandidate: 'Vorläufiger Vermittlungsentwurf',
      docTitleEmployer: 'Vorläufige Zusammenarbeit',
      docRoleCandidate: 'Ihre Rolle: Kandidatin oder Kandidat',
      docRoleEmployer: 'Ihre Rolle: Arbeitgeber',
      metaToken: 'Vorgangsnummer',
      metaOffer: 'Angebotsreferenz',
      unknownOffer: 'Diese Referenz ist nur eine Angebotsnummer. Es wird keine Stelle erfunden.',
      missingToken: 'Dieser Link enthält keine Vorgangsnummer. Bitte den Link aus Ihrer Anmeldung verwenden.',
      missingOffer: 'Dieser Link enthält keine Angebotsreferenz.',
      docIntroCandidate: 'Bitte lesen Sie diesen Entwurf, bevor Sie Interesse senden. MEDA Vermittlung prüft zuerst. Ein Arbeitgeber wird nicht automatisch angeschrieben.',
      docIntroEmployer: 'Bitte lesen Sie diesen Entwurf, bevor Sie unterschreiben. Wenn MEDA die E-Mail freigibt, öffnet der Link genau diese Seite. Bis dahin geht keine E-Mail an Arbeitgeber hinaus.',
      cClause1: 'Kontaktdaten. Ich bin einverstanden, dass MEDA Vermittlung meine Kontaktdaten an Arbeitgeber weitergibt, mit denen sie mich zusammenführt. Das geschieht erst nach Prüfung durch MEDA. Kein automatischer Versand.',
      cClause2: 'Leistungen. MEDA Vermittlung umfasst Personalvermittlung und Integration, einschließlich MEDA One und Integrationshilfe.',
      cClause3: 'Gebühren. Es gibt Gebühren. Die Höhe wird besprochen. Beträge: <span class="esign-todo">[TODO Anwalt / Gebührentabelle]</span>. Diese Unterschrift legt keinen festen Euro-Betrag fest.',
      cClause4: 'Späterer Zusatz. Ein Vertrag für Login und Plattformzugang kann später unterschrieben werden, falls nötig. Er ist hier nicht enthalten.',
      cClause5: 'Vorläufig. Ein bindender Vermittlungsvertrag entsteht erst nach Gewerbe und rechtlicher Prüfung. Reine Personalvermittlung. Keine Arbeitnehmerüberlassung ohne Erlaubnis.',
      cClause6: 'Keine Visumzusage. Keine Rechtsberatung. Kandidat und Arbeitgeber unterschreiben getrennt.',
      eClause1: 'Zusammenarbeit. Ich möchte eine langfristige Zusammenarbeit mit Meda Family / MEDA Vermittlung.',
      eClause2: 'Auswahllisten. Ich möchte einen Kandidatenpool als Auswahllisten erhalten. Profile gehen erst nach Prüfung durch MEDA hinaus.',
      eClause3: 'Rechnung. Eine Gebühr wird dem Arbeitgeber per gesonderter Rechnung berechnet. Der Arbeitgeber zahlt. Beträge: <span class="esign-todo">[TODO Anwalt / Gebührentabelle]</span>. Diese Unterschrift ist keine Rechnung und kein fester Euro-Betrag.',
      eClause4: 'Vorläufig. Noch kein bindender Vertrag, bis Gewerbe und rechtliche Prüfung abgeschlossen sind. Reine Personalvermittlung. Keine Arbeitnehmerüberlassung ohne Erlaubnis.',
      eClause5: 'Keine Visumzusage. Keine Rechtsberatung. Die Kandidatin oder der Kandidat wird nicht automatisch angeschrieben.',
      eClause6: 'Getrennte Unterschrift. Jede Seite unterschreibt nur ihren eigenen Entwurf.',
      clauseAckTitle: 'Vertragspunkte',
      clauseAckHint: 'Bitte jeden Punkt bestätigen. Der Text steht im Vertrag links bzw. oben.',
      cAck1: 'Punkt 1. Kontaktdaten an passende Arbeitgeber, erst nach Prüfung durch MEDA. Kein automatischer Versand.',
      cAck2: 'Punkt 2. Leistung: Vermittlung und Integration (MEDA One / Integrationshilfe).',
      cAck3: 'Punkt 3. Gebühren werden besprochen. Beträge: <span class="esign-todo">[TODO Anwalt / Gebührentabelle]</span>. Kein fester Euro-Betrag.',
      cAck4: 'Punkt 4. Login und Plattformzugang können später als Zusatz unterschrieben werden.',
      eAck1: 'Punkt 1. Langfristige Zusammenarbeit mit Meda Family / MEDA Vermittlung.',
      eAck2: 'Punkt 2. Auswahllisten (Kandidatenpool), erst nach Prüfung durch MEDA.',
      eAck3: 'Punkt 3. Gebühr per gesonderter Rechnung an den Arbeitgeber. Beträge: <span class="esign-todo">[TODO Anwalt / Gebührentabelle]</span>. Hier keine Rechnung.',
      clauseErr: 'Bitte diesen Vertragspunkt bestätigen.',
      blockAddress: 'Anschrift',
      blockSign: 'Unterschrift',
      blockDate: 'Datum',
      blockCompany: 'Unternehmen',
      blockRole: 'Funktion',
      signPlaceholder: 'Erscheint beim Ausfüllen',
      datePending: 'Wird beim Senden festgehalten',
      panelTitle: 'Angaben und Unterschrift',
      name: 'Vollständiger Name',
      company: 'Unternehmen',
      roleTitle: 'Funktion',
      street: 'Straße und Hausnummer',
      postal: 'Postleitzahl',
      city: 'Ort',
      country: 'Land',
      email: 'E-Mail',
      phone: 'Telefon (optional)',
      lawTitle: 'Rechtliche Bestätigung',
      lawHint: 'Alle Punkte müssen gesetzt sein. Sonst bleibt Senden aus.',
      law_provisional: 'Ich bestätige: vorläufige Interessensbekundung. Noch kein bindender Vermittlungsvertrag, bis Gewerbe und rechtliche Prüfung abgeschlossen sind.',
      law_vermittlung: 'Ich bestätige: reine Personalvermittlung. Keine Arbeitnehmerüberlassung ohne Erlaubnis.',
      law_visa: 'Ich bestätige: keine Visumzusage und keine Rechtsberatung.',
      law_privacy: 'Ich habe die <a href="einwilligung.html" target="_blank" rel="noopener">Einwilligung</a> und den <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutz</a> gelesen.',
      law_signature: 'Ich bestätige: meine getippte Unterschrift und der Zeitstempel bestätigen den Text auf dieser Seite.',
      lawErr: 'Bitte diesen Punkt bestätigen.',
      noOtherParty: 'Keine Nachricht an die andere Seite.',
      copyNotice: 'Sie erhalten eine Kopie. MEDA Vermittlung erhält eine Kopie (AgentMail + Team).',
      signerCopy: 'Kopie an meine E-Mail senden. Nur an diese Adresse. Nicht an die andere Seite.',
      signerCopyHint: 'Freiwillig. Nach dem Senden können Sie die Kopie immer speichern oder drucken.',
      download: 'Kopie speichern',
      print: 'Drucken oder als PDF speichern',
      successCopy: 'Ihre Kopie können Sie speichern oder drucken. MEDA Vermittlung erhält eine Kopie (AgentMail + Team).',
      successSignerMail: 'Eine Kopie an Ihre E-Mail ist vorgemerkt. Es geht keine Nachricht an die andere Seite.',
      successNoSignerMail: 'Es geht keine E-Mail an Sie hinaus. Speichern Sie die Kopie hier.',
      receiptTitle: 'Kopie der Interessensbekundung',
      clausesTitle: 'Bestätigter Text',
      typed: 'Unterschrift (Namen tippen)',
      typedHint: 'Tippen Sie den Namen genau so wie im Feld „Vollständiger Name“.',
      typedOk: 'Die Unterschrift stimmt mit dem Namen überein.',
      typedBad: 'Die Unterschrift muss mit dem Namen übereinstimmen.',
      draw: 'Zeichnen (optional)',
      drawHint: 'Mit Finger oder Maus. Für diese vorläufige Interessensbekundung nicht erforderlich.',
      clear: 'Zeichnung löschen',
      next: 'Nächstes Pflichtfeld',
      submit: 'Interesse mit Unterschrift senden',
      sending: 'Wird gesendet…',
      remaining: 'Noch {n} Pflichtfelder',
      remainingOne: 'Noch 1 Pflichtfeld',
      ready: 'Alle Pflichtfelder sind ausgefüllt.',
      previewNote: 'Vorschau: Es wird nichts gespeichert und keine E-Mail gesendet.',
      name_full: 'Bitte Vor- und Nachnamen eintragen.',
      too_short: 'Bitte dieses Feld ausfüllen.',
      email: 'Bitte eine gültige E-Mail eintragen.',
      typed_empty: 'Bitte den Namen als Unterschrift tippen.',
      typed_mismatch: 'Die Unterschrift muss genau dem Namen entsprechen.',
      errSend: 'Das hat nicht geklappt. Bitte später erneut versuchen oder schreiben Sie an meda-vermittlung@agentmail.to.',
      successKicker: 'Erfasst · nicht bindend',
      successTitle: 'Unterschrift erfasst',
      successBody: 'Ihre vorläufige Interessensbekundung ist bei MEDA Vermittlung eingegangen. Das ist noch kein bindender Vertrag. Die andere Seite wird nicht angeschrieben.',
      successPreview: 'Vorschau-Modus: nichts wurde gesendet. Keine E-Mail.',
      auditTitle: 'Nachweis für Sie',
      auditWhen: 'Zeitpunkt',
      auditParty: 'Rolle',
      auditToken: 'Vorgangsnummer',
      auditOffer: 'Angebotsreferenz',
      auditHash: 'Gerätehinweis',
      auditBinding: 'Bindung',
      auditBindingValue: 'Nein · Soft Launch',
      auditMail: 'E-Mail an die andere Seite',
      auditMailValue: 'Nein',
      drawnYes: 'Gezeichnete Unterschrift: ja',
      drawnNo: 'Gezeichnete Unterschrift: nein',
      partyCandidate: 'Kandidatin / Kandidat',
      partyEmployer: 'Arbeitgeber',
      langMin: 'Sprachniveau im Angebot: {level}',
      linkGap: 'Senden ist möglich, sobald der Link vollständig ist und alle Pflichtfelder stimmen.'
    },
    en: {
      skip: 'Skip to content',
      navEmployers: 'For employers',
      navContact: 'Contact',
      footerNote: 'Provisional · No legal advice · Copy only to you and to MEDA',
      pageTitleCandidate: 'Sign your interest — MEDA Vermittlung',
      pageTitleEmployer: 'Employer signature — MEDA Vermittlung',
      kickerCandidate: 'Draft contract · provisional signature',
      kickerEmployer: 'Employer link · provisional signature',
      h1Candidate: 'Confirm interest with your signature',
      h1Employer: 'Review the draft and sign',
      leadCandidate: 'Read the draft first. It is not binding yet. Your contact details reach an employer only after MEDA has reviewed them.',
      leadEmployer: 'This link is the digital contract. An email to an employer goes out only after MEDA approves it. The signature is not binding yet.',
      stepReview: 'Review',
      stepDetails: 'Details',
      stepSign: 'Sign',
      summaryDoc: 'View the contract text',
      badge: 'Provisional · not binding',
      docTitleCandidate: 'Provisional placement draft',
      docTitleEmployer: 'Provisional cooperation',
      docRoleCandidate: 'Your role: candidate',
      docRoleEmployer: 'Your role: employer',
      metaToken: 'Reference number',
      metaOffer: 'Offer reference',
      unknownOffer: 'This reference is only an offer number. No job is invented.',
      missingToken: 'This link has no reference number. Please use the link from your registration.',
      missingOffer: 'This link has no offer reference.',
      docIntroCandidate: 'Please read this draft before you send interest. MEDA Vermittlung reviews first. An employer is not contacted automatically.',
      docIntroEmployer: 'Please read this draft before you sign. When MEDA approves the email, the link opens this page. Until then no email goes to an employer.',
      cClause1: 'Contact details. I agree that MEDA Vermittlung may share my contact details with employers it matches me with. That happens only after MEDA review. No automatic sending.',
      cClause2: 'Services. MEDA Vermittlung covers recruitment and integration, including MEDA One and integration support.',
      cClause3: 'Fees. Fees exist. The amount will be discussed. Amounts: <span class="esign-todo">[TODO lawyer / fee table]</span>. This signature does not set a fixed euro amount.',
      cClause4: 'Later addendum. An agreement for login and platform access can be signed later if needed. It is not part of this signature.',
      cClause5: 'Provisional. A binding placement contract starts only after business registration and legal review. Recruitment only. No employee leasing without a permit.',
      cClause6: 'No visa promise. No legal advice. Candidate and employer sign separately.',
      eClause1: 'Cooperation. I want long-term cooperation with Meda Family / MEDA Vermittlung.',
      eClause2: 'Shortlists. I want a candidate pool as shortlists. Profiles go out only after MEDA review.',
      eClause3: 'Invoice. A fee is billed to the employer on a separate invoice. The employer pays. Amounts: <span class="esign-todo">[TODO lawyer / fee table]</span>. This signature is not an invoice and not a fixed euro amount.',
      eClause4: 'Provisional. Not a binding contract until business registration and legal review are complete. Recruitment only. No employee leasing without a permit.',
      eClause5: 'No visa promise. No legal advice. The candidate is not contacted automatically.',
      eClause6: 'Separate signature. Each party signs only their own draft.',
      clauseAckTitle: 'Contract points',
      clauseAckHint: 'Please confirm each point. The text is in the contract above or beside this form.',
      cAck1: 'Point 1. Contact details to matched employers, only after MEDA review. No automatic sending.',
      cAck2: 'Point 2. Service: recruitment and integration (MEDA One / integration support).',
      cAck3: 'Point 3. Fees will be discussed. Amounts: <span class="esign-todo">[TODO lawyer / fee table]</span>. No fixed euro amount.',
      cAck4: 'Point 4. Login and platform access can be signed later as an addendum.',
      eAck1: 'Point 1. Long-term cooperation with Meda Family / MEDA Vermittlung.',
      eAck2: 'Point 2. Shortlists (candidate pool), only after MEDA review.',
      eAck3: 'Point 3. Fee by separate invoice to the employer. Amounts: <span class="esign-todo">[TODO lawyer / fee table]</span>. Not an invoice here.',
      clauseErr: 'Please confirm this contract point.',
      blockAddress: 'Address',
      blockSign: 'Signature',
      blockDate: 'Date',
      blockCompany: 'Company',
      blockRole: 'Role',
      signPlaceholder: 'Appears as you type',
      datePending: 'Recorded when you send',
      panelTitle: 'Details and signature',
      name: 'Full name',
      company: 'Company',
      roleTitle: 'Job title',
      street: 'Street and number',
      postal: 'Postal code',
      city: 'City',
      country: 'Country',
      email: 'Email',
      phone: 'Phone (optional)',
      lawTitle: 'Legal confirmation',
      lawHint: 'Every point must be checked. Otherwise Send stays off.',
      law_provisional: 'I confirm: this is a provisional statement of interest. It is not a binding placement contract until business registration and legal review are complete.',
      law_vermittlung: 'I confirm: recruitment only. No employee leasing without a permit.',
      law_visa: 'I confirm: no visa promise and no legal advice.',
      law_privacy: 'I have read the <a href="einwilligung.html" target="_blank" rel="noopener">consent notice</a> and the <a href="datenschutz.html" target="_blank" rel="noopener">privacy notice</a>.',
      law_signature: 'I confirm: my typed signature and the timestamp confirm the text on this page.',
      lawErr: 'Please confirm this point.',
      copyNotice: 'You receive a copy. MEDA Vermittlung receives a copy (AgentMail + team).',
      signerCopy: 'Email a copy to my address. Only to this address. Not to the other party.',
      signerCopyHint: 'Optional. After sending you can always save or print the copy.',
      download: 'Save copy',
      print: 'Print or save as PDF',
      successCopy: 'You can save or print your copy. MEDA Vermittlung receives a copy (AgentMail + team).',
      successSignerMail: 'A copy to your email is requested. No message goes to the other party.',
      successNoSignerMail: 'No email is sent to you. Save the copy here.',
      receiptTitle: 'Copy of the statement of interest',
      clausesTitle: 'Confirmed text',
      typed: 'Signature (type your name)',
      typedHint: 'Type the name exactly as in “Full name”.',
      typedOk: 'The signature matches the name.',
      typedBad: 'The signature must match the name.',
      draw: 'Draw (optional)',
      drawHint: 'Use a finger or a mouse. Not required for this provisional statement.',
      clear: 'Clear drawing',
      next: 'Next required field',
      submit: 'Send interest with signature',
      sending: 'Sending…',
      remaining: '{n} required fields left',
      remainingOne: '1 required field left',
      ready: 'All required fields are complete.',
      previewNote: 'Preview: nothing is stored and no email is sent.',
      name_full: 'Please enter a first and last name.',
      too_short: 'Please complete this field.',
      email: 'Please enter a valid email.',
      noOtherParty: 'No message to the other party.',
      typed_empty: 'Please type your name as the signature.',
      typed_mismatch: 'The signature must match the name exactly.',
      errSend: 'That did not work. Please try again later or write to meda-vermittlung@agentmail.to.',
      successKicker: 'Recorded · not binding',
      successTitle: 'Signature recorded',
      successBody: 'Your provisional statement of interest has reached MEDA Vermittlung. This is not a binding contract. The other party is not contacted.',
      successPreview: 'Preview mode: nothing was sent. No email.',
      auditTitle: 'Record for you',
      auditWhen: 'Time',
      auditParty: 'Role',
      auditToken: 'Reference number',
      auditOffer: 'Offer reference',
      auditHash: 'Device hint',
      auditBinding: 'Binding',
      auditBindingValue: 'No · soft launch',
      auditMail: 'Email to the other party',
      auditMailValue: 'No',
      drawnYes: 'Drawn signature: yes',
      drawnNo: 'Drawn signature: no',
      partyCandidate: 'Candidate',
      partyEmployer: 'Employer',
      langMin: 'Language level on the offer: {level}',
      linkGap: 'You can send once the link is complete and every required field is valid.'
    },
    fr: {
      skip: 'Aller au contenu',
      navEmployers: 'Pour les employeurs',
      navContact: 'Contact',
      footerNote: 'Provisoire · Pas de conseil juridique · Copie seulement pour vous et pour MEDA',
      pageTitleCandidate: 'Signer l’intérêt — MEDA Vermittlung',
      pageTitleEmployer: 'Signature employeur — MEDA Vermittlung',
      kickerCandidate: 'Projet de contrat · signature provisoire',
      kickerEmployer: 'Lien employeur · signature provisoire',
      h1Candidate: 'Confirmer l’intérêt avec signature',
      h1Employer: 'Lire le projet et signer',
      leadCandidate: 'Lisez d’abord le projet. Il n’est pas encore contraignant. Vos coordonnées n’atteignent un employeur qu’après examen par MEDA.',
      leadEmployer: 'Ce lien est le contrat numérique. Un e-mail à un employeur part seulement après l’accord de MEDA. La signature n’est pas encore contraignante.',
      stepReview: 'Lire',
      stepDetails: 'Données',
      stepSign: 'Signature',
      summaryDoc: 'Voir le texte',
      badge: 'Provisoire · non contraignant',
      docTitleCandidate: 'Projet de placement provisoire',
      docTitleEmployer: 'Coopération provisoire',
      docRoleCandidate: 'Votre rôle : candidat',
      docRoleEmployer: 'Votre rôle : employeur',
      metaToken: 'Numéro de dossier',
      metaOffer: 'Référence de l’offre',
      unknownOffer: 'Cette référence est seulement un numéro d’offre. Aucun poste n’est inventé.',
      missingToken: 'Ce lien n’a pas de numéro de dossier. Utilisez le lien de votre inscription.',
      missingOffer: 'Ce lien n’a pas de référence d’offre.',
      docIntroCandidate: 'Veuillez lire ce projet avant d’envoyer votre intérêt. MEDA Vermittlung vérifie d’abord. Un employeur n’est pas contacté automatiquement.',
      docIntroEmployer: 'Veuillez lire ce projet avant de signer. Quand MEDA autorise l’e-mail, le lien ouvre cette page. Jusque-là, aucun e-mail ne part vers un employeur.',
      cClause1: 'Coordonnées. J’accepte que MEDA Vermittlung transmette mes coordonnées aux employeurs avec lesquels elle me met en relation. Cela se fait seulement après examen par MEDA. Pas d’envoi automatique.',
      cClause2: 'Prestations. MEDA Vermittlung couvre le placement et l’intégration, y compris MEDA One et l’aide à l’intégration.',
      cClause3: 'Frais. Des frais existent. Le montant sera discuté. Montants : <span class="esign-todo">[TODO avocat / barème]</span>. Cette signature ne fixe aucun montant en euros.',
      cClause4: 'Avenant ultérieur. Un accord pour l’accès au compte et à la plateforme peut être signé plus tard si besoin. Il n’est pas inclus ici.',
      cClause5: 'Provisoire. Un contrat de placement contraignant ne naît qu’après l’immatriculation et le contrôle juridique. Placement uniquement. Pas de prêt de main-d’œuvre sans autorisation.',
      cClause6: 'Pas de promesse de visa. Pas de conseil juridique. Le candidat et l’employeur signent séparément.',
      eClause1: 'Coopération. Je souhaite une coopération de longue durée avec Meda Family / MEDA Vermittlung.',
      eClause2: 'Listes. Je souhaite recevoir un vivier de candidats sous forme de listes courtes. Les profils partent seulement après examen par MEDA.',
      eClause3: 'Facture. Des frais sont facturés à l’employeur par une facture séparée. L’employeur paie. Montants : <span class="esign-todo">[TODO avocat / barème]</span>. Cette signature n’est pas une facture et ne fixe aucun montant en euros.',
      eClause4: 'Provisoire. Pas encore de contrat contraignant tant que l’immatriculation et le contrôle juridique ne sont pas terminés. Placement uniquement. Pas de prêt de main-d’œuvre sans autorisation.',
      eClause5: 'Pas de promesse de visa. Pas de conseil juridique. Le candidat n’est pas contacté automatiquement.',
      eClause6: 'Signature séparée. Chaque partie ne signe que son propre projet.',
      clauseAckTitle: 'Points du contrat',
      clauseAckHint: 'Veuillez confirmer chaque point. Le texte est dans le contrat au-dessus ou à côté.',
      cAck1: 'Point 1. Coordonnées aux employeurs correspondants, seulement après examen par MEDA. Pas d’envoi automatique.',
      cAck2: 'Point 2. Prestation : placement et intégration (MEDA One / aide à l’intégration).',
      cAck3: 'Point 3. Les frais seront discutés. Montants : <span class="esign-todo">[TODO avocat / barème]</span>. Aucun montant fixe en euros.',
      cAck4: 'Point 4. L’accès au compte et à la plateforme peut être signé plus tard en avenant.',
      eAck1: 'Point 1. Coopération de longue durée avec Meda Family / MEDA Vermittlung.',
      eAck2: 'Point 2. Listes courtes (vivier de candidats), seulement après examen par MEDA.',
      eAck3: 'Point 3. Frais par facture séparée à l’employeur. Montants : <span class="esign-todo">[TODO avocat / barème]</span>. Pas une facture ici.',
      clauseErr: 'Veuillez confirmer ce point du contrat.',
      blockAddress: 'Adresse',
      blockSign: 'Signature',
      blockDate: 'Date',
      blockCompany: 'Entreprise',
      blockRole: 'Fonction',
      signPlaceholder: 'Apparaît pendant la saisie',
      datePending: 'Enregistrée à l’envoi',
      panelTitle: 'Données et signature',
      name: 'Nom complet',
      company: 'Entreprise',
      roleTitle: 'Fonction',
      street: 'Rue et numéro',
      postal: 'Code postal',
      city: 'Ville',
      country: 'Pays',
      email: 'E-mail',
      phone: 'Téléphone (facultatif)',
      lawTitle: 'Confirmation juridique',
      lawHint: 'Tous les points doivent être cochés. Sinon l’envoi reste bloqué.',
      law_provisional: 'Je confirme : manifestation d’intérêt provisoire. Pas encore de contrat de placement contraignant, tant que l’immatriculation et le contrôle juridique ne sont pas terminés.',
      law_vermittlung: 'Je confirme : placement de personnel uniquement. Pas de prêt de main-d’œuvre sans autorisation.',
      law_visa: 'Je confirme : pas de promesse de visa et pas de conseil juridique.',
      law_privacy: 'J’ai lu le <a href="einwilligung.html" target="_blank" rel="noopener">consentement</a> et les <a href="datenschutz.html" target="_blank" rel="noopener">informations sur les données</a>.',
      law_signature: 'Je confirme : ma signature tapée et l’horodatage confirment le texte de cette page.',
      lawErr: 'Veuillez confirmer ce point.',
      copyNotice: 'Vous recevez une copie. MEDA Vermittlung reçoit une copie (AgentMail + équipe).',
      signerCopy: 'Envoyer une copie à mon e-mail. Seulement à cette adresse. Pas à l’autre partie.',
      signerCopyHint: 'Facultatif. Après l’envoi, vous pouvez toujours enregistrer ou imprimer la copie.',
      download: 'Enregistrer la copie',
      print: 'Imprimer ou enregistrer en PDF',
      successCopy: 'Vous pouvez enregistrer ou imprimer votre copie. MEDA Vermittlung reçoit une copie (AgentMail + équipe).',
      successSignerMail: 'Une copie vers votre e-mail est demandée. Aucun message ne part vers l’autre partie.',
      successNoSignerMail: 'Aucun e-mail ne vous est envoyé. Enregistrez la copie ici.',
      receiptTitle: 'Copie de la manifestation d’intérêt',
      clausesTitle: 'Texte confirmé',
      typed: 'Signature (taper le nom)',
      typedHint: 'Tapez le nom exactement comme dans « Nom complet ».',
      typedOk: 'La signature correspond au nom.',
      typedBad: 'La signature doit correspondre au nom.',
      draw: 'Dessiner (facultatif)',
      drawHint: 'Au doigt ou à la souris. Pas nécessaire pour cette manifestation provisoire.',
      clear: 'Effacer le dessin',
      next: 'Champ obligatoire suivant',
      submit: 'Envoyer l’intérêt avec signature',
      sending: 'Envoi…',
      remaining: 'Encore {n} champs obligatoires',
      remainingOne: 'Encore 1 champ obligatoire',
      ready: 'Tous les champs obligatoires sont remplis.',
      previewNote: 'Aperçu : rien n’est enregistré et aucun e-mail n’est envoyé.',
      name_full: 'Indiquez le prénom et le nom.',
      too_short: 'Veuillez remplir ce champ.',
      email: 'Indiquez un e-mail valide.',
      noOtherParty: 'Pas de message à l’autre partie.',
      typed_empty: 'Tapez le nom comme signature.',
      typed_mismatch: 'La signature doit correspondre exactement au nom.',
      errSend: 'Cela n’a pas fonctionné. Réessayez plus tard ou écrivez à meda-vermittlung@agentmail.to.',
      successKicker: 'Enregistré · non contraignant',
      successTitle: 'Signature enregistrée',
      successBody: 'Votre manifestation d’intérêt provisoire est bien arrivée chez MEDA Vermittlung. Ce n’est pas un contrat contraignant. L’autre partie n’est pas contactée.',
      successPreview: 'Mode aperçu : rien n’a été envoyé. Pas d’e-mail.',
      auditTitle: 'Justificatif pour vous',
      auditWhen: 'Heure',
      auditParty: 'Rôle',
      auditToken: 'Numéro de dossier',
      auditOffer: 'Référence de l’offre',
      auditHash: 'Indice d’appareil',
      auditBinding: 'Caractère contraignant',
      auditBindingValue: 'Non · lancement progressif',
      auditMail: 'E-mail à l’autre partie',
      auditMailValue: 'Non',
      drawnYes: 'Signature dessinée : oui',
      drawnNo: 'Signature dessinée : non',
      partyCandidate: 'Candidat',
      partyEmployer: 'Employeur',
      langMin: 'Niveau de langue de l’offre : {level}',
      linkGap: 'L’envoi est possible lorsque le lien est complet et que tous les champs obligatoires sont valides.'
    },
    ar: {
      skip: 'إلى المحتوى',
      navEmployers: 'لأصحاب العمل',
      navContact: 'اتصال',
      footerNote: 'مبدئي · ليست استشارة قانونية · نسخة لكم ولـ MEDA فقط',
      pageTitleCandidate: 'توقيع إبداء الاهتمام — MEDA Vermittlung',
      pageTitleEmployer: 'توقيع صاحب العمل — MEDA Vermittlung',
      kickerCandidate: 'مسودة عقد · توقيع مبدئي',
      kickerEmployer: 'رابط صاحب العمل · توقيع مبدئي',
      h1Candidate: 'تأكيد الاهتمام بالتوقيع',
      h1Employer: 'مراجعة المسودة والتوقيع',
      leadCandidate: 'اقرأوا المسودة أولاً. ليست ملزمة بعد. تصل بيانات الاتصال إلى صاحب العمل فقط بعد مراجعة MEDA.',
      leadEmployer: 'هذا الرابط هو العقد الرقمي. لا يُرسل بريد إلى صاحب العمل إلا بعد موافقة MEDA. التوقيع ليس ملزماً بعد.',
      stepReview: 'مراجعة',
      stepDetails: 'البيانات',
      stepSign: 'التوقيع',
      summaryDoc: 'عرض نص العقد',
      badge: 'مبدئي · غير ملزم',
      docTitleCandidate: 'مسودة وساطة مبدئية',
      docTitleEmployer: 'تعاون مبدئي',
      docRoleCandidate: 'الدور: مرشح',
      docRoleEmployer: 'الدور: صاحب عمل',
      metaToken: 'رقم الملف',
      metaOffer: 'مرجع العرض',
      unknownOffer: 'هذا المرجع رقم عرض فقط. لا نخترع وظيفة.',
      missingToken: 'هذا الرابط بلا رقم ملف. استخدموا الرابط من التسجيل.',
      missingOffer: 'هذا الرابط بلا مرجع عرض.',
      docIntroCandidate: 'يرجى قراءة هذه المسودة قبل إرسال الاهتمام. تراجع MEDA Vermittlung أولاً. لا يُراسَل صاحب العمل تلقائياً.',
      docIntroEmployer: 'يرجى قراءة هذه المسودة قبل التوقيع. عندما توافق MEDA على البريد، يفتح الرابط هذه الصفحة. حتى ذلك الحين لا يُرسل بريد إلى صاحب العمل.',
      cClause1: 'بيانات الاتصال. أوافق على أن تنقل MEDA Vermittlung بيانات اتصالي إلى أصحاب العمل الذين تطابقني معهم. يتم ذلك فقط بعد مراجعة MEDA. لا إرسال تلقائي.',
      cClause2: 'الخدمات. تشمل MEDA Vermittlung الوساطة والاندماج، بما في ذلك MEDA One ومساعدة الاندماج.',
      cClause3: 'الرسوم. توجد رسوم. يُناقَش المبلغ. المبالغ: <span class="esign-todo">[TODO محامٍ / جدول الرسوم]</span>. هذا التوقيع لا يحدد مبلغاً ثابتاً باليورو.',
      cClause4: 'ملحق لاحق. يمكن توقيع اتفاق للدخول إلى الحساب والمنصة لاحقاً عند الحاجة. وهو غير مشمول هنا.',
      cClause5: 'مبدئي. لا ينشأ عقد وساطة ملزم إلا بعد التسجيل التجاري والمراجعة القانونية. وساطة فقط. لا إعارة عمال من دون ترخيص.',
      cClause6: 'لا ضمان تأشيرة. لا استشارة قانونية. المرشح وصاحب العمل يوقّعان بشكل منفصل.',
      eClause1: 'التعاون. أرغب في تعاون طويل الأمد مع Meda Family / MEDA Vermittlung.',
      eClause2: 'قوائم الاختيار. أرغب في الحصول على مجموعة مرشحين كقوائم مختصرة. لا تُرسل الملفات إلا بعد مراجعة MEDA.',
      eClause3: 'فاتورة. تُحسب الرسوم على صاحب العمل بفاتورة منفصلة. صاحب العمل يدفع. المبالغ: <span class="esign-todo">[TODO محامٍ / جدول الرسوم]</span>. هذا التوقيع ليس فاتورة وليس مبلغاً ثابتاً باليورو.',
      eClause4: 'مبدئي. ليس عقداً ملزماً إلى أن يكتمل التسجيل التجاري والمراجعة القانونية. وساطة فقط. لا إعارة عمال من دون ترخيص.',
      eClause5: 'لا ضمان تأشيرة. لا استشارة قانونية. لا يُراسَل المرشح تلقائياً.',
      eClause6: 'توقيع منفصل. كل طرف يوقّع مسودته فقط.',
      clauseAckTitle: 'بنود العقد',
      clauseAckHint: 'يرجى تأكيد كل بند. النص موجود في العقد أعلى النموذج أو بجانبه.',
      cAck1: 'البند 1. بيانات الاتصال لأصحاب العمل المناسبين، فقط بعد مراجعة MEDA. لا إرسال تلقائي.',
      cAck2: 'البند 2. الخدمة: وساطة واندماج (MEDA One / مساعدة الاندماج).',
      cAck3: 'البند 3. تُناقَش الرسوم. المبالغ: <span class="esign-todo">[TODO محامٍ / جدول الرسوم]</span>. لا مبلغ ثابت باليورو.',
      cAck4: 'البند 4. يمكن توقيع الدخول إلى الحساب والمنصة لاحقاً كملحق.',
      eAck1: 'البند 1. تعاون طويل الأمد مع Meda Family / MEDA Vermittlung.',
      eAck2: 'البند 2. قوائم مختصرة (مجموعة مرشحين)، فقط بعد مراجعة MEDA.',
      eAck3: 'البند 3. رسوم بفاتورة منفصلة على صاحب العمل. المبالغ: <span class="esign-todo">[TODO محامٍ / جدول الرسوم]</span>. ليست فاتورة هنا.',
      clauseErr: 'يرجى تأكيد هذا البند.',
      blockAddress: 'العنوان',
      blockSign: 'التوقيع',
      blockDate: 'التاريخ',
      blockCompany: 'الشركة',
      blockRole: 'الوظيفة',
      signPlaceholder: 'يظهر أثناء التعبئة',
      datePending: 'يُثبَّت عند الإرسال',
      panelTitle: 'البيانات والتوقيع',
      name: 'الاسم الكامل',
      company: 'الشركة',
      roleTitle: 'الوظيفة',
      street: 'الشارع ورقم المبنى',
      postal: 'الرمز البريدي',
      city: 'المدينة',
      country: 'البلد',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف (اختياري)',
      lawTitle: 'تأكيد قانوني',
      lawHint: 'يجب تحديد كل النقاط. وإلا يبقى الإرسال مغلقاً.',
      law_provisional: 'أؤكد: هذا إبداء اهتمام مبدئي. ليس عقد وساطة ملزماً إلى أن يكتمل تسجيل النشاط والمراجعة القانونية.',
      law_vermittlung: 'أؤكد: وساطة توظيف فقط. لا إعارة عمال من دون ترخيص.',
      law_visa: 'أؤكد: لا ضمان تأشيرة ولا استشارة قانونية.',
      law_privacy: 'لقد قرأت <a href="einwilligung.html" target="_blank" rel="noopener">الموافقة</a> و<a href="datenschutz.html" target="_blank" rel="noopener">حماية البيانات</a>.',
      law_signature: 'أؤكد: التوقيع المكتوب والوقت يؤكدان النص الظاهر في هذه الصفحة.',
      lawErr: 'يرجى تأكيد هذه النقطة.',
      copyNotice: 'تحصلون على نسخة. وتحصل MEDA Vermittlung على نسخة (AgentMail + الفريق).',
      signerCopy: 'إرسال نسخة إلى بريدي. إلى هذا العنوان فقط. ليس إلى الطرف الآخر.',
      signerCopyHint: 'اختياري. بعد الإرسال يمكنكم دائماً حفظ النسخة أو طباعتها.',
      download: 'حفظ النسخة',
      print: 'طباعة أو حفظ PDF',
      successCopy: 'يمكنكم حفظ نسختكم أو طباعتها. تحصل MEDA Vermittlung على نسخة (AgentMail + الفريق).',
      successSignerMail: 'طُلبت نسخة إلى بريدكم. لا تُرسل رسالة إلى الطرف الآخر.',
      successNoSignerMail: 'لا يُرسل بريد إليكم. احفظوا النسخة هنا.',
      receiptTitle: 'نسخة من إبداء الاهتمام',
      clausesTitle: 'النص المؤكَّد',
      typed: 'التوقيع (اكتبوا الاسم)',
      typedHint: 'اكتبوا الاسم كما في حقل «الاسم الكامل».',
      typedOk: 'التوقيع يطابق الاسم.',
      typedBad: 'يجب أن يطابق التوقيع الاسم.',
      draw: 'رسم (اختياري)',
      drawHint: 'بالإصبع أو بالفأرة. غير مطلوب لهذا الإبداء المبدئي.',
      clear: 'مسح الرسم',
      next: 'الحقل الإلزامي التالي',
      submit: 'إرسال الاهتمام مع التوقيع',
      sending: 'جارٍ الإرسال…',
      remaining: 'تبقّى {n} حقول إلزامية',
      remainingOne: 'تبقّى حقل إلزامي واحد',
      ready: 'كل الحقول الإلزامية مكتملة.',
      previewNote: 'معاينة: لا يُحفظ شيء ولا يُرسل بريد.',
      name_full: 'يرجى إدخال الاسم واللقب.',
      too_short: 'يرجى تعبئة هذا الحقل.',
      email: 'يرجى إدخال بريد صالح.',
      noOtherParty: 'لا رسالة إلى الطرف الآخر.',
      typed_empty: 'يرجى كتابة الاسم كتوقيع.',
      typed_mismatch: 'يجب أن يطابق التوقيع الاسم تماماً.',
      errSend: 'لم ينجح الإرسال. أعد المحاولة لاحقاً أو اكتب إلى meda-vermittlung@agentmail.to.',
      successKicker: 'تم التسجيل · غير ملزم',
      successTitle: 'تم تسجيل التوقيع',
      successBody: 'وصل إبداء الاهتمام المبدئي إلى MEDA Vermittlung. هذا ليس عقداً ملزماً. لا يُراسَل الطرف الآخر.',
      successPreview: 'وضع المعاينة: لم يُرسل شيء. لا بريد.',
      auditTitle: 'إثبات لكم',
      auditWhen: 'الوقت',
      auditParty: 'الدور',
      auditToken: 'رقم الملف',
      auditOffer: 'مرجع العرض',
      auditHash: 'مؤشر الجهاز',
      auditBinding: 'الإلزام',
      auditBindingValue: 'لا · إطلاق تدريجي',
      auditMail: 'بريد إلى الطرف الآخر',
      auditMailValue: 'لا',
      drawnYes: 'توقيع مرسوم: نعم',
      drawnNo: 'توقيع مرسوم: لا',
      partyCandidate: 'مرشح',
      partyEmployer: 'صاحب عمل',
      langMin: 'مستوى اللغة في العرض: {level}',
      linkGap: 'يُتاح الإرسال عندما يكتمل الرابط وتصح كل الحقول الإلزامية.'
    }
  };

  function t(lang, key) {
    var pack = COPY[lang] || COPY.de;
    if (pack[key] != null) return pack[key];
    return COPY.de[key] != null ? COPY.de[key] : key;
  }

  function hashText(text) {
    var value = String(text || '');
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('').slice(0, 16);
      });
    }
    var h = 2166136261;
    for (var i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Promise.resolve(('00000000' + (h >>> 0).toString(16)).slice(-8));
  }

  function employerSignUrl(token, offer) {
    var url = new URL('employer-sign.html', window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('token', token);
    url.searchParams.set('offer', offer);
    return url.href;
  }

  function locOffer(obj, lang) {
    if (!obj) return '';
    return obj[lang] || obj.de || obj.en || obj.fr || '';
  }

  function findOffer(id) {
    var list = window.ABK_OFFERS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }

  function bindCanvas(canvas, onChange) {
    var ctx = canvas.getContext('2d');
    var ink = false;
    var drawing = false;
    var last = null;

    function paintSetup() {
      var ratio = window.devicePixelRatio || 1;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2.15;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1A1238';
    }

    function resize() {
      var ratio = window.devicePixelRatio || 1;
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      if (!w || !h) return;
      var snap = ink ? canvas.toDataURL() : '';
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      paintSetup();
      if (snap) {
        var img = new Image();
        img.onload = function () { ctx.drawImage(img, 0, 0, w, h); };
        img.src = snap;
      }
    }

    function point(event) {
      var rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    canvas.addEventListener('pointerdown', function (event) {
      drawing = true;
      try { canvas.setPointerCapture(event.pointerId); } catch (e) { /* ignore */ }
      last = point(event);
    });
    canvas.addEventListener('pointermove', function (event) {
      if (!drawing || !last) return;
      var next = point(event);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
      last = next;
      if (!ink) {
        ink = true;
        onChange(true);
      }
    });
    function stop() { drawing = false; last = null; }
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    window.addEventListener('resize', resize);
    requestAnimationFrame(resize);

    return {
      hasInk: function () { return ink; },
      clear: function () {
        ink = false;
        var rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        onChange(false);
      }
    };
  }

  function mount(root) {
    if (!root || !RULES) return;
    var role = root.getAttribute('data-role') === 'employer' ? 'employer' : 'candidate';
    var params = new URLSearchParams(window.location.search);
    var token = params.get('token') || '';
    var offerId = params.get('offer') || '';
    var preview = params.get('preview') === '1';
    var lang = 'de';
    try {
      var stored = sessionStorage.getItem('medaEsignLang');
      if (LANGS.indexOf(stored) !== -1) lang = stored;
    } catch (e) { /* ignore */ }

    var form = document.getElementById('esign-form');
    var doc = document.getElementById('esign-doc');
    var countEl = document.getElementById('esign-count');
    var actionbar = document.getElementById('esign-actionbar');
    var submitBtn = document.getElementById('esign-submit');
    var nextBtn = document.getElementById('esign-next');
    var statusEl = document.getElementById('esign-status');
    var doneEl = document.getElementById('esign-done');
    var typedHint = document.getElementById('typed-hint');
    var canvas = document.getElementById('esign-canvas');
    var clearBtn = document.getElementById('esign-clear');
    var started = false;
    var busy = false;
    var touched = {};
    var finishedSnapshot = null;
    var pad = canvas ? bindCanvas(canvas, function () { render(); }) : { hasInk: function () { return false; }, clear: function () {} };

    var emailInput = document.getElementById('f-email');
    if (emailInput && !emailInput.value && RULES.EMAIL_RE.test(params.get('email') || '')) {
      emailInput.value = params.get('email');
    }
    var previewNote = document.getElementById('preview-note');
    if (previewNote) previewNote.hidden = !preview;

    function text(key) { return t(lang, key); }

    function fieldValue(id) {
      var el = document.getElementById(id);
      return el ? el.value : '';
    }

    function model() {
      var data = {
        role: role,
        candidate_token: token,
        offer_id: offerId,
        name: fieldValue('f-name'),
        company: fieldValue('f-company'),
        role_title: fieldValue('f-role'),
        street: fieldValue('f-street'),
        postal_code: fieldValue('f-postal'),
        city: fieldValue('f-city'),
        country: fieldValue('f-country'),
        email: fieldValue('f-email'),
        phone: fieldValue('f-phone'),
        typed_signature: fieldValue('f-typed'),
        has_drawn_signature: pad.hasInk(),
        send_signer_copy: !!(document.getElementById('f-signer-copy') && document.getElementById('f-signer-copy').checked),
        law_provisional: checked('f-law_provisional'),
        law_vermittlung: checked('f-law_vermittlung'),
        law_visa: checked('f-law_visa'),
        law_privacy: checked('f-law_privacy'),
        law_signature: checked('f-law_signature'),
        employer_sign_url: role === 'candidate' && token && offerId ? employerSignUrl(token, offerId) : ''
      };
      RULES.clauseKeysFor(role).forEach(function (key) {
        data[key] = checked('f-' + key);
      });
      return data;
    }

    function checked(id) {
      var el = document.getElementById(id);
      return !!(el && el.checked);
    }

    function applyCopy() {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.title = text(role === 'employer' ? 'pageTitleEmployer' : 'pageTitleCandidate');
      document.querySelectorAll('[data-t]').forEach(function (el) {
        var key = el.getAttribute('data-t');
        if (el.hasAttribute('data-t-html')) el.innerHTML = text(key);
        else el.textContent = text(key);
      });
      document.querySelectorAll('[data-lang]').forEach(function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
      });
    }

    function setLive(id, value, placeholder) {
      var el = document.getElementById(id);
      if (!el) return;
      var shown = String(value || '').trim();
      el.textContent = shown || placeholder || '';
      el.classList.toggle('is-placeholder', !shown);
    }

    function paintDoc(state) {
      var data = model();
      setLive('doc-company', data.company, text('signPlaceholder'));
      setLive('doc-role', data.role_title, text('signPlaceholder'));
      setLive('doc-sign', data.typed_signature, text('signPlaceholder'));
      var address = [data.street, [data.postal_code, data.city].filter(Boolean).join(' '), data.country, data.email]
        .map(function (line) { return String(line || '').trim(); })
        .filter(Boolean)
        .join('\n');
      setLive('doc-address', address, text('signPlaceholder'));
      var dateEl = document.getElementById('doc-date');
      if (dateEl && !dateEl.getAttribute('data-locked')) {
        dateEl.textContent = text('datePending');
        dateEl.classList.add('is-placeholder');
      }
      var tok = document.getElementById('doc-token');
      var off = document.getElementById('doc-offer');
      if (tok) tok.textContent = token || '—';
      if (off) off.textContent = offerId || '—';
      var card = document.getElementById('offer-card');
      var note = document.getElementById('offer-note');
      var found = offerId ? findOffer(offerId) : null;
      if (card) card.hidden = !found;
      if (found) {
        var title = document.getElementById('offer-title');
        var place = document.getElementById('offer-place');
        var level = document.getElementById('offer-lang');
        if (title) title.textContent = locOffer(found.title, lang);
        if (place) {
          place.textContent = [locOffer(found.city, lang), locOffer(found.region, lang)].filter(Boolean).join(' · ');
        }
        if (level) level.textContent = text('langMin').replace('{level}', found.langMin || '—');
      }
      if (note) {
        if (!offerId) note.textContent = text('missingOffer');
        else if (!found) note.textContent = text('unknownOffer');
        else note.textContent = '';
      }
      var warn = document.getElementById('link-warn');
      if (warn) {
        var bits = [];
        if (!state.tokenOk) bits.push(text('missingToken'));
        if (!state.offerOk) bits.push(text('missingOffer'));
        warn.hidden = bits.length === 0;
        warn.textContent = bits.join(' ');
      }
    }

    function fieldId(key) {
      if (key === 'role_title') return 'f-role';
      if (key === 'postal_code') return 'f-postal';
      if (key === 'typed_signature') return 'f-typed';
      return 'f-' + key;
    }

    function errorText(code) {
      if (code === 'law') return text('lawErr');
      if (code === 'clause') return text('clauseErr');
      return text(code);
    }

    function render() {
      var data = model();
      var state = RULES.validate(data);
      applyCopy();
      paintDoc(state);

      Object.keys(state.errors).concat(['name', 'company', 'role_title', 'street', 'postal_code', 'city', 'country', 'email', 'typed_signature'].concat(RULES.LAW_KEYS, RULES.clauseKeysFor(role))).forEach(function (key) {
        var err = document.getElementById('err-' + key);
        var wrap = document.querySelector('[data-field="' + key + '"]');
        var code = touched[key] ? state.errors[key] : '';
        if (err) {
          err.hidden = !code;
          err.textContent = code ? errorText(code) : '';
        }
        if (wrap) wrap.classList.toggle('is-invalid', !!code);
        var input = document.getElementById(fieldId(key));
        if (input) input.setAttribute('aria-invalid', code ? 'true' : 'false');
      });

      if (typedHint) {
        var typed = String(data.typed_signature || '').trim();
        if (!typed) {
          typedHint.textContent = text('typedHint');
          typedHint.className = 'esign-hint';
        } else if (RULES.normalizeName(typed) === RULES.normalizeName(data.name) && !state.errors.name) {
          typedHint.textContent = text('typedOk');
          typedHint.className = 'esign-hint is-ok';
        } else {
          typedHint.textContent = text('typedBad');
          typedHint.className = 'esign-hint is-err';
        }
      }

      var n = state.missing.length;
      if (countEl) {
        countEl.textContent = n === 0 ? text('ready') : n === 1 ? text('remainingOne') : text('remaining').replace('{n}', String(n));
        countEl.classList.toggle('is-ready', n === 0 && state.tokenOk && state.offerOk);
      }
      if (actionbar) actionbar.classList.toggle('is-ready', state.ok);
      if (submitBtn && !busy) {
        submitBtn.disabled = !state.ok;
        submitBtn.textContent = text('submit');
      }

      var identityOpen = ['name', 'company', 'role_title', 'street', 'postal_code', 'city', 'country', 'email'].some(function (key) {
        return state.missing.indexOf(key) !== -1;
      });
      var signOpen = ['typed_signature'].concat(RULES.LAW_KEYS, RULES.clauseKeysFor(role)).some(function (key) {
        return state.missing.indexOf(key) !== -1;
      });
      var step = !started ? 1 : identityOpen ? 2 : 3;
      document.querySelectorAll('[data-step]').forEach(function (li) {
        var nStep = Number(li.getAttribute('data-step'));
        var done = state.ok || nStep < step || (nStep === 2 && !identityOpen && started) || (nStep === 1 && started);
        if (state.ok) done = true;
        li.classList.toggle('is-done', done && !(nStep === step && !state.ok));
        li.classList.toggle('is-current', nStep === step && !state.ok);
        if (nStep === step && !state.ok) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
      });
      if (!signOpen && !identityOpen && started) {
        /* step 3 complete when ok */
      }
      return state;
    }

    function focusMissing(state) {
      var key = state.missing[0];
      if (!key) return;
      touched[key] = true;
      if (doc && key.indexOf('clause_') === 0) doc.open = true;
      var input = document.getElementById(fieldId(key));
      if (input) {
        input.focus();
        try { input.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { input.scrollIntoView(); }
      }
      render();
    }

    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-lang');
        if (LANGS.indexOf(next) === -1) return;
        lang = next;
        try { sessionStorage.setItem('medaEsignLang', lang); } catch (e) { /* ignore */ }
        render();
        if (finishedSnapshot) paintSuccess(finishedSnapshot, false);
      });
    });

    if (form) {
      form.addEventListener('input', function () {
        started = true;
        render();
      });
      form.addEventListener('focusin', function () { started = true; });
      form.addEventListener('focusout', function (event) {
        var el = event.target;
        if (!el || !el.id) return;
        var map = {
          'f-name': 'name',
          'f-company': 'company',
          'f-role': 'role_title',
          'f-street': 'street',
          'f-postal': 'postal_code',
          'f-city': 'city',
          'f-country': 'country',
          'f-email': 'email',
          'f-typed': 'typed_signature',
          'f-law_provisional': 'law_provisional',
          'f-law_vermittlung': 'law_vermittlung',
          'f-law_visa': 'law_visa',
          'f-law_privacy': 'law_privacy',
          'f-law_signature': 'law_signature',
          'f-clause_share': 'clause_share',
          'f-clause_services': 'clause_services',
          'f-clause_fees': 'clause_fees',
          'f-clause_login': 'clause_login',
          'f-clause_coop': 'clause_coop',
          'f-clause_pool': 'clause_pool',
          'f-clause_invoice': 'clause_invoice'
        };
        if (map[el.id]) touched[map[el.id]] = true;
        render();
      });
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var state = RULES.validate(model());
        state.missing.forEach(function (key) { touched[key] = true; });
        if (!state.ok) {
          started = true;
          focusMissing(state);
          return;
        }
        if (busy) return;
        busy = true;
        submitBtn.disabled = true;
        submitBtn.textContent = text('sending');
        if (statusEl) statusEl.hidden = true;
        var snapshot = model();
        hashText(navigator.userAgent || '').then(function (hash) {
          snapshot.user_agent_hash = hash;
          snapshot.signed_at = new Date().toISOString();
          snapshot.has_drawn_signature = pad.hasInk();
          snapshot.preview = !!preview;
          if (preview) return { preview: true };
          var meta = document.querySelector('meta[name="meda-ask-api"]');
          var api = (meta && meta.content) || 'https://meda-ask.g5kjd9v7cf.workers.dev';
          var copies = RULES.buildIntakeCopies(snapshot);
          function postOne(payload) {
            return fetch(String(api).replace(/\/$/, '') + '/intake', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify(payload)
            }).then(function (res) {
              return res.json().catch(function () { return null; }).then(function (data) {
                if (!res.ok || !data || !data.ok) throw new Error('intake');
              });
            });
          }
          return postOne(copies[0]).then(function () { return postOne(copies[1]); });
        }).then(function () {
          showSuccess(snapshot);
        }).catch(function () {
          busy = false;
          if (statusEl) {
            statusEl.hidden = false;
            statusEl.className = 'platform-status is-err';
            statusEl.textContent = text('errSend');
          }
          render();
        });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        started = true;
        if (doc && window.matchMedia('(max-width: 959px)').matches) doc.open = false;
        focusMissing(RULES.validate(model()));
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        pad.clear();
        render();
      });
    }

    var mq = window.matchMedia('(min-width: 960px)');
    function syncDocOpen() { if (mq.matches && doc) doc.open = true; }
    syncDocOpen();
    if (mq.addEventListener) mq.addEventListener('change', syncDocOpen);

    function paintSuccess(snapshot, scroll) {
      document.body.classList.add('is-complete');
      if (doc) doc.open = true;
      var formatted = snapshot.signed_at;
      try {
        formatted = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(snapshot.signed_at));
      } catch (e) { /* keep iso */ }
      var dateEl = document.getElementById('doc-date');
      if (dateEl) {
        dateEl.textContent = formatted;
        dateEl.classList.remove('is-placeholder');
        dateEl.setAttribute('data-locked', '1');
      }
      if (!doneEl) return;
      doneEl.hidden = false;
      var when = document.getElementById('audit-when');
      var party = document.getElementById('audit-party');
      var tok = document.getElementById('audit-token');
      var off = document.getElementById('audit-offer');
      var hash = document.getElementById('audit-hash');
      var drawn = document.getElementById('audit-drawn');
      var previewLine = document.getElementById('success-preview');
      if (when) when.textContent = formatted;
      if (party) party.textContent = text(role === 'employer' ? 'partyEmployer' : 'partyCandidate');
      if (tok) tok.textContent = token;
      if (off) off.textContent = offerId;
      if (hash) hash.textContent = snapshot.user_agent_hash || '—';
      if (drawn) drawn.textContent = snapshot.has_drawn_signature ? text('drawnYes') : text('drawnNo');
      if (previewLine) previewLine.hidden = !preview;
      var signerLine = document.getElementById('success-signer-mail');
      if (signerLine) {
        signerLine.hidden = false;
        signerLine.textContent = snapshot.send_signer_copy ? text('successSignerMail') : text('successNoSignerMail');
      }
      if (scroll) {
        try { doneEl.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e2) { doneEl.scrollIntoView(); }
      }
    }

    function formattedTime(snapshot) {
      try {
        return new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(snapshot.signed_at));
      } catch (e) {
        return snapshot.signed_at || '';
      }
    }

    function plainText(key) {
      var holder = document.createElement('div');
      holder.innerHTML = text(key);
      return holder.textContent || '';
    }

    function downloadReceipt() {
      if (!finishedSnapshot) return;
      var html = RULES.buildReceiptHtml(finishedSnapshot, {
        lang: lang,
        title: text('receiptTitle'),
        notBinding: text('badge'),
        copyNotice: text('copyNotice'),
        previewNote: text('successPreview'),
        tokenLabel: text('auditToken'),
        offerLabel: text('auditOffer'),
        roleLabel: text('auditParty'),
        partyCandidate: text('partyCandidate'),
        partyEmployer: text('partyEmployer'),
        nameLabel: text('name'),
        companyLabel: text('company'),
        roleTitleLabel: text('roleTitle'),
        addressLabel: text('blockAddress'),
        emailLabel: text('email'),
        timeLabel: text('auditWhen'),
        formattedTime: formattedTime(finishedSnapshot),
        signatureLabel: text('blockSign'),
        hashLabel: text('auditHash'),
        clausesTitle: text('clausesTitle'),
        clauses: (role === 'employer'
          ? ['eClause1', 'eClause2', 'eClause3', 'eClause4', 'eClause5', 'eClause6']
          : ['cClause1', 'cClause2', 'cClause3', 'cClause4', 'cClause5', 'cClause6']).map(plainText),
        lawTitle: text('lawTitle'),
        laws: RULES.LAW_KEYS.map(plainText),
        signerMailNote: text('successSignerMail'),
        noSignerMailNote: text('successNoSignerMail'),
        noOtherParty: text('noOtherParty')
      });
      var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'MEDA-Kopie-' + (token || 'REF') + '.html';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 1500);
    }

    var downloadBtn = document.getElementById('esign-download');
    var printBtn = document.getElementById('esign-print');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadReceipt);
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

    function showSuccess(snapshot) {
      finishedSnapshot = snapshot;
      applyCopy();
      paintSuccess(snapshot, true);
    }

    render();
  }

  window.MEDA_ESIGN = { mount: mount };
})();
