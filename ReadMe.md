# Medikation-eRezept-slice

RESTful Backend für das Medikation-/eRezept-Projekt.

## Voraussetzungen

* Node.js
* Docker Desktop
* Git

Yarn ist bereits über Corepack enthalten.

## Projekt einrichten

```bash
corepack enable
yarn install
```

## MongoDB starten

```bash
yarn mongodb
```

MongoDB stoppen:

```bash
yarn mongodb:down
```

MongoDB inkl. aller Daten zurücksetzen:

```bash
yarn mongodb:reset
```

## Backend starten

Entwicklungsmodus:

```bash
yarn dev
```

Produktiv:

```bash
yarn start
```

## Code prüfen

ESLint ausführen:

```bash
yarn lint
```

Automatisch korrigieren:

```bash
yarn lint:fix
```

## VS Code

Empfohlene Erweiterung:

* ESLint

Falls ESLint nicht funktioniert:

```bash
yarn dlx @yarnpkg/sdks vscode
```

Danach VS Code neu starten.

## Nach dem Klonen

```bash
git clone <repository>
cd Medikation-eRezept-slice

corepack enable
yarn install

yarn mongodb
yarn dev
```
