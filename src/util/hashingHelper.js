import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const pepper = readFileSync("./kv.hash");

export const hashHelperIdentifier = (value) => {

  const normalizedIdentifier = value.trim().toUpperCase();

  return createHmac("sha256", pepper)
    .update(normalizedIdentifier)
    .digest("hex");

};
