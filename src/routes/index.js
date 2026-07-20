import { Router } from "express";
import { handleDummyLogin, securityMiddleware } from "../auth/auth.js";
import { addAuditOptions } from "../audit/addAuditOptionsMiddelware.js";
import { auditMiddleware } from "../audit/auditMiddleWare.js";
import {
  createMedicationRequestBundleHandler,
  createVisitHandler,
  getAllVisitsHandler,
  submitAnamnesisHandler,
} from "../controller/visitController.js";
import { ResourceType } from "../db/schema/ressourceType.js";
import { getMedicationStatementHandler } from "../controller/medicationController.js";

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 example: "admin"
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT for 60 days
 *       401:
 *         description: Invalid credentials (Wrong Username or Password)
 */

router.use(auditMiddleware);

router.post("/login", addAuditOptions("Login", ResourceType.USER), handleDummyLogin);

// middleware
router.use(securityMiddleware);

/**
 * @openapi
 * /Patient:
 *   post:
 *     tags:
 *       - Visit
 *     summary: Starts a new patient visit.
 *     description: >
 *       Searches for an existing FHIR Patient using the insurance identifier
 *       and demographic information. If no matching Patient exists, a new
 *       FHIR Patient is created. A local Visit is then stored with the
 *       resulting FHIR Patient id.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kv
 *               - insuranceType
 *               - familyName
 *               - givenNames
 *               - birthday
 *               - address
 *               - gender
 *             properties:
 *               kv:
 *                 type: string
 *                 example: "A123456789"
 *               insuranceType:
 *                 type: string
 *                 enum: [GKV, PKV]
 *               familyName:
 *                 type: string
 *                 example: "Mustermann"
 *               givenNames:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Max"]
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: "1998-06-15"
 *               address:
 *                 type: string
 *                 example: "Musterstraße 1, 12345 Berlin"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, unknown]
 *     responses:
 *       201:
 *         description: Visit successfully created.
 *       400:
 *         description: Required patient information is missing.
 *       502:
 *         description: FHIR Patient lookup or creation failed.
 */
router.post("/Patient", addAuditOptions("create", ResourceType.VISIT), createVisitHandler);

/**
 * @openapi
 * /Patient/visits:
 *   get:
 *     tags:
 *       - Visit
 *     summary: Shows all current visits.
 *     responses:
 *       200:
 *         description: Successfully found visits.
 *       500:
 *         description: Database failed.
 */
router.get(
  "/Patient/visits",
  addAuditOptions("get", ResourceType.BUNDLE),
  getAllVisitsHandler,
);


// ---------- Anamnesis ----------

/**
 * @openapi
 * /Visit/{visitId}/anamnesis:
 *   post:
 *     tags:
 *       - Visit
 *     summary: Submits an anamnesis for a visit.
 *     description: >
 *       Stores the anamnesis locally for the specified visit.
 *       Depending on the patient's consent, the anamnesis is either stored only locally
 *       or transmitted to the FHIR server as a transaction bundle together with the Consent.
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Local Visit identifier.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               consent:
 *                 type: string
 *                 enum:
 *                   - permit
 *                   - deny
 *                 description: >
 *                   Optional. If omitted, the currently active Consent on the
 *                   FHIR server is used. If none exists, a deny Consent is created.
 *               condition:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     display:
 *                       type: string
 *               medicationStatement:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: cfsb1758031032850
 *                     display:
 *                       type: string
 *                       example: Atorvastatin-ratiopharm® 40mg 30 Filmtbl. N1
 *     responses:
 *       200:
 *         description: Anamnesis successfully processed.
 *       400:
 *         description: Invalid request.
 *       404:
 *         description: Visit not found.
 *       409:
 *         description: Multiple active Consents found for the patient.
 *       502:
 *         description: FHIR server request failed.
 */
router.post(
  "/Visit/:visitId/anamnesis",
  addAuditOptions("create", ResourceType.BUNDLE),
  submitAnamnesisHandler,
);

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
router.get("/visits/:visitId/medicationHistory", addAuditOptions("Read", ResourceType.MEDICATION_STATEMENT), getMedicationStatementHandler);

/**
 * @openapi
 * /visits/{visitId}/prescription:
 *   post:
 *     tags:
 *       - Medication
 *     summary: Creates a prescription for the patient of a visit.
 *     description: >
 *       Creates a FHIR MedicationRequest for the patient linked to the visit
 *       and sends it to the FHIR server as a transaction bundle.
 *       A Provenance resource documenting the prescribing physician is added automatically.
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Local Visit identifier.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - display
 *             properties:
 *               code:
 *                 type: string
 *                 description: Medication code.
 *                 example: cfsb1758031032850
 *               display:
 *                 type: string
 *                 description: Human readable medication name.
 *                 example: Atorvastatin-ratiopharm® 40mg 30 Filmtbl. N1
 *     responses:
 *       201:
 *         description: Prescription created successfully.
 *       400:
 *         description: Invalid request.
 *       404:
 *         description: Visit not found.
 *       502:
 *         description: FHIR server request failed.
 */
router.post("/visits/:visitId/prescription", addAuditOptions("create", ResourceType.MEDICATION_REQUEST), createMedicationRequestBundleHandler);

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
//router.post("/visits/:visitId/finalize", addAuditOptions("finish Visit", ResourceType.VISIT), finalizeVisitHandler);



export default router;
