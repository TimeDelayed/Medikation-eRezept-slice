// examples from the official codes below
// https://hl7.org/fhir/R4/valueset-condition-code.html
export const conditions = [
  { code: "140004", display: "Chronic pharyngitis" },
  { code: "144008", display: "Normal peripheral vision" },
  { code: "147001", display: "Superficial foreign body of scrotum without major open wound but with infection" },
  { code: "150003", display: "Abnormal bladder continence" },
  { code: "151004", display: "Meningitis due to gonococcus" },
];

// examples from the official codes below
// https://fhir.hl7.org/fhir/valueset-medication-codes.html
export const medications = [
  { code: "1148001", display: "Product containing ticarcillin (medicinal product)" },
  { code: "1182007", display: "Hypotensive agent" },
  { code: "1206000", display: "Product containing alpha-2 adrenergic receptor antagonist (product)" },
  { code: "1222004", display: "Product containing metronidazole (medicinal product)" },
  { code: "1389007", display: "Product containing beclometasone (medicinal product)" },
];

// for simulation of doctor picking the correct medication
// https://stackoverflow.com/questions/5915096/get-a-random-item-from-a-javascript-array
export const pickRandomCondition = () => {
  return conditions[Math.floor(Math.random() * conditions.length)];
};

export const pickRandomMedication = () => {
  return medications[Math.floor(Math.random() * medications.length)];
};
