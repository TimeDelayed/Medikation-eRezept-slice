import { readFileSync } from "node:fs";
import jwt from "jsonwebtoken";

const publicKey = readFileSync("./public.key");
const privateKey = readFileSync("./private.key");

// verifies the JWT token and adds the user to the request object
export const securityMiddleware = async (req, res, next) => {
  try {
    const tokenSplit = req.headers?.authorization?.split(" ");
    const token = tokenSplit?.[1];
    if (tokenSplit?.[0] !== "Bearer") {
      throw Error("No baerer keyword found");
    }

    req.user = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
    console.log(req.user);
  } catch (e) {
    console.log(e);
    return res.status(401).json({ error: "Invalid token" });
  }

  next();
};

// https://www.npmjs.com/package/jsonwebtoken
// https://medium.com/@almog_y/creating-and-reading-jwt-tokens-in-node-js-dd2202363327
export const handleDummyLogin = (req, res) => {
  const { username, password } = req.body;

  if (username !== "admin" || password !== "admin") {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = { username };
  const token = jwt.sign(user, privateKey, { expiresIn: "60d",  algorithm: "RS256" });
  console.log("Generated JWT token:", token);

  return res.status(200).json({ token: token });

};
