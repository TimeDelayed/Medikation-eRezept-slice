# Medikation-eRezept-slice

RESTful backend for the medication/ePrescription project.

## Prerequisites

* Node.js
* Docker Desktop
* Git

Yarn is already included via Corepack.

## Generate the PUBLIC_KEY and PRIVATE_KEY 

Use Commands and 

### PRIVATE_KEY
````bash 
openssl genrsa -out ./private.key 4096
````

### PUBLIC_KEY
````bash 
openssl rsa -in ./private.key -pubout -outform PEM -out ./public.key
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
