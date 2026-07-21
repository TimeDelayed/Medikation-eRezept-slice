import { readFileSync } from "node:fs";
import jwt from "jsonwebtoken";
import { setAuditIdsHelper } from "../audit/auditHelper.js";

const publicKey = readFileSync("./public.key");
const privateKey = readFileSync("./private.key");

// verifies the JWT token and adds the user to the request object
export const securityMiddleware = async (req, res, next) => {
  try {
    const tokenSplit = req.headers?.authorization?.split(" ");
    const token = tokenSplit?.[1];
    if (tokenSplit?.[0] !== "Bearer") {
      throw Error("No bearer keyword found");
    }

    req.user = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
    console.log(req.user);
  } catch (e) {
    console.log(e);
    req.auditError = e.message;
    return res.status(401).json({ error: "Invalid token" });
  }

  next();
};

// https://www.npmjs.com/package/jsonwebtoken
// https://medium.com/@almog_y/creating-and-reading-jwt-tokens-in-node-js-dd2202363327
export const handleDummyLogin = (req, res) => {
  const { username, password } = req.body;

  if (username !== "admin" || password !== "admin") {
    req.auditError = "Invalid credentials";
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const roles = ["admin", "physician"];
  //const randomNumber = Math.floor(Math.random() * 100);
  const token = jwt.sign({
    sub: username,
    name: "Example physician",
    roles: roles,
  }, privateKey, { expiresIn: "60d",  algorithm: "RS256" });
  console.log("Generated JWT token:", token);

  return res.status(200).json({ token: token });

};
