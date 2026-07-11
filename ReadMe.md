# Medikation-eRezept-slice

RESTful backend for the medication/ePrescription project.

## Prerequisites

* Node.js
* Docker Desktop
* Git

Yarn is already included via Corepack.

## Generate the PUBLIC_KEY and PRIVATE_KEY 

Use Commands and 

### PUBLIC_KEY
````bash 
openssl rsa -in private.key -pubout -outform PEM -out public.key
````

### PRIVATE_KEY
````bash 
openssl genrsa -out ./private.key 4096
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
