import { Router } from 'express'
import {handleDummyLogin, securityMiddleware} from "../auth/auth.js";
import {createPatientHandler, searchPatientByIdentifierHandler} from "../controller/intakeController.js";

//https://expressjs.com/en/5x/guide/routing/
const router = Router()

// debug ping
router.get('/ping', (_, res) => res.json(({ version: '2.13.0' })))

router.post("/login", handleDummyLogin)

// Public Endpoints
router.post('/Patients', createPatientHandler)
router.get('/Patients/:kv', searchPatientByIdentifierHandler)

// middleware
router.use(securityMiddleware)

export default router

