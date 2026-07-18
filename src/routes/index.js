import { Router } from "express";
import { handleDummyLogin, securityMiddleware } from "../auth/auth.js";
import { addAuditOptions } from "../audit/addAuditOptionsMiddelware.js";
import { auditMiddleware } from "../audit/auditMiddleWare.js";
import {
  createVisitHandler,
  getAllVisits,
  /*submitAnamnesisHandler*/
} from "../controller/anamnesisController.js";
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
  getAllVisits,
);


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
 *
router.post("/visits/:visitId/anamnesis", addAuditOptions("Update Visit", ResourceType.VISIT), submitAnamnesisHandler);*/

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
