(function () {
  'use strict';
  /**
   * Demo / sample offers for client-side matching.
   * langMin: minimum German level the role typically asks for.
   * experienceRequired: whether prior professional experience is expected.
   * path: ausbildung | healthcare | other
   * role: specific sub-role key (optional for ausbildung)
   */
  window.ABK_OFFERS = [
    {
      id: 'aus-mec-b1',
      path: 'ausbildung',
      role: 'ausbildung',
      langMin: 'B2',
      experienceRequired: false,
      title: { de: 'Ausbildung Industriemechanik (m/w/d)', fr: 'Formation mécanicien industriel (H/F)', en: 'Apprenticeship — Industrial Mechanic' },
      city: { de: 'Stuttgart', fr: 'Stuttgart', en: 'Stuttgart' },
      region: { de: 'Baden-Württemberg', fr: 'Bade-Wurtemberg', en: 'Baden-Württemberg' },
      tags: { de: 'Ausbildung · B2', fr: 'Formation · B2', en: 'Ausbildung · B2' }
    },
    {
      id: 'aus-ele-b2',
      path: 'ausbildung',
      role: 'ausbildung',
      langMin: 'B2',
      experienceRequired: false,
      title: { de: 'Ausbildung Elektroniker für Betriebstechnik', fr: 'Formation électronicien systèmes industriels', en: 'Apprenticeship — Industrial Electronics' },
      city: { de: 'Nürnberg', fr: 'Nuremberg', en: 'Nuremberg' },
      region: { de: 'Bayern', fr: 'Bavière', en: 'Bavaria' },
      tags: { de: 'Ausbildung · B2', fr: 'Formation · B2', en: 'Ausbildung · B2' }
    },
    {
      id: 'aus-pflege-b2',
      path: 'ausbildung',
      role: 'ausbildung',
      langMin: 'B2',
      experienceRequired: false,
      title: { de: 'Ausbildung Pflegefachfrau/-mann', fr: 'Formation infirmier·ère (Ausbildung)', en: 'Nursing apprenticeship (Pflegefachkraft)' },
      city: { de: 'Hamburg', fr: 'Hambourg', en: 'Hamburg' },
      region: { de: 'Hamburg', fr: 'Hambourg', en: 'Hamburg' },
      tags: { de: 'Ausbildung · B2 · C1 willkommen', fr: 'Formation · B2 · C1 bienvenu', en: 'Ausbildung · B2 · C1 welcome' }
    },
    {
      id: 'aus-it-b2',
      path: 'ausbildung',
      role: 'ausbildung',
      langMin: 'B2',
      experienceRequired: false,
      title: { de: 'Ausbildung Fachinformatiker Anwendungsentwicklung', fr: 'Formation informaticien développement d’applications', en: 'IT apprenticeship — Application Development' },
      city: { de: 'Berlin', fr: 'Berlin', en: 'Berlin' },
      region: { de: 'Berlin', fr: 'Berlin', en: 'Berlin' },
      tags: { de: 'Ausbildung · B2', fr: 'Formation · B2', en: 'Ausbildung · B2' }
    },
    {
      id: 'aus-log-b2',
      path: 'ausbildung',
      role: 'ausbildung',
      langMin: 'B2',
      experienceRequired: false,
      title: { de: 'Ausbildung Fachkraft für Lagerlogistik', fr: 'Formation agent logistique d’entrepôt', en: 'Warehouse logistics apprenticeship' },
      city: { de: 'Leipzig', fr: 'Leipzig', en: 'Leipzig' },
      region: { de: 'Sachsen', fr: 'Saxe', en: 'Saxony' },
      tags: { de: 'Ausbildung · B2', fr: 'Formation · B2', en: 'Ausbildung · B2' }
    },
    {
      id: 'hc-pflege-b2-exp',
      path: 'healthcare',
      role: 'pflege',
      langMin: 'B1',
      experienceRequired: true,
      title: { de: 'Pflegefachkraft Intensivstation', fr: 'Infirmier·ère — soins intensifs', en: 'Registered nurse — ICU' },
      city: { de: 'München', fr: 'Munich', en: 'Munich' },
      region: { de: 'Bayern', fr: 'Bavière', en: 'Bavaria' },
      tags: { de: 'B2 · Erfahrung · C1 willkommen', fr: 'B2 · Expérience · C1 bienvenu', en: 'B2 · Experience · C1 welcome' }
    },
    {
      id: 'hc-pflege-b1-noexp',
      path: 'healthcare',
      role: 'pflege',
      langMin: 'B1',
      experienceRequired: false,
      title: { de: 'Pflegefachkraft Station (Anerkennungspfad)', fr: 'Infirmier·ère — service (parcours reconnaissance)', en: 'Registered nurse — ward (recognition track)' },
      city: { de: 'Köln', fr: 'Cologne', en: 'Cologne' },
      region: { de: 'NRW', fr: 'Rhénanie-du-Nord-Westphalie', en: 'North Rhine-Westphalia' },
      tags: { de: 'B2 · Anerkennung möglich', fr: 'B2 · Reconnaissance possible', en: 'B2 · Recognition pathway' }
    },
    {
      id: 'hc-pueri-b1',
      path: 'healthcare',
      role: 'pueri',
      langMin: 'B1',
      experienceRequired: true,
      title: { de: 'Kinderkrankenpflege / Puériculteur', fr: 'Puériculteur·trice — pédiatrie', en: 'Paediatric / child nursing specialist' },
      city: { de: 'Frankfurt am Main', fr: 'Francfort-sur-le-Main', en: 'Frankfurt am Main' },
      region: { de: 'Hessen', fr: 'Hesse', en: 'Hesse' },
      tags: { de: 'B2 · Erfahrung', fr: 'B2 · Expérience', en: 'B2 · Experience' }
    },
    {
      id: 'hc-ota-b1',
      path: 'healthcare',
      role: 'ota',
      langMin: 'B1',
      experienceRequired: true,
      title: { de: 'OTA — Operationstechnischer Assistent', fr: 'OTA — assistant technique opératoire', en: 'OTA — Surgical Technical Assistant' },
      city: { de: 'Hannover', fr: 'Hanovre', en: 'Hanover' },
      region: { de: 'Niedersachsen', fr: 'Basse-Saxe', en: 'Lower Saxony' },
      tags: { de: 'B2 · OP · C1 willkommen', fr: 'B2 · Bloc · C1 bienvenu', en: 'B2 · OR · C1 welcome' }
    },
    {
      id: 'hc-ata-b1',
      path: 'healthcare',
      role: 'ata',
      langMin: 'B1',
      experienceRequired: false,
      title: { de: 'ATA — Anästhesietechnischer Assistent', fr: 'ATA — assistant technique anesthésie', en: 'ATA — Anaesthesia Technical Assistant' },
      city: { de: 'Düsseldorf', fr: 'Düsseldorf', en: 'Düsseldorf' },
      region: { de: 'NRW', fr: 'Rhénanie-du-Nord-Westphalie', en: 'North Rhine-Westphalia' },
      tags: { de: 'B2 · Klinik', fr: 'B2 · Clinique', en: 'B2 · Hospital' }
    },
    {
      id: 'hc-physio-b1-exp',
      path: 'healthcare',
      role: 'physio',
      langMin: 'B1',
      experienceRequired: true,
      title: { de: 'Physiotherapeut/in Rehaklinik', fr: 'Kinésithérapeute — clinique de rééducation', en: 'Physiotherapist — rehab clinic' },
      city: { de: 'Freiburg', fr: 'Fribourg-en-Brisgau', en: 'Freiburg' },
      region: { de: 'Baden-Württemberg', fr: 'Bade-Wurtemberg', en: 'Baden-Württemberg' },
      tags: { de: 'B2 · Erfahrung', fr: 'B2 · Expérience', en: 'B2 · Experience' }
    },
    {
      id: 'hc-physio-b1-junior',
      path: 'healthcare',
      role: 'physio',
      langMin: 'B1',
      experienceRequired: false,
      title: { de: 'Physiotherapie — Einstieg nach Anerkennung', fr: 'Physiothérapie — début après reconnaissance', en: 'Physiotherapy — entry after recognition' },
      city: { de: 'Dortmund', fr: 'Dortmund', en: 'Dortmund' },
      region: { de: 'NRW', fr: 'Rhénanie-du-Nord-Westphalie', en: 'North Rhine-Westphalia' },
      tags: { de: 'B2 · Junior', fr: 'B2 · Junior', en: 'B2 · Junior' }
    },
    {
      id: 'ot-fahrer-b1',
      path: 'other',
      role: 'fahrer',
      langMin: 'B1',
      experienceRequired: true,
      title: { de: 'Berufskraftfahrer CE Fernverkehr', fr: 'Chauffeur poids lourd CE — longue distance', en: 'Professional driver CE — long haul' },
      city: { de: 'Kassel', fr: 'Cassel', en: 'Kassel' },
      region: { de: 'Hessen', fr: 'Hesse', en: 'Hesse' },
      tags: { de: 'B1 · CE · Erfahrung', fr: 'B1 · CE · Expérience', en: 'B1 · CE · Experience' }
    },
    {
      id: 'ot-fahrer-b2',
      path: 'other',
      role: 'fahrer',
      langMin: 'B2',
      experienceRequired: false,
      title: { de: 'Fahrer Regionalverkehr (C/CE-Pfad)', fr: 'Chauffeur régional (parcours C/CE)', en: 'Regional driver (C/CE pathway)' },
      city: { de: 'Magdeburg', fr: 'Magdeburg', en: 'Magdeburg' },
      region: { de: 'Sachsen-Anhalt', fr: 'Saxe-Anhalt', en: 'Saxony-Anhalt' },
      tags: { de: 'B2 · Regional', fr: 'B2 · Régional', en: 'B2 · Regional' }
    },
    {
      id: 'ot-bau-b2-exp',
      path: 'other',
      role: 'bau',
      langMin: 'B2',
      experienceRequired: true,
      title: { de: 'Bauingenieur Hochbau', fr: 'Ingénieur génie civil — bâtiment', en: 'Civil engineer — building construction' },
      city: { de: 'München', fr: 'Munich', en: 'Munich' },
      region: { de: 'Bayern', fr: 'Bavière', en: 'Bavaria' },
      tags: { de: 'B2 · Erfahrung · C1 willkommen', fr: 'B2 · Expérience · C1 bienvenu', en: 'B2 · Experience · C1 welcome' }
    },
    {
      id: 'ot-bau-b1',
      path: 'other',
      role: 'bau',
      langMin: 'B1',
      experienceRequired: false,
      title: { de: 'Bauzeichner / Jungingenieur Baustelle', fr: 'Dessinateur / jeune ingénieur chantier', en: 'Drafter / junior site engineer' },
      city: { de: 'Erfurt', fr: 'Erfurt', en: 'Erfurt' },
      region: { de: 'Thüringen', fr: 'Thuringe', en: 'Thuringia' },
      tags: { de: 'B1 · Einstieg', fr: 'B1 · Début', en: 'B1 · Entry' }
    },
    {
      id: 'ot-andere-b2',
      path: 'other',
      role: 'andere',
      langMin: 'B2',
      experienceRequired: true,
      title: { de: 'Fachkraft Sonstiges — individuelles Matching', fr: 'Autre métier — matching individuel', en: 'Other skilled role — individual matching' },
      city: { de: 'Deutschlandweit', fr: 'Toute l’Allemagne', en: 'Germany-wide' },
      region: { de: 'Mehrere Regionen', fr: 'Plusieurs régions', en: 'Multiple regions' },
      tags: { de: 'B2 · Profilabhängig', fr: 'B2 · Selon profil', en: 'B2 · Profile-dependent' }
    },
    {
      id: 'ot-andere-b1',
      path: 'other',
      role: 'andere',
      langMin: 'B1',
      experienceRequired: false,
      title: { de: 'Orientierungs-Slot — andere Qualifikation', fr: 'Créneau d’orientation — autre qualification', en: 'Orientation slot — other qualification' },
      city: { de: 'Remote / DE', fr: 'À distance / DE', en: 'Remote / DE' },
      region: { de: 'Nach Absprache', fr: 'Sur accord', en: 'By arrangement' },
      tags: { de: 'B1 · Demo', fr: 'B1 · Démo', en: 'B1 · Demo' }
    }
  ];
})();
