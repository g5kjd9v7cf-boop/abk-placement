(function () {
  'use strict';

  var LANGS = ['de', 'fr', 'en', 'ar'];
  var lang = 'de';
  var lastTopic = '';
  var openedOnce = false;
  var root, panel, log, chips, launch, form, input;

  var UI = {
    de: {
      open: 'Hilfe',
      title: 'MEDA Hilfe',
      close: 'Schließen',
      placeholder: 'Frage zur Vermittlung…',
      send: 'Senden',
      disclaimer: 'Antworten stammen aus den Seiten von MEDA. Keine Rechts- oder Visumsberatung. Dieser Chat bleibt in Ihrem Browser und wird nicht gesendet.',
      intro: 'Guten Tag. Ich helfe bei der Bewerbung, bei Arbeitgeberanfragen, beim Matching, beim Deutsch-Niveau und beim Datenschutz. Was möchten Sie wissen?',
      fallback: 'Dazu steht auf den Seiten keine genaue Antwort. Ich kann Bewerbung, Arbeitgeber, Matching, Deutsch, Visum-Grenzen, Integration und Datenschutz erklären. Für Ihren Einzelfall nutzen Sie das Formular.',
      chips: [
        { q: 'Wie bewerbe ich mich?', label: 'Bewerben' },
        { q: 'Ich bin Arbeitgeber', label: 'Arbeitgeber' },
        { q: 'Gibt es eine Visumgarantie?', label: 'Visum' },
        { q: 'Datenschutz und Widerruf', label: 'Datenschutz' }
      ]
    },
    fr: {
      open: 'Aide',
      title: 'Aide MEDA',
      close: 'Fermer',
      placeholder: 'Question sur le placement…',
      send: 'Envoyer',
      disclaimer: 'Les réponses viennent des pages MEDA. Pas de conseil juridique ni de garantie de visa. Cette conversation reste dans votre navigateur et n’est pas envoyée.',
      intro: 'Bonjour. Je peux aider pour la candidature, les employeurs, le matching, le niveau d’allemand et la protection des données. Que souhaitez-vous savoir ?',
      fallback: 'Les pages ne donnent pas de réponse précise à cela. Je peux expliquer la candidature, les employeurs, le matching, l’allemand, les limites de visa, l’intégration et la confidentialité. Pour votre cas, utilisez le formulaire.',
      chips: [
        { q: 'Comment postuler ?', label: 'Postuler' },
        { q: 'Je suis employeur', label: 'Employeur' },
        { q: 'Y a-t-il une garantie de visa ?', label: 'Visa' },
        { q: 'Confidentialité et retrait', label: 'Données' }
      ]
    },
    en: {
      open: 'Help',
      title: 'MEDA Help',
      close: 'Close',
      placeholder: 'Question about placement…',
      send: 'Send',
      disclaimer: 'Answers come from MEDA’s own pages. This is not legal advice and not a visa guarantee. This chat stays in your browser and is not sent.',
      intro: 'Hello. I can help with applications, employer enquiries, matching, German level, and privacy. What would you like to know?',
      fallback: 'The pages do not state a precise answer to that. I can explain applications, employers, matching, German, visa limits, integration, and privacy. For your own case, use the form.',
      chips: [
        { q: 'How do I apply?', label: 'Apply' },
        { q: 'I am an employer', label: 'Employer' },
        { q: 'Is there a visa guarantee?', label: 'Visa' },
        { q: 'Privacy and withdrawal', label: 'Privacy' }
      ]
    },
    ar: {
      open: 'مساعدة',
      title: 'مساعدة MEDA',
      close: 'إغلاق',
      placeholder: 'سؤال عن الوساطة…',
      send: 'إرسال',
      disclaimer: 'الإجابات من صفحات MEDA. ليست استشارة قانونية ولا ضمان تأشيرة. تبقى هذه المحادثة في المتصفح ولا تُرسل.',
      intro: 'مرحباً. أساعد في التقديم وطلبات أصحاب العمل والمطابقة ومستوى الألمانية وحماية البيانات. ماذا تريد أن تعرف؟',
      fallback: 'لا توجد في الصفحات إجابة دقيقة عن ذلك. أستطيع شرح التقديم وأصحاب العمل والمطابقة والألمانية وحدود التأشيرة والاندماج والخصوصية. لحالتك استخدم النموذج.',
      chips: [
        { q: 'كيف أقدّم؟', label: 'التقديم' },
        { q: 'أنا صاحب عمل', label: 'صاحب عمل' },
        { q: 'هل يوجد ضمان تأشيرة؟', label: 'تأشيرة' },
        { q: 'الخصوصية والسحب', label: 'الخصوصية' }
      ]
    }
  };

  var ANSWERS = {
    apply: {
      de: 'Bewerbungen laufen nur über das Formular. Sie können einen Lebenslauf als PDF, DOC oder DOCX hochladen (höchstens 10 MB) oder ein Profil ohne Datei senden. Pflicht sind die Einwilligung zur Verarbeitung, die Weitergabe an Arbeitgeber und die Altersbestätigung (mindestens 16 Jahre, oder die Einwilligung einer sorgeberechtigten Person). Der Talentpool ist freiwillig. Eine E-Mail ohne Formular wird nicht bearbeitet.',
      fr: 'Les candidatures passent uniquement par le formulaire. Vous pouvez envoyer un CV en PDF, DOC ou DOCX (10 Mo maximum) ou un profil sans fichier. Le traitement, la transmission aux employeurs et la confirmation d’âge (16 ans au moins, ou le consentement d’un titulaire de l’autorité parentale) sont obligatoires. Le vivier de talents est facultatif. Un e-mail sans formulaire n’est pas traité.',
      en: 'Applications go only through the form. You can upload a CV as PDF, DOC, or DOCX (10 MB maximum) or send a profile without a file. Processing consent, consent to share with employers, and age confirmation (at least 16, or consent from a guardian) are required. The talent pool is optional. An email without the form is not processed.',
      ar: 'التقديم يتم فقط عبر النموذج. يمكن رفع سيرة ذاتية بصيغة PDF أو DOC أو DOCX (بحد أقصى 10 ميغابايت) أو إرسال ملف من دون مرفق. الموافقة على المعالجة وعلى المشاركة مع أصحاب العمل وتأكيد العمر (16 سنة على الأقل، أو موافقة ولي الأمر) إلزامية. قائمة المواهب اختيارية. البريد من دون النموذج لا يُعالَج.'
    },
    file: {
      de: 'Die Datei muss PDF, DOC oder DOCX sein und darf 10 MB nicht überschreiten. Bitte keine Gesundheitsdaten, Religionsangaben oder Gewerkschaftszugehörigkeit, außer ein Verfahren verlangt ausdrücklich einen berufsbezogenen Nachweis.',
      fr: 'Le fichier doit être un PDF, DOC ou DOCX et ne pas dépasser 10 Mo. N’envoyez pas de données de santé, de religion ou d’appartenance syndicale, sauf si une procédure exige expressément une preuve liée au métier.',
      en: 'The file must be PDF, DOC, or DOCX and must not exceed 10 MB. Do not upload health data, religion, or trade-union membership unless a procedure expressly requires a job-related proof.',
      ar: 'يجب أن يكون الملف PDF أو DOC أو DOCX وألا يتجاوز 10 ميغابايت. لا ترفعوا بيانات صحية أو دينية أو انتماء نقابياً إلا إذا طلب إجراء إثباتاً مهنياً صريحاً.'
    },
    employer: {
      de: 'Arbeitgeber erhalten vorqualifizierte Shortlists in Medizin und Pflege, Technik, Logistik und IT. MEDA ist reine Personalvermittlung und bietet keine Arbeitnehmerüberlassung ohne Erlaubnis an. Ein Preis steht nicht auf der Website. Die Rolle beschreiben Sie im Kontaktformular.',
      fr: 'Les employeurs reçoivent des shortlists préqualifiées en santé, technique, logistique et IT. MEDA fait du placement pur et ne propose pas d’intérim sans l’autorisation requise. Aucun prix n’est publié sur le site. Décrivez le poste via le formulaire de contact.',
      en: 'Employers receive prequalified shortlists in healthcare, engineering, logistics, and IT. MEDA is pure placement and does not offer temporary staffing without the required licence. No price is published on the site. Describe the role in the contact form.',
      ar: 'يحصل أصحاب العمل على قوائم مختصرة مُقيَّمة مسبقاً في الصحة والهندسة واللوجستيات وتقنية المعلومات. MEDA وساطة خالصة ولا تقدّم إعارة عمال من دون الترخيص. لا يُنشر سعر في الموقع. صِفوا الدور في نموذج الاتصال.'
    },
    visa: {
      de: 'Wir matchen Profile und geben Orientierung zu einem tragfähigen Aufenthaltsweg, zur Blauen Karte und zur Anerkennung. Das ist keine Rechtsberatung und keine Visumgarantie. Über ein Visum entscheiden die zuständigen Stellen.',
      fr: 'Nous apparions des profils et donnons une orientation sur une voie de séjour viable, la carte bleue et la reconnaissance. Ce n’est pas un conseil juridique et pas une garantie de visa. Les autorités compétentes décident du visa.',
      en: 'We match profiles and give orientation on a viable residence route, the EU Blue Card, and recognition. This is not legal advice and not a visa guarantee. The competent authorities decide on a visa.',
      ar: 'نطابق الملفات ونقدّم توجيهاً حول مسار إقامة ممكن والبطاقة الزرقاء والاعتراف بالمؤهلات. هذه ليست استشارة قانونية ولا ضمان تأشيرة. الجهات المختصة هي التي تقرر التأشيرة.'
    },
    matcher: {
      de: 'Auf der Seite für Fachkräfte wählen Sie Pfad, Rolle, Deutsch und Erfahrung. Die Angebote dort sind eine Matching-Demo mit Beispielen, keine veröffentlichten Stellen. Eine echte Bewerbung senden Sie über das Formular.',
      fr: 'Sur la page des professionnels, vous choisissez le parcours, le rôle, l’allemand et l’expérience. Les offres affichées sont une démo avec des exemples, pas des postes publiés. Une vraie candidature passe par le formulaire.',
      en: 'On the professionals page you choose a path, role, German level, and experience. The offers shown there are a matching demo with examples, not published jobs. A real application goes through the form.',
      ar: 'في صفحة الكفاءات تختارون المسار والدور ومستوى الألمانية والخبرة. العروض المعروضة تجربة مطابقة بأمثلة، وليست وظائف منشورة. التقديم الحقيقي يتم عبر النموذج.'
    },
    language: {
      de: 'Die Website gibt es auf Deutsch, Französisch, Englisch und Arabisch. Für Profile gilt Deutsch B1 oder B2; C1 ist willkommen. Die Sprache der Website und das Sprachniveau für eine Stelle sind zwei verschiedene Dinge.',
      fr: 'Le site est en allemand, français, anglais et arabe. Pour les profils, l’allemand B1 ou B2 est attendu ; le C1 est bienvenu. La langue du site et le niveau exigé pour un poste sont deux choses différentes.',
      en: 'The site is available in German, French, English, and Arabic. Profiles are expected at German B1 or B2; C1 is welcome. The language of the website and the language level for a role are two different things.',
      ar: 'الموقع متاح بالألمانية والفرنسية والإنجليزية والعربية. للملفات يُتوقَّع مستوى ألماني B1 أو B2، وC1 مرحّب به. لغة الموقع ومستوى اللغة المطلوب للوظيفة أمران مختلفان.'
    },
    privacy: {
      de: 'Seitenaufrufe speichern wir nur, wenn Sie „Ich akzeptiere“ wählen. Ablehnen lässt die Website nutzbar. Bewerbungen brauchen getrennte Einwilligungen. Ein Widerruf geht über die Seite Widerruf; wenn das Protokoll nicht erreichbar ist, bleibt der E-Mail-Weg. Dieser Chat wird nicht an einen Server gesendet.',
      fr: 'Nous n’enregistrons les visites que si vous choisissez « J’accepte ». Refuser laisse le site utilisable. Les candidatures exigent des consentements séparés. Le retrait se fait sur la page Retrait ; si le journal est injoignable, l’e-mail reste possible. Cette conversation n’est pas envoyée à un serveur.',
      en: 'We store page visits only if you choose “I accept”. Declining leaves the site usable. Applications need separate consents. Withdrawal is on the withdrawal page; if the log cannot be reached, email remains available. This chat is not sent to a server.',
      ar: 'لا نحفظ زيارات الصفحات إلا إذا اخترتم «أوافق». الرفض يبقي الموقع قابلاً للاستخدام. التقديم يحتاج موافقات منفصلة. السحب يتم من صفحة السحب؛ وإذا تعذّر السجل يبقى البريد متاحاً. هذه المحادثة لا تُرسل إلى خادم.'
    },
    integration: {
      de: 'Nach einer erfolgreichen Vermittlung unterstützen wir das praktische Ankommen: Wohnungssuche, Orientierung zum Konto und zu den ersten Behördengängen. Das ersetzt keine Rechtsberatung und beginnt nicht vor einer Vermittlung.',
      fr: 'Après un placement réussi, nous aidons pour l’arrivée concrète : recherche de logement, orientation pour le compte bancaire et les premières démarches. Cela ne remplace pas un conseil juridique et ne commence pas avant un placement.',
      en: 'After a successful placement we help with the practical arrival: finding housing, and orientation for a bank account and the first appointments with authorities. This does not replace legal advice and does not start before a placement.',
      ar: 'بعد وساطة ناجحة نساعد على الوصول العملي: البحث عن سكن، والتوجيه لفتح حساب والخطوات الأولى لدى الجهات. هذا لا يغني عن استشارة قانونية ولا يبدأ قبل الوساطة.'
    },
    contact: {
      de: 'Nachrichten senden Sie über das Kontaktformular oder an meda-vermittlung@agentmail.to. Bewerbungen bitte nur über das Bewerbungsformular. Eine postalische Anschrift wird nicht veröffentlicht. Sobald eine virtuelle Geschäftsnummer geschaltet ist, nimmt ein automatischer Assistent den Anruf entgegen, schreibt die Nachricht auf und eine Person ruft zurück.',
      fr: 'Écrivez via le formulaire de contact ou à meda-vermittlung@agentmail.to. Les candidatures passent uniquement par le formulaire de candidature. Aucune adresse postale n’est publiée. Dès qu’un numéro professionnel virtuel est activé, un assistant automatique prend l’appel, note le message et une personne rappelle.',
      en: 'Send a message through the contact form or to meda-vermittlung@agentmail.to. Applications go only through the application form. No postal address is published. Once a virtual business number is connected, an automatic assistant answers, writes down the message, and a person calls back.',
      ar: 'أرسلوا الرسالة عبر نموذج الاتصال أو إلى meda-vermittlung@agentmail.to. التقديم يتم فقط عبر نموذج التقديم. لا يُنشر عنوان بريدي. عند تشغيل رقم عمل افتراضي يرد مساعد آلي ويكتب الرسالة ثم يتصل شخص لاحقاً.'
    },
    sectors: {
      de: 'Der Fokus liegt auf Medizin und Pflege, Ingenieurwesen und Technik, Logistik und IT, dazu Ausbildungspfade. Unqualifizierte Helferprofile und reines Lager-Sourcing gehören nicht zum Angebot.',
      fr: 'Le focus porte sur la santé, l’ingénierie et la technique, la logistique et l’IT, ainsi que les parcours d’Ausbildung. Les profils d’aides non qualifiés et le sourcing d’entrepôt seul ne font pas partie de l’offre.',
      en: 'The focus is healthcare, engineering, logistics, and IT, plus Ausbildung pathways. Unqualified helper profiles and warehouse-only sourcing are not part of the offer.',
      ar: 'التركيز على الصحة والهندسة واللوجستيات وتقنية المعلومات، إضافة إلى مسارات التدريب المهني. ملفات المساعدين غير المؤهلين والتوظيف للمستودع فقط ليسا ضمن العرض.'
    },
    fees: {
      de: 'Auf den Seiten steht kein Preis für Bewerberinnen und Bewerber und kein Festpreis für Arbeitgeber. Für Arbeitgeber gibt es flexible Beauftragungsmodelle. Eine konkrete Frage dazu stellen Sie über das Kontaktformular.',
      fr: 'Les pages n’indiquent pas de prix pour les candidats ni de forfait pour les employeurs. Pour les employeurs, les modes de mission sont flexibles. Posez une question précise via le formulaire de contact.',
      en: 'The pages do not list a fee for applicants or a fixed price for employers. Employer engagements can be flexible. Ask a specific question through the contact form.',
      ar: 'لا تذكر الصفحات رسماً للمرشحين ولا سعراً ثابتاً لأصحاب العمل. نماذج التكليف لأصحاب العمل مرنة. اطرحوا السؤال المحدد عبر نموذج الاتصال.'
    },
    aug: {
      de: 'MEDA Vermittlung ist reine Personalvermittlung. Arbeitnehmerüberlassung im Sinne des AÜG bieten wir ohne die erforderliche Erlaubnis nicht an.',
      fr: 'MEDA Vermittlung est du placement pur. Nous ne proposons pas d’intérim au sens de l’AÜG sans l’autorisation requise.',
      en: 'MEDA Vermittlung is pure placement. We do not offer temporary staffing under the AÜG without the required licence.',
      ar: 'MEDA Vermittlung وساطة مهنية خالصة. لا نقدّم إعارة عمال وفق قانون AÜG من دون الترخيص المطلوب.'
    },
    who: {
      de: 'MEDA Vermittlung verbindet Unternehmen in Deutschland mit Profilen auf Ausbildungs- oder Fachkräftepfaden. Maßstab sind Qualifikation, Deutsch und ein tragfähiger Weg — ohne Visumversprechen.',
      fr: 'MEDA Vermittlung relie des entreprises en Allemagne à des profils en Ausbildung ou déjà qualifiés. Les critères sont la qualification, l’allemand et une voie viable — sans promesse de visa.',
      en: 'MEDA Vermittlung connects companies in Germany with Ausbildung or qualified-professional profiles. The measure is qualification, German, and a viable route — without a visa promise.',
      ar: 'تربط MEDA Vermittlung شركات في ألمانيا بملفات تدريب مهني أو كفاءات جاهزة. المعيار هو المؤهل والألمانية ومسار ممكن — من دون وعد بتأشيرة.'
    }
  };

  var LINKS = {
    apply: [
      { href: 'bewerben.html', de: 'Zum Formular', fr: 'Vers le formulaire', en: 'Open the form', ar: 'إلى النموذج' },
      { href: 'einwilligung.html', de: 'Einwilligung', fr: 'Consentement', en: 'Consent', ar: 'الموافقة' }
    ],
    file: [
      { href: 'bewerben.html', de: 'Zum Formular', fr: 'Vers le formulaire', en: 'Open the form', ar: 'إلى النموذج' }
    ],
    employer: [
      { href: 'fuer-arbeitgeber.html', de: 'Für Arbeitgeber', fr: 'Pour employeurs', en: 'For employers', ar: 'لأصحاب العمل' },
      { href: 'kontakt.html', de: 'Kontakt', fr: 'Contact', en: 'Contact', ar: 'اتصال' }
    ],
    visa: [
      { href: 'leistungen.html', de: 'Leistungen', fr: 'Prestations', en: 'Services', ar: 'الخدمات' },
      { href: 'fuer-fachkraefte.html', de: 'Für Fachkräfte', fr: 'Pour professionnels', en: 'For professionals', ar: 'للكفاءات' }
    ],
    matcher: [
      { href: 'fuer-fachkraefte.html#candidate-matcher', de: 'Matching-Demo', fr: 'Démo de matching', en: 'Matching demo', ar: 'تجربة المطابقة' },
      { href: 'bewerben.html', de: 'Wirklich bewerben', fr: 'Postuler vraiment', en: 'Apply for real', ar: 'تقديم حقيقي' }
    ],
    language: [
      { href: 'fuer-fachkraefte.html', de: 'Pfad wählen', fr: 'Choisir un parcours', en: 'Choose a path', ar: 'اختيار المسار' }
    ],
    privacy: [
      { href: 'datenschutz.html', de: 'Datenschutz', fr: 'Confidentialité', en: 'Privacy', ar: 'الخصوصية' },
      { href: 'widerruf.html', de: 'Widerruf', fr: 'Retrait', en: 'Withdrawal', ar: 'السحب' }
    ],
    integration: [
      { href: 'integration.html', de: 'Integration', fr: 'Intégration', en: 'Integration', ar: 'الاندماج' }
    ],
    contact: [
      { href: 'kontakt.html', de: 'Kontaktformular', fr: 'Formulaire de contact', en: 'Contact form', ar: 'نموذج الاتصال' },
      { href: 'bewerben.html', de: 'Bewerbung', fr: 'Candidature', en: 'Application', ar: 'التقديم' }
    ],
    sectors: [
      { href: 'leistungen.html', de: 'Leistungen', fr: 'Prestations', en: 'Services', ar: 'الخدمات' }
    ],
    fees: [
      { href: 'kontakt.html', de: 'Frage stellen', fr: 'Poser une question', en: 'Ask a question', ar: 'اطرح سؤالاً' }
    ],
    aug: [
      { href: 'ueber-uns.html', de: 'Über uns', fr: 'À propos', en: 'About us', ar: 'من نحن' }
    ],
    who: [
      { href: 'ueber-uns.html', de: 'Über uns', fr: 'À propos', en: 'About us', ar: 'من نحن' },
      { href: 'index.html', de: 'Startseite', fr: 'Accueil', en: 'Home', ar: 'البداية' }
    ]
  };

  var TOPICS = [
    { id: 'file', keys: ['10 mb', '10mb', '10 mo', 'datei', 'fichier', 'file size', 'pdf', 'docx', 'anhang', 'pièce jointe', 'attachment', 'ميغابايت', 'مرفق'] },
    { id: 'fees', keys: ['gebühr', 'gebuhr', 'kosten', 'preis', 'honorar', 'tarif', 'fee', 'price', 'cost', 'how much', 'combien', 'prix', 'gratuit', 'free of charge', 'رسوم', 'سعر', 'تكلفة', 'مجانا'] },
    { id: 'aug', keys: ['aüg', 'aug', 'überlassung', 'uberlassung', 'zeitarbeit', 'leiharbeit', 'intérim', 'interim', 'staffing', 'temporary staff', 'إعارة', 'عمل مؤقت'] },
    { id: 'visa', keys: ['visum', 'visa', 'blue card', 'blaue karte', 'anerkennung', 'recognition', 'reconnaissance', 'aufenthalt', 'immigration', 'تأشيرة', 'فيزا', 'إقامة', 'اعتراف', 'البطاقة الزرقاء'] },
    { id: 'privacy', keys: ['datenschutz', 'dsgvo', 'gdpr', 'einwilligung', 'widerruf', 'consent', 'privacy', 'withdraw', 'confidentialité', 'retrait', 'خصوصية', 'موافقة', 'سحب', 'حماية البيانات'] },
    { id: 'integration', keys: ['integration', 'wohnung', 'konto', 'behörde', 'ankommen', 'logement', 'banque', 'arrivée', 'housing', 'bank account', 'سكن', 'حساب', 'اندماج', 'وصول'] },
    { id: 'matcher', keys: ['matcher', 'matching', 'demo', 'beispielangebot', 'exemple', 'sample offer', 'angebote', 'offres', 'مطابقة', 'عروض'] },
    { id: 'language', keys: ['deutsch', 'german', 'allemand', 'b1', 'b2', 'c1', 'sprachniveau', 'niveau', 'ألماني', 'لغة', 'مستوى'] },
    { id: 'employer', keys: ['arbeitgeber', 'unternehmen', 'employer', 'company', 'employeur', 'entreprise', 'shortlist', 'stelle besetzen', 'hiring', 'صاحب عمل', 'شركة', 'توظيف'] },
    { id: 'apply', keys: ['bewerb', 'lebenslauf', 'profil', 'formular', 'postul', 'candidat', 'cv', 'resume', 'upload', 'apply', 'application', 'تقديم', 'أقدّم', 'سيرة', 'طلب', 'استمارة'] },
    { id: 'contact', keys: ['kontakt', 'contact', 'e-mail', 'email', 'telefon', 'anfrage', 'adresse', 'anschrift', 'هاتف', 'بريد', 'عنوان', 'اتصال'] },
    { id: 'sectors', keys: ['pflege', 'healthcare', 'arzt', 'ingenieur', 'logistik', 'ausbildung', 'sektor', 'nurse', 'sante', 'ingenieur', 'logistique', 'software', 'informatik', 'digital', 'تمريض', 'هندسة', 'لوجست', 'قطاع', 'تدريب مهني', 'تقنية المعلومات'] },
    { id: 'who', keys: ['wer seid', 'was ist meda', 'über uns', 'uber uns', 'about', 'qui êtes', 'qui etes', 'what is meda', 'what do you do', 'من أنتم', 'ما هي', 'عنكم'] }
  ];

  var GREET = ['hallo', 'hi', 'hello', 'hey', 'bonjour', 'salut', 'guten tag', 'guten morgen', 'مرحبا', 'السلام', 'أهلا', 'اهلا'];

  function fold(value) {
    return String(value || '').toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/ß/g, 'ss')
      .replace(/[’']/g, '');
  }

  function hasKey(text, key) {
    var folded = fold(text);
    var needle = fold(key);
    if (!needle) return false;
    if (needle.length <= 3 && /^[a-z0-9]+$/.test(needle)) {
      return new RegExp('(^|[^a-z0-9])' + needle + '([^a-z0-9]|$)').test(folded);
    }
    return folded.indexOf(needle) !== -1 || String(text).indexOf(key) !== -1;
  }

  function scoreTopics(text) {
    var best = '';
    var bestScore = 0;
    TOPICS.forEach(function (topic) {
      var score = 0;
      topic.keys.forEach(function (key) {
        if (hasKey(text, key)) score += key.length > 4 ? 2 : 1;
      });
      if (score > bestScore) {
        bestScore = score;
        best = topic.id;
      }
    });
    return best;
  }

  function isGreeting(text) {
    var folded = fold(text).replace(/[!?.،]+/g, '').trim();
    return GREET.some(function (word) {
      var greeting = fold(word);
      return folded === greeting || (folded.indexOf(greeting + ' ') === 0 && folded.length < greeting.length + 16);
    });
  }

  function safeHref(href) {
    return /^[a-z0-9-]+\.html(#[a-z0-9-]+)?$/.test(href) ? href : 'index.html';
  }

  function pack() {
    return UI[lang] || UI.de;
  }

  function reply(text) {
    var raw = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 500);
    if (!raw) return null;
    var topic = scoreTopics(raw);
    var probe = fold(raw);
    if (!topic && lastTopic && probe.length < 42 && /^(und|and|et|wie|how|comment|weiter|auch|also|then|puis)/.test(probe)) {
      topic = /pdf|datei|file|fichier|mb|mo|taille|size|grosse/.test(probe) ? 'file' : lastTopic;
    }
    if (!topic && isGreeting(raw)) {
      return { topic: 'greeting', text: pack().intro, links: [] };
    }
    if (!topic) {
      return { topic: 'fallback', text: pack().fallback, links: LINKS.contact };
    }
    if (topic !== 'file') lastTopic = topic;
    else lastTopic = 'apply';
    var answer = ANSWERS[topic] || {};
    return {
      topic: topic,
      text: answer[lang] || answer.de || pack().fallback,
      links: LINKS[topic] || []
    };
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function addMessage(role, text, links) {
    var bubble = el('div', 'meda-support-msg ' + role);
    text.split(/\n+/).forEach(function (part) {
      var p = el('p', '', part);
      bubble.appendChild(p);
    });
    if (links && links.length) {
      var row = el('div', 'meda-support-links');
      links.forEach(function (link) {
        var a = document.createElement('a');
        a.href = safeHref(link.href);
        a.textContent = link[lang] || link.de || link.en || '';
        row.appendChild(a);
      });
      bubble.appendChild(row);
    }
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function renderChips() {
    chips.textContent = '';
    pack().chips.forEach(function (chip) {
      var btn = el('button', 'meda-support-chip', chip.label);
      btn.type = 'button';
      btn.addEventListener('click', function () {
        ask(chip.q);
      });
      chips.appendChild(btn);
    });
  }

  function renderChrome() {
    if (!root) return;
    var copy = pack();
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.lang = lang;
    launch.textContent = copy.open;
    launch.setAttribute('aria-label', copy.title);
    root.querySelector('.meda-support-title').textContent = copy.title;
    root.querySelector('.meda-support-close').textContent = copy.close;
    root.querySelector('.meda-support-close').setAttribute('aria-label', copy.close);
    root.querySelector('.meda-support-note').textContent = copy.disclaimer;
    input.placeholder = copy.placeholder;
    input.setAttribute('aria-label', copy.placeholder);
    root.querySelector('.meda-support-send').textContent = copy.send;
    renderChips();
  }

  function ask(text) {
    var result = reply(text);
    if (!result) return;
    addMessage('user', String(text).trim().slice(0, 500));
    addMessage('bot', result.text, result.links);
  }

  function setOpen(open) {
    panel.hidden = !open;
    launch.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      if (!openedOnce) {
        openedOnce = true;
        addMessage('bot', pack().intro);
      }
      input.focus();
    } else {
      launch.focus();
    }
  }

  function currentLang() {
    var code = (document.documentElement.lang || 'de').slice(0, 2).toLowerCase();
    return LANGS.indexOf(code) === -1 ? 'de' : code;
  }

  function build() {
    root = el('div', 'meda-support');
    launch = el('button', 'meda-support-launch', pack().open);
    launch.type = 'button';
    launch.setAttribute('aria-controls', 'meda-support-panel');
    launch.setAttribute('aria-expanded', 'false');
    panel = el('section', 'meda-support-panel');
    panel.id = 'meda-support-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'meda-support-title');
    var head = el('header', 'meda-support-head');
    var title = el('h2', 'meda-support-title', pack().title);
    title.id = 'meda-support-title';
    var close = el('button', 'meda-support-close', pack().close);
    close.type = 'button';
    close.addEventListener('click', function () { setOpen(false); });
    head.appendChild(title);
    head.appendChild(close);
    log = el('div', 'meda-support-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');
    chips = el('div', 'meda-support-chips');
    var note = el('p', 'meda-support-note', pack().disclaimer);
    form = el('form', 'meda-support-form');
    form.setAttribute('action', '#');
    input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 500;
    input.autocomplete = 'off';
    var send = el('button', 'meda-support-send', pack().send);
    send.type = 'submit';
    form.appendChild(input);
    form.appendChild(send);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var value = input.value;
      input.value = '';
      ask(value);
    });
    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(chips);
    panel.appendChild(note);
    panel.appendChild(form);
    root.appendChild(panel);
    root.appendChild(launch);
    launch.addEventListener('click', function () {
      setOpen(panel.hidden);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && panel && !panel.hidden) setOpen(false);
    });
    document.body.appendChild(root);
    renderChrome();
  }

  function onLang(next) {
    lang = LANGS.indexOf(next) === -1 ? 'de' : next;
    renderChrome();
  }

  document.addEventListener('abk:lang', function (event) {
    var next = event.detail && event.detail.lang;
    onLang(next || currentLang());
  });

  function start() {
    if (!document.body || document.getElementById('meda-support-panel')) return;
    lang = currentLang();
    build();
  }

  window.MEDA_support = {
    reply: function (text, language) {
      var previous = lang;
      var previousTopic = lastTopic;
      if (language && LANGS.indexOf(language) !== -1) lang = language;
      var result = reply(text);
      lang = previous;
      lastTopic = previousTopic;
      return result;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
