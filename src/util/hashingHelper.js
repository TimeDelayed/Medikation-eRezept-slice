import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const pepper = readFileSync("./kv.hash");

export const hashHelperKV = (value) => {

  const normalizedKV = value.trim().toUpperCase();

  return createHmac("sha256", pepper)
    .update(normalizedKV)
    .digest("hex");

};
