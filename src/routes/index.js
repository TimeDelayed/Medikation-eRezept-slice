import { Router } from "express";
import { handleDummyLogin, securityMiddleware } from "../auth/auth.js";
import { addAuditOptions } from "../audit/addAuditOptionsMiddelware.js";
import { auditMiddleware } from "../audit/auditMiddleWare.js";
import {
  checkConsentHandler,
  createPatientHandler,
  createVisitHandler,
  recordConsentHandler,
  searchPatientHandler,
  submitAnamnesisHandler,
} from "../controller/intakeController.js";
import {
  createPrescriptionHandler,
  finalizeVisitHandler,
  getMedicationHistoryHandler,
} from "../controller/medicationController.js";
import { ResourceType } from "../db/schema/ressourceType.js";

// https://expressjs.com/en/guide/writing-middleware/
// https://expressjs.com/en/5x/guide/routing/
const router = Router();

/**
 * @openapi
 * /ping:
 *   get:
 *     tags:
 *       - Debug
 *     summary: Returns the current API version.
 *     responses:
 *       200:
 *         description: API version returned successfully.
 */
router.get("/ping", (_, res) => res.json({ version: "2.13.0" }));

// ---------- Authentication ----------

/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Performs a dummy login.
 *     responses:
 *       200:
 *         description: Login successful.
 */

router.use(auditMiddleware);

router.post("/login", addAuditOptions("Login", ResourceType.USER), handleDummyLogin);

// middleware
// router.use(securityMiddleware);

// ---------- Patient ----------

/**
 * @openapi
 * /Patient:
 *   get:
 *     tags:
 *       - Patient
 *     summary: Searches for a patient.
 *     description: >
 *       Searches either by insurance identifier (kv) or by demographic information.
 *       If 'kv' is provided, identifier search is performed.
 *       Otherwise demographic search is used.
 *     parameters:
 *       - in: query
 *         name: insuranceType
 *         schema:
 *           type: string
 *           enum: [GKV, PKV]
 *         description: Insurance identifier (GKV / PKV).
 *       - in: query
 *         name: kv
 *         schema:
 *           type: string
 *         description: Insurance number (A123456789)
 *       - in: query
 *         name: familyName
 *         schema:
 *           type: string
 *       - in: query
 *         name: givenName
 *         schema:
 *           type: string
 *       - in: query
 *         name: birthday
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other, unknown]
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching patient returned.
 *       404:
 *         description: Patient not found.
 *       409:
 *         description: Multiple patients matched the demographic search.
 */
router.get("/Patient", addAuditOptions("search", ResourceType.PATIENT), searchPatientHandler);

// ---------- Consent ----------
/**
 * @openapi
 * /Patient/consents:
 *   get:
 *     tags:
 *       - Patient consent
 *     summary: Searches consents of a category for a patient.
 *     description: >
 *       Searches for consents of a specific category for a patient. The patient is identified by the provided fhir patientId.
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           description: FHIR Patient reference.
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           description: >
 *             Consent category. Example: "dsgvo" or "research".
 *     responses:
 *       200:
 *         description: Matching consents returned.
 *       404:
 *         description: No consents found for the patient and category.
 *       400:
 *         description: Missing required query parameters.
 */
router.get("/Patient/consents", addAuditOptions("create", ResourceType.CONSENT), checkConsentHandler);

/**
 * @openapi
 * /Patient:
 *   post:
 *     tags:
 *       - Patient
 *     summary: Creates a new patient.
 *     description: >
 *       Creates a FHIR Patient with the mandatory patient information.
 *       Additional patient information can later be added through the anamnesis workflow.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/PatientCreate"
 *     responses:
 *       201:
 *         description: Patient successfully created.
 *       400:
 *         description: Missing required patient data.
 */
router.post("/Patient",addAuditOptions("create", ResourceType.PATIENT), createPatientHandler);

// ---------- Visit ----------

/**
 * @openapi
 * /visits:
 *   post:
 *     tags:
 *       - Visit
 *     summary: Creates a new local visit.
 *     description: Creates a local visit referencing an existing patient.
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Visit created successfully.
 */
router.post("/visits",addAuditOptions("create", ResourceType.VISIT), createVisitHandler);

// ---------- Consent ----------

/**
 * @openapi
 * /visits/{visitId}/consent:
 *   get:
 *     tags:
 *       - Consent
 *     summary: Checks whether an active consent exists.
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: patient
 *         required: true
 *         schema:
 *           type: string
 *         description: FHIR Patient reference.
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Consent category.
 *     responses:
 *       200:
 *         description: Matching active consent(s).
 *       400:
 *         description: Missing query parameters.
 */
router.get("/visits/:visitId/consent", addAuditOptions("Read", ResourceType.CONSENT), checkConsentHandler);

/**
 * @openapi
 * /visits/{visitId}/consent:
 *   post:
 *     tags:
 *       - Consent
 *     summary: Records a patient consent.
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Consent recorded successfully.
 */
router.post("/visits/:visitId/consent", addAuditOptions("create", ResourceType.CONSENT), recordConsentHandler);

// ---------- Anamnesis ----------

/**
 * @openapi
 * /visits/{visitId}/anamnesis:
 *   post:
 *     tags:
 *       - Anamnesis
 *     summary: Submits the patient's anamnesis.
 *     description: Updates the corresponding FHIR Patient resource.
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Anamnesis submitted successfully.
 */
router.post("/visits/:visitId/anamnesis", addAuditOptions("Update Visit", ResourceType.VISIT), submitAnamnesisHandler);

// ---------- Medication ----------

/**
 * @openapi
 * /visits/{visitId}/medicationHistory:
 *   get:
 *     tags:
 *       - Medication
 *     summary: Returns the patient's medication history.
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medication history returned.
 */
router.get("/visits/:visitId/medicationHistory", addAuditOptions("Read", ResourceType.MEDICATION_STATEMENT), getMedicationHistoryHandler);

/**
 * @openapi
 * /visits/{visitId}/prescription:
 *   post:
 *     tags:
 *       - Medication
 *     summary: Creates a prescription.
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Prescription created successfully.
 */
router.post("/visits/:visitId/prescription", addAuditOptions("create", ResourceType.MEDICATION_REQUEST), createPrescriptionHandler);

/**
 * @openapi
 * /visits/{visitId}/finalize:
 *   post:
 *     tags:
 *       - Visit
 *     summary: Finalizes a visit.
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Visit finalized successfully.
 */
router.post("/visits/:visitId/finalize", addAuditOptions("finish Visit", ResourceType.VISIT), finalizeVisitHandler);



export default router;
