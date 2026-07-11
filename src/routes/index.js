import { Router } from 'express'
import {handleDummyLogin, securityMiddleware} from "../auth/auth.js";
import {handleNewMedication} from "../fhir/test.js";

//https://expressjs.com/en/5x/guide/routing/
const router = Router()

// debug ping
router.get('/ping', (_, res) => res.json(({ version: '2.13.0' })))

router.post("/login", handleDummyLogin)

// security MiddleWare for JWT
router.use(securityMiddleware)

// Private Endpoints
router.post('/Patient', handleNewMedication)
router.post('/Patient/:patientId/medication', handleNewMedication)

export default router

