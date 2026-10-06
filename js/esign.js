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
      leadCandidate: 'Dies ist ein vorläufiger Schritt. Es entsteht noch kein bindender Vermittlungsvertrag. Eine E-Mail an Arbeitgeber geht nicht automatisch hinaus.',
      leadEmployer: 'Dieser Link gehört zu einer Vorgangsnummer. Ihre Unterschrift ist eine vorläufige Interessensbekundung. Es geht keine automatische E-Mail an Kandidaten hinaus.',
      stepReview: 'Prüfen',
      stepDetails: 'Angaben',
      stepSign: 'Unterschrift',
      summaryDoc: 'Vertragstext ansehen',
      badge: 'Vorläufig · nicht bindend',
      docTitle: 'Vorläufige Interessensbekundung',
      docRoleCandidate: 'Ihre Rolle: Kandidatin oder Kandidat',
      docRoleEmployer: 'Ihre Rolle: Arbeitgeber',
      metaToken: 'Vorgangsnummer',
      metaOffer: 'Angebotsreferenz',
      unknownOffer: 'Diese Referenz ist nur eine Angebotsnummer. Es wird keine Stelle erfunden.',
      missingToken: 'Dieser Link enthält keine Vorgangsnummer. Bitte den Link aus Ihrer Anmeldung verwenden.',
      missingOffer: 'Dieser Link enthält keine Angebotsreferenz.',
      docIntroCandidate: 'Sie bekunden Interesse an einem vorläufigen Vermittlungsentwurf. MEDA Vermittlung prüft die Angaben. Ein Arbeitgeber wird nicht automatisch kontaktiert.',
      docIntroEmployer: 'Sie prüfen den vorläufigen Entwurf zu dieser Vorgangsnummer. Die Unterschrift ist eine Interessensbekundung. Die Kandidatin oder der Kandidat wird nicht automatisch kontaktiert.',
      clause1: 'Reine Personalvermittlung. Keine Arbeitnehmerüberlassung ohne Erlaubnis.',
      clause2: 'Keine Visumzusage. Keine Rechtsberatung.',
      clause3: 'Keine Vermittlungsgebühr über diese Seite, solange die Gewerbeanmeldung nicht abgeschlossen ist.',
      clause4: 'Ein bindender Vermittlungsvertrag entsteht erst nach Freigabe durch Gewerbe und rechtliche Prüfung.',
      clause5: 'Personenbezogene Daten aus diesem Formular gehen nur an MEDA Vermittlung.',
      clause6: 'Kandidat und Arbeitgeber unterschreiben getrennt. Jede Unterschrift bleibt eine Interessensbekundung.',
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
      leadCandidate: 'This is a provisional step. It is not a binding placement contract yet. No email is sent to an employer automatically.',
      leadEmployer: 'This link belongs to one reference number. Your signature is a provisional statement of interest. No email is sent to a candidate automatically.',
      stepReview: 'Review',
      stepDetails: 'Details',
      stepSign: 'Sign',
      summaryDoc: 'View the contract text',
      badge: 'Provisional · not binding',
      docTitle: 'Provisional statement of interest',
      docRoleCandidate: 'Your role: candidate',
      docRoleEmployer: 'Your role: employer',
      metaToken: 'Reference number',
      metaOffer: 'Offer reference',
      unknownOffer: 'This reference is only an offer number. No job is invented.',
      missingToken: 'This link has no reference number. Please use the link from your registration.',
      missingOffer: 'This link has no offer reference.',
      docIntroCandidate: 'You state interest in a provisional placement draft. MEDA Vermittlung reviews the details. An employer is not contacted automatically.',
      docIntroEmployer: 'You review the provisional draft for this reference number. The signature is a statement of interest. The candidate is not contacted automatically.',
      clause1: 'Recruitment only. No employee leasing without a permit.',
      clause2: 'No visa promise. No legal advice.',
      clause3: 'No placement fee through this page until business registration is complete.',
      clause4: 'A binding placement contract starts only after business registration and legal review.',
      clause5: 'Personal data from this form goes only to MEDA Vermittlung.',
      clause6: 'Candidate and employer sign separately. Each signature stays a statement of interest.',
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
      leadCandidate: 'Ceci est une étape provisoire. Ce n’est pas encore un contrat de placement contraignant. Aucun e-mail n’est envoyé automatiquement à un employeur.',
      leadEmployer: 'Ce lien correspond à un numéro de dossier. Votre signature est une manifestation d’intérêt provisoire. Aucun e-mail n’est envoyé automatiquement à un candidat.',
      stepReview: 'Lire',
      stepDetails: 'Données',
      stepSign: 'Signature',
      summaryDoc: 'Voir le texte',
      badge: 'Provisoire · non contraignant',
      docTitle: 'Manifestation d’intérêt provisoire',
      docRoleCandidate: 'Votre rôle : candidat',
      docRoleEmployer: 'Votre rôle : employeur',
      metaToken: 'Numéro de dossier',
      metaOffer: 'Référence de l’offre',
      unknownOffer: 'Cette référence est seulement un numéro d’offre. Aucun poste n’est inventé.',
      missingToken: 'Ce lien n’a pas de numéro de dossier. Utilisez le lien de votre inscription.',
      missingOffer: 'Ce lien n’a pas de référence d’offre.',
      docIntroCandidate: 'Vous manifestez votre intérêt pour un projet de placement provisoire. MEDA Vermittlung vérifie les données. Un employeur n’est pas contacté automatiquement.',
      docIntroEmployer: 'Vous lisez le projet provisoire de ce numéro de dossier. La signature est une manifestation d’intérêt. Le candidat n’est pas contacté automatiquement.',
      clause1: 'Placement de personnel uniquement. Pas de prêt de main-d’œuvre sans autorisation.',
      clause2: 'Pas de promesse de visa. Pas de conseil juridique.',
      clause3: 'Pas de frais de placement via cette page tant que l’immatriculation n’est pas terminée.',
      clause4: 'Un contrat de placement contraignant ne naît qu’après l’immatriculation et le contrôle juridique.',
      clause5: 'Les données personnelles de ce formulaire vont uniquement à MEDA Vermittlung.',
      clause6: 'Le candidat et l’employeur signent séparément. Chaque signature reste une manifestation d’intérêt.',
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
      leadCandidate: 'هذه خطوة مبدئية. ليست عقد وساطة ملزماً بعد. لا يُرسل بريد تلقائي إلى صاحب العمل.',
      leadEmployer: 'هذا الرابط خاص برقم ملف. توقيعكم إبداء اهتمام مبدئي. لا يُرسل بريد تلقائي إلى المرشح.',
      stepReview: 'مراجعة',
      stepDetails: 'البيانات',
      stepSign: 'التوقيع',
      summaryDoc: 'عرض نص العقد',
      badge: 'مبدئي · غير ملزم',
      docTitle: 'إبداء اهتمام مبدئي',
      docRoleCandidate: 'الدور: مرشح',
      docRoleEmployer: 'الدور: صاحب عمل',
      metaToken: 'رقم الملف',
      metaOffer: 'مرجع العرض',
      unknownOffer: 'هذا المرجع رقم عرض فقط. لا نخترع وظيفة.',
      missingToken: 'هذا الرابط بلا رقم ملف. استخدموا الرابط من التسجيل.',
      missingOffer: 'هذا الرابط بلا مرجع عرض.',
      docIntroCandidate: 'تبدون اهتمامكم بمسودة وساطة مبدئية. تراجع MEDA البيانات. لا يُراسَل صاحب العمل تلقائياً.',
      docIntroEmployer: 'تراجعون المسودة المبدئية لرقم الملف هذا. التوقيع إبداء اهتمام. لا يُراسَل المرشح تلقائياً.',
      clause1: 'وساطة توظيف فقط. لا إعارة عمال من دون ترخيص.',
      clause2: 'لا ضمان تأشيرة. لا استشارة قانونية.',
      clause3: 'لا رسوم وساطة عبر هذه الصفحة قبل اكتمال تسجيل النشاط.',
      clause4: 'لا ينشأ عقد وساطة ملزم إلا بعد التسجيل التجاري والمراجعة القانونية.',
      clause5: 'البيانات الشخصية في هذا النموذج تذهب فقط إلى MEDA Vermittlung.',
      clause6: 'المرشح وصاحب العمل يوقّعان بشكل منفصل. كل توقيع يبقى إبداء اهتمام.',
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
      return {
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
      return text(code);
    }

    function render() {
      var data = model();
      var state = RULES.validate(data);
      applyCopy();
      paintDoc(state);

      Object.keys(state.errors).concat(['name', 'company', 'role_title', 'street', 'postal_code', 'city', 'country', 'email', 'typed_signature'].concat(RULES.LAW_KEYS)).forEach(function (key) {
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
      var signOpen = ['typed_signature'].concat(RULES.LAW_KEYS).some(function (key) {
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
          'f-law_signature': 'law_signature'
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
        clauses: ['clause1', 'clause2', 'clause3', 'clause4', 'clause5', 'clause6'].map(function (key) { return text(key); }),
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
