import mongoose from "mongoose";
import { Schema } from "mongoose";
import patientSchema from "./PatientSchema.js";
import diagnosesSchema from "./DiagnoseSchema.js";
import patientAllSchema from "./PatientAll.js";
import { getPatientById, createPatient, createCondition, findConditionById, searchPatientByName } from "./fhirClient.js";

const main = async () => {
    try {
        await mongoose.connect(
            "mongodb://root:fhir@localhost:27017/"
        );

        const Patient = mongoose.model("patient", patientSchema);

        const createdPatient = await createPatient({
            resourceType: "Patient",
            name: [
                {
                    family: "Test2",
                    given: ["Test2"]
                }
            ],
            age: 18,
            gender: "male"
        });

        console.log("Created:");
        console.log(JSON.stringify(createdPatient, null, 2));

        // const fhirPatient = await getPatientById(createdPatient.id);

        const PatientAll = mongoose.model("patientAll", patientAllSchema);

        console.log("======================")
        console.log("Search Patient Condition")
        const fhirPatient = await searchPatientByName("Test2");
        console.log(fhirPatient)

        console.log("Fetched:");
        console.log(JSON.stringify(fhirPatient, null, 2));
        console.log("======================")


        const searchedPatient = fhirPatient.entry[0].resource
        const name = searchedPatient.name?.[0];

        const savedPatient = await Patient.create({
            id: searchedPatient.id,
            name: {
                family: name?.family,
                given: name?.given ?? []
            },
            gender: searchedPatient.gender,
            fullUrl: fhirPatient.entry[0].fullUrl
        });

        await PatientAll.create({ myJsonProperty: searchedPatient })

        console.log("======================")
        console.log("Mongo User Condition")
        console.log("Saved in MongoDB:");
        console.log(savedPatient.toObject());
        console.log("======================")

        // const createResult = await createPatient({
        //     name: [
        //         {
        //             family: savedPatient.name.family,
        //             given: ["test23", ...savedPatient.name.given]
        //         }
        //     ],
        //     gender: savedPatient.gender,
        // });

        // console.log("Created from MongoDB:");
        // console.log(JSON.stringify(createResult));



        const Condition = mongoose.model("condition", diagnosesSchema);

        const patientDiagnose = new Condition({
            subject: {
                reference: searchedPatient.id
            },
            code: 122003
        })

        const requestCondition = {
            subject: {
                reference: `Patient/${searchedPatient.id}`
            },
            code: 127009
        }

        console.log("======================")
        console.log("created Condition")
        const conditionResult = await createCondition(requestCondition)
        console.log(conditionResult)

        const savedCondition = await Condition.create({
            patientRefId: searchedPatient.id,
            conditionId: conditionResult.id,
            code: "109006"
        });

        console.log("======================")

        console.log("======================")
        console.log("find created Condition")
        const findCondition = await findConditionById(conditionResult.id)
        console.log(findCondition)
        console.log("======================")

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

main();