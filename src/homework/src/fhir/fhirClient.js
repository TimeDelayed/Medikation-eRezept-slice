export const searchPatientByName = async (name) => {
    const result = await fetch(`https://hapi.fhir.org/baseR4/Patient/?name=${name}`)
    return result.json()
}

export const getPatientById = async (id) => {
    const result = await fetch(`https://hapi.fhir.org/baseR4/Patient/${id}`)
    return result.json()
}

export const createPatient = async (patient) => {
    const result = await fetch(`https://hapi.fhir.org/baseR4/Patient`,
        {
            method: "post",
            headers: {
                "Content-Type": "application/fhir+json"
            },
            body: JSON.stringify({ resourceType: "Patient", ...patient }),
        }
    )
    return result.json()
}

export const createCondition = async (condition) => {
    const result = await fetch(`https://hapi.fhir.org/baseR4/Condition`,
        {
            method: "post",
            headers: {
                "Content-Type": "application/fhir+json"
            },
            body: JSON.stringify({ resourceType: "Condition", ...condition }),
        }
    )
    return result.json()
}

export const findConditionById = async (id) => {
    const result = await fetch(`https://hapi.fhir.org/baseR4/Condition/${id}`)
    return result.json()
}