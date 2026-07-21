# Medikation-eRezept-slice

RESTful backend for the medication/ePrescription project.

## Wichtig
Lea Feilberg steht zwar auf Miro als Gruppenmitglied, hat sich aber entschieden nicht an der Gruppe teilzunehmen. 
Dies wurde im privaten chat abgesprochen.

### Hinweis zur Gruppenarbeit
Nikita Schmidt und Nils Scharein haben dieses Repo gemeinsam erarbeitet und an einigen Stellen Co-Working und Pair-Programming betrieben.
Die Leistung verteilt sich somit auf etwa 50 / 50.

## Anforderungen an das Projekt und unsere Grundlagen

Damit man unseren Code versteht, müssen zuerst einige grundlegende Grundsteine gelegt werden.
Auf diesen Grundsteinen baut die gesamte Architektur des Services auf.

Notiz: Aus der Aufgabenstellung auf Miro ging lediglich hervor, dass eine Schmerzmedikation verordnet wird. 
Daher haben wir unseren Ablauf auf genau einen MedicationRequest ausgelegt. 
Die Architektur lässt sich jedoch problemlos erweitern, indem mehrere MedicationRequest-Ressourcen in einem gemeinsamen Transaction-Bundle übertragen werden. 
Aus Zeitgründen haben wir hier nur das Nötigste gemacht.

### 1. FHIR als einzige Source of Truth

Wir können uns an **keiner** Stelle im Prozess darauf verlassen, dass lokal gespeicherte Patientendaten aktuell sind.
Das ist uns recht früh aufgefallen, als wir die Abläufe durchgesprochen haben. 
In der Praxis kann es jederzeit dazu kommen, dass eine andere Praxis oder ein anderer Betreiber neue Daten für einen Patienten auf FHIR hinterlegt.
Wie gehen wir damit um?

Wir haben uns dazu entschieden, **FHIR als einzige Source of Truth** zu nehmen.
Lokal halten wir ausschließlich Referenzen auf FHIR-Ressourcen – niemals Kopien von Patientenstammdaten.
Dadurch sind wir gezwungen, die Daten auf FHIR aktuell zu halten und nur diesen zu vertrauen. Ein Abgleich veralteter lokaler Kopien entfällt.

### 2. Eigene IDs statt übernommener Ressourcen-IDs

Obwohl wir FHIR-Referenzen speichern, werden diese (mit außnahme zur patienten ID vom FHIR Server) 
**nicht für die interne Logik** verwendet, da wir nach folgendem Prinzip immer eigene IDs vergeben müssen:

> "Der Medication Service MUSS übermittelte id-Werte von Ressourcen im Rahmen einer Operation verwerfen und stattdessen eine neue ID vergeben, die im weiteren Verlauf der Operation verwendet wird." — [gematik: ePA Medication, General Principles](https://gemspec.gematik.de/ig/fhir/epa-medication/1.3.1/general-principles.html)

Das hat uns dazu bewegt, eine **eigene `Visit`-Schema-Klasse** zu erstellen, die alle relevanten Daten unter einer selbst vergebenen `visitId` (via `nanoid`) verknüpft.
Der `Visit` ist damit unser interner Anker. Die Patienten-FHIR-ID dient ausschließlich als technische Referenz zum FHIR-Server. Diese wird nicht von unseren eigenen Endpunkten als Input angenommen.

_Warum verwenden wir die Patient-FHIR-ID's überhaupt als technischen Lookup zum FHIR-Server?_
In der realen Welt ist die KV-Nummer unser Identifikationsmerkmal für die Patienten. In unserem
Fall prüft der Test-FHIR-Server nicht, ob eine KV-Nummer existiert, geschweige denn ob es 
Dopplungen gibt. Wir können uns also nicht auf die KV-Nummer verlassen, und verwenden daher
die Patienten-FHIR-ID, da diese unique ist!

### 3. Consent-gesteuerter Datenfluss (DSGVO)

Ergänzend haben wir die DSGVO zu den für unser Szenario relevanten Regelungen geprüft. Die lokale Speicherung der im Rahmen der Behandlung erhobenen Daten erfolgt **unabhängig von einer datenschutzrechtlichen Einwilligung**. Rechtsgrundlage hierfür sind insbesondere [**Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Behandlungsvertrags)**](https://dsgvo-gesetz.de/art-6-dsgvo/) sowie [**Art. 9 Abs. 2 lit. h DSGVO (Verarbeitung von Gesundheitsdaten zum Zweck der medizinischen Versorgung)**](https://dsgvo-gesetz.de/art-9-dsgvo/). Da Gesundheitsdaten einer besonderen Kategorie personenbezogener Daten angehören (Art. 9 DSGVO), haben wir uns im Projekt dafür entschieden, Anamnesedaten ausschließlich nach dokumentierter Einwilligung (Consent) an FHIR zu übertragen

Bei beiden Transactions werden seperat Consents von uns geführt im folgenden Stil:
* Bei `permit` wird das **Transaction-Bundle**  an FHIR gesendet und überschreibt einen anderen activen Consent, da dieser aktueller ist.
* Bei `deny` wird **nur** ein Bundle mit Consent-Ressource und Provenance geschrieben und an FHIR gesendet – keine medizinischen Daten.
Bei jeweils keiner Angabe wird nach vorhandenen aktiven Consents auf FHIR gesucht:
* Consent `permit` wie oben. Der Consent wird hier jedoch nicht nochmal seperat gesendet.
* Consent `deny` wie oben. Der Consent wird hier nicht jedoch nochmal seperat gesendet.
* Kein vorhanderer Consent -> Consent wurde nie gegeben, wird also als `deny` interpretiert und
an FHIR gesendet.

Dabei ist eins unserer Transaction das Anamnese-Bundle ( Condition (Vorerkrankungen) + MedicationStatement (Dauermedikamente) + Consent (DSGVO) + Provenance -> Alle referenzieren den Patienten über seine FHIR-ID),
und das Medication-Request-Bundle (Consent (DSGVO) + MedicationRequest + Provenance -> Alle referenzieren den Patienten über seine FHIR-ID).

### 4. Gesetzliche Aufbewahrungsfrist

Aus dem Behandlungsvertragsrecht (eng mit der DSGVO verzahnt) ergibt sich die zehnjährige Aufbewahrungspflicht:

> "Der Behandelnde hat die Patientenakte für die Dauer von zehn Jahren nach Abschluss der Behandlung aufzubewahren, soweit nicht nach anderen Vorschriften andere Aufbewahrungsfristen bestehen." — [§ 630f Abs. 3 BGB](https://www.gesetze-im-internet.de/bgb/__630f.html)

Umgesetzt haben wir das über einen Index in MongoDB: Visits löschen sich automatisch zehn Jahre nach ihrer Erstellung (`expireAfterSeconds` auf `createdAt`).

### 5. Nachvollziehbarkeit durch Audit-Trail

Jede API-Operation wird protokolliert (Akteur inkl. Rollen, Aktion, Ressourcentyp, betroffene Ressourcen- bzw. Patienten-Referenz, HTTP-Methode und Statuscode).
Das setzt den Gedanken der FHIR-`Provenance`/`AuditEvent`-Ressourcen ("wo kommen die Daten her, wer hat was getan?") auf Anwendungsebene um.
Wir haben uns an dieser Stelle dagegen entschieden die FHIR Audits zu verwenden, da wir lieber ein internes Audit haben wollten und das FHIR Audit keine Pflicht darstellt. 

### 6. Grenzen des Audits

Wir loggen ganze Vorgänge und nicht jede einzelne FHIR-Abfrage.
Uns interessiert: wann haben wir für welchen Patienten eine Anamnese gemacht
oder eine Medikation verordnet, wer war das, und hat es geklappt.
Jeder FHIR-Request einzeln im Log hätte den Trail nur vollgemüllt und uns
für diese Frage nichts gebracht. Alles, was zu einem Vorgang gehört, hängt
über die `transactionId` zusammen. (In unserem Fall ist aber jede Transaktion
einzeln machbar, weshalb diese IDs immer unterschiedlich sind.)

Limitationen des bestehenden Systems:

Sollte das Schreiben des Audits fehlschlagen, lassen wir den Request trotzdem
weiterlaufen. Das haben wir bewusst so gewählt, um Serviceausfälle in vollen
Praxen zu vermeiden.

In der Realität würde man an dieser Stelle z. B. eine RabbitMQ-Queue
dazwischenwerfen, damit die Audit-DB "egal" wird (Fire and Forget).

Wir haben die Audit-DB gegen Änderungen aus dem Code abgesichert.
Natürlich würde man in der Praxis die Datenbank zusätzlich von außen über
Schreibrechte absichern. In unserem Fall wäre das aber Overkill.

### 7. Pseudonymisierung der KV-Nummer und Patient-Internal-Identifier

Vorab, wir haben uns an dem Grundsatz entlangehangelt das ein Patient im Notfall (oder 
durch Umstände) keine KV-Nummer zum gegebenen Zeitpunkt des Besuchs hat. Daher muss er 
vorerst im System und auf FHIR mit einer Übergangs-ID des Systems hinterlegt werden, um später die 
Möglichkeit zu haben, seine Krankenversicherung Nachzureichen. Diese setzten wir innerhalb des `Visit` mit der `patientInternalIdentifier` um.

Bei Grundsatz 1 ist uns aufgefallen, dass wir uns an einer Stelle selbst widersprechen: Die KV-Nummer und Patient-Internal-Identifier stand bei uns im Klartext in der Datenbank, obwohl sie ein direkt identifizierendes Merkmal sind.

Gespeichert wird deshalb die KV und der Patient-Internal-Identifier nur noch als Hash. Gehasht wird erst direkt vor dem Schreiben in die Datenbank (`util/dbHelpers.js`).

Wir benutzen **HMAC-SHA256**. Dabei fließt zusätzlich ein geheimer Schlüssel in den Hash ein, der sogenannte Pepper (in `kv.hash`).
Der liegt als Datei beim Code und nicht in der Datenbank. Ohne ihn kann man die Hashes gar nicht erst nachbauen, das Durchprobieren bringt also nichts mehr.

### 8. Der Visit als Zustandsautomat

Ein `Visit` bildet bei uns den logischen Ablauf in einer Arztpraxis ab:
Patient wird aufgenommen, Anamnese wird erhoben, Medikation wird verordnet.
Das passt gut zu einer Dokumentendatenbank wie MongoDB, weil man dort Daten,
die fachlich zusammengehören, ohnehin in einem Dokument bündelt statt sie über
mehrere Tabellen zu verteilen. Alles zu einer Behandlung liegt damit an einer
Stelle.

Daraus wurde ein fester Ablauf: `started` → `amnesisIsCompleted` → `completed`
(`constants/fhirConstants.js`). Daran hängen zwei Regeln.

**Ein Patient darf immer nur einen offenen Visit haben.**
In unserer Beispielpraxis kann ein Patient nicht gleichzeitig in mehreren
Behandlungen sein, er sitzt ja nur in einem Behandlungszimmer. Wir prüfen das
deshalb vor dem Anlegen (`checkIfPatientHasPendingVisit`) und geben sonst einen
409 zurück. Sonst wüssten wir bei zwei offenen Visits auch gar nicht, an welchen
die Verordnung gehört.

**Jeder Schritt lädt den Visit nur in den Status, in denen er erlaubt ist.**
Das steckt in den Query-Funktionen in `util/dbHelpers.js`: `findPendingVisitById`
findet nur `started`, `findAnamnesisCompletedVisitById` findet `amnesisIsCompleted`
oder `started`. Damit erzwingt schon die Datenbankabfrage die richtige Reihenfolge.

Dass die zweite Funktion auch `started` akzeptiert, ist Absicht: In einer
Notaufnahme muss ein Schmerzmittel auch dann verordnet werden können, wenn der
Anamnesebogen noch nicht fertig ist.

Aus der Aufgabenstellung auf Miro ging für uns nicht hervor, wie strikt dieser
Ablauf sein soll. Wir haben ihn deshalb so umgesetzt, wie er für uns fachlich
logisch war, und sind mit diesem Ansatz ziemlich zufrieden.

Uns ist aber klar, dass er nicht perfekt ist und nicht alles abbildet, was in
einer echten Praxis passiert. Ein Visit lässt sich zum Beispiel nicht abbrechen,
wenn ein Patient doch wieder geht — er bleibt dann offen und blockiert neue
Visits für diesen Patienten.

### 9. Einheitliches Fehlerformat mit OperationOutcome

Alle Fehler, die unser Service zurückgibt, haben das Format der FHIR-Ressource
`OperationOutcome` – auch die, die mit FHIR gar nichts zu tun haben, zum Beispiel
"Visit nicht gefunden" oder ein fehlgeschlagener Datenbankzugriff.

Der Grund ist simpel: Ein Teil unserer Fehler kommt sowieso vom FHIR-Server
zurück. Hätten wir daneben noch ein eigenes Format, müsste ein Client zwei
verschiedene Fehlerarten auseinanderhalten. So sieht nach aussen alles gleich aus
und wir können die Diagnostics vom FHIR-Server einfach übernehmen.

Gebaut wird das an einer Stelle, in `sendErrorResponse` (`util/errorHelpers.js`).
Die `issueCodes` nehmen wir aus dem offiziellen ValueSet
([FHIR: issue-types](https://build.fhir.org/valueset-issue-type.html)).

### 10. Bei der Verordnung schreiben wir erst lokal, dann an FHIR

Nach Grundstein 1 halten wir lokal keine Kopien der eigentlichen Patientenstammdaten.
Die im Rahmen eines Besuchs erhobene ``anamnesis`` und die ausgestellte
``prescription`` speichern wir trotzdem im zugehörigen ``Visit``
(``services/visitService.js``).

Beide gehören fachlich zu unserem lokalen Behandlungsablauf und müssen auch dann
dokumentiert werden, wenn aufgrund eines fehlenden oder abgelehnten Consents
keine medizinischen Daten an FHIR übertragen werden dürfen.

Der Ablauf ist bei beiden Vorgängen ähnlich:

1. Die Eingabedaten und der aktuelle Consent werden ausgewertet.
2. Falls erforderlich, wird ein FHIR-Transaction-Bundle erstellt und an den
   FHIR-Server geschickt.
3. Die Anamnese beziehungsweise Verordnung wird im lokalen ``Visit`` gespeichert
   und der Visit-Status aktualisiert.

Bei einem ``deny`` kann das Bundle ausschließlich den Consent und die Provenance
enthalten oder vollständig entfallen, wenn bereits ein aktiver Deny-Consent
vorliegt. Die medizinischen Daten bleiben in diesem Fall ausschließlich lokal.

Damit man unterscheiden kann, ob die Daten tatsächlich an FHIR übertragen
wurden, setzen wir ``fhirSubmittedAt`` beziehungsweise ``sentToFhirAt`` nur nach
einer erfolgreichen Übertragung. Fehlt das jeweilige Feld, ist der Vorgang zwar
lokal dokumentiert, die medizinischen Daten wurden aber nicht an den
FHIR-Server übermittelt.

Uns ist bewusst, dass MongoDB Transaktionen unterstützt und sich hierfür eine
robustere Lösung umsetzen ließe. Aufgrund des Projektumfangs und des
verfügbaren Bearbeitungszeitraums haben wir diesen Sonderfall jedoch bewusst
nicht weiter behandelt.

### 11. Transaction-Bundles und Provenance

Alles, was zu einem Vorgang gehört, geht als **ein** Transaction-Bundle an FHIR
(`util/mapper.js`): bei der Anamnese sind es Condition, MedicationStatement und Consent,
bei der Verordnung MedicationRequest und Consent. Entweder wird alles geschrieben
oder nichts – sonst könnte die Diagnose auf dem Server stehen, der Consent dazu
aber nicht.

In jedem Bundle liegt außerdem eine `Provenance`, die auf alle geschriebenen
Ressourcen zeigt und festhält, wer sie erzeugt hat. Das ist der Teil der
Nachvollziehbarkeit, den wir nach außen abgeben, der Rest bleibt im internen
Audit (Grundstein 5).

Nur den Patienten legen wir mit einem eigenen Request an, weil wir seine FHIR-ID
schon brauchen, um die anderen Ressourcen darauf zu referenzieren.

### Ableitung der Architektur

Bereits früh im Projekt haben wir ein erstes UML für den Ablauf in der Arztpraxis vorbereitet, das für uns logisch erschien und an dem wir uns über die gesamte Projektlaufzeit orientiert haben:

![Schmerzmedikation Journey](docs/patientenJourny.svg)

Aus diesen Grundsteinen und dem Ablauf entstand die folgende Schichtenarchitektur (Router → Middleware → Controller → Service → FHIR-Client / DB):

![Medication Service Architektur](docs/Architecture.svg)

referenzieren.

## Ablauf und Verwendung der Endpunkte

Die Endpunkte bauen aufeinander auf und bilden den Ablauf einer Behandlung ab.
Am einfachsten testet man das über die Swagger UI unter
`http://localhost:3000/swagger/`.

### 1. Einloggen

```
POST /login
{ "username": "admin", "password": "admin" }
```

Gibt einen JWT zurück. Alle folgenden Requests brauchen ihn im Header:
`Authorization: Bearer <token>`.

### 2. Visit starten

Der Patient wird aufgenommen. Dafür gibt es zwei Wege, je nachdem ob die
Versichertenkarte vorliegt:

```
POST /Patient/kv
{ "kv": "A123456789", "insuranceType": "GKV" }
```

Sucht den Patienten auf FHIR über die KV-Nummer. Existiert er dort nicht,
kommt ein 404 – über diesen Weg legen wir niemanden neu an.
(Hierbei unterscheiden wir nach "GKV" oder "PKV" bei `insuranceType`.)

```
POST /Patient/demographics
{
  "familyName": "Mustermann",
  "givenNames": ["Max"],
  "birthday": "1985-03-12",
  "address": "Musterstraße 1, 10115 Berlin",
  "gender": "male"
}
```

Sucht über die Personendaten und legt den Patienten auf FHIR neu an, wenn er
noch nicht existiert.

Beide geben eine `visitId` zurück, die man für alle weiteren Schritte braucht.
Hat der Patient noch einen offenen Visit, kommt ein 409 (siehe Grundstein 8).

### 3. Medikationshistorie ansehen (optional)

```
GET /visits/{visitId}/medicationHistory
```

Holt die bestehenden `MedicationStatement` des Patienten von FHIR, damit man
vor dem Verordnen sieht, was er schon nimmt.

Nach unserer Architektur macht es hier Sinn, den Patienten über die visitId zu bestimmen, da jeder Visit genau einem Patienten zugeordnet ist und wir dadurch direkt auf dessen FHIR-ID zugreifen können.

### 4. Anamnese erfassen

```
POST /Visit/{visitId}/anamnesis
{
  "consent": "permit",
  "condition": [{ "code": "...", "display": "Bluthochdruck" }],
  "medicationStatement": [
    { "code": "cfsb1758031032850", "display": "Atorvastatin 40mg" }
  ]
}
```

`consent` ist optional. Wird es weggelassen, gilt der aktive Consent auf dem
FHIR-Server – und wenn es keinen gibt, legen wir einen `deny` an. Bei `permit`
gehen Condition, MedicationStatement und Consent als ein Bundle raus, bei `deny`
nur der Consent (siehe Grundstein 3).

### 5. Medikation verordnen

```
POST /visits/{visitId}/prescription
{
  "consent": "permit",
  "medicationRequest": { "code": "...", "display": "Ibuprofen 400mg" }
}
```

Schreibt die Verordnung in den Visit und schickt MedicationRequest und Consent
als Bundle an FHIR. Danach steht der Visit auf `completed`.

Dieser Schritt geht auch direkt nach Schritt 2, ohne Anamnese – falls keine Anamnese notwendig ist oder
der Patient keine Updates für seine Patientendaten hat.

### 6. Visits ansehen

```
GET /Patient/visits
```

Listet alle lokal gespeicherten Visits mit ihrem Status.


## Setup
Es müssen ein private.key, ein public.key und ein kv.hash im repo liegen. 
Diese können über die unteren Befehle erzeugt werden. 

## Prerequisites
* Node.js
* Docker Desktop
* Git

Yarn is already included via Corepack.

## Generate the PUBLIC_KEY and PRIVATE_KEY

### PRIVATE_KEY
````bash 
openssl genrsa -out ./private.key 4096
````

### PUBLIC_KEY
````bash 
openssl rsa -in ./private.key -pubout -outform PEM -out ./public.key
````

## Generate the KV_PEPPER

Geheimnis Pseudonymisierung KV
````bash 
openssl rand -hex 32 | tr -d '\n' > ./kv.hash
````

## Project setup

```bash
corepack enable
yarn install
```

## Start MongoDB

```bash
yarn mongodb
```

## Start the backend

```bash
yarn start:dev
```

## Access Endpoints via Swagger UI

Use ```http://localhost:3000/swagger/```

## Mongo Express Dashboard
via http://localhost:8081
user: admin
password: pass
