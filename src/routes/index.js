import { Router } from 'express'
import {handleDummyLogin, securityMiddleware} from "../auth/auth.js";
import {
  createPatientHandler,
  searchPatientByIdentifierHandler,
  createVisitHandler,
  checkConsentHandler,
  recordConsentHandler,
  submitAnamnesisHandler,
} from "../controller/intakeController.js";
import {
  getMedicationHistoryHandler,
  createPrescriptionHandler,
  finalizeVisitHandler,
} from "../controller/medicationController.js";

//https://expressjs.com/en/5x/guide/routing/
const router = Router()

// debug ping
router.get('/ping', (_, res) => res.json(({ version: '2.13.0' })))

//intake routes
router.get('/Patients/:kv', searchPatientByIdentifierHandler)
router.post('/Patients', createPatientHandler)

// creates the local visit with a patient refId and an identifier (kv) (as body)
router.post("/visits", createVisitHandler);

// consent + anamnesis on the local visit
router.get("/visits/:visitId/consent", checkConsentHandler);
router.post("/visits/:visitId/consent", recordConsentHandler);
router.post("/visits/:visitId/anamnesis", submitAnamnesisHandler);

//medication routes
router.get("/visits/:visitId/medicationHistory", getMedicationHistoryHandler)
router.post("/visits/:visitId/prescription", createPrescriptionHandler)
router.post("/visits/:visitId/finalize", finalizeVisitHandler)


router.post("/login", handleDummyLogin)
// middleware
router.use(securityMiddleware)

export default router

