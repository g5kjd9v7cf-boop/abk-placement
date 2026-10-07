(function () {
  'use strict';

  var RULES = window.MEDA_ESIGN_RULES;
  var LANGS = ['de', 'en', 'fr', 'ar'];
  var COPY = {
    de: {
      skip: 'Zum Inhalt',
      navEmployers: 'Für Arbeitgeber',
      navContact: 'Kontakt',
      footerNote: 'Hinweis · Entwurf zur rechtlichen Prüfung · Keine Rechtsberatung · Kopie nur an die erklärende Person und an MEDA Vermittlung',
      pageTitleCandidate: 'Anmeldung zum Vermittlungsservice — MEDA Vermittlung',
      pageTitleEmployer: 'Angebot bestätigen — MEDA Vermittlung',
      kickerCandidate: 'Hinweis · Homepage-Gate · Entwurf zur rechtlichen Prüfung',
      kickerEmployer: 'Angebot',
      h1Candidate: 'Anmeldung zum MEDA Vermittlungsservice',
      h1Employer: 'Angebot bestätigen',
      leadCandidate: 'Bitte lesen Sie die Anmeldung. Sie ist die Voraussetzung für den Upload von Lebenslauf und Bewerbungsunterlagen. Sie ist nicht rechtsverbindlich und begründet keine Zahlungspflicht.',
      leadEmployer: 'Firma und Stelle sind eingesetzt. Die Bestätigung ist unverbindlich und löst keine Zahlung aus.',
      stepReview: 'Prüfen',
      stepDetails: 'Angaben',
      stepSign: 'Unterschrift',
      summaryDoc: 'Entwurf anzeigen',
      badge: 'Entwurf · nicht rechtsverbindlich',
      draftKicker: 'Hinweis · Soft-Launch · nicht rechtsverbindlich',
      draftBanner: 'Entwurf zur rechtlichen Prüfung',
      draftNote: 'Ein zugelassener Rechtsanwalt hat diesen Text nicht freigegeben. Dies ist keine Rechtsberatung.',
      docTitleCandidate: 'Entwurf der Anmeldung zum Vermittlungsservice',
      docTitleEmployer: 'Angebot',
      docKickerCandidate: 'Private Arbeitsvermittlung im Sinne der §§ 296–299 SGB III. Kein Rechtsdienst nach dem RDG. Homepage-Gate. Fassung Soft-Launch 0.14.',
      docKickerEmployer: 'MEDA Vermittlung / Meda Family. Aufruf nur über den individuellen Link nach dem Gespräch. Fassung Soft-Launch 0.5.',
      docRoleCandidate: 'Ihre Rolle: Kandidatin oder Kandidat',
      docRoleEmployer: 'Ihre Rolle: Arbeitgeber',
      metaToken: 'Referenznummer',
      metaOffer: 'Angebotsreferenz',
      unknownOffer: 'Diese Angabe ist eine Angebotsreferenz. Es wird keine Stelle bezeichnet.',
      missingToken: 'Dieser Link enthält keine Referenznummer. Bitte verwenden Sie den Link aus Ihrer Anmeldung.',
      missingOffer: 'Dieser Link enthält keine Angebotsreferenz.',
      docIntroCandidate: 'Dieses Gate ist die Anmeldung zum Vermittlungsservice und die Einwilligung nach der DSGVO. Es begründet keine Zahlungspflicht und keinen Vermittlungsvertrag nach § 296 SGB III. Lebenslauf und Bewerbungsunterlagen werden erst nach dieser Unterschrift freigeschaltet.',
      docIntroEmployer: 'Unverbindlicher Entwurf. Kein rechtsverbindlicher Vermittlungsauftrag. Wirksamkeit erst nach Gewerbeanmeldung und Freigabe durch einen deutschen Rechtsanwalt. <span class="esign-todo">[TODO Anwalt]</span>',
      cSheetMeta: 'Gültig ab dem Zeitpunkt der Unterschrift. Paket Soft-Launch 0.14. Bindung: false bis Gewerbeanzeige nach § 14 GewO und Anwaltsfreigabe. UI-Widerrufsfrist: 12 Monate und 14 Tage, freiwillige Verlängerung. Gesetzliches Mindestmaß: 14 Tage nach § 355 Abs. 2 BGB.',
      cWithdraw: 'UI-Widerrufsfrist: 12 Monate und 14 Tage (freiwillige Verlängerung). Gesetzliches Mindestmaß: 14 Tage nach § 355 Abs. 2 BGB. Widerruf senden an <a href="mailto:meda-vermittlung@agentmail.to">meda-vermittlung@agentmail.to</a>. <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutz</a> · <a href="einwilligung.html" target="_blank" rel="noopener">Einwilligung</a>.',
      nameEmployer: 'Ansprechpartner',
      companyEmployer: 'Firma / Einrichtung',
      submitEmployer: 'Angebot unverbindlich annehmen',
      cSec1: '<h3>1. Parteien und Geltung</h3><ol class="esign-nums"><li>1.1 Kandidat/in: [Name, Geburtsdatum, E-Mail, Telefon].</li><li>1.2 Anbieter: MEDA Vermittlung [PLATZHALTER], Luhnenstraße 7, 30559 Hannover (Büro). Private Arbeitsvermittlung und Integrationshilfe.</li><li>1.3 Geltung: Nur für die Homepage-Anmeldung vor dem CV-Upload. Kein finaler Vermittlungsvertrag. Fernabsatzvertrag im Sinne der §§ 312c, 312g BGB, wenn die Kandidatin oder der Kandidat Verbraucher nach § 13 BGB ist.</li></ol>',
      cSec2: '<h3>2. Zweck und Gate-Funktion</h3><ol class="esign-nums"><li>2.1 Zweck: Anmeldung zum MEDA Vermittlungsservice. Prüfung Ihres Profils. Bei Eignung Vorstellung bei passenden deutschen Arbeitgebern.</li><li>2.2 Gate-Prinzip: Erst dieses Pack unterschreiben, dann CV und Bewerbungsunterlagen hochladen.</li><li>2.3 Ohne unterschriebenes Pack kein Upload, kein Auto-Blast, keine Weiterleitung.</li><li>2.4 MEDA ist reiner Vermittler. Keine Arbeitnehmerüberlassung. Abgrenzung zu § 1 AÜG.</li><li>2.5 Ablauf: Dieses Homepage-Gate (ohne Vergütung) → CV-Upload → Prüfung → bei einem Match ein gesonderter schriftlicher Vermittlungsvertrag nach § 296 SGB III beziehungsweise eine Anlage und ein separater Arbeitgeber-Angebotslink. Erst dort steht die Vergütungsregelung.</li></ol>',
      cSec3: '<h3>3. DSGVO-Einwilligung zur Datenweitergabe — separat widerruflich</h3><ol class="esign-nums"><li>3.1 Sie willigen nach Art. 6 Abs. 1 lit. a, Art. 7 DSGVO und § 26 BDSG ein, dass MEDA Ihr Profil und Ihre Kontaktdaten verarbeitet.</li><li>3.2 Weitergabe nur über MEDA Ops nach manueller Prüfung und nur an Arbeitgeber mit konkretem, qualifikationsbezogenem Match. Sie werden vor der Weitergabe informiert, soweit das möglich ist.</li><li>3.3 DSGVO-Widerruf (Art. 7 Abs. 3): Widerruf dieser Einwilligung jederzeit formlos per E-Mail an [E-Mail MEDA PLATZHALTER]. Er wirkt für die Zukunft. Die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung bleibt unberührt. Dies ist separat vom Fernabsatz-Widerruf nach Klausel 7.</li><li>3.4 Rechte: Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit. Speicherung und Löschung nach den DSGVO-Prinzipien (Datenminimierung, Zweckbindung).</li></ol>',
      cSec4: '<h3>4. Leistungen von MEDA in diesem Gate</h3><ol class="esign-nums"><li>4.1 Prüfung Ihrer Anmeldung, Suche und Vorschlag passender Stellen nach §§ 296 ff. SGB III.</li><li>4.2 Abstimmung mit Arbeitgebern, Vorstellung nur nach Prüfung.</li><li>4.3 Integration und MEDA One nur als separate Hilfe nach der Ankunft. Einzelheiten stehen separat. Kein Teil dieses Gates.</li></ol>',
      cSec5: '<h3>5. Vergütung — keine Zahlungspflicht aus diesem Gate</h3><ol class="esign-nums"><li>5.1 Dieses Gate begründet keine Zahlungspflicht. Keine Vergütung, kein Vorschuss, kein Entgelt, keine Vergütung nach § 296 SGB III.</li><li>5.2 Keine konkreten MEDA €/%-Preise in diesem Gate. Keine Listenpreise.</li><li>5.3 Vergütung erst später und nur in einem gesonderten schriftlichen Vermittlungsvertrag nach § 296 SGB III oder in einer Anlage nach dem Match (Arbeitgeber-Angebotslink). Erst nach Zustandekommen eines Arbeitsvertrags infolge der Vermittlung.</li><li>5.4 Gesetzlicher Hinweis: Die Höchstgrenze für Arbeitsuchende beträgt 2.000 € inklusive Umsatzsteuer nach § 296 Abs. 3 SGB III. Das ist die gesetzliche Höchstgrenze, nicht ein MEDA-Preis. Der MEDA-Preis steht dort: [PLATZHALTER].</li><li>5.5 Ausbildung: Hinweis nur als gesetzlicher Vorbehalt für den späteren Vertrag. Nach § 296a SGB III zahlt bei der Ausbildungsvermittlung nur der Arbeitgeber. Für die Kandidatin oder den Kandidaten gilt 0 €, wo das Gesetz dies verlangt. Dies ist kein Entgelt dieses Gates. Die Regelung erfolgt erst im späteren schriftlichen Vertrag.</li></ol>',
      cSec6: '<h3>6. Kontaktkanal und Prior-Agency-Vorbehalt — keine harte Exklusivität</h3><ol class="esign-nums"><li>6.1 Keine harte Exklusivität. § 297 Nr. 4 SGB III wird beachtet. Sie dürfen sich parallel selbst bewerben und andere Vermittler beauftragen.</li><li>6.2 Soft-Kontaktkanal: Arbeitgeber, die MEDA Ihnen vorgestellt hat, kontaktieren Sie bis zum Arbeitsvertrag nur über MEDA. Das dient der geordneten Vermittlung.</li><li>6.3 Andere Vermittler und Eigenbewerbungen bleiben frei. Dies ist keine Ausschließlichkeitsklausel.</li><li>6.4 Prior-Agency-Vorbehalt: Haben Sie einen Arbeitgeber bereits selbst oder über einen anderen Vermittler kontaktiert, teilen Sie dies MEDA vor der Weitergabe schriftlich mit (Name des Arbeitgebers, Datum).</li><li>6.5 Für Verträge mit anderen Vermittlern haftet MEDA nicht.</li></ol>',
      cSec7: '<h3>7. Fernabsatz-Widerrufsbelehrung (§§ 312g, 355, 356 BGB) — UI-Frist 12 Monate und 14 Tage</h3><p>Gilt, wenn Sie Verbraucher nach § 13 BGB sind und dieser Vertrag im Fernabsatz (Homepage) geschlossen wird. Grundlage ist auch § 312 Abs. 1a BGB, soweit Sie personenbezogene Daten zur Weiterleitung bereitstellen.</p><p><strong>Gesetzliches Mindestmaß.</strong> Nach § 355 Abs. 2 BGB beträgt die gesetzliche Widerrufsfrist 14 Tage ab Vertragsschluss. Sie beginnt nicht vor dem Erhalt einer ordnungsgemäßen Belehrung (Art. 246a § 1 Abs. 2 Satz 1 Nr. 1 EGBGB in Verbindung mit § 356 Abs. 3 BGB).</p><p><strong>Vertragliche und UI-Widerrufsfrist. Freiwillige Verlängerung zugunsten des Verbrauchers.</strong> MEDA gewährt Ihnen über dieses gesetzliche Mindestmaß hinaus eine Widerrufsfrist von 12 Monaten und 14 Tagen ab dem Tag des Vertragsschlusses, beziehungsweise ab Erhalt dieser Belehrung, falls später. Diese Frist ist die in der UI und in diesem Pack angezeigte Frist. Sie können den Vertrag binnen 12 Monaten und 14 Tagen ohne Angabe von Gründen widerrufen.</p><p><strong>Ausübung.</strong> Zur Wahrung der Frist genügt die rechtzeitige Absendung. Sie müssen uns (MEDA Vermittlung [PLATZHALTER], Luhnenstraße 7, 30559 Hannover (Büro), E-Mail: [PLATZHALTER]) mittels einer eindeutigen Erklärung (zum Beispiel E-Mail oder Brief) über Ihren Entschluss informieren, diesen Vertrag zu widerrufen. Sie können das beigefügte Muster-Widerrufsformular verwenden. Das Formular ist nicht vorgeschrieben.</p><p><strong>Folgen.</strong> Ist der Widerruf wirksam, sind empfangene Leistungen zurückzugewähren. Da dieses Gate keine Zahlungspflicht begründet, schulden Sie keine Vergütung. Bereits erteilte Einwilligungen nach der DSGVO können Sie zusätzlich nach Art. 7 DSGVO widerrufen (Klausel 3.3). Bereits rechtmäßig erfolgte Datenweitergaben bleiben wirksam. Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, erlischt Ihr Widerrufsrecht bei Verträgen ohne Preiszahlungspflicht mit vollständiger Erbringung (§ 356 Abs. 5 Nr. 1 BGB).</p><p><strong>Muster-Widerrufsformular (kurz).</strong> An MEDA Vermittlung [PLATZHALTER], Luhnenstraße 7, 30559 Hannover (Büro), E-Mail [PLATZHALTER]: Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die Anmeldung zum MEDA Vermittlungsservice vom [Datum]. Name, Anschrift, Datum. Unterschrift nur bei Papier.</p>',
      cSec8: '<h3>8. Soft-Launch-Vorbehalt</h3><ol class="esign-nums"><li>8.1 Bindung: false. Provisorische Service-Anmeldung.</li><li>8.2 Ein voll wirksamer Vermittlungsvertrag nach §§ 296–299 SGB III entsteht erst nach (a) der Gewerbeanzeige nach § 14 GewO und (b) der Freigabe durch einen Rechtsanwalt.</li><li>8.3 Bis dahin keine volle Bindung als Vermittlungsvertrag. MEDA informiert Sie bei der Freigabe. Dann erhalten Sie den finalen Vertrag zur Unterschrift.</li></ol>',
      cSec9: '<h3>9. Keine Garantie. Keine Arbeitnehmerüberlassung. Kein Gütesiegel</h3><ol class="esign-nums"><li>9.1 Keine Job-Garantie, keine Visa-Garantie, keine Einreise-Garantie.</li><li>9.2 Die Entscheidung über die Einstellung trifft allein der Arbeitgeber. Die Entscheidung über das Visum trifft allein die Botschaft oder die Ausländerbehörde.</li><li>9.3 MEDA schuldet Bemühen, keinen Erfolg. Keine Arbeitnehmerüberlassung. Es gilt deutsches Arbeitsrecht und das AGG.</li><li>9.4 Kein Gütesiegel und keine Zertifizierung wird beansprucht.</li></ol>',
      cSec10: '<h3>10. MEDA-Verpflichtungen zu fairer Vermittlungspraxis (kein Siegel — nur Orientierung)</h3><ol class="esign-nums"><li>10.1 MEDA hält das Gütesiegel „Faire Anwerbung Pflege Deutschland“ (RAL/GAPA) nicht und beansprucht keine WHO- oder ILO-Zertifizierung. Die ILO General Principles and Operational Guidelines for Fair Recruitment (2016/2019) und Themen des WHO-Codes dienen nur als Orientierungsrahmen für die Praxis.</li><li>10.2 Praxis-Verpflichtungen: (a) Transparenz zu den Rollen (MEDA ist Vermittler) und zur Gebührenstruktur (dieses Gate ohne Vergütung; eine Vergütung erst später schriftlich); (b) Keine Worker-Pays für Ausbildung (§ 296a SGB III) — Praxis und Gesetz; (c) informierte Einwilligung (DSGVO und Belehrung vor der Weitergabe); (d) keine Täuschung und keine falschen Job- oder Visa-Garantien; (e) Gleichbehandlung und Nichtdiskriminierung nach dem AGG; (f) Datenminimierung und zweckgebundene Weitergabe nur bei einem Match; (g) Beschwerdeweg und Abhilfe: Kontakt jederzeit an [PLATZHALTER E-Mail Beschwerde].</li><li>10.3 Hinweis: Kein Gütesiegel und keine Zertifizierung wird beansprucht. ILO- und WHO-Prinzipien dienen nur als Orientierungsrahmen für die Praxis.</li></ol>',
      cSec11: '<h3>11. Pflichten und Laufzeit</h3><ol class="esign-nums"><li>11.1 Sie geben wahre und vollständige Angaben und melden Änderungen unverzüglich.</li><li>11.2 Laufzeit dieser Anmeldung: 6 Monate ab Unterschrift. Eine Verlängerung nur mit neuer Einwilligung.</li></ol>',
      cSec12: '<h3>12. Unterschrift — Voraussetzung für den Upload</h3><ol class="esign-nums"><li>12.1 Mit der Unterschrift bestätigen Sie die Klauseln 1 bis 11 und den Erhalt der Widerrufsbelehrung (Klausel 7).</li><li>12.2 Erst nach der Unterschrift wird der Upload von Lebenslauf und Bewerbungsunterlagen freigeschaltet.</li></ol>',
      eSec0: '<h3>0. Personalisiertes Angebot — Angebots-Infos [PLATZHALTER Angebot]</h3><p>Dieses Blatt wird über einen individuellen Link aufgerufen und gilt nur für das hier genannte Angebot.</p><ul class="esign-nums"><li>Angebots-ID: <span id="ph-offer">[PLATZHALTER Angebot-ID]</span></li><li>Datum Angebot: <span id="ph-offer-date">[PLATZHALTER Datum]</span></li><li>Einrichtung / Arbeitgeber: <span id="ph-company">[PLATZHALTER Einrichtung]</span></li><li>Ansprechpartner: <span id="ph-name">[PLATZHALTER Ansprechpartner]</span></li><li>Stelle / Profil-Referenz: <span id="ph-role">[PLATZHALTER Stelle / Profil-Referenz]</span></li><li>Link-Gültigkeit: <span id="ph-valid">[PLATZHALTER Gültigkeit]</span></li></ul><p>Keine festen €-Beträge und keine %-Sätze in diesem Blatt. Einzelheiten stehen in Ziffer 5.</p>',
      eSec1: '<h3>1. Gegenstand und Status</h3><ol class="esign-nums"><li>1.1 MEDA Vermittlung [PLATZHALTER] / Meda Family ist private Arbeitsvermittlung im Sinne der §§ 296–299 SGB III. Keine Arbeitnehmerüberlassung im Sinne des AÜG. Der Arbeitsvertrag kommt direkt zwischen Arbeitgeber und Kandidat zustande. Meda Family ist der Markenrahmen für eine langfristige Kooperation.</li><li>1.2 Dieses Blatt regelt nur den Rahmen für die Vorstellung von Kandidaten zum genannten Angebot. Es ist ein Interessens- und Rahmenblatt. Es begründet noch keinen bindenden Vermittlungsauftrag.</li><li>1.3 Soft-Launch-Vorbehalt: Alle Pflichten sind provisorisch. Bindung: false. Bis zur Gewerbeanzeige nach § 14 GewO und zur anwaltlichen Freigabe nur eine unverbindliche Interessensbekundung. Ablauf: Homepage-Gate ohne Vergütung. Eine Vergütungsvereinbarung nach § 296 SGB III entsteht erst später und separat in Schriftform.</li><li>1.4 Wird dieses Blatt als Vergütungsvereinbarung im Sinne des § 296 SGB III gelesen, ist Schriftform erforderlich. Eine einfache elektronische Signatur über den Link reicht dann nicht. Deshalb steht in diesem Blatt keine Vergütungshöhe.</li></ol>',
      eSec2: '<h3>2. Leistungen von MEDA</h3><ol class="esign-nums"><li>2.1 MEDA sucht und präsentiert passende Bewerber für das genannte Profil und trifft eine Vorauswahl. Die Endauswahl trifft allein der Arbeitgeber.</li><li>2.2 Der Arbeitgeber erhält einen Kandidaten-Pool und Auswahllisten mit Profilen. Profile und Lebensläufe werden erst nach unterzeichnetem Kandidaten-Pack und nur mit Einwilligung der Bewerber nach Art. 6 DSGVO und dem BDSG übermittelt.</li><li>2.3 MEDA übernimmt keine arbeitsrechtliche Entscheidung für den Arbeitgeber.</li><li>2.4 MEDA bleibt nach der Ankunft in Abstimmung mit dem Arbeitgeber für die Integrationsbegleitung in Kontakt.</li></ol>',
      eSec3: '<h3>3. Pflichten des Arbeitgebers</h3><ol class="esign-nums"><li>3.1 Zeitnahe Prüfung von Vorschlägen und Rückmeldung.</li><li>3.2 Beachtung des AGG. Keine Diskriminierung nach § 1 und § 2 AGG. Auswahl nur nach Qualifikation.</li><li>3.3 Beachtung von DSGVO und BDSG. Bewerberdaten nur für das Besetzungsverfahren nutzen, nicht weitergeben, nach Abschluss löschen beziehungsweise gesetzliche Aufbewahrung beachten. Der Widerruf einer datenschutzrechtlichen Einwilligung nach Art. 7 Abs. 3 DSGVO bleibt jederzeit möglich. Davon zu trennen ist das Fernabsatz-Widerrufsrecht (Ziffer 8).</li><li>3.4 Zeitnahe Rückmeldung einer Einstellung an MEDA.</li></ol>',
      eSec4: '<h3>4. Kontaktkanal, Umgehungsschutz und keine harte Exklusivität</h3><ol class="esign-nums"><li>4.1 Für von MEDA nachweislich eingeführte Kandidaten läuft der Kontakt bis zum Abschluss eines Arbeitsvertrags über MEDA Vermittlung [PLATZHALTER]. Kein Bypass für diesen Personenkreis.</li><li>4.2 Direkte Kontaktaufnahme oder ein Abschluss ohne Einbindung von MEDA ist für eingeführte Kandidaten ausgeschlossen. Das gilt nur für nachweislich von MEDA eingeführte Kandidaten.</li><li>4.3 <span class="esign-todo">[prüfen]</span> Frist, Nachweis und Rechtsfolgen des Umgehungsschutzes müssen anwaltlich definiert werden. Ohne klare Frist droht Unwirksamkeit und ein AGB-Risiko.</li><li>4.4 Keine harte Exklusivität. Der Arbeitgeber darf weiter mit anderen Vermittlern oder eigenen Kanälen suchen. Dies entspricht § 297 Nr. 4 SGB III.</li><li>4.5 Prior-Agency-Vorbehalt: Kandidaten, die der Arbeitgeber bereits vor MEDA nachweislich im Verfahren hatte, fallen nicht unter Ziffer 4.1 und 4.2. Den Nachweis führt der Arbeitgeber.</li><li>4.6 Kein AÜG-Verleih. Klarstellung zu Ziffer 1.1.</li></ol>',
      eSec5: '<h3>5. Vergütung — nur bei Erfolg, Abrechnung per separater Rechnung</h3><ol class="esign-nums"><li>5.1 Eine Vergütung wird nur bei erfolgreicher Vermittlung fällig. Erfolg ist der Abschluss eines Arbeitsvertrags zwischen Arbeitgeber und vermitteltem Kandidaten infolge der Vermittlung und der Arbeitsantritt.</li><li>5.2 Die Abrechnung erfolgt ausschließlich über eine separate Rechnung oder eine separate schriftliche Vergütungsvereinbarung. Höhe, Fälligkeit, Zahlungsziel und Staffel: [PLATZHALTER Vergütung].</li><li>5.3 Keine €-Beträge und keine %-Sätze in diesem Blatt. Kein Vorschuss. Keine Zahlungspflicht aus diesem Blatt. Die Vergütung wird erst nach Zustandekommen des Arbeitsvertrags infolge der Vermittlung fällig (§ 296 Abs. 1 SGB III). Eine Rechnung vor dem Erfolg kann als Vorschuss nach § 296 SGB III unwirksam sein.</li><li>5.4 Hinweis zur Umsatzsteuer, offen: Alle Beträge zuzüglich gesetzlicher Umsatzsteuer, sofern anwendbar.</li><li>5.5 Gesetzlicher Rahmen: Die Vergütungsregelung muss §§ 296 ff. SGB III entsprechen.</li><li>5.6 Hinweis Ausbildung: Für die Ausbildungsvermittlung gilt § 296a SGB III. Die Vergütung trägt nur der Arbeitgeber. Für die Kandidatin oder den Kandidaten gilt 0 €. Dies ist nur ein Hinweis für den späteren Vertrag, keine Vergütung aus diesem Blatt.</li><li>5.7 Hinweis zur gesetzlichen Höchstgrenze: Die gesetzliche Höchstgrenze für eine Vergütung mit Arbeitsuchenden beträgt 2.000 € inklusive Umsatzsteuer nach § 296 Abs. 3 SGB III. Das ist eine gesetzliche Höchstgrenze, kein Listenpreis von MEDA. Der Preis gegenüber der Kandidatin oder dem Kandidaten steht nur in einer separaten schriftlichen Vereinbarung: [PLATZHALTER], nicht über dieser Höchstgrenze. Für diesen Arbeitgeber-Pack ist das nicht preisbildend und nur zur Transparenz genannt.</li></ol>',
      eSec6: '<h3>6. Datenschutz, AGG und Praxis fairer Vermittlung (ohne Siegel)</h3><ol class="esign-nums"><li>6.1 Rechtsgrundlage ist Art. 6 Abs. 1 lit. a und lit. b DSGVO in Verbindung mit dem BDSG und §§ 296 ff. SGB III. Datenminimierung: nur die für das Besetzungsverfahren erforderlichen Daten.</li><li>6.2 Bewerberdaten werden nur mit Einwilligung übermittelt. Der Arbeitgeber sichert Vertraulichkeit zu.</li><li>6.3 Beide Parteien beachten das AGG. Ausschreibungen und Auswahl erfolgen diskriminierungsfrei.</li><li>6.4 MEDA handelt als Vermittler. Die Rollen und die Gebührenstruktur sind offengelegt: dieses Blatt ohne Vergütung, eine Vergütung erst später schriftlich. MEDA holt eine informierte Einwilligung ein (DSGVO und Belehrung), vermeidet Täuschung (keine falschen Job- oder Visa-Garantien), beachtet Gleichbehandlung und das AGG, praktiziert Datenminimierung und bietet einen Beschwerdeweg über [PLATZHALTER E-Mail]. Keine Worker-Pays für Ausbildung (§ 296a SGB III) — Praxis und Gesetz. Orientierung an den ILO General Principles and Operational Guidelines for Fair Recruitment (2016/2019) und an Themen des WHO-Codes zur fairen internationalen Anwerbung (informierte Einwilligung, keine Täuschung). Das ist nur ein Orientierungsrahmen, keine Akkreditierung.</li><li>6.5 Kein Gütesiegel und keine Zertifizierung wird beansprucht. ILO- und WHO-Prinzipien dienen nur als Orientierungsrahmen für die Praxis. MEDA hält das Gütesiegel „Faire Anwerbung Pflege Deutschland“ (RAL/GAPA) nicht. Die Bezeichnungen „zertifiziert“, „Siegel“ und „Fair Recruitment Certified“ werden nicht verwendet.</li></ol>',
      eSec7: '<h3>7. Laufzeit und Beendigung</h3><ol class="esign-nums"><li>7.1 Dieses Interessensblatt läuft auf unbestimmte Zeit und kann jederzeit ohne Frist per E-Mail beendet werden.</li><li>7.2 Bereits übermittelte Profile sind dann zu löschen, sofern keine gesetzliche Aufbewahrungspflicht besteht.</li></ol>',
      eSec8: '<h3>8. Widerruf und Fernabsatz — Klarstellung für diesen B2B-Pack</h3><ol class="esign-nums"><li>8.1 Kein Verbrauchervertrag und kein gesetzliches Fernabsatz-Widerrufsrecht. Die Gegenpartei dieses Packs ist typischerweise eine Einrichtung oder ein Arbeitgeber als Unternehmer im Sinne des § 14 BGB (juristische Person, Personengesellschaft oder natürliche Person in Ausübung einer gewerblichen oder selbständigen beruflichen Tätigkeit). Ein Verbrauchervertrag im Sinne des § 13 BGB liegt nicht vor.</li><li>8.2 Die Vorschriften zu Fernabsatzverträgen (§ 312 Abs. 1, § 312g Abs. 1, § 355 BGB) gelten nach § 312 Abs. 1 BGB nur für Verbraucherverträge, das heißt nur, wenn ein Verbraucher im Sinne des § 13 BGB einen Preis schuldet oder personenbezogene Daten bereitstellt (§ 312 Abs. 1a BGB) und der Unternehmer im Sinne des § 14 BGB handelt. Diese Voraussetzung ist hier im Regelfall nicht erfüllt.</li><li>8.3 Folge: Für diesen B2B-Rahmen besteht kein Widerrufsrecht nach § 312g und § 355 BGB. Es wird keine 14-Tage-Widerrufsbelehrung nach Art. 246a § 1 Abs. 2 Satz 1 Nr. 1 EGBGB in Verbindung mit § 356 Abs. 3 BGB erteilt. Die gesetzliche Widerrufsfrist von 14 Tagen nach § 355 Abs. 2 BGB greift hier nicht.</li><li>8.4 <span class="esign-todo">[prüfen]</span> Ausnahmefall Verbraucher-Arbeitgeber: Handelt es sich ausnahmsweise um eine natürliche Person als Arbeitgeber ohne unternehmerischen Bezug (zum Beispiel ein Privathaushalt, Einordnung nach § 13 oder § 14 BGB unklar), ist der Fernabsatz-Widerruf gesondert zu prüfen. Dann gilt: Bei ordnungsgemäßer Belehrung beträgt die Widerrufsfrist 14 Tage ab Vertragsschluss (§ 355 Abs. 2 BGB). Die äußere Erlöschensgrenze von 12 Monaten und 14 Tagen bei fehlender oder fehlerhafter Belehrung (§ 356 Abs. 3 in Verbindung mit Abs. 4 BGB) ist nur eine gesetzliche Sanktionsfolge, nicht die vertragliche oder in der UI angezeigte Frist.</li><li>8.5 Davon unberührt bleibt der jederzeitige Widerruf einer datenschutzrechtlichen Einwilligung nach Art. 7 Abs. 3 DSGVO.</li></ol>',
      eSec9: '<h3>9. Schlussbestimmungen</h3><ol class="esign-nums"><li>9.1 Es gilt deutsches Recht.</li><li>9.2 Änderungen bedürfen der Textform. E-Mail reicht.</li><li>9.3 Sollte eine Klausel unwirksam sein, bleibt der Rest wirksam.</li></ol>',
      clauseAckTitle: 'Bestätigung',
      clauseAckHint: 'Hinweis: Ohne diese Bestätigungen bleibt die Übermittlung gesperrt. Der Entwurf steht im vorherigen Schritt.',
      cAck1: 'Ich melde mich zum MEDA Vermittlungsservice an. Ich willige nach Art. 6 und Art. 7 DSGVO ein, dass MEDA mein Profil und meine Kontaktdaten nur nach Prüfung an passende deutsche Arbeitgeber weitergibt. Kein Auto-Blast. Widerruf jederzeit nach Art. 7 (Klausel 3.3), separat vom Fernabsatz-Widerruf.',
      cAckWithdraw: 'Ich habe die Widerrufsbelehrung (Klausel 7) zur Kenntnis genommen. Gesetzliches Mindestmaß: 14 Tage nach § 355 Abs. 2 BGB. MEDA gewährt eine UI- und Vertragsfrist von 12 Monaten und 14 Tagen. Der Widerruf erfolgt durch eine eindeutige Erklärung an MEDA Vermittlung [PLATZHALTER], Luhnenstraße 7, 30559 Hannover (Büro), E-Mail [PLATZHALTER]. Das Musterformular ist freiwillig.',
      cAckUpload: 'Ich weiß: Lebenslauf und Bewerbungsunterlagen darf ich erst nach Unterschrift dieses Packs hochladen. Ohne Unterschrift kein Upload.',
      cAck3: 'Ich weiß: Dieses Gate begründet keine Zahlungspflicht. Keine €/% MEDA-Preise, kein Vorschuss. Eine Vergütung entsteht erst später in einem gesonderten schriftlichen Vertrag nach § 296 SGB III oder in einer Anlage nach dem Match. Die gesetzliche Höchstgrenze von 2.000 € inklusive Umsatzsteuer nach § 296 Abs. 3 SGB III ist nur eine Höchstgrenze.',
      cAckTraining: 'Ich weiß: Bei der Ausbildung gilt 0 € von der Kandidatin oder dem Kandidaten nur als gesetzlicher Vorbehalt für einen späteren Vertrag nach § 296a SGB III, nicht als Vergütung aus diesem Gate.',
      cAck5: 'Ich weiß: Keine harte Exklusivität nach § 297 Nr. 4 SGB III. Der Soft-Kontaktkanal gilt für von MEDA vorgestellte Arbeitgeber. Den Prior-Agency-Vorbehalt melde ich vor der Weitergabe.',
      cAckFair: 'Ich habe die MEDA-Verpflichtungen zu fairer Vermittlungspraxis (Klausel 10) zur Kenntnis genommen: kein Gütesiegel, keine Zertifizierung, ILO und WHO nur als Orientierung. Beschwerdeweg: [PLATZHALTER E-Mail].',
      cAck6: 'Optional: Ich will später gegebenenfalls einen separaten Login-Nachtrag unterschreiben.',
      eAckLink: 'Ich rufe dieses Blatt über meinen individuellen MEDA-Link auf für das Angebot [PLATZHALTER Angebot-ID / Stelle].',
      eAck1: 'Ich bestätige mein Interesse an einer langfristigen Kooperation mit MEDA Vermittlung [PLATZHALTER] / Meda Family als private Arbeitsvermittlung nach §§ 296–299 SGB III. Kein AÜG-Verleih.',
      eAck2: 'Ich möchte einen Kandidaten-Pool und Auswahllisten für [PLATZHALTER Stelle] erhalten und zeitnah prüfen.',
      eAck3: 'Mir ist klar: Keine Einstellungspflicht. Ich entscheide frei über jede Einstellung.',
      eAck4: 'Mir ist klar: Keine harte Exklusivität nach § 297 Nr. 4 SGB III. Ich darf parallel andere Wege nutzen. Der Prior-Agency-Vorbehalt wird beachtet.',
      eAck6: 'Ich beachte das AGG und DSGVO/BDSG und behandle Bewerberdaten vertraulich. Der Widerruf meiner Einwilligung nach Art. 7 DSGVO bleibt jederzeit möglich.',
      eAckChannel: 'Für von MEDA eingeführte Kandidaten läuft der Kontakt bis zur Einstellung über MEDA. Kein Bypass. MEDA bleibt nach der Ankunft für die Integrationsbegleitung in Kontakt. <span class="esign-todo">[prüfen: Frist und Rechtsfolgen sind noch offen]</span>',
      eAck7: 'Ich stimme zu: Vergütung nur bei erfolgreicher Vermittlung per separater Rechnung oder separater schriftlicher Vergütungsvereinbarung. Höhe, Fälligkeit und Zahlungsziel: [PLATZHALTER]. Keine Zahlungspflicht aus diesem Blatt. Kein Vorschuss. Ausbildung nach § 296a SGB III: nur der Arbeitgeber zahlt, und zwar im späteren Vertrag.',
      eAck8: 'Mir ist klar: Dies ist ein Entwurf. Bindung: false bis zur Gewerbeanzeige nach § 14 GewO und zur anwaltlichen Freigabe. Keine Rechtsberatung.',
      eAckB2b: 'Ich habe verstanden: Die Gegenpartei ist Unternehmer nach § 14 BGB. Für diesen B2B-Rahmen besteht kein Fernabsatz-Widerrufsrecht nach § 312g und § 355 BGB. <span class="esign-todo">[prüfen]</span> Nur bei einem Verbraucher als Arbeitgeber ist das gesondert zu prüfen.',
      eAckFair: 'Ich habe die Hinweise zur fairen Vermittlungspraxis (Ziffer 6.4 und 6.5) zur Kenntnis genommen: Transparenz, keine Täuschung, AGG, Beschwerdeweg [PLATZHALTER E-Mail], kein Gütesiegel.',
      fSec1: '<h3>1. Zweck und Status. Bindung: false. Verhältnis zum Homepage-Gate</h3><p>Dieses Blatt ist die Meda-Family-Schicht ohne Vergütung. Es steht nach dem Homepage-Gate oder parallel dazu. Das Homepage-Gate ist die Anmeldung zum Vermittlungsservice, die Einwilligung nach der DSGVO, der Soft-Kontaktkanal und der Prior-Agency-Vorbehalt. Beide Ebenen begründen keine Zahlungspflicht. Nach § 14 GewO erfolgt eine vergütungspflichtige Vermittlung erst nach der Gewerbeanzeige, der anwaltlichen Freigabe und dem Abschluss eines gesonderten schriftlichen Vermittlungsvertrags. Bis dahin gilt: Bindung: false. Keine Bindung, keine Exklusivität, jederzeit widerruflich. Ablauf: Homepage-Gate ohne Vergütung, danach dieses Family-Blatt ohne Vergütung, später ein gesonderter Vermittlungsvertrag nach § 296 SGB III oder der Angebotslink des Arbeitgebers. Aus diesem Blatt entsteht keine Vergütung.</p>',
      fSec2: '<h3>2. Kein Vermittlungsvertrag und keine Vergütungspflicht durch dieses Blatt</h3><p>Dieses Blatt ist kein Vermittlungsvertrag im Sinne der §§ 296 ff. SGB III und begründet keinen Vergütungsanspruch nach § 296 SGB III. Ein solcher Vertrag wird, wenn überhaupt, erst später separat geschlossen, als Anlage nach einem Match oder als gesonderter Vertrag. Nicht durch dieses Blatt. Kein Vorschuss und keine Fälligkeit.</p>',
      fSec3: '<h3>3. Soft-Kontaktkanal — keine harte Exklusivität und Prior-Agency-Vorbehalt</h3><p>Sie bekunden Ihr Interesse unverbindlich über den Soft-Kontaktkanal. Es entsteht keine Pflicht zur Beauftragung. Keine harte Exklusivität nach § 297 Nr. 4 SGB III. Eine Klausel, die Sie verpflichtet, ausschließlich MEDA zu beauftragen, wäre unwirksam. Sie können jederzeit weitere Vermittler beauftragen. Prior-Agency-Vorbehalt: Bestehende Beauftragungen anderer Vermittler bleiben unberührt. Bereits angebahnte Arbeitgeberkontakte sind ausgenommen. Kontakt: [PLATZHALTER E-Mail / Formular / Telefon]. Die Rückmeldung erfolgt unverbindlich und diskriminierungsfrei nach dem AGG. Mit dem Absenden bekunden Sie nur Interesse. Sie beauftragen noch keine Vermittlung.</p>',
      fSec4: '<h3>4. Leistungen — Meda Family</h3><p>MEDA Vermittlung [PLATZHALTER] erbringt ausschließlich private Arbeitsvermittlung im Sinne der §§ 296–299 SGB III. Meda Family ist die langfristige Begleitung: Orientierung, Kontaktpflege und Information. Keine Vermittlungsgarantie, keine Job-Garantie und keine Visa-Garantie. Keine Arbeitnehmerüberlassung und keine Zeitarbeit im Sinne des AÜG. MEDA wird nicht Arbeitgeber. Vermittelt wird nur ein direkter Arbeitsvertrag zwischen Arbeitgeber und Arbeitnehmer. Ein Arbeitgeberkontakt erfolgt erst nach einem Match und einer gesonderten Freigabe. Ein Upload von Lebenslauf oder Unterlagen erfolgt erst nach einem unterzeichneten Pack.</p>',
      fSec5: '<h3>5. Praxis fairer Vermittlung — Verpflichtungen ohne Gütesiegel</h3><p>MEDA handelt nach Grundsätzen fairer Vermittlung als eigene Verpflichtung und Praxis, in Orientierung an den ILO General Principles and Operational Guidelines for Fair Recruitment (2016/2019) und an Themen des WHO-Codes, ohne ein Gütesiegel, eine Zertifizierung oder eine Akkreditierung zu beanspruchen.</p><ul class="esign-nums"><li>Transparenz zu Rollen und Gebühren: MEDA ist Vermittler, nicht Arbeitgeber. Dieses Blatt ist ohne Vergütung. Eine Vergütung, wenn überhaupt, nur im späteren schriftlichen Vertrag.</li><li>Keine Worker-Pays für Ausbildung: Praxis und Gesetz nach § 296a SGB III. Bei der Ausbildungsvermittlung zahlt nur der Arbeitgeber (Ziffer 7).</li><li>Informierte Einwilligung: verständliche Belehrung vor der Datenverarbeitung und vor einem späteren Vertragsschluss.</li><li>Keine Täuschung: keine falschen Zusagen zu Job, Gehalt, Visum oder Einreise.</li><li>Gleichbehandlung nach dem AGG: diskriminierungsfreie Ansprache und Auswahl.</li><li>Datenminimierung: nur erforderliche Daten, Speicherung bis zum Widerruf.</li><li>Beschwerdeweg: Kontakt jederzeit unter [PLATZHALTER E-Mail], zeitnahe Bearbeitung und Abhilfe.</li></ul><p>Klarstellung: Kein Gütesiegel und keine Zertifizierung wird beansprucht. MEDA hält das Gütesiegel „Faire Anwerbung Pflege Deutschland“ (RAL/GAPA) nicht. ILO- und WHO-Prinzipien dienen nur als Orientierungsrahmen für die Praxis.</p>',
      fSec6: '<h3>6. Rechtlicher Rahmen</h3><ul class="esign-nums"><li>§§ 296–299 SGB III: private Arbeitsvermittlung.</li><li>§ 296 Abs. 3 SGB III: gesetzliche Höchstgrenze für die Vermittlung von Arbeitsuchenden von 2.000 € inklusive Umsatzsteuer. Ausschließlich als gesetzliche Schranke zitiert, kein Preisangebot von MEDA Vermittlung [PLATZHALTER].</li><li>§ 296a SGB III: bei der Ausbildung trägt die Vergütung nur der Arbeitgeber.</li><li>§ 297 Nr. 4 SGB III: keine harte Exklusivität.</li><li>§ 14 GewO: Gewerbeanzeige vor vergütungspflichtiger Tätigkeit.</li><li>§§ 13, 14, 312, 312g, 355 und 356 BGB: Abgrenzung von Verbraucher und Unternehmer und Fernabsatz-Widerruf (Ziffer 9).</li><li>AGG, DSGVO und BDSG: diskriminierungsfreie Verarbeitung.</li></ul>',
      fSec7: '<h3>7. Keine Vergütung in diesem Blatt</h3><p>Dieses Blatt begründet keinen Vergütungsanspruch. Keine Zahlungspflicht, kein Vorschuss, keine Fälligkeit und keine Erstattungsregelung. Keine Vergütungsfelder und keine €/%-Angaben als Preis in dieser Erklärung. Eine Vergütung wird, wenn überhaupt, ausschließlich in einem späteren gesonderten schriftlichen Vermittlungsvertrag nach § 296 SGB III oder auf einer separaten Rechnung vereinbart. Nicht durch dieses Blatt. Hinweis für den späteren Vertrag nach § 296a SGB III: Bei der Ausbildungsvermittlung ist eine Vergütung durch den Ausbildungssuchenden unzulässig. Nur der Arbeitgeber kann Vergütungsschuldner sein. Hinweis nach § 296 Abs. 3 SGB III: Die gesetzliche Höchstgrenze von 2.000 € inklusive Umsatzsteuer ist eine Schranke.</p>',
      fSec8: '<h3>8. Datenschutz nach DSGVO und BDSG</h3><p>Verantwortlicher: MEDA Vermittlung [PLATZHALTER], Büro: Luhnenstraße 7, 30559 Hannover, [PLATZHALTER Ergänzung Anschrift und E-Mail]. Rechtsgrundlagen: Art. 6 Abs. 1 lit. a und lit. b DSGVO. Zwecke: Prüfung der Interessensbekundung, Kontaktaufnahme, Anbahnung. Empfänger: nur mit gesonderter Einwilligung an Arbeitgeber. Speicherdauer: bis zum Widerruf. Rechte: Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit und Beschwerde bei einer Aufsichtsbehörde. Ihre Einwilligung in die Datenverarbeitung können Sie jederzeit für die Zukunft widerrufen, zum Beispiel per E-Mail an [PLATZHALTER] (Art. 7 Abs. 3 DSGVO). Der Widerruf berührt die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung nicht. Das ist separat vom Fernabsatz-Widerrufsrecht nach Ziffer 9. Ein Lebenslauf oder Unterlagen werden ohne unterschriebenes Pack nicht hochgeladen. <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutz</a>.</p>',
      fSec9: '<h3>9. Fernabsatz-Widerrufsbelehrung für Verbraucher — UI-Frist 12 Monate und 14 Tage (§§ 312g, 355, 356 BGB)</h3><p>Diese Belehrung gilt, wenn Sie Verbraucher im Sinne des § 13 BGB sind und der Vertrag als Fernabsatzvertrag (§ 312c BGB) ausschließlich über Fernkommunikationsmittel geschlossen wird. Da dieses Blatt keine Zahlungspflicht begründet, greift das Fernabsatz-Widerrufsrecht nach § 312 Abs. 1 BGB grundsätzlich nur bei einer Preiszahlungspflicht. Nach § 312 Abs. 1a BGB gilt es jedoch auch, wenn Sie als Verbraucher personenbezogene Daten bereitstellen und wir diese nicht ausschließlich zur Erfüllung unserer Leistungspflicht oder rechtlicher Anforderungen verarbeiten. Da hier Daten zur Interessensbekundung erhoben werden, wird vorsorglich wie folgt belehrt.</p><p><strong>Gesetzliches Mindestmaß.</strong> Sie haben nach § 355 Abs. 2 BGB ein Widerrufsrecht binnen 14 Tagen ab Vertragsschluss. Es beginnt nicht vor einer ordnungsgemäßen Belehrung (Art. 246a § 1 Abs. 2 Satz 1 Nr. 1 EGBGB in Verbindung mit § 356 Abs. 3 BGB).</p><p><strong>Vertragliche und UI-Widerrufsfrist. Freiwillige Verlängerung zugunsten des Verbrauchers.</strong> MEDA gewährt über das gesetzliche Mindestmaß hinaus eine Widerrufsfrist von 12 Monaten und 14 Tagen ab Vertragsschluss, beziehungsweise ab Erhalt dieser Belehrung, falls später. Das ist die in der UI und in diesem Pack angezeigte Frist. Sie dürfen binnen 12 Monaten und 14 Tagen ohne Angabe von Gründen widerrufen.</p><p>Zur Ausübung genügt eine eindeutige Erklärung an MEDA Vermittlung [PLATZHALTER], Büro: Luhnenstraße 7, 30559 Hannover, [PLATZHALTER E-Mail] (zum Beispiel Brief oder E-Mail). Sie können das Muster-Widerrufsformular verwenden. Das ist nicht vorgeschrieben. Zur Fristwahrung genügt die rechtzeitige Absendung vor Ablauf der 12 Monate und 14 Tage.</p><p><strong>Folgen des Widerrufs.</strong> Ist der Widerruf wirksam, sind empfangene Leistungen zurückzugewähren. Da dieses Blatt keine Zahlungspflicht vorsieht, entstehen Ihnen durch den Widerruf keine Kosten und keine Zahlungspflichten. Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, erlischt Ihr Widerrufsrecht bei Verträgen ohne Preiszahlungspflicht mit vollständiger Erbringung (§ 356 Abs. 5 Nr. 1 BGB).</p><p><strong>Muster-Widerrufsformular.</strong> Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung. Bestellt am oder erhalten am [Datum]. Name, Anschrift. Unterschrift nur bei Papier. Datum. Unzutreffendes streichen.</p><p>Die vertragliche und in der UI angezeigte Frist beträgt 12 Monate und 14 Tage. Das ist eine freiwillige Verlängerung. Das gesetzliche Mindestmaß von 14 Tagen bleibt genannt.</p>',
      fAck1: 'Ich willige in die Verarbeitung meiner Daten zur Bearbeitung dieser Interessensbekundung ein (Art. 6 Abs. 1 lit. a DSGVO, Art. 7 DSGVO). Die Einwilligung ist jederzeit widerruflich.',
      fAckWithdraw: 'Ich habe die Widerrufsbelehrung (Ziffer 9) zur Kenntnis genommen. Gesetzlich 14 Tage nach § 355 Abs. 2 BGB. Vertraglich und in der UI 12 Monate und 14 Tage. Ich erhalte die Belehrung auf einem dauerhaften Datenträger.',
      fAckNonfee: 'Ich bestätige: Dieses Blatt ist unverbindlich (Bindung: false), begründet keine Zahlungspflicht und ist kein Vermittlungsvertrag nach § 296 SGB III.',
      stepIntro: 'Hinweis',
      stepClauses: 'Entwurf',
      stepChecklist: 'Bestätigung',
      stepSign: 'Unterschrift',
      stepDone: 'Abschluss',
      stepOf: 'Schritt {n} von {m}',
      back: 'Zurück',
      continue: 'Weiter',
      lockPending: 'Hinweis: Die rechtliche Freigabe steht aus. Die Übermittlung bleibt gesperrt, bis diese Entwurfsfassung hinterlegt ist.',
      dryRun: 'Vorschau anzeigen',
      dryHint: 'Die Vorschau speichert nichts und versendet keine E-Mail.',
      capture: 'Anmeldung erfassen',
      captureHint: 'Die Übermittlung bleibt gesperrt. Die erfasste Anmeldung ist nicht rechtsverbindlich. Erst danach werden Lebenslauf und Bewerbungsunterlagen freigeschaltet.',
      successNotSent: 'Es wurde nichts übermittelt. Es wurde keine E-Mail versendet. Die Übermittlung bleibt gesperrt, bis die rechtliche Freigabe vorliegt.',
      successCopyLocal: 'Sie können die Kopie speichern oder drucken. MEDA Vermittlung hat diese Erklärung noch nicht erhalten.',
      cvNext: 'Weiter zum Lebenslauf',
      serviceOfferNote: 'Diese Erklärung betrifft den MEDA-Service. Es ist keine einzelne Stelle bezeichnet. Profile kommen aus dem Ausland.',
      legalLangNote: 'Hinweis: Maßgeblich ist der deutsche Entwurfstext.',
      reviewTitle: 'Prüfung vor der Übermittlung',
      draw: 'Unterschrift zeichnen',
      drawHint: 'Bitte mit Finger oder Maus unterschreiben. Erforderlich zusammen mit dem getippten Namen.',
      drawnMissing: 'Bitte auch auf der Fläche unterschreiben.',
      downloadMd: 'Kopie als Markdown',
      downloadPdf: 'Kopie als PDF',
      familySubmit: 'Unverbindliches Interesse bekunden',
      h1Family: 'Interessensblatt Meda Family',
      pageTitleFamily: 'Interessensblatt Meda Family — MEDA Vermittlung',
      kickerFamily: 'Hinweis · Meda Family · ohne Vergütung · Soft-Launch 0.6',
      leadFamily: 'Hinweis: Entwurf zur rechtlichen Prüfung. Dieses Blatt kann nach der Anmeldung zum Vermittlungsservice stehen oder parallel dazu. Es ist nicht rechtsverbindlich. Es begründet keine Zahlungspflicht, keine Exklusivität und keine Arbeitnehmerüberlassung nach dem AÜG.',
      familyNote1: 'Dieses Dokument begründet keinen Vermittlungsvertrag und keinen Vergütungsanspruch. Es dient der unverbindlichen Interessensbekundung. Ein Lebenslauf wird hier nicht hochgeladen.',
      familyNote2: 'Die Vermittlung erfolgt diskriminierungsfrei nach dem AGG. Eine Vergütung steht in diesem Blatt nicht. Sie kann nur in einem späteren gesonderten Vertrag oder auf einer separaten Rechnung vereinbart werden.',
      docTitleFamily: 'Entwurf eines Interessensblatts ohne Vergütung',
      footerImpressum: 'MEDA Vermittlung [PLATZHALTER]. Impressum: [TODO Anwalt].',
      lawSignatureCandidate: 'Ich bestätige, die Klauseln 1 bis 11 gelesen zu haben und den Erhalt der Widerrufsbelehrung (Ziffer 7) zu bestätigen. Die UI-Frist beträgt 12 Monate und 14 Tage. Das gesetzliche Mindestmaß von 14 Tagen nach § 355 Abs. 2 BGB ist genannt. Die Unterschrift schaltet den Upload von Lebenslauf und Bewerbungsunterlagen frei. Die getippte Unterschrift und der Zeitstempel bestätigen diesen Text.',
      lawSignatureEmployer: 'Ich bestätige, die Klauseln 1 bis 9 gelesen zu haben und ihnen zuzustimmen. Die getippte Unterschrift und der Zeitstempel bestätigen diesen Text.',
      lawSignatureFamily: 'Ich bestätige, den Entwurf gelesen zu haben. Die Erklärung ist nicht rechtsverbindlich. Keine Exklusivität. Keine Arbeitnehmerüberlassung nach dem AÜG.',
      clauseErr: 'Bitte diese Bestätigung setzen.',
      loginOptional: 'Hinweis: Diese Bestätigung ist freiwillig. Die Übermittlung ist auch ohne sie möglich.',
      blockAddress: 'Anschrift',
      blockSign: 'Unterschrift',
      blockDate: 'Datum',
      blockCompany: 'Unternehmen',
      blockRole: 'Funktion',
      signPlaceholder: 'Erscheint mit der Eingabe.',
      datePending: 'Wird bei der Erfassung festgehalten.',
      panelTitle: 'Angaben und Unterschrift',
      name: 'Vollständiger Name',
      company: 'Unternehmen',
      roleTitle: 'Funktion',
      roleTitleEmployer: 'Stelle',
      street: 'Straße und Hausnummer',
      postal: 'Postleitzahl',
      city: 'Ort',
      country: 'Land',
      emailLabel: 'E-Mail',
      phone: 'Telefon (freiwillig)',
      lawTitle: 'Rechtliche Bestätigung',
      lawHint: 'Hinweis: Alle Bestätigungen sind erforderlich. Andernfalls bleibt die Übermittlung gesperrt.',
      law_provisional: 'Ich bestätige: Dies ist eine vorläufige Interessensbekundung. Es besteht noch kein rechtsverbindlicher Vermittlungsvertrag, solange die Gewerbeanmeldung und die rechtliche Prüfung nicht abgeschlossen sind.',
      law_vermittlung: 'Ich bestätige: Es handelt sich um reine Personalvermittlung. Keine Arbeitnehmerüberlassung ohne Erlaubnis.',
      law_visa: 'Ich bestätige: Es besteht keine Visumzusage und keine Rechtsberatung.',
      law_privacy: 'Ich habe die <a href="einwilligung.html" target="_blank" rel="noopener">Einwilligung</a> und die Hinweise zum <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutz</a> gelesen.',
      law_signature: 'Ich bestätige, den Text dieser Seite gelesen zu haben. Die getippte Unterschrift und der Zeitstempel bestätigen diesen Text.',
      lawErr: 'Bitte diese Bestätigung setzen.',
      noOtherParty: 'Keine Nachricht an die andere Partei.',
      copyNotice: 'Eine Kopie geht an die unterzeichnende Person. MEDA Vermittlung erhält Kopien an AgentMail und an Outlook.',
      signerCopy: 'Kopie an meine E-Mail-Adresse. Voreingestellt. Nicht an die andere Partei.',
      signerCopyHint: 'Voreingestellt. Bei der späteren Freigabe geht die Kopie an diese Adresse. MEDA erhält Kopien an meda-vermittlung@agentmail.to und MEDA-team@outlook.com. Diese Vorschau versendet keine E-Mail.',
      copiesKicker: 'Kopien',
      copySignerLabel: 'Unterzeichnende Person',
      copyMedaAgent: 'MEDA · AgentMail',
      copyMedaOutlook: 'MEDA · Outlook',
      copyPreviewExplain: 'Diese Erfassung hat keine E-Mail versendet. Sobald die Übermittlung freigegeben ist, erhält die unterzeichnende Person eine Kopie, und MEDA erhält Kopien an meda-vermittlung@agentmail.to sowie MEDA-team@outlook.com.',
      copyLiveSent: 'Eine Kopie geht an die E-Mail der unterzeichnenden Person. MEDA erhält Kopien an meda-vermittlung@agentmail.to und MEDA-team@outlook.com.',
      copySignerQueued: 'Vorgemerkt · {email}',
      copySignerOff: 'Nicht angefordert',
      sealPack: 'Paket',
      sealHash: 'Hash',
      sealWhen: 'Zeitpunkt',
      sealDevice: 'Gerät',
      liveSealKicker: 'Nachweis',
      sessionKicker: 'Ihr Angebot',
      sessionTitle: 'Dieses Angebot',
      eUiDraftKicker: 'ENTWURF',
      eUiDraftBanner: 'Unverbindlich · Bindung: false',
      eUiDraftNote: 'Noch nicht anwaltlich freigegeben. Keine Rechtsberatung.',
      eUiIntro: 'Prüfen Sie das Angebot und bestätigen Sie es in drei Punkten. Der vollständige Entwurf steht im nächsten Schritt.',
      eUiStep1: 'Angebot',
      eUiStep2: 'Entwurf',
      eUiStep3: 'Annahme',
      eUiStep4: 'Unterschrift',
      eUiStep5: 'Fertig',
      eUiAckTitle: 'Annahme',
      eUiAckHint: 'Bitte alle drei Punkte setzen.',
      eUiLock: 'Die Übermittlung bleibt gesperrt, bis diese Entwurfsfassung freigegeben ist.',
      eUiFooter: 'ENTWURF · unverbindlich · Kopie an Sie und an MEDA',
      eUiReview: 'Ihre Annahme',
      eUiCopy: 'Sie erhalten eine Kopie. MEDA erhält eine Kopie.',
      eUiSigner: 'Kopie an meine E-Mail',
      eUiSignerHint: 'Voreingestellt. Bei Freigabe an meda-vermittlung@agentmail.to und MEDA-team@outlook.com. Diese Vorschau versendet keine E-Mail.',
      eUiPreview: 'Vorschau: nichts wird gespeichert und keine E-Mail versendet.',
      eUiSummary: 'Entwurf lesen',
      download: 'Kopie speichern',
      print: 'Drucken oder als PDF speichern',
      successCopy: 'Die unterzeichnende Person erhält eine Kopie. MEDA erhält Kopien an meda-vermittlung@agentmail.to und MEDA-team@outlook.com.',
      successSignerMail: 'Ihre Kopie ist für diese E-Mail-Adresse vorgemerkt. MEDA erhält Kopien an meda-vermittlung@agentmail.to und MEDA-team@outlook.com. Es geht keine Nachricht an die andere Partei.',
      successNoSignerMail: 'Eine E-Mail-Kopie an Sie ist nicht angefordert. MEDA erhält bei der Freigabe Kopien an meda-vermittlung@agentmail.to und MEDA-team@outlook.com.',
      receiptTitle: 'Kopie der Erklärung',
      clausesTitle: 'Bestätigter Entwurf',
      typed: 'Unterschrift (Name in Druckschrift)',
      typedHint: 'Bitte den Namen genau wie im Feld „Vollständiger Name“ eintragen.',
      typedOk: 'Die Unterschrift entspricht dem Namen.',
      typedBad: 'Die Unterschrift muss dem Namen entsprechen.',
      drawRequired: 'Zeichnen',
      clear: 'Unterschrift löschen',
      next: 'Nächste Pflichtangabe',
      submit: 'Erklärung übermitteln',
      sending: 'Wird übermittelt…',
      remaining: 'Noch {n} Pflichtangaben',
      remainingOne: 'Noch 1 Pflichtangabe',
      ready: 'Die Pflichtangaben sind vollständig.',
      previewNote: 'Vorschau: Es wird nichts gespeichert und keine E-Mail versendet. Bei Freigabe gehen Kopien an die unterzeichnende Person, an meda-vermittlung@agentmail.to und an MEDA-team@outlook.com.',
      name_full: 'Bitte Vor- und Nachnamen angeben.',
      too_short: 'Bitte dieses Feld ausfüllen.',
      email: 'Bitte eine gültige E-Mail-Adresse angeben.',
      typed_empty: 'Bitte den Namen als Unterschrift eintragen.',
      typed_mismatch: 'Die Unterschrift muss dem Namen entsprechen.',
      errSend: 'Die Übermittlung ist nicht erfolgt. Bitte versuchen Sie es später erneut oder schreiben Sie an meda-vermittlung@agentmail.to.',
      successKicker: 'Erfasst · nicht rechtsverbindlich',
      successTitle: 'Die Erklärung wurde erfasst',
      successBody: 'Die Erklärung wurde erfasst. Sie ist kein rechtsverbindlicher Vertrag. Aus dieser Erklärung entsteht keine Vergütung und keine Zahlungspflicht. Die andere Partei wird nicht benachrichtigt.',
      successPreview: 'Vorschau: Es wurde keine E-Mail versendet. Bei Freigabe erhält die unterzeichnende Person eine Kopie, und MEDA erhält Kopien an meda-vermittlung@agentmail.to und MEDA-team@outlook.com.',
      auditTitle: 'Nachweis der Erfassung',
      auditWhen: 'Zeitpunkt',
      auditParty: 'Rolle',
      auditToken: 'Referenznummer',
      auditOffer: 'Angebotsreferenz',
      auditHash: 'Nachweis zum Gerät',
      auditBinding: 'Rechtsverbindlichkeit',
      auditBindingValue: 'Nein · Soft-Launch · nicht rechtsverbindlich',
      auditMail: 'Nachricht an die andere Partei',
      auditMailValue: 'Nein',
      drawnYes: 'Gezeichnete Unterschrift: erfasst',
      drawnNo: 'Gezeichnete Unterschrift: nicht erfasst',
      partyCandidate: 'Kandidatin oder Kandidat',
      partyEmployer: 'Arbeitgeber',
      partyFamily: 'Interessent oder Interessentin',
      langMin: 'Sprachniveau der Angebotsreferenz: {level}',
      linkGap: 'Die Übermittlung ist möglich, sobald der Link vollständig ist und alle Pflichtangaben vorliegen.'
    },
    en: {
      skip: 'Skip to content',
      navEmployers: 'For employers',
      navContact: 'Contact',
      footerNote: 'Notice · Draft for legal review · Not legal advice · Copy only to the declaring party and to MEDA Vermittlung',
      pageTitleCandidate: 'Registration for the placement service — MEDA Vermittlung',
      pageTitleEmployer: 'Confirm the offer — MEDA Vermittlung',
      kickerCandidate: 'Notice · Draft for legal review',
      kickerEmployer: 'Offer',
      h1Candidate: 'Registration for the MEDA placement service',
      h1Employer: 'Confirm the offer',
      leadCandidate: 'Please read the draft. The declaration is not legally binding. Contact details are passed to an employer only after review by MEDA Vermittlung.',
      leadEmployer: 'Company and role are filled in. Confirmation is non-binding and creates no payment.',
      stepReview: 'Review',
      stepDetails: 'Particulars',
      stepSign: 'Signature',
      summaryDoc: 'Show the draft',
      badge: 'Draft · not legally binding',
      draftKicker: 'Notice · Soft launch · not legally binding',
      draftBanner: 'Draft for legal review',
      draftNote: 'A licensed lawyer has not approved this text. This is not legal advice.',
      docTitleCandidate: 'Draft registration for the placement service',
      docTitleEmployer: 'Offer',
      docKickerCandidate: 'Private placement within the meaning of §§ 296–299 SGB III. Not a legal service under the RDG. Homepage gate. Soft-launch version 0.14.',
      docKickerEmployer: 'MEDA Vermittlung / Meda Family. Opened only from the individual link after the call. Soft-launch version 0.5.',
      docRoleCandidate: 'Your role: candidate',
      docRoleEmployer: 'Your role: employer',
      metaToken: 'Reference number',
      metaOffer: 'Offer reference',
      unknownOffer: 'This entry is an offer reference. No position is designated.',
      missingToken: 'This link contains no reference number. Please use the link from your registration.',
      missingOffer: 'This link contains no offer reference.',
      docIntroCandidate: 'This declaration is made before submission. It comprises the consent and the statement of interest. It is not yet a final placement contract.',
      docIntroEmployer: 'Non-binding draft. Not a legally binding placement instruction. It takes effect only after trade registration and approval by a German lawyer. <span class="esign-todo">[TODO lawyer]</span>',
      nameEmployer: 'Contact person',
      companyEmployer: 'Company / institution',
      roleTitleEmployer: 'Role',
      submitEmployer: 'Accept the offer, non-binding',
      clauseAckTitle: 'Confirmation',
      clauseAckHint: 'Notice: Without these confirmations, submission remains locked. The draft is in the previous step.',
      lawSignatureCandidate: 'I confirm that I have read clauses 1–11 and that I have received the withdrawal notice (clause 7). The displayed period is 12 months and 14 days, a voluntary extension. The notice names the ordinary 14 days under § 355 (2) BGB. The typed signature and the timestamp confirm this text.',
      lawSignatureEmployer: 'I confirm that I have read clauses 1–9 and agree to them. The typed signature and the timestamp confirm this text.',
      lawSignatureFamily: 'I confirm that I have read the draft. The declaration is not legally binding. No exclusivity. No employee leasing under the AÜG.',
      clauseErr: 'Please give this confirmation.',
      loginOptional: 'Notice: This confirmation is voluntary. Submission is possible without it.',
      blockAddress: 'Address',
      blockSign: 'Signature',
      blockDate: 'Date',
      blockCompany: 'Company',
      blockRole: 'Role',
      signPlaceholder: 'Appears with the entry.',
      datePending: 'Recorded when the declaration is captured.',
      panelTitle: 'Particulars and signature',
      name: 'Full name',
      company: 'Company',
      roleTitle: 'Function',
      street: 'Street and number',
      postal: 'Postal code',
      city: 'City',
      country: 'Country',
      emailLabel: 'Email',
      phone: 'Telephone (voluntary)',
      lawTitle: 'Legal confirmation',
      lawHint: 'Notice: Every confirmation is required. Otherwise submission remains locked.',
      law_provisional: 'I confirm: this is a provisional statement of interest. It is not a legally binding placement contract until trade registration and legal review are complete.',
      law_vermittlung: 'I confirm: this is placement only. No employee leasing without a permit.',
      law_visa: 'I confirm: there is no visa undertaking and no legal advice.',
      law_privacy: 'I have read the <a href="einwilligung.html" target="_blank" rel="noopener">consent notice</a> and the <a href="datenschutz.html" target="_blank" rel="noopener">privacy notice</a>.',
      law_signature: 'I confirm that I have read the text on this page. The typed signature and the timestamp confirm this text.',
      lawErr: 'Please give this confirmation.',
      copyNotice: 'A copy goes to the signer. MEDA Vermittlung receives copies at AgentMail and at Outlook.',
      signerCopy: 'Send a copy to my email address. Selected by default. Not to the other party.',
      signerCopyHint: 'Selected by default. When sending is unlocked, the copy goes to this address. MEDA also receives copies at meda-vermittlung@agentmail.to and MEDA-team@outlook.com. This preview sends no email.',
      copiesKicker: 'Copies',
      copySignerLabel: 'Signer',
      copyMedaAgent: 'MEDA · AgentMail',
      copyMedaOutlook: 'MEDA · Outlook',
      copyPreviewExplain: 'This capture did not send email. When sending is unlocked, the signer receives a copy, and MEDA receives copies at meda-vermittlung@agentmail.to and MEDA-team@outlook.com.',
      copyLiveSent: 'A copy goes to the signer’s email. MEDA receives copies at meda-vermittlung@agentmail.to and MEDA-team@outlook.com.',
      copySignerQueued: 'Queued · {email}',
      copySignerOff: 'Not requested',
      sealPack: 'Pack',
      sealHash: 'Hash',
      sealWhen: 'Time',
      sealDevice: 'Device',
      liveSealKicker: 'Record',
      sessionKicker: 'Your offer',
      sessionTitle: 'This offer',
      eUiDraftKicker: 'DRAFT',
      eUiDraftBanner: 'Non-binding · binding: false',
      eUiDraftNote: 'Not yet cleared by counsel. Not legal advice.',
      eUiIntro: 'Review the offer and confirm it in three points. The full draft is in the next step.',
      eUiStep1: 'Offer',
      eUiStep2: 'Draft',
      eUiStep3: 'Acceptance',
      eUiStep4: 'Signature',
      eUiStep5: 'Done',
      eUiAckTitle: 'Acceptance',
      eUiAckHint: 'Please tick all three points.',
      eUiLock: 'Sending stays locked until this draft is cleared.',
      eUiFooter: 'DRAFT · non-binding · copy to you and to MEDA',
      eUiReview: 'Your acceptance',
      eUiCopy: 'You receive a copy. MEDA receives a copy.',
      eUiSigner: 'Copy to my email',
      eUiSignerHint: 'Selected by default. When unlocked, copies also go to meda-vermittlung@agentmail.to and MEDA-team@outlook.com. This preview sends no email.',
      eUiPreview: 'Preview: nothing is stored and no email is sent.',
      eUiSummary: 'Read the draft',
      download: 'Save copy',
      print: 'Print or save as PDF',
      successCopy: 'The signer receives a copy. MEDA receives copies at meda-vermittlung@agentmail.to and MEDA-team@outlook.com.',
      successSignerMail: 'Your copy is queued for this email address. MEDA receives copies at meda-vermittlung@agentmail.to and MEDA-team@outlook.com. No message goes to the other party.',
      successNoSignerMail: 'An email copy to you was not requested. When sending is unlocked, MEDA still receives copies at meda-vermittlung@agentmail.to and MEDA-team@outlook.com.',
      receiptTitle: 'Copy of the declaration',
      clausesTitle: 'Confirmed draft',
      typed: 'Signature (name in block letters)',
      typedHint: 'Please enter the name exactly as in “Full name”.',
      typedOk: 'The signature corresponds to the name.',
      typedBad: 'The signature must correspond to the name.',
      draw: 'Draw the signature',
      drawHint: 'Please sign with a finger or a mouse. Required together with the typed name.',
      stepIntro: 'Notice',
      stepClauses: 'Draft',
      stepChecklist: 'Confirmation',
      stepSign: 'Signature',
      stepDone: 'Conclusion',
      stepOf: 'Step {n} of {m}',
      back: 'Back',
      continue: 'Continue',
      lockPending: 'Notice: Legal clearance is pending. Submission remains locked until this draft version is recorded.',
      dryRun: 'Show preview',
      dryHint: 'The preview stores nothing and sends no email.',
      capture: 'Record the declaration',
      captureHint: 'Submission stays locked. The recorded declaration is not legally binding and then opens the CV step.',
      successNotSent: 'Nothing was submitted. No email was sent. Submission stays locked until legal approval.',
      successCopyLocal: 'You may save or print the copy. MEDA Vermittlung has not yet received this declaration.',
      cvNext: 'Continue to the CV',
      serviceOfferNote: 'This declaration concerns the MEDA service. No single position is designated. Profiles come from abroad.',
      legalLangNote: 'Notice: The German draft is the governing text.',
      reviewTitle: 'Review before submission',
      drawnMissing: 'Please also sign on the signature field.',
      downloadMd: 'Copy as Markdown',
      downloadPdf: 'Copy as PDF',
      familySubmit: 'Submit the non-binding declaration',
      kickerFamily: 'Notice · Meda Family · Soft launch',
      leadFamily: 'Notice: Draft for legal review. Not legally binding until trade notification under § 14 GewO. No exclusivity. No employee leasing under the AÜG.',
      familyNote1: 'This document does not create a placement contract or a claim to remuneration. It serves as a non-binding declaration of interest.',
      familyNote2: 'Placement is carried out without discrimination under the AGG. Placement into training under § 296a SGB III is payable by the employer only. The remuneration remains <span class="esign-todo">[TODO lawyer] / [PLATZHALTER]</span>.',
      h1Family: 'Non-binding declaration of interest',
      pageTitleFamily: 'Declaration of interest, Meda Family — MEDA Vermittlung',
      docTitleFamily: 'Draft statement of interest',
      clear: 'Clear signature',
      next: 'Next required particular',
      submit: 'Submit declaration',
      sending: 'Submitting…',
      remaining: '{n} required particulars remaining',
      remainingOne: '1 required particular remaining',
      ready: 'The required particulars are complete.',
      previewNote: 'Preview: nothing is stored and no email is sent. When sending is unlocked, the signer receives a copy, and MEDA receives copies at meda-vermittlung@agentmail.to and MEDA-team@outlook.com.',
      name_full: 'Please state the given name and the surname.',
      too_short: 'Please complete this field.',
      email: 'Please state a valid email address.',
      noOtherParty: 'No message to the other party.',
      typed_empty: 'Please enter the name as the signature.',
      typed_mismatch: 'The signature must correspond to the name.',
      errSend: 'The submission did not take place. Please try again later or write to meda-vermittlung@agentmail.to.',
      successKicker: 'Recorded · not legally binding',
      successTitle: 'The declaration has been recorded',
      successBody: 'The declaration has been recorded. It is not a legally binding contract. This declaration gives rise to no fee and no payment obligation. The other party is not notified.',
      successPreview: 'Preview: no email was sent. When sending is unlocked, the signer receives a copy, and MEDA receives copies at meda-vermittlung@agentmail.to and MEDA-team@outlook.com.',
      auditTitle: 'Record of capture',
      auditWhen: 'Time',
      auditParty: 'Role',
      auditToken: 'Reference number',
      auditOffer: 'Offer reference',
      auditHash: 'Device record',
      auditBinding: 'Legal effect',
      auditBindingValue: 'No · soft launch · not legally binding',
      auditMail: 'Message to the other party',
      auditMailValue: 'No',
      drawnYes: 'Drawn signature: recorded',
      drawnNo: 'Drawn signature: not recorded',
      partyCandidate: 'Candidate',
      partyEmployer: 'Employer',
      partyFamily: 'Person stating interest',
      langMin: 'Language level of the offer reference: {level}',
      linkGap: 'Submission is possible once the link is complete and every required particular is present.'
    },
    fr: {
      skip: 'Aller au contenu',
      navEmployers: 'Pour les employeurs',
      navContact: 'Contact',
      footerNote: 'Mention · Projet soumis à examen juridique · Pas de conseil juridique · Copie uniquement à la personne déclarante et à MEDA Vermittlung',
      pageTitleCandidate: 'Inscription au service de placement — MEDA Vermittlung',
      pageTitleEmployer: 'Confirmer l’offre — MEDA Vermittlung',
      kickerCandidate: 'Mention · Projet soumis à examen juridique',
      kickerEmployer: 'Offre',
      h1Candidate: 'Inscription au service de placement MEDA',
      h1Employer: 'Confirmer l’offre',
      leadCandidate: 'Veuillez lire le projet. La déclaration n’est pas juridiquement contraignante. Les coordonnées ne sont transmises à un employeur qu’après examen par MEDA Vermittlung.',
      leadEmployer: 'L’établissement et le poste sont renseignés. La confirmation est sans engagement et ne crée aucun paiement.',
      stepReview: 'Examen',
      stepDetails: 'Mentions',
      stepSign: 'Signature',
      summaryDoc: 'Afficher le projet',
      badge: 'Projet · non juridiquement contraignant',
      draftBanner: 'Projet soumis à examen juridique',
      draftNote: 'Un avocat inscrit n’a pas approuvé ce texte. Ceci ne constitue pas un conseil juridique.',
      docTitleCandidate: 'Projet de déclaration d’intérêt et de consentement',
      docTitleEmployer: 'Offre',
      docKickerCandidate: 'Placement privé au sens des §§ 296–299 SGB III. Pas un service juridique au sens de la RDG. Gate d’accueil. Version soft-launch 0.14.',
      docKickerEmployer: 'MEDA Vermittlung / Meda Family. Ouvert uniquement via le lien individuel après l’appel. Version soft-launch 0.5.',
      docRoleCandidate: 'Votre rôle : candidat',
      docRoleEmployer: 'Votre rôle : employeur',
      metaToken: 'Numéro de référence',
      metaOffer: 'Référence de l’offre',
      unknownOffer: 'Cette indication est une référence d’offre. Aucun poste n’est désigné.',
      missingToken: 'Ce lien ne contient pas de numéro de référence. Veuillez utiliser le lien de votre inscription.',
      missingOffer: 'Ce lien ne contient pas de référence d’offre.',
      docIntroCandidate: 'Cette déclaration est remise avant la transmission. Elle comprend le consentement et la déclaration d’intérêt. Elle n’est pas encore un contrat de placement définitif.',
      docIntroEmployer: 'Projet non contraignant. Pas un mandat de placement juridiquement contraignant. Effet seulement après immatriculation et approbation par un avocat allemand. <span class="esign-todo">[TODO avocat]</span>',
      clauseAckTitle: 'Confirmation',
      clauseAckHint: 'Mention : sans ces confirmations, la transmission reste verrouillée. Le projet figure à l’étape précédente.',
      lawSignatureCandidate: 'Je confirme avoir lu les clauses 1 à 11 et avoir reçu l’information de rétractation (clause 7). Le délai affiché est de 12 mois et 14 jours, une prolongation volontaire. Le texte nomme le délai ordinaire de 14 jours selon le § 355 al. 2 BGB. La signature dactylographiée et l’horodatage confirment ce texte.',
      lawSignatureEmployer: 'Je confirme avoir lu les clauses 1 à 9 et y consentir. La signature dactylographiée et l’horodatage confirment ce texte.',
      clauseErr: 'Veuillez donner cette confirmation.',
      loginOptional: 'Mention : cette confirmation est facultative. La transmission est possible sans elle.',
      blockAddress: 'Adresse',
      blockSign: 'Signature',
      blockDate: 'Date',
      blockCompany: 'Entreprise',
      blockRole: 'Fonction',
      signPlaceholder: 'Apparaît avec la saisie.',
      datePending: 'Constatée lors de l’enregistrement.',
      panelTitle: 'Mentions et signature',
      name: 'Nom complet',
      company: 'Entreprise',
      roleTitle: 'Fonction',
      street: 'Rue et numéro',
      postal: 'Code postal',
      city: 'Ville',
      country: 'Pays',
      emailLabel: 'E-mail',
      phone: 'Téléphone (facultatif)',
      lawTitle: 'Confirmation juridique',
      lawHint: 'Mention : toutes les confirmations sont requises. À défaut, la transmission reste verrouillée.',
      law_provisional: 'Je confirme : il s’agit d’une déclaration d’intérêt provisoire. Il n’existe pas encore de contrat de placement juridiquement contraignant tant que l’immatriculation et l’examen juridique ne sont pas achevés.',
      law_vermittlung: 'Je confirme : il s’agit uniquement de placement de personnel. Pas de prêt de main-d’œuvre sans autorisation.',
      law_visa: 'Je confirme : il n’y a ni engagement de visa ni conseil juridique.',
      law_privacy: 'J’ai lu le <a href="einwilligung.html" target="_blank" rel="noopener">consentement</a> et les <a href="datenschutz.html" target="_blank" rel="noopener">informations sur les données</a>.',
      law_signature: 'Je confirme avoir lu le texte de cette page. La signature dactylographiée et l’horodatage confirment ce texte.',
      lawErr: 'Veuillez donner cette confirmation.',
      copyNotice: 'Une copie va à la personne signataire. MEDA Vermittlung reçoit des copies sur AgentMail et sur Outlook.',
      signerCopy: 'Copie à mon adresse e-mail. Présélectionné. Pas à l’autre partie.',
      signerCopyHint: 'Présélectionné. Après déverrouillage, la copie part à cette adresse. MEDA reçoit aussi des copies à meda-vermittlung@agentmail.to et MEDA-team@outlook.com. Cet aperçu n’envoie aucun e-mail.',
      copiesKicker: 'Copies',
      copySignerLabel: 'Signataire',
      copyMedaAgent: 'MEDA · AgentMail',
      copyMedaOutlook: 'MEDA · Outlook',
      copyPreviewExplain: 'Cet enregistrement n’a envoyé aucun e-mail. Après déverrouillage, la personne signataire reçoit une copie, et MEDA reçoit des copies à meda-vermittlung@agentmail.to et MEDA-team@outlook.com.',
      copyLiveSent: 'Une copie part vers l’e-mail de la personne signataire. MEDA reçoit des copies à meda-vermittlung@agentmail.to et MEDA-team@outlook.com.',
      copySignerQueued: 'Prévu · {email}',
      copySignerOff: 'Non demandé',
      sealPack: 'Pack',
      sealHash: 'Hash',
      sealWhen: 'Heure',
      sealDevice: 'Appareil',
      liveSealKicker: 'Preuve',
      sessionKicker: 'Votre offre',
      sessionTitle: 'Cette offre',
      eUiDraftKicker: 'PROJET',
      eUiDraftBanner: 'Sans engagement · binding: false',
      eUiDraftNote: 'Pas encore validé par un avocat. Pas un conseil juridique.',
      eUiIntro: 'Vérifiez l’offre et confirmez-la en trois points. Le projet complet est à l’étape suivante.',
      eUiStep1: 'Offre',
      eUiStep2: 'Projet',
      eUiStep3: 'Acceptation',
      eUiStep4: 'Signature',
      eUiStep5: 'Terminé',
      eUiAckTitle: 'Acceptation',
      eUiAckHint: 'Veuillez cocher les trois points.',
      eUiLock: 'L’envoi reste verrouillé tant que ce projet n’est pas validé.',
      eUiFooter: 'PROJET · sans engagement · copie pour vous et pour MEDA',
      eUiReview: 'Votre acceptation',
      eUiCopy: 'Vous recevez une copie. MEDA reçoit une copie.',
      eUiSigner: 'Copie à mon e-mail',
      eUiSignerHint: 'Présélectionné. Après déverrouillage, des copies partent aussi à meda-vermittlung@agentmail.to et MEDA-team@outlook.com. Cet aperçu n’envoie aucun e-mail.',
      eUiPreview: 'Aperçu : rien n’est enregistré et aucun e-mail n’est envoyé.',
      eUiSummary: 'Lire le projet',
      download: 'Enregistrer la copie',
      print: 'Imprimer ou enregistrer en PDF',
      successCopy: 'La personne signataire reçoit une copie. MEDA reçoit des copies à meda-vermittlung@agentmail.to et MEDA-team@outlook.com.',
      successSignerMail: 'Votre copie est prévue pour cette adresse. MEDA reçoit des copies à meda-vermittlung@agentmail.to et MEDA-team@outlook.com. Aucun message ne part vers l’autre partie.',
      successNoSignerMail: 'Une copie par e-mail ne vous est pas demandée. Après déverrouillage, MEDA reçoit quand même des copies à meda-vermittlung@agentmail.to et MEDA-team@outlook.com.',
      receiptTitle: 'Copie de la déclaration',
      clausesTitle: 'Projet confirmé',
      typed: 'Signature (nom en caractères d’imprimerie)',
      typedHint: 'Veuillez indiquer le nom exactement comme dans « Nom complet ».',
      typedOk: 'La signature correspond au nom.',
      typedBad: 'La signature doit correspondre au nom.',
      draw: 'Apposer la signature',
      drawHint: 'Veuillez signer au doigt ou à la souris. Requis avec le nom dactylographié.',
      clear: 'Effacer la signature',
      next: 'Mention obligatoire suivante',
      submit: 'Transmettre la déclaration',
      submitEmployer: 'Accepter l’offre, sans engagement',
      nameEmployer: 'Interlocuteur',
      companyEmployer: 'Entreprise / établissement',
      roleTitleEmployer: 'Poste',
      sending: 'Transmission…',
      remaining: 'Encore {n} mentions obligatoires',
      remainingOne: 'Encore 1 mention obligatoire',
      ready: 'Les mentions obligatoires sont complètes.',
      previewNote: 'Aperçu : rien n’est enregistré et aucun e-mail n’est envoyé. Après déverrouillage, la personne signataire reçoit une copie, et MEDA reçoit des copies à meda-vermittlung@agentmail.to et MEDA-team@outlook.com.',
      name_full: 'Veuillez indiquer le prénom et le nom.',
      too_short: 'Veuillez remplir ce champ.',
      email: 'Veuillez indiquer une adresse e-mail valide.',
      noOtherParty: 'Aucun message à l’autre partie.',
      typed_empty: 'Veuillez indiquer le nom comme signature.',
      typed_mismatch: 'La signature doit correspondre au nom.',
      errSend: 'La transmission n’a pas eu lieu. Veuillez réessayer plus tard ou écrire à meda-vermittlung@agentmail.to.',
      successKicker: 'Enregistrée · non juridiquement contraignante',
      successTitle: 'La déclaration a été enregistrée',
      successBody: 'La déclaration a été enregistrée. Elle ne constitue pas un contrat juridiquement contraignant. Cette déclaration ne donne lieu à aucune rémunération ni à aucune obligation de paiement. L’autre partie n’est pas avisée.',
      successPreview: 'Aperçu : aucun e-mail n’a été envoyé. Après déverrouillage, la personne signataire reçoit une copie, et MEDA reçoit des copies à meda-vermittlung@agentmail.to et MEDA-team@outlook.com.',
      auditTitle: 'Preuve de l’enregistrement',
      auditWhen: 'Date et heure',
      auditParty: 'Rôle',
      auditToken: 'Numéro de référence',
      auditOffer: 'Référence de l’offre',
      auditHash: 'Mention relative à l’appareil',
      auditBinding: 'Force obligatoire',
      auditBindingValue: 'Non · soft launch · non juridiquement contraignant',
      auditMail: 'Message à l’autre partie',
      auditMailValue: 'Non',
      drawnYes: 'Signature dessinée : enregistrée',
      drawnNo: 'Signature dessinée : non enregistrée',
      partyCandidate: 'Candidat',
      partyEmployer: 'Employeur',
      langMin: 'Niveau de langue de la référence d’offre : {level}',
      linkGap: 'La transmission est possible lorsque le lien est complet et que toutes les mentions obligatoires sont réunies.'
    },
    ar: {
      skip: 'إلى المحتوى',
      navEmployers: 'لأصحاب العمل',
      navContact: 'اتصال',
      footerNote: 'تنبيه · مسودة للمراجعة القانونية · ليست استشارة قانونية · نسخة للشخص المُصرِّح وMEDA Vermittlung فقط',
      pageTitleCandidate: 'التسجيل في خدمة الوساطة — MEDA Vermittlung',
      pageTitleEmployer: 'تأكيد العرض — MEDA Vermittlung',
      kickerCandidate: 'تنبيه · مسودة للمراجعة القانونية',
      kickerEmployer: 'العرض',
      h1Candidate: 'التسجيل في خدمة الوساطة لدى MEDA',
      h1Employer: 'تأكيد العرض',
      leadCandidate: 'يُرجى قراءة المسودة. الإقرار غير ملزم قانوناً. لا تُحال بيانات الاتصال إلى صاحب عمل إلا بعد مراجعة MEDA Vermittlung.',
      leadEmployer: 'الجهة والوظيفة معبّأتان. التأكيد غير ملزم ولا ينشئ أي دفع.',
      stepReview: 'مراجعة',
      stepDetails: 'البيانات',
      stepSign: 'التوقيع',
      summaryDoc: 'عرض المسودة',
      badge: 'مسودة · غير ملزمة قانوناً',
      draftBanner: 'مسودة للمراجعة القانونية',
      draftNote: 'لم يعتمد محامٍ مرخّص هذا النص. هذا ليس استشارة قانونية.',
      docTitleCandidate: 'مسودة إقرار بالاهتمام والموافقة',
      docTitleEmployer: 'العرض',
      docKickerCandidate: 'وساطة خاصة وفق §§ 296–299 SGB III. ليست خدمة قانونية وفق RDG. بوابة الصفحة الرئيسية. الإصدار 0.14.',
      docKickerEmployer: 'MEDA Vermittlung / Meda Family. يُفتح فقط من الرابط الفردي بعد الاتصال. الإصدار 0.5.',
      docRoleCandidate: 'الدور: مرشح',
      docRoleEmployer: 'الدور: صاحب عمل',
      metaToken: 'الرقم المرجعي',
      metaOffer: 'مرجع العرض',
      unknownOffer: 'هذا البيان مرجع عرض. لا يُعيَّن منصب.',
      missingToken: 'لا يتضمن هذا الرابط رقماً مرجعياً. يُرجى استخدام الرابط من التسجيل.',
      missingOffer: 'لا يتضمن هذا الرابط مرجع عرض.',
      docIntroCandidate: 'يُقدَّم هذا الإقرار قبل الإرسال. ويشمل الموافقة وإبداء الاهتمام. وهو ليس بعد عقد وساطة نهائياً.',
      docIntroEmployer: 'مسودة غير ملزمة. ليست تكليف وساطة ملزماً قانوناً. يسري الأثر بعد التسجيل التجاري وموافقة محامٍ ألماني. <span class="esign-todo">[TODO محامٍ]</span>',
      clauseAckTitle: 'تأكيد',
      clauseAckHint: 'تنبيه: من دون هذه التأكيدات يبقى الإرسال مقفلاً. المسودة في الخطوة السابقة.',
      lawSignatureCandidate: 'أؤكد أنني قرأت البنود 1–11 وأنني استلمت تعليمات العدول (البند 7). المدة المعروضة 12 شهراً و14 يوماً، تمديد طوعي. وينص النص على المدة العادية من 14 يوماً وفق § 355 Abs. 2 BGB. التوقيع المكتوب والوقت يؤكدان هذا النص.',
      lawSignatureEmployer: 'أؤكد أنني قرأت البنود 1–9 وأوافق عليها. التوقيع المكتوب والوقت يؤكدان هذا النص.',
      clauseErr: 'يُرجى إعطاء هذا التأكيد.',
      loginOptional: 'تنبيه: هذا التأكيد اختياري. الإرسال ممكن من دونه.',
      blockAddress: 'العنوان',
      blockSign: 'التوقيع',
      blockDate: 'التاريخ',
      blockCompany: 'الشركة',
      blockRole: 'الوظيفة',
      signPlaceholder: 'يظهر مع الإدخال.',
      datePending: 'يُثبَّت عند التسجيل.',
      panelTitle: 'البيانات والتوقيع',
      name: 'الاسم الكامل',
      company: 'الشركة',
      roleTitle: 'الوظيفة',
      street: 'الشارع ورقم المبنى',
      postal: 'الرمز البريدي',
      city: 'المدينة',
      country: 'البلد',
      emailLabel: 'البريد الإلكتروني',
      phone: 'الهاتف (اختياري)',
      lawTitle: 'تأكيد قانوني',
      lawHint: 'تنبيه: كل التأكيدات مطلوبة. وإلا يبقى الإرسال مقفلاً.',
      law_provisional: 'أؤكد: هذا إقرار مبدئي بإبداء الاهتمام. ليس عقد وساطة ملزماً قانوناً إلى أن يكتمل تسجيل النشاط والمراجعة القانونية.',
      law_vermittlung: 'أؤكد: وساطة توظيف فقط. لا إعارة عمال من دون ترخيص.',
      law_visa: 'أؤكد: لا تعهد بتأشيرة ولا استشارة قانونية.',
      law_privacy: 'لقد قرأت <a href="einwilligung.html" target="_blank" rel="noopener">الموافقة</a> و<a href="datenschutz.html" target="_blank" rel="noopener">حماية البيانات</a>.',
      law_signature: 'أؤكد أنني قرأت نص هذه الصفحة. التوقيع المكتوب والوقت يؤكدان هذا النص.',
      lawErr: 'يُرجى إعطاء هذا التأكيد.',
      copyNotice: 'تصل نسخة إلى الموقّع. وتتلقى MEDA Vermittlung نسختين عبر AgentMail وOutlook.',
      signerCopy: 'نسخة إلى بريدي. محدد مسبقاً. ليس إلى الطرف الآخر.',
      signerCopyHint: 'محدد مسبقاً. عند فتح الإرسال تذهب النسخة إلى هذا العنوان. وتتلقى MEDA أيضاً نسختين على meda-vermittlung@agentmail.to وMEDA-team@outlook.com. هذه المعاينة لا ترسل بريداً.',
      copiesKicker: 'النسخ',
      copySignerLabel: 'الموقّع',
      copyMedaAgent: 'MEDA · AgentMail',
      copyMedaOutlook: 'MEDA · Outlook',
      copyPreviewExplain: 'هذا التسجيل لم يرسل بريداً. عند فتح الإرسال يتلقى الموقّع نسخة، وتتلقى MEDA نسختين على meda-vermittlung@agentmail.to وMEDA-team@outlook.com.',
      copyLiveSent: 'تذهب نسخة إلى بريد الموقّع. وتتلقى MEDA نسختين على meda-vermittlung@agentmail.to وMEDA-team@outlook.com.',
      copySignerQueued: 'مجدول · {email}',
      copySignerOff: 'غير مطلوب',
      sealPack: 'الحزمة',
      sealHash: 'البصمة',
      sealWhen: 'الوقت',
      sealDevice: 'الجهاز',
      liveSealKicker: 'الإثبات',
      sessionKicker: 'عرضكم',
      sessionTitle: 'هذا العرض',
      eUiDraftKicker: 'مسودة',
      eUiDraftBanner: 'غير ملزم · binding: false',
      eUiDraftNote: 'لم تُعتمد بعد من محامٍ. ليست استشارة قانونية.',
      eUiIntro: 'راجعوا العرض وأكّدوه في ثلاث نقاط. النص الكامل في الخطوة التالية.',
      eUiStep1: 'العرض',
      eUiStep2: 'المسودة',
      eUiStep3: 'القبول',
      eUiStep4: 'التوقيع',
      eUiStep5: 'تم',
      eUiAckTitle: 'القبول',
      eUiAckHint: 'يرجى تعليم النقاط الثلاث.',
      eUiLock: 'يبقى الإرسال مقفلاً إلى أن تُعتمد هذه المسودة.',
      eUiFooter: 'مسودة · غير ملزم · نسخة لكم ولـ MEDA',
      eUiReview: 'قبولكم',
      eUiCopy: 'تصلكم نسخة. وتصلك MEDA نسخة.',
      eUiSigner: 'نسخة إلى بريدي',
      eUiSignerHint: 'محدد مسبقاً. عند الفتح تذهب نسخ أيضاً إلى meda-vermittlung@agentmail.to وMEDA-team@outlook.com. هذه المعاينة لا ترسل بريداً.',
      eUiPreview: 'معاينة: لا يُحفظ شيء ولا يُرسَل بريد.',
      eUiSummary: 'قراءة المسودة',
      download: 'حفظ النسخة',
      print: 'طباعة أو حفظ PDF',
      successCopy: 'يتلقى الموقّع نسخة. وتتلقى MEDA نسختين على meda-vermittlung@agentmail.to وMEDA-team@outlook.com.',
      successSignerMail: 'نسختكم مجدولة لهذا العنوان. وتتلقى MEDA نسختين على meda-vermittlung@agentmail.to وMEDA-team@outlook.com. لا تذهب رسالة إلى الطرف الآخر.',
      successNoSignerMail: 'لم تُطلب نسخة بالبريد إليكم. عند فتح الإرسال تتلقى MEDA نسختين على meda-vermittlung@agentmail.to وMEDA-team@outlook.com.',
      receiptTitle: 'نسخة من الإقرار',
      clausesTitle: 'المسودة المؤكَّدة',
      typed: 'التوقيع (الاسم بحروف واضحة)',
      typedHint: 'يُرجى إدخال الاسم كما في حقل «الاسم الكامل».',
      typedOk: 'التوقيع يطابق الاسم.',
      typedBad: 'يجب أن يطابق التوقيع الاسم.',
      draw: 'تثبيت التوقيع',
      drawHint: 'يُرجى التوقيع بالإصبع أو بالفأرة. مطلوب مع الاسم المكتوب.',
      clear: 'مسح التوقيع',
      next: 'البيان الإلزامي التالي',
      submit: 'إرسال الإقرار',
      submitEmployer: 'قبول العرض دون التزام',
      nameEmployer: 'جهة الاتصال',
      companyEmployer: 'الشركة / المنشأة',
      roleTitleEmployer: 'الوظيفة',
      sending: 'جارٍ الإرسال…',
      remaining: 'تبقّى {n} بيانات إلزامية',
      remainingOne: 'تبقّى بيان إلزامي واحد',
      ready: 'البيانات الإلزامية مكتملة.',
      previewNote: 'معاينة: لا يُحفظ شيء ولا يُرسَل بريد. عند فتح الإرسال يتلقى الموقّع نسخة، وتتلقى MEDA نسختين على meda-vermittlung@agentmail.to وMEDA-team@outlook.com.',
      name_full: 'يُرجى إدخال الاسم واللقب.',
      too_short: 'يُرجى تعبئة هذا الحقل.',
      email: 'يُرجى إدخال عنوان بريد صالح.',
      noOtherParty: 'لا رسالة إلى الطرف الآخر.',
      typed_empty: 'يُرجى إدخال الاسم كتوقيع.',
      typed_mismatch: 'يجب أن يطابق التوقيع الاسم.',
      errSend: 'لم يتم الإرسال. يُرجى المحاولة لاحقاً أو الكتابة إلى meda-vermittlung@agentmail.to.',
      successKicker: 'مُسجَّل · غير ملزم قانوناً',
      successTitle: 'تم تسجيل الإقرار',
      successBody: 'تم تسجيل الإقرار. وهو ليس عقداً ملزماً قانوناً. لا ينشأ عن هذا الإقرار أجر ولا التزام بالدفع. لا يُخطَر الطرف الآخر.',
      successPreview: 'معاينة: لم يُرسَل بريد. عند فتح الإرسال يتلقى الموقّع نسخة، وتتلقى MEDA نسختين على meda-vermittlung@agentmail.to وMEDA-team@outlook.com.',
      auditTitle: 'إثبات التسجيل',
      auditWhen: 'الوقت',
      auditParty: 'الدور',
      auditToken: 'الرقم المرجعي',
      auditOffer: 'مرجع العرض',
      auditHash: 'بيان الجهاز',
      auditBinding: 'القوة الملزمة',
      auditBindingValue: 'لا · إطلاق تدريجي · غير ملزم قانوناً',
      auditMail: 'رسالة إلى الطرف الآخر',
      auditMailValue: 'لا',
      drawnYes: 'توقيع مرسوم: مُسجَّل',
      drawnNo: 'توقيع مرسوم: غير مُسجَّل',
      partyCandidate: 'مرشح',
      partyEmployer: 'صاحب عمل',
      langMin: 'مستوى اللغة في مرجع العرض: {level}',
      linkGap: 'يُتاح الإرسال عندما يكتمل الرابط وتكتمل كل البيانات الإلزامية.'
    }
  };

  COPY.de.eAckScope = 'Ich bestätige dieses Angebot und möchte passende Kandidaten erhalten. Es besteht keine Einstellungspflicht und keine Ausschließlichkeit. MEDA vermittelt direkt, ohne Arbeitnehmerüberlassung.';
  COPY.de.eAckConduct = 'Bewerberdaten bleiben vertraulich. Der Kontakt zu vorgestellten Kandidaten läuft über MEDA. Eine Vergütung entsteht nur bei erfolgreicher Vermittlung und wird separat berechnet. MEDA führt kein Gütesiegel.';
  COPY.de.eAckStatus = 'Ich habe den Entwurf gelesen. Die Annahme ist unverbindlich (Bindung: false). Für Unternehmen besteht kein Widerrufsrecht im Fernabsatz.';
  COPY.de.cAckShare = [COPY.de.cAck1, COPY.de.cAckUpload].join(' ');
  COPY.de.cAckTerms = [COPY.de.cAckWithdraw, COPY.de.cAck3, COPY.de.cAckTraining, COPY.de.cAck5].join(' ');
  COPY.de.cAckSign = [COPY.de.cAckFair, COPY.de.lawSignatureCandidate].join(' ');
  COPY.de.fAckClose = [COPY.de.fAckNonfee, COPY.de.lawSignatureFamily].join(' ');

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
    var flowCv = role === 'candidate' && params.get('flow') === 'cv';
    if (flowCv && window.MEDA_ESIGN_GATE && !RULES.publicTokenOk('candidate', token)) {
      token = window.MEDA_ESIGN_GATE.issueCandidateToken();
      try {
        var nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('token', token);
        nextUrl.searchParams.set('flow', 'cv');
        history.replaceState(null, '', nextUrl.pathname + nextUrl.search);
      } catch (e2) { /* keep issued token in memory */ }
    }
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
    function takeParam(key) {
      var value = String(params.get(key) || '').trim();
      return value.length > 180 ? '' : value;
    }
    function prefill(id, value) {
      var el = document.getElementById(id);
      if (el && !String(el.value || '').trim() && value) el.value = value;
    }
    if (role === 'employer') {
      prefill('f-company', takeParam('company'));
      prefill('f-name', takeParam('name'));
      prefill('f-role', takeParam('role'));
      prefill('f-city', takeParam('city'));
      prefill('f-street', takeParam('street'));
      prefill('f-postal', takeParam('postal'));
      prefill('f-country', takeParam('country'));
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
        service_flow: flowCv,
        employer_sign_url: ''
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
      if (role === 'employer') {
        function place(id, value, placeholder) {
          var node = document.getElementById(id);
          if (!node) return;
          var shown = String(value || '').trim();
          node.textContent = shown || placeholder;
        }
        place('ph-offer', offerId, '[PLATZHALTER Angebot-ID]');
        place('ph-offer-date', takeParam('offer_date'), '[PLATZHALTER Datum]');
        place('ph-company', data.company, '[PLATZHALTER Einrichtung]');
        place('ph-name', data.name, '[PLATZHALTER Ansprechpartner]');
        place('ph-role', data.role_title, '[PLATZHALTER Stelle / Profil-Referenz]');
        place('ph-valid', takeParam('valid'), '[PLATZHALTER Gültigkeit]');
      }
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
        else if (flowCv && !offerId) note.textContent = text('serviceOfferNote');
        else if (!offerId) note.textContent = text('missingOffer');
        else if (!found) note.textContent = text('unknownOffer');
        else note.textContent = '';
      }
      var warn = document.getElementById('link-warn');
      if (warn) {
        var bits = [];
        if (role !== 'family' && !state.tokenOk) bits.push(text('missingToken'));
        if (role !== 'family' && !state.offerOk && !flowCv) bits.push(text('missingOffer'));
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
      if (code === 'drawn') return text('drawnMissing');
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
      var captureBtn = document.getElementById('esign-capture');
      if (captureBtn) {
        captureBtn.hidden = !flowCv || currentStep !== 4 || !!finishedSnapshot;
        captureBtn.disabled = !(flowCv && state.ok && currentStep === 4 && !busy);
      }
      var captureHint = document.getElementById('esign-capture-hint');
      if (captureHint) captureHint.hidden = !flowCv || currentStep !== 4 || !!finishedSnapshot;
      if (lockEl) {
        lockEl.hidden = currentStep !== 4 || !!finishedSnapshot;
        lockEl.textContent = locked ? text('ready') : text(role === 'employer' ? 'eUiLock' : 'lockPending');
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
      paintLiveSeal(data);
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
        RULES.clauseKeysFor(role).concat(RULES.LAW_KEYS).forEach(function (key) {
          var li = document.createElement('li');
          li.className = data[key] ? 'is-set' : 'is-open';
          li.textContent = plainText(ackKey(key));
          list.appendChild(li);
        });
      }
      if (img && canvas && pad.hasInk()) {
        img.hidden = false;
        img.src = canvas.toDataURL('image/png');
      } else if (img) img.hidden = true;
    }

    function ackKey(key) {
      if (key === 'clause_withdraw') return role === 'family' ? 'fAckWithdraw' : 'cAckTerms';
      var map = {
        clause_share: 'cAckShare',
        clause_scope: 'eAckScope',
        clause_conduct: 'eAckConduct',
        clause_privacy: 'fAck1',
        law_signature: role === 'employer' ? 'eAckStatus' : role === 'family' ? 'fAckClose' : 'cAckSign'
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
          'f-clause_withdraw': 'clause_withdraw',
          'f-clause_scope': 'clause_scope',
          'f-clause_conduct': 'clause_conduct',
          'f-clause_privacy': 'clause_privacy',
          'f-clause_login': 'clause_login'
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
            statusEl.textContent = text(role === 'employer' ? 'eUiLock' : 'lockPending');
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
    var captureBtn = document.getElementById('esign-capture');
    if (captureBtn) {
      captureBtn.addEventListener('click', function () {
        var state = RULES.validate(model());
        state.missing.forEach(function (key) { touched[key] = true; });
        if (!flowCv || !state.ok) {
          focusMissing(state);
          return;
        }
        finishLocal(false);
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
      if (party) party.textContent = text(role === 'employer' ? 'partyEmployer' : role === 'family' ? 'partyFamily' : 'partyCandidate');
      var shownId = RULES.publicTokenOk(role, token) ? token : '';
      if (tok) tok.textContent = shownId;
      var hero = document.getElementById('success-ref');
      if (hero) hero.hidden = !shownId;
      if (off) off.textContent = offerId;
      if (hash) hash.textContent = shortHash(snapshot.user_agent_hash);
      if (drawn) drawn.textContent = snapshot.has_drawn_signature ? text('drawnYes') : text('drawnNo');
      var held = !!snapshot.preview || flowCv;
      if (previewLine) {
        previewLine.hidden = !held;
        if (held) previewLine.textContent = text('copyPreviewExplain');
      }
      paintCopies(snapshot, formatted);
      var cvContinue = document.getElementById('esign-cv-continue');
      var cvNext = document.getElementById('esign-cv-next');
      if (flowCv && snapshot.candidate_token && window.MEDA_ESIGN_GATE) {
        window.MEDA_ESIGN_GATE.write({
          token: snapshot.candidate_token,
          pack_id: snapshot.pack_id,
          signed_at: snapshot.signed_at
        });
        if (cvNext) cvNext.href = 'bewerben.html?token=' + encodeURIComponent(snapshot.candidate_token);
        if (cvContinue) cvContinue.hidden = false;
      }
      var signerLine = document.getElementById('success-signer-mail');
      if (signerLine) {
        signerLine.hidden = false;
        signerLine.textContent = snapshot.send_signer_copy ? text('successSignerMail') : text('successNoSignerMail');
      }
      if (scroll) {
        try { doneEl.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e2) { doneEl.scrollIntoView(); }
      }
    }

    function shortHash(value) {
      var hash = String(value || '');
      if (!hash) return '—';
      return hash.slice(0, 12) + (hash.length > 12 ? '…' : '');
    }

    function deviceLabel() {
      var ua = navigator.userAgent || '';
      if (/iPhone|iPad/.test(ua)) return 'iOS';
      if (/Android/.test(ua)) return 'Android';
      if (/Mobile/.test(ua)) return 'Mobil';
      return 'Desktop';
    }

    function setNode(id, value) {
      var node = document.getElementById(id);
      if (node) node.textContent = value;
    }

    function paintLiveSeal(data) {
      var shown = RULES.publicTokenOk(role, token) ? token : '—';
      setNode('live-token', shown);
      setNode('live-pack', RULES.PACK_IDS[role]);
      setNode('live-hash', packHash ? shortHash(packHash) : '…');
      if (role !== 'employer') return;
      var session = document.getElementById('esign-session');
      if (session) session.hidden = false;
      setNode('session-token', shown);
      setNode('session-offer', offerId || '—');
      setNode('session-company', (data && data.company) || '—');
      setNode('session-name', (data && data.name) || '—');
      setNode('session-role', (data && data.role_title) || '—');
      setNode('session-pack', RULES.PACK_IDS.employer);
    }

    function paintCopies(snapshot, formatted) {
      var signer = document.getElementById('copy-signer');
      var note = document.getElementById('copy-live-note');
      var email = String((snapshot && snapshot.email) || '').trim();
      if (signer) {
        signer.textContent = snapshot && snapshot.send_signer_copy && email
          ? text('copySignerQueued').replace('{email}', email)
          : text('copySignerOff');
      }
      var held = !snapshot || snapshot.preview || flowCv;
      if (note) note.textContent = held ? text('copyPreviewExplain') : text('copyLiveSent');
      setNode('seal-pack', (snapshot && snapshot.pack_id) || RULES.PACK_IDS[role]);
      setNode('seal-hash', shortHash(snapshot && snapshot.pack_hash));
      setNode('seal-when', formatted || '—');
      var deviceHash = shortHash(snapshot && snapshot.user_agent_hash);
      setNode('seal-device', deviceLabel() + (deviceHash !== '—' ? ' · ' + deviceHash : ''));
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
        emailLabel: text('emailLabel'),
        timeLabel: text('auditWhen'),
        formattedTime: formattedTime(finishedSnapshot),
        signatureLabel: text('blockSign'),
        hashLabel: text('auditHash'),
        clausesTitle: text('clausesTitle'),
        clauses: (role === 'employer'
          ? ['eSec0', 'eSec1', 'eSec2', 'eSec3', 'eSec4', 'eSec5', 'eSec6', 'eSec7', 'eSec8', 'eSec9']
          : role === 'family'
            ? ['fSec1', 'fSec2', 'fSec3', 'fSec4', 'fSec5', 'fSec6', 'fSec7', 'fSec8', 'fSec9']
            : ['cSec1', 'cSec2', 'cSec3', 'cSec4', 'cSec5', 'cSec6', 'cSec7', 'cSec8', 'cSec9', 'cSec10', 'cSec11', 'cSec12']).map(plainText),
        lawTitle: text('lawTitle'),
        laws: [plainText(role === 'employer' ? 'lawSignatureEmployer' : role === 'family' ? 'lawSignatureFamily' : 'lawSignatureCandidate')],
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
        ? ['eSec0', 'eSec1', 'eSec2', 'eSec3', 'eSec4', 'eSec5', 'eSec6', 'eSec7', 'eSec8', 'eSec9']
        : role === 'family'
          ? ['fSec1', 'fSec2', 'fSec3', 'fSec4', 'fSec5', 'fSec6', 'fSec7', 'fSec8', 'fSec9']
          : ['cSec1', 'cSec2', 'cSec3', 'cSec4', 'cSec5', 'cSec6', 'cSec7', 'cSec8', 'cSec9', 'cSec10', 'cSec11', 'cSec12'];
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
