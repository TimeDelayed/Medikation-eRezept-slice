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
Der `Visit` ist damit unser interner Anker. Die Patienten-FHIR-ID bleibt reine Referenzen nach außen für einen schnellen lookup. Diese wird nicht von unseren eigenen Endpunkten als Input angenommen.

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
* Consent `permit` wie oben. Der Consent wird hier nicht nochmal seperat gesendet.
* Consent `deny` wie oben. Der Consent wird hier nicht nochmal seperat gesendet.
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
Möglichkeit zu haben, seine Krankenversicherung Nachzureichen.

Bei Grundsatz 1 ist uns aufgefallen, dass wir uns an einer Stelle selbst widersprechen: Die KV-Nummer stand bei uns im Klartext in der Datenbank, obwohl sie ein direkt identifizierendes Merkmal ist.

Ganz weglassen konnten wir sie aber nicht, weil wir beim Anlegen eines `Visit` prüfen müssen, ob die KV-Nummer schon existiert.
Für diesen Vergleich macht es allerdings keinen Unterschied, ob der Wert im Klartext oder gehasht vorliegt – gleiche Eingabe ergibt immer den gleichen Hash.
Somit für unseren Zweck perfekt. 

Gespeichert wird deshalb nur noch `kvHash`. Gehasht wird erst direkt vor dem Schreiben in die Datenbank (`util/dbHelpers.js`) – vorher braucht der Service die echte KV-Nummer noch für die Patientensuche auf FHIR.

Wir benutzen **HMAC-SHA256**. Dabei fließt zusätzlich ein geheimer Schlüssel in den Hash ein, der sogenannte Pepper (`kv.hash`).
Der liegt als Datei beim Code und nicht in der Datenbank. Ohne ihn kann man die Hashes gar nicht erst nachbauen, das Durchprobieren bringt also nichts mehr.

### Ableitung der Architektur

Bereits früh im Projekt haben wir ein erstes UML für den Ablauf in der Arztpraxis vorbereitet, das für uns logisch erschien und an dem wir uns über die gesamte Projektlaufzeit orientiert haben:

![Schmerzmedikation Journey](docs/patientenJourny.svg)

Aus diesen Grundsteinen und dem Ablauf entstand die folgende Schichtenarchitektur (Router → Middleware → Controller → Service → FHIR-Client / DB):

![Medication Service Architektur](docs/Architecture.svg)

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
