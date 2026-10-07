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
      draftBanner: 'Entwurf – Prüfung durch Rechtsanwalt erforderlich',
      draftNote: 'Keine Rechtsberatung. Ein zugelassener Rechtsanwalt hat diesen Text nicht freigegeben.',
      docTitleCandidate: 'Provisorisches Interessens- und Einwilligungs-Vertragsblatt',
      docTitleEmployer: 'Provisorisches Rahmen- und Interessensblatt',
      docKickerCandidate: 'Private Arbeitsvermittlung i.S.d. §§ 296–299 SGB III. Kein Rechtsdienst nach RDG. Version Soft-Launch 0.9.',
      docKickerEmployer: 'MEDA Vermittlung / Meda Family. Aufruf über den MEDA-E-Mail-Link. Version Soft-Launch 0.1.',
      docRoleCandidate: 'Ihre Rolle: Kandidatin oder Kandidat',
      docRoleEmployer: 'Ihre Rolle: Arbeitgeber',
      metaToken: 'Vorgangsnummer',
      metaOffer: 'Angebotsreferenz',
      unknownOffer: 'Diese Referenz ist nur eine Angebotsnummer. Es wird keine Stelle erfunden.',
      missingToken: 'Dieser Link enthält keine Vorgangsnummer. Bitte den Link aus Ihrer Anmeldung verwenden.',
      missingOffer: 'Dieser Link enthält keine Angebotsreferenz.',
      docIntroCandidate: 'Dieses Blatt unterschreiben Sie vor „Interesse senden“. Es ist Einwilligung und Interessens-Auftrag. Es ist noch kein finaler Vermittlungsvertrag.',
      docIntroEmployer: 'Unverbindlicher Entwurf. Kein rechtsverbindlicher Vermittlungsauftrag. Wirksamkeit erst nach Gewerbeanmeldung und Freigabe durch einen deutschen Rechtsanwalt. <span class="esign-todo">[TODO Anwalt]</span>',
      cSheetMeta: 'Gültig ab dem Zeitpunkt der Unterschrift. Version Soft-Launch 0.9. Bindung: false bis Gewerbe und Anwaltsfreigabe.',
      cWithdraw: 'Widerruf senden an <a href="mailto:meda-vermittlung@agentmail.to">meda-vermittlung@agentmail.to</a>. <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutz</a> · <a href="einwilligung.html" target="_blank" rel="noopener">Einwilligung</a>.',
      nameEmployer: 'Ansprechpartner',
      companyEmployer: 'Firma / Einrichtung',
      submitEmployer: 'Unverbindliches Interesse bestätigen',
      cSec1: '<h3>1. Parteien und Zweck</h3><ol class="esign-nums"><li>1.1 Auftraggeber: Kandidat/in (Name und E-Mail auf diesem Blatt). Geburtsdatum: [PLATZHALTER], auf diesem Blatt nicht erfasst.</li><li>1.2 Auftragnehmer: MEDA Vermittlung [PLATZHALTER], Luhnenstraße 7, 30559 Hannover. Private Arbeitsvermittlung und Integrationshilfe.</li><li>1.3 Zweck: MEDA soll Ihr Profil prüfen und es bei Eignung an passende deutsche Arbeitgeber weiterleiten.</li></ol>',
      cSec2: '<h3>2. Einwilligung zur Datenweitergabe – DSGVO / BDSG</h3><ol class="esign-nums"><li>2.1 Sie willigen nach Art. 6 Abs. 1 lit. a DSGVO, Art. 7 DSGVO und § 26 BDSG ein: MEDA darf Kontaktdaten und Bewerberprofil an passende deutsche Arbeitgeber weitergeben.</li><li>2.2 Weitergabe nur über MEDA Ops nach manueller Prüfung. Kein Auto-Blast. Kein Massenversand.</li><li>2.3 Nur an Arbeitgeber mit konkretem Match für Ihre Qualifikation. Sie werden vorher informiert, an wen gesendet wird, soweit möglich.</li><li>2.4 Sie können die Einwilligung jederzeit widerrufen. Widerruf per E-Mail an meda-vermittlung@agentmail.to. Widerruf wirkt für die Zukunft. § 7 Abs. 3 DSGVO.</li><li>2.5 Speicherung und Löschung nach DSGVO. Rechte: Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch.</li></ol>',
      cSec3: '<h3>3. Leistungen von MEDA</h3><ol class="esign-nums"><li>3.1 Vermittlung: private Arbeitsvermittlung nach §§ 296 ff. SGB III. MEDA sucht, prüft und schlägt passende Stellen vor. MEDA führt Vorstellungsgespräche und die Abstimmung mit Arbeitgebern.</li><li>3.2 Integration / MEDA One: Integrationshilfe nach Ankunft, z. B. Orientierung, Behördenwege, Wohnungssuche-Hilfe, Sprach- und Kultur-Coaching. Details werden separat vereinbart.</li><li>3.3 MEDA ist reiner Vermittler. Keine Arbeitnehmerüberlassung. Abgrenzung zu § 1 AÜG: Anstellung direkt beim Arbeitgeber, nicht bei MEDA.</li></ol>',
      cSec4: '<h3>4. Vergütung und Kosten – <span class="esign-todo">[TODO Anwalt]</span></h3><ol class="esign-nums"><li>4.1 Ob und welche Vergütung anfällt, ist offen. Alle Beträge werden vor Abschluss des finalen Vermittlungsvertrags schriftlich genannt und erklärt.</li><li>4.2 Konkrete Höhe: <span class="esign-todo">[TODO Anwalt – Betrag einsetzen, § 296 SGB III beachten, Deckelung nach § 296 SGB III]</span>. Keine Vorkasse. Kein Vorschuss vor Erfolg.</li><li>4.3 Ausbildung: 0 € Vergütung vom Kandidaten, wo das Gesetz dies verlangt. MEDA hält dies ein.</li><li>4.4 Alle Vergütungen erst nach separater, ausdrücklicher Vereinbarung im finalen Vermittlungsvertrag nach § 296 SGB III. Dieses Blatt begründet keine Zahlungspflicht.</li></ol>',
      cSec5: '<h3>5. Kein Exklusiv-Auftrag. Kontaktkanal. Keine AÜG.</h3><ol class="esign-nums"><li>5.1 Kein harter Exklusiv-Auftrag. Sie dürfen sich parallel selbst bewerben und andere Vermittler beauftragen. § 297 Nr. 4 SGB III verbietet unzulässige Ausschließlichkeitsklauseln.</li><li>5.2 Soft-Kontaktkanal: Arbeitgeber, die MEDA Ihnen vorgestellt hat, kontaktieren Sie bis zum Arbeitsvertrag nur über MEDA. Das dient der geordneten Vermittlung.</li><li>5.3 Dies ist keine harte Exklusivität. Bewerbungen über andere Vermittler und Eigenbewerbungen bleiben frei.</li><li>5.4 Vorab-Offenlegung: Haben Sie einen Arbeitgeber bereits über einen anderen Vermittler oder selbst kontaktiert, teilen Sie dies MEDA vor Weitergabe mit. Für Verträge mit anderen Vermittlern haftet MEDA nicht.</li><li>5.5 MEDA verlangt keine Kündigung Ihres aktuellen Jobs als Bedingung.</li><li>5.6 Keine Arbeitnehmerüberlassung. Es gilt deutsches Arbeitsrecht und das AGG. Diskriminierung nach dem AGG ist untersagt.</li></ol>',
      cSec6: '<h3>6. Soft-Launch-Vorbehalt</h3><ol class="esign-nums"><li>6.1 Dieses Blatt ist ein provisorischer Interessens-Auftrag. Bindung: false.</li><li>6.2 Der voll wirksame Vermittlungsvertrag nach §§ 296–299 SGB III entsteht erst nach (a) Gewerbeanmeldung der privaten Arbeitsvermittlung und (b) Freigabe durch einen Rechtsanwalt.</li><li>6.3 Bis dahin keine volle Bindung als Vermittlungsvertrag. MEDA informiert Sie, sobald die Freigabe vorliegt. Dann erhalten Sie den finalen Vertrag zur Unterschrift.</li></ol>',
      cSec7: '<h3>7. Keine Garantie</h3><ol class="esign-nums"><li>7.1 Keine Job-Garantie. Keine Visa-Garantie. Keine Einreise-Garantie.</li><li>7.2 Die Einstellung entscheidet allein der Arbeitgeber. Das Visum entscheidet allein die deutsche Botschaft oder die Ausländerbehörde.</li><li>7.3 MEDA schuldet Bemühen, keinen Erfolg.</li></ol>',
      cSec8: '<h3>8. Pflichten des Kandidaten</h3><ol class="esign-nums"><li>8.1 Sie geben wahre und vollständige Angaben. Sie informieren MEDA über Änderungen.</li><li>8.2 Sie beachten deutsche Gesetze und die AGG-Pflichten im Bewerbungsprozess.</li></ol>',
      cSec9: '<h3>9. Laufzeit und Widerruf</h3><ol class="esign-nums"><li>9.1 Laufzeit: 6 Monate ab Unterschrift. Verlängerung nur mit neuer Einwilligung.</li><li>9.2 Widerruf jederzeit ohne Grund, formlos per E-Mail. Bereits erfolgte, rechtmäßige Weitergaben bleiben wirksam.</li></ol>',
      cSec10: '<h3>10. Optionaler Plattform-Nachtrag</h3><ol class="esign-nums"><li>10.1 Ein späterer Login oder Plattformzugang ist freiwillig.</li><li>10.2 Dafür kann ein separater Nutzungs-Nachtrag unterschrieben werden. Er regelt Zugang, Passwort und Datenschutz im Portal.</li><li>10.3 Ohne diesen Nachtrag gilt nur dieses Blatt.</li></ol>',
      eSec1: '<h3>1. Gegenstand und Status</h3><ol class="esign-nums"><li>1.1 MEDA Vermittlung [PLATZHALTER] / Meda Family ist private Arbeitsvermittlung i. S. d. §§ 296–299 SGB III. Keine Arbeitnehmerüberlassung i. S. d. AÜG. Meda Family ist Markenrahmen.</li><li>1.2 Dieses Blatt regelt nur den Rahmen für eine langfristige Kooperation. Es ist ein Interessensblatt. Es begründet noch keinen bindenden Vermittlungsauftrag.</li><li>1.3 Soft-Launch: alle Pflichten sind provisorisch. Bindung: false. Bindung entsteht erst nach (a) Gewerbeanmeldung und (b) anwaltlicher Freigabe. Bis dahin unverbindliche Interessensbekundung.</li></ol>',
      eSec2: '<h3>2. Leistungen von MEDA</h3><ol class="esign-nums"><li>2.1 MEDA Vermittlung [PLATZHALTER] sucht und präsentiert passende Bewerber für Pflege und Betreuung.</li><li>2.2 Der Arbeitgeber erhält einen Kandidaten-Pool / Auswahllisten mit Profilen. Nur mit Einwilligung der Bewerber nach Art. 6 DSGVO / BDSG.</li><li>2.3 MEDA trifft eine Vorauswahl. Die Endauswahl trifft allein der Arbeitgeber.</li><li>2.4 MEDA übernimmt keine arbeitsrechtliche Entscheidung für den Arbeitgeber.</li><li>2.5 MEDA bleibt nach Ankunft in Kontakt. Integrationsbegleitung für Bewerber und Arbeitgeber. Kontakt erfolgt in Abstimmung mit dem Arbeitgeber.</li></ol>',
      eSec3: '<h3>3. Pflichten des Arbeitgebers</h3><ol class="esign-nums"><li>3.1 Der Arbeitgeber prüft die Vorschläge zeitnah und gibt Feedback.</li><li>3.2 Der Arbeitgeber beachtet das AGG. Keine Diskriminierung nach § 1 und § 2 AGG. Auswahl nur nach Qualifikation.</li><li>3.3 Datenschutz nach DSGVO und BDSG. Bewerberdaten nur für das Besetzungsverfahren. Nicht weitergeben. Nach Abschluss löschen.</li><li>3.4 Der Arbeitgeber meldet eine Einstellung zeitnah an MEDA Vermittlung [PLATZHALTER] zurück.</li><li>3.5 Kontaktkanal und Umgehungsschutz für eingeführte Kandidaten: Für von MEDA eingeführte Kandidaten läuft der Kontakt bis zum Abschluss eines Arbeitsvertrags über MEDA Vermittlung [PLATZHALTER]. Kein Bypass der Vermittlung für diese Kandidaten. Direkte Kontaktaufnahme oder Abschluss ohne Einbindung von MEDA ist für diesen Personenkreis ausgeschlossen. <span class="esign-todo">[TODO Anwalt prüft Frist, Nachweis, Rechtsfolgen]</span></li></ol>',
      eSec4: '<h3>4. Keine Übernahme-Pflicht und keine harte Exklusivität</h3><ol class="esign-nums"><li>4.1 Es besteht keine Pflicht zur Einstellung. Der Arbeitgeber entscheidet frei. Keine Auto-Hire-Pflicht.</li><li>4.2 Keine harte Exklusivität. Der Arbeitgeber darf weiter mit anderen Vermittlern oder eigenen Kanälen suchen. § 297 Nr. 4 SGB III. <span class="esign-todo">[TODO Anwalt prüft Formulierung]</span></li><li>4.3 Kein AÜG-Verleih. MEDA Vermittlung [PLATZHALTER] überlässt keine Arbeitnehmer. Es wird nur vermittelt. Der Arbeitsvertrag kommt direkt zwischen Arbeitgeber und Bewerber zustande.</li></ol>',
      eSec5: '<h3>5. Vergütung – Abrechnung per separater Rechnung</h3><ol class="esign-nums"><li>5.1 Eine Vergütung wird nur bei erfolgreicher Vermittlung fällig. Erfolg = Abschluss eines Arbeitsvertrags und Arbeitsantritt. <span class="esign-todo">[TODO Anwalt definiert Erfolg, Fälligkeit, Rückzahlung]</span></li><li>5.2 Die Abrechnung erfolgt über eine separate Rechnung oder eine separate Vergütungsvereinbarung. Die Höhe steht nicht in diesem Rahmenblatt.</li><li>5.3 Höhe, Fälligkeit, Zahlungsziel und ggf. Raten / Staffel = <span class="esign-todo">[TODO Anwalt – Beträge, Fälligkeit und Bedingungen eintragen]</span>. Keine Euro-Beträge und keine Prozentsätze in diesem Blatt.</li><li>5.4 Alle Beträge verstehen sich zzgl. gesetzlicher USt., sofern anwendbar. <span class="esign-todo">[TODO Anwalt]</span></li><li>5.5 Die Vergütungsregelung muss §§ 296 ff. SGB III entsprechen. <span class="esign-todo">[TODO Anwalt prüft und ergänzt]</span></li></ol>',
      eSec6: '<h3>6. Datenschutz und AGG</h3><ol class="esign-nums"><li>6.1 Rechtsgrundlage: Art. 6 Abs. 1 lit. a und lit. b DSGVO i. V. m. BDSG und §§ 296 ff. SGB III.</li><li>6.2 Bewerberdaten nur mit Einwilligung. Der Arbeitgeber sichert Vertraulichkeit zu.</li><li>6.3 Beide Parteien beachten das AGG. Stellenausschreibungen und Auswahl erfolgen diskriminierungsfrei.</li></ol>',
      eSec7: '<h3>7. Laufzeit und Beendigung</h3><ol class="esign-nums"><li>7.1 Unbestimmte Zeit. Jederzeit ohne Frist per E-Mail beendbar.</li><li>7.2 Bereits übermittelte Profile sind dann zu löschen, sofern keine gesetzliche Aufbewahrungspflicht besteht.</li></ol>',
      eSec8: '<h3>8. Schlussbestimmungen</h3><ol class="esign-nums"><li>8.1 Es gilt deutsches Recht.</li><li>8.2 Änderungen bedürfen der Textform. E-Mail reicht.</li><li>8.3 Sollte eine Klausel unwirksam sein, bleibt der Rest wirksam.</li></ol>',
      clauseAckTitle: 'Checkliste',
      clauseAckHint: 'Ohne diese Haken kein Senden. Der Vertragstext steht oben bzw. daneben.',
      cAck1: 'Ich willige ein, dass MEDA mein Profil und meine Kontaktdaten nur nach Prüfung an passende deutsche Arbeitgeber weitergibt. Kein Auto-Blast. Widerruf jederzeit möglich. DSGVO Art. 6 und 7.',
      cAck2: 'Ich verstehe: MEDA bietet Vermittlung nach §§ 296–299 SGB III und Integration MEDA One. Keine Arbeitnehmerüberlassung nach dem AÜG.',
      cAck3: 'Ich weiß: Ob Vergütung anfällt, ist offen. Die Höhe wird vor dem finalen Vertrag genannt: <span class="esign-todo">[TODO Anwalt]</span>, gedeckelt nach § 296 SGB III. Keine Vorkasse, kein Vorschuss. Ausbildung 0 €, wo das Gesetz das verlangt. Dieses Blatt begründet keine Zahlungspflicht.',
      cAck4: 'Ich weiß: Dies ist nur ein provisorischer Interessens-Auftrag. Bindung: false. Der finale Vermittlungsvertrag kommt erst nach Gewerbe und Anwaltsfreigabe. Keine Job- oder Visa-Garantie.',
      cAck5: 'Ich bestätige: Angaben sind wahr. Kein harter Exklusiv-Auftrag nach § 297 Nr. 4 SGB III. Soft-Kontaktkanal für von MEDA vorgestellte Arbeitgeber bis zum Arbeitsvertrag. Andere Vermittler und Eigenbewerbung bleiben frei. Vorab-Offenlegung wird beachtet. AGG wird beachtet.',
      cAck6: 'Optional: Ich will später ggf. einen separaten Login-Nachtrag unterschreiben.',
      eAck1: 'Ich bestätige mein Interesse an einer langfristigen Kooperation mit MEDA Vermittlung [PLATZHALTER] / Meda Family als private Arbeitsvermittlung nach §§ 296–299 SGB III.',
      eAck2: 'Ich möchte einen Kandidaten-Pool / Auswahllisten erhalten und zeitnah prüfen.',
      eAck3: 'Mir ist klar: Keine Einstellungspflicht. Ich entscheide frei über jede Einstellung.',
      eAck4: 'Mir ist klar: Keine harte Exklusivität nach § 297 Nr. 4 SGB III. Ich darf parallel andere Wege nutzen.',
      eAck5: 'Mir ist klar: Kein AÜG-Verleih. MEDA vermittelt nur. Der Arbeitsvertrag kommt direkt mit dem Bewerber zustande.',
      eAck6: 'Ich beachte AGG und DSGVO/BDSG und behandle Bewerberdaten vertraulich.',
      eAckChannel: 'Für von MEDA eingeführte Kandidaten läuft der Kontakt bis zur Einstellung über MEDA. Kein Bypass. MEDA bleibt nach Ankunft für Integrationssupport in Kontakt.',
      eAck7: 'Ich stimme zu: Vergütung nur bei erfolgreicher Vermittlung per separater Rechnung. Höhe, Fälligkeit, Zahlungsziel = <span class="esign-todo">[TODO Anwalt]</span> – noch nicht festgelegt.',
      eAck8: 'Mir ist klar: Dies ist ein provisorischer Soft-Launch-Entwurf. Noch nicht bindend. Bindung erst nach Gewerbeanmeldung und anwaltlicher Freigabe.',
      fSec1: '<h3>1. Zweck und Status. Bindung: false</h3><p>Dieses Interessensblatt dokumentiert unverbindliches Interesse an einer privaten Arbeitsvermittlung durch MEDA Vermittlung [PLATZHALTER] im Bereich Meda Family. Nach § 14 GewO erfolgt eine vergütungspflichtige Vermittlung erst nach Gewerbeanzeige und einem gesonderten schriftlichen Vermittlungsvertrag. Bis dahin: binding: false. Keine Bindungswirkung, keine Exklusivität, jederzeit widerruflich. Keine harte Exklusivität. Weitere Vermittler können beauftragt werden.</p>',
      fSec2: '<h3>2. Soft-Kontaktkanal</h3><p>Die Interessensbekundung ist unverbindlich. Es entsteht keine Verpflichtung zur Beauftragung oder zum Vertragsschluss. Kontakt: meda-vermittlung@agentmail.to. Rückmeldung erfolgt unverbindlich und diskriminierungsfrei nach AGG. Mit Absenden dieses Interessensblattes beauftragen Sie MEDA noch nicht mit einer Vermittlung.</p>',
      fSec3: '<h3>3. Leistungen</h3><p>MEDA Vermittlung [PLATZHALTER] erbringt ausschließlich private Arbeitsvermittlung i. S. d. §§ 296–299 SGB III. Keine Arbeitnehmerüberlassung und keine Zeitarbeit nach dem AÜG. MEDA wird nicht Arbeitgeber. Vermittelt wird nur ein direkter Arbeitsvertrag zwischen Arbeitgeber und Arbeitnehmer.</p>',
      fSec4: '<h3>4. Rechtlicher Rahmen</h3><p>§§ 296–299 SGB III. § 296 Abs. 3 SGB III nennt eine gesetzliche Vergütungsgrenze für die Vermittlung von Arbeitsuchenden: 2.000 € inkl. USt. Das ist eine gesetzliche Schranke, kein Preisangebot von MEDA Vermittlung [PLATZHALTER]. § 296a SGB III regelt die Ausbildungsvermittlung. § 297 Nr. 4 SGB III: keine harte Exklusivität. § 14 GewO: Gewerbeanzeige vor vergütungspflichtiger Tätigkeit. AGG. DSGVO / BDSG. Es werden keine Gütesiegel, Fair-Recruit-Siegel oder behördlichen Zertifizierungen beansprucht.</p>',
      fSec5: '<h3>5. Vergütung – offen. <span class="esign-todo">[TODO Anwalt]</span></h3><p>Die Vergütung wird erst im gesonderten Vermittlungsvertrag wirksam vereinbart. Arbeitnehmervermittlung: <span class="esign-todo">[TODO Anwalt] / [PLATZHALTER]</span> unter Beachtung der gesetzlichen Grenze. Konkrete Beträge und Prozentsätze werden hier nicht festgelegt. Ausbildungsvermittlung nach § 296a SGB III: ausschließlich vom Arbeitgeber zu vergüten. Eine Vergütung durch den Ausbildungssuchenden ist unzulässig. Höhe: <span class="esign-todo">[TODO Anwalt] / [PLATZHALTER — nur Arbeitgeber zahlt]</span>. Fälligkeit, Zahlungsbedingungen und Erstattung: <span class="esign-todo">[TODO Anwalt]</span>. Gesetzliche Grenzen werden als Gesetz zitiert, nicht als MEDA-Preis. Dieses Blatt begründet keinen Vergütungsanspruch.</p>',
      fSec6: '<h3>6. Datenschutz</h3><p>Verantwortlicher: MEDA Vermittlung [PLATZHALTER], [PLATZHALTER Anschrift]. Rechtsgrundlagen: Art. 6 Abs. 1 lit. a und b DSGVO, § 26 BDSG. Zwecke: Prüfung der Interessensbekundung, Kontaktaufnahme, spätere Vertragsanbahnung. Empfänger: nur mit gesonderter Einwilligung an potenzielle Arbeitgeber. Speicherdauer: bis Widerruf bzw. nach gesetzlichen Aufbewahrungsfristen. Rechte: Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit und Beschwerde bei der Aufsichtsbehörde. Widerruf jederzeit mit Wirkung für die Zukunft. Keine automatisierte Entscheidungsfindung. <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutz</a>.</p>',
      fAck1: 'Ich willige in die Verarbeitung meiner Daten zur Bearbeitung dieser Interessensbekundung ein.',
      stepIntro: 'Intro',
      stepClauses: 'Klauseln',
      stepChecklist: 'Checkliste',
      stepSign: 'Unterschrift',
      stepDone: 'Fertig',
      stepOf: 'Schritt {n} von {m}',
      back: 'Zurück',
      continue: 'Weiter',
      lockPending: 'Legal-Freigabe ausstehend. Senden bleibt aus, bis der Worker diese Paket-Version sperrt.',
      dryRun: 'Probelauf ansehen',
      dryHint: 'Probelauf speichert nichts und sendet keine E-Mail.',
      legalLangNote: 'Der maßgebliche Vertragstext ist der deutsche Entwurf.',
      reviewTitle: 'Prüfen vor dem Senden',
      draw: 'Zeichnen',
      drawHint: 'Mit Finger oder Maus. Pflicht, zusammen mit dem getippten Namen.',
      drawnMissing: 'Bitte auch auf der Fläche unterschreiben.',
      downloadMd: 'Markdown-Kopie',
      downloadPdf: 'PDF-Kopie',
      familySubmit: 'Unverbindliches Interesse bekunden',
      h1Family: 'Unverbindliches Interesse bekunden',
      pageTitleFamily: 'Interessensblatt Meda Family — MEDA Vermittlung',
      docTitleFamily: 'Provisionales Interessensblatt — ENTWURF',
      footerImpressum: 'MEDA Vermittlung [PLATZHALTER]. Impressum: [TODO Anwalt].',
      lawSignatureCandidate: 'Ich habe die Klauseln 1–10 gelesen und stimme zu. Meine getippte Unterschrift und der Zeitstempel bestätigen diesen Text.',
      lawSignatureEmployer: 'Ich habe die Klauseln 1–8 gelesen und stimme zu. Meine getippte Unterschrift und der Zeitstempel bestätigen diesen Text.',
      clauseErr: 'Bitte diesen Punkt der Checkliste bestätigen.',
      loginOptional: 'Optional. Ohne diesen Haken können Sie senden.',
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
      drawRequired: 'Zeichnen',
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
      draftBanner: 'Draft – review by a lawyer is required',
      draftNote: 'No legal advice. A licensed lawyer has not approved this text.',
      docTitleCandidate: 'Provisional interest and consent sheet',
      docTitleEmployer: 'Provisional framework and interest sheet',
      docKickerCandidate: 'Private job placement under §§ 296–299 SGB III. Not a legal service under the RDG. Soft-launch version 0.9.',
      docKickerEmployer: 'MEDA Vermittlung / Meda Family. Opened from the MEDA email link. Soft-launch version 0.1.',
      docRoleCandidate: 'Your role: candidate',
      docRoleEmployer: 'Your role: employer',
      metaToken: 'Reference number',
      metaOffer: 'Offer reference',
      unknownOffer: 'This reference is only an offer number. No job is invented.',
      missingToken: 'This link has no reference number. Please use the link from your registration.',
      missingOffer: 'This link has no offer reference.',
      docIntroCandidate: 'You sign this sheet before sending interest. It is your consent and your instruction to proceed. It is not yet a final placement contract.',
      docIntroEmployer: 'Non-binding draft. Not a binding placement order. It takes effect only after business registration and approval by a German lawyer. <span class="esign-todo">[TODO lawyer]</span>',
      nameEmployer: 'Contact person',
      companyEmployer: 'Company / institution',
      submitEmployer: 'Confirm non-binding interest',
      clauseAckTitle: 'Checklist',
      clauseAckHint: 'Without these ticks, send stays off. The contract text is above or beside this form.',
      lawSignatureCandidate: 'I have read clauses 1–10 and agree. My typed signature and the timestamp confirm this text.',
      lawSignatureEmployer: 'I have read clauses 1–8 and agree. My typed signature and the timestamp confirm this text.',
      clauseErr: 'Please confirm this checklist point.',
      loginOptional: 'Optional. You can send without this tick.',
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
      draw: 'Draw',
      drawHint: 'Finger or mouse. Required, together with the typed name.',
      stepIntro: 'Intro',
      stepClauses: 'Clauses',
      stepChecklist: 'Checklist',
      stepSign: 'Signature',
      stepDone: 'Done',
      stepOf: 'Step {n} of {m}',
      back: 'Back',
      continue: 'Continue',
      lockPending: 'Legal approval pending. Send stays off until the worker locks this pack version.',
      dryRun: 'Preview dry-run',
      dryHint: 'The dry-run stores nothing and sends no email.',
      legalLangNote: 'The German draft is the text that counts.',
      reviewTitle: 'Review before sending',
      drawnMissing: 'Please sign on the pad as well.',
      downloadMd: 'Markdown copy',
      downloadPdf: 'PDF copy',
      familySubmit: 'State non-binding interest',
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
      draftBanner: 'Projet – examen par un avocat requis',
      draftNote: 'Pas de conseil juridique. Un avocat inscrit n’a pas validé ce texte.',
      docTitleCandidate: 'Feuille provisoire d’intérêt et de consentement',
      docTitleEmployer: 'Feuille provisoire de cadre et d’intérêt',
      docKickerCandidate: 'Placement privé au sens des §§ 296–299 SGB III. Pas un service juridique au sens de la RDG. Version soft-launch 0.9.',
      docKickerEmployer: 'MEDA Vermittlung / Meda Family. Ouvert via le lien e-mail MEDA. Version soft-launch 0.1.',
      docRoleCandidate: 'Votre rôle : candidat',
      docRoleEmployer: 'Votre rôle : employeur',
      metaToken: 'Numéro de dossier',
      metaOffer: 'Référence de l’offre',
      unknownOffer: 'Cette référence est seulement un numéro d’offre. Aucun poste n’est inventé.',
      missingToken: 'Ce lien n’a pas de numéro de dossier. Utilisez le lien de votre inscription.',
      missingOffer: 'Ce lien n’a pas de référence d’offre.',
      docIntroCandidate: 'Vous signez cette feuille avant d’envoyer votre intérêt. C’est votre consentement et votre mandat d’intérêt. Ce n’est pas encore un contrat de placement final.',
      docIntroEmployer: 'Projet non contraignant. Pas un mandat de placement contraignant. Effet seulement après immatriculation et validation par un avocat allemand. <span class="esign-todo">[TODO avocat]</span>',
      clauseAckTitle: 'Liste de contrôle',
      clauseAckHint: 'Sans ces cases, l’envoi reste bloqué. Le texte est au-dessus ou à côté.',
      lawSignatureCandidate: 'J’ai lu les clauses 1 à 10 et j’accepte. Ma signature tapée et l’horodatage confirment ce texte.',
      lawSignatureEmployer: 'J’ai lu les clauses 1 à 8 et j’accepte. Ma signature tapée et l’horodatage confirment ce texte.',
      clauseErr: 'Veuillez confirmer ce point de la liste.',
      loginOptional: 'Facultatif. Vous pouvez envoyer sans cette case.',
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
      submitEmployer: 'Confirmer un intérêt non contraignant',
      nameEmployer: 'Interlocuteur',
      companyEmployer: 'Entreprise / établissement',
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
      draftBanner: 'مسودة – يلزم مراجعة محامٍ',
      draftNote: 'ليست استشارة قانونية. لم يعتمد محامٍ مرخّص هذا النص.',
      docTitleCandidate: 'ورقة اهتمام وموافقة مبدئية',
      docTitleEmployer: 'ورقة إطار واهتمام مبدئية',
      docKickerCandidate: 'وساطة خاصة وفق §§ 296–299 SGB III. ليست خدمة قانونية وفق RDG. الإصدار 0.9.',
      docKickerEmployer: 'MEDA Vermittlung / Meda Family. يُفتح من رابط بريد MEDA. الإصدار 0.1.',
      docRoleCandidate: 'الدور: مرشح',
      docRoleEmployer: 'الدور: صاحب عمل',
      metaToken: 'رقم الملف',
      metaOffer: 'مرجع العرض',
      unknownOffer: 'هذا المرجع رقم عرض فقط. لا نخترع وظيفة.',
      missingToken: 'هذا الرابط بلا رقم ملف. استخدموا الرابط من التسجيل.',
      missingOffer: 'هذا الرابط بلا مرجع عرض.',
      docIntroCandidate: 'توقّعون هذه الورقة قبل إرسال الاهتمام. هي موافقة وتكليف اهتمام. ليست عقد وساطة نهائياً بعد.',
      docIntroEmployer: 'مسودة غير ملزمة. ليست تكليف وساطة ملزماً. يسري الأثر بعد التسجيل التجاري وموافقة محامٍ ألماني. <span class="esign-todo">[TODO محامٍ]</span>',
      clauseAckTitle: 'قائمة التحقق',
      clauseAckHint: 'من دون هذه العلامات لا يُفتح الإرسال. النص أعلى النموذج أو بجانبه.',
      lawSignatureCandidate: 'قرأت البنود 1–10 وأوافق. التوقيع المكتوب والوقت يؤكدان هذا النص.',
      lawSignatureEmployer: 'قرأت البنود 1–8 وأوافق. التوقيع المكتوب والوقت يؤكدان هذا النص.',
      clauseErr: 'يرجى تأكيد هذا البند من القائمة.',
      loginOptional: 'اختياري. يمكن الإرسال من دون هذه العلامة.',
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
      submitEmployer: 'تأكيد اهتمام غير ملزم',
      nameEmployer: 'جهة الاتصال',
      companyEmployer: 'الشركة / المنشأة',
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
    if (/^(cSec|eSec|fSec|cAck|eAck|fAck|cSheetMeta|cWithdraw)/.test(key)) {
      return COPY.de[key] != null ? COPY.de[key] : key;
    }
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
        }).join('');
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
    var roleAttr = root.getAttribute('data-role');
    var role = roleAttr === 'employer' ? 'employer' : roleAttr === 'family' ? 'family' : 'candidate';
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
    var backBtn = document.getElementById('esign-back');
    var dryBtn = document.getElementById('esign-dry');
    var lockEl = document.getElementById('esign-lock');
    var statusEl = document.getElementById('esign-status');
    var doneEl = document.getElementById('esign-done');
    var typedHint = document.getElementById('typed-hint');
    var canvas = document.getElementById('esign-canvas');
    var clearBtn = document.getElementById('esign-clear');
    var started = false;
    var busy = false;
    var currentStep = 1;
    var packHash = '';
    var packLock = { legal_approved: false, binding: false, status: 'ENTWURF', pack_hash: '' };
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
      data.clause_login = checked('f-clause_login');
      return data;
    }

    function checked(id) {
      var el = document.getElementById(id);
      return !!(el && el.checked);
    }

    function applyCopy() {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.title = text(role === 'employer' ? 'pageTitleEmployer' : role === 'family' ? 'pageTitleFamily' : 'pageTitleCandidate');
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
      var publicToken = RULES.publicTokenOk(role, token) ? token : '';
      if (tok) tok.textContent = publicToken || '—';
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
        if (role === 'family') note.textContent = '';
        else if (!offerId) note.textContent = text('missingOffer');
        else if (!found) note.textContent = text('unknownOffer');
        else note.textContent = '';
      }
      var warn = document.getElementById('link-warn');
      if (warn) {
        var bits = [];
        if (role !== 'family' && !state.tokenOk) bits.push(text('missingToken'));
        if (role !== 'family' && !state.offerOk) bits.push(text('missingOffer'));
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
      var locked = RULES.submitAllowed(packLock, packHash) && !preview;
      if (submitBtn && !busy) {
        submitBtn.disabled = !(locked && state.ok && currentStep === 4);
        submitBtn.textContent = text(role === 'employer' ? 'submitEmployer' : role === 'family' ? 'familySubmit' : 'submit');
      }
      if (dryBtn) {
        dryBtn.hidden = !preview || !!finishedSnapshot;
        dryBtn.disabled = !(preview && state.ok && currentStep === 4 && !busy);
      }
      if (lockEl) {
        lockEl.hidden = currentStep !== 4 || !!finishedSnapshot;
        lockEl.textContent = locked ? text('ready') : text('lockPending');
      }
      if (nextBtn) nextBtn.hidden = currentStep >= 4 || !!finishedSnapshot;
      if (backBtn) backBtn.hidden = currentStep <= 1 || !!finishedSnapshot;
      var stepOf = document.getElementById('esign-stepof');
      var shownStep = finishedSnapshot ? 5 : currentStep;
      if (stepOf) stepOf.textContent = text('stepOf').replace('{n}', String(shownStep)).replace('{m}', '5');
      var bar = document.getElementById('esign-bar-fill');
      if (bar) bar.style.width = Math.round((shownStep / 5) * 100) + '%';
      var langNote = document.getElementById('esign-lang-note');
      if (langNote) langNote.hidden = lang === 'de';
      document.querySelectorAll('[data-panel]').forEach(function (el) {
        el.hidden = !!finishedSnapshot || Number(el.getAttribute('data-panel')) !== currentStep;
      });
      document.querySelectorAll('[data-step]').forEach(function (li) {
        var nStep = Number(li.getAttribute('data-step'));
        li.classList.toggle('is-done', nStep < shownStep);
        li.classList.toggle('is-current', nStep === shownStep);
        if (nStep === shownStep) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
      });
      paintReview(data);
      requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
      return state;
    }

    function checklistReady(state) {
      return RULES.clauseKeysFor(role).concat(RULES.LAW_KEYS).every(function (key) {
        return !state.errors[key];
      });
    }

    function paintReview(data) {
      var list = document.getElementById('review-checks');
      var img = document.getElementById('review-sig');
      if (list) {
        list.textContent = '';
        RULES.clauseKeysFor(role).forEach(function (key) {
          var li = document.createElement('li');
          li.textContent = (data[key] ? '✓ ' : '· ') + plainText(ackKey(key));
          list.appendChild(li);
        });
      }
      if (img && canvas && pad.hasInk()) {
        img.hidden = false;
        img.src = canvas.toDataURL('image/png');
      } else if (img) img.hidden = true;
    }

    function ackKey(key) {
      var map = {
        clause_share: 'cAck1', clause_services: 'cAck2', clause_fees: 'cAck3', clause_provisional: 'cAck4', clause_truth: 'cAck5',
        clause_coop: 'eAck1', clause_pool: 'eAck2', clause_nohire: 'eAck3', clause_exclusivity: 'eAck4', clause_aueg: 'eAck5',
        clause_compliance: 'eAck6', clause_channel: 'eAckChannel', clause_invoice: 'eAck7', clause_soft: 'eAck8',
        clause_privacy: 'fAck1'
      };
      return map[key] || key;
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
          'f-clause_provisional': 'clause_provisional',
          'f-clause_truth': 'clause_truth',
          'f-clause_login': 'clause_login',
          'f-clause_coop': 'clause_coop',
          'f-clause_pool': 'clause_pool',
          'f-clause_nohire': 'clause_nohire',
          'f-clause_exclusivity': 'clause_exclusivity',
          'f-clause_aueg': 'clause_aueg',
          'f-clause_compliance': 'clause_compliance',
          'f-clause_invoice': 'clause_invoice',
          'f-clause_channel': 'clause_channel',
          'f-clause_privacy': 'clause_privacy',
          'f-clause_soft': 'clause_soft'
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
        if (preview || !RULES.submitAllowed(packLock, packHash)) {
          if (statusEl) {
            statusEl.hidden = false;
            statusEl.className = 'platform-status';
            statusEl.textContent = text('lockPending');
          }
          render();
          return;
        }
        if (busy) return;
        busy = true;
        submitBtn.disabled = true;
        submitBtn.textContent = text('sending');
        if (statusEl) statusEl.hidden = true;
        var snapshot = model();
        stampSnapshot(snapshot, false).then(function () {
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
        var state = RULES.validate(model());
        if (currentStep === 3 && !checklistReady(state)) {
          state.missing.forEach(function (key) { touched[key] = true; });
          focusMissing(state);
          return;
        }
        if (currentStep < 4) currentStep += 1;
        if (doc) doc.open = true;
        render();
        try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
      });
    }
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (currentStep > 1) currentStep -= 1;
        render();
      });
    }
    if (dryBtn) {
      dryBtn.addEventListener('click', function () {
        var state = RULES.validate(model());
        state.missing.forEach(function (key) { touched[key] = true; });
        if (!preview || !state.ok) {
          focusMissing(state);
          return;
        }
        finishLocal(true);
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

    function stampSnapshot(snapshot, isPreview) {
      snapshot.user_agent = navigator.userAgent || '';
      snapshot.signed_at = new Date().toISOString();
      snapshot.has_drawn_signature = pad.hasInk();
      snapshot.preview = !!isPreview;
      snapshot.pack_id = RULES.PACK_IDS[role];
      snapshot.pack_hash = packHash;
      snapshot.binding = false;
      snapshot.candidate_token = RULES.publicTokenOk(role, snapshot.candidate_token) ? snapshot.candidate_token : '';
      var png = canvas && pad.hasInk() ? canvas.toDataURL('image/png') : '';
      return hashText(snapshot.user_agent).then(function (hash) {
        snapshot.user_agent_hash = hash;
        return hashText(png || snapshot.typed_signature || '');
      }).then(function (sigHash) {
        snapshot.signature_asset_ref = sigHash;
        return snapshot;
      });
    }

    function finishLocal(isPreview) {
      busy = true;
      stampSnapshot(model(), isPreview).then(function (snapshot) {
        showSuccess(snapshot);
      });
    }

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
      if (party) party.textContent = text(role === 'employer' ? 'partyEmployer' : role === 'family' ? 'h1Family' : 'partyCandidate');
      if (tok) tok.textContent = token;
      if (off) off.textContent = offerId;
      if (hash) hash.textContent = snapshot.pack_hash || '—';
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
        nameLabel: text(role === 'employer' ? 'nameEmployer' : 'name'),
        companyLabel: text(role === 'employer' ? 'companyEmployer' : 'company'),
        roleTitleLabel: text('roleTitle'),
        addressLabel: text('blockAddress'),
        emailLabel: text('email'),
        timeLabel: text('auditWhen'),
        formattedTime: formattedTime(finishedSnapshot),
        signatureLabel: text('blockSign'),
        hashLabel: text('auditHash'),
        clausesTitle: text('clausesTitle'),
        clauses: (role === 'employer'
          ? ['eSec1', 'eSec2', 'eSec3', 'eSec4', 'eSec5', 'eSec6', 'eSec7', 'eSec8']
          : ['cSec1', 'cSec2', 'cSec3', 'cSec4', 'cSec5', 'cSec6', 'cSec7', 'cSec8', 'cSec9', 'cSec10']).map(plainText),
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
      currentStep = 5;
      applyCopy();
      paintSuccess(snapshot, true);
      render();
    }

    function saveBlob(blob, filename) {
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 1500);
    }

    var downloadMd = document.getElementById('esign-download-md');
    var downloadPdf = document.getElementById('esign-download-pdf');
    if (downloadMd) downloadMd.addEventListener('click', function () {
      if (!finishedSnapshot) return;
      saveBlob(new Blob([RULES.buildReceiptMd(finishedSnapshot)], { type: 'text/markdown;charset=utf-8' }), 'MEDA-Kopie-' + (finishedSnapshot.candidate_token || 'ENTWURF') + '.md');
    });
    if (downloadPdf) downloadPdf.addEventListener('click', function () {
      if (!finishedSnapshot) return;
      saveBlob(new Blob([RULES.buildReceiptPdf(finishedSnapshot)], { type: 'application/pdf' }), 'MEDA-Kopie-' + (finishedSnapshot.candidate_token || 'ENTWURF') + '.pdf');
    });

    function refreshPack() {
      var keys = role === 'employer'
        ? ['eSec1', 'eSec2', 'eSec3', 'eSec4', 'eSec5', 'eSec6', 'eSec7', 'eSec8']
        : role === 'family'
          ? ['fSec1', 'fSec2', 'fSec3', 'fSec4', 'fSec5', 'fSec6']
          : ['cSec1', 'cSec2', 'cSec3', 'cSec4', 'cSec5', 'cSec6', 'cSec7', 'cSec8', 'cSec9', 'cSec10'];
      hashText(keys.map(plainText).join('\n')).then(function (hash) {
        packHash = hash || '';
        var meta = document.querySelector('meta[name="meda-consent-api"]');
        var api = meta && meta.content;
        if (!api || !packHash) { render(); return; }
        fetch(String(api).replace(/\/$/, '') + '/esign/pack?id=' + encodeURIComponent(RULES.PACK_IDS[role]) + '&hash=' + encodeURIComponent(packHash), {
          headers: { Accept: 'application/json' }
        }).then(function (res) { return res.json(); }).then(function (data) {
          var approved = !!(data && data.legal_approved === true && data.binding === false && data.status === 'ENTWURF' && data.pack_hash === packHash);
          packLock = { legal_approved: approved, binding: false, status: 'ENTWURF', pack_hash: approved ? packHash : '' };
          render();
        }).catch(function () { render(); });
      }).catch(function () { render(); });
    }

    render();
    refreshPack();
  }

  window.MEDA_ESIGN = { mount: mount };
})();
