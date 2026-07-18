import { Router } from "express";
import { handleDummyLogin, securityMiddleware } from "../auth/auth.js";
import {
  createPatientHandler,
  searchPatientHandler,
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

// ---------- Patient ----------

/**
 * @openapi
 * /Patient/consents:
 *   get:
 *     tags:
 *       - Patient consent
 *     summary: Returns patient consents.
 *     description: >
 *       Returns all Consents of a patient.
 *       If a category is provided, only Consents of that category are returned.
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: FHIR Patient id.
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Consent category.
 *     responses:
 *       200:
 *         description: Matching Consents returned.
 *       400:
 *         description: Missing required query parameters.
 */
router.get("/Patient/consents", checkConsentHandler);

/**
 * @openapi
 * /Patient/consents:
 *   post:
 *     tags:
 *       - Patient consent
 *     summary: Records a patient consent decision.
 *     description: >
 *       Records a new Consent decision.
 *
 *       If no active Consent of the requested category exists, a new active
 *       Consent is created.
 *
 *       If an active Consent with a different decision exists, it is first
 *       marked as inactive and a new active Consent is created.
 *
 *       If an active Consent with the same decision already exists,
 *       the request fails with HTTP 409 Conflict.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - category
 *               - decision
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: FHIR Patient id.
 *               category:
 *                 type: string
 *                 description: Consent category.
 *               decision:
 *                 type: string
 *                 enum:
 *                   - permit
 *                   - deny
 *                 description: Consent decision.
 *     responses:
 *       201:
 *         description: Consent created successfully.
 *       400:
 *         description: Invalid request body.
 *       409:
 *         description: An active Consent with the same decision already exists.
 */
router.post("/Patient/consents", recordConsentHandler);

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
router.post("/Patient", createPatientHandler);

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
router.post("/visits", createVisitHandler);

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
router.get("/visits/:visitId/consent", checkConsentHandler);

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
router.post("/visits/:visitId/consent", recordConsentHandler);

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
router.post("/visits/:visitId/anamnesis", submitAnamnesisHandler);

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
router.get("/visits/:visitId/medicationHistory", getMedicationHistoryHandler);

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
router.post("/visits/:visitId/prescription", createPrescriptionHandler);

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
router.post("/visits/:visitId/finalize", finalizeVisitHandler);

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
router.post("/login", handleDummyLogin);

// middleware
router.use(securityMiddleware);

export default router;
