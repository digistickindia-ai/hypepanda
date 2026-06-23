import crypto from "crypto";

// Paytm checksum (signature) generation — server-side only.
// Mirrors Paytm's official PaytmChecksum.generateSignature.

function randomString(length) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%";
  let s = "";
  for (let i = 0; i < length; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

function encrypt(input, key) {
  const iv = "@@@@&&&&####$$$$";
  const cipher = crypto.createCipheriv("AES-128-CBC", key, iv);
  let enc = cipher.update(input, "binary", "base64");
  enc += cipher.final("base64");
  return enc;
}

function decrypt(input, key) {
  const iv = "@@@@&&&&####$$$$";
  const decipher = crypto.createDecipheriv("AES-128-CBC", key, iv);
  let dec = decipher.update(input, "base64", "binary");
  dec += decipher.final("binary");
  return dec;
}

export async function paytmChecksum(params, key) {
  const salt = randomString(4);
  const finalString = (typeof params === "object" && !Array.isArray(params))
    ? Object.keys(params).sort().map((k) => params[k]).join("|")
    : String(params);
  const hash = crypto.createHash("sha256").update(finalString + "|" + salt).digest("hex") + salt;
  return encrypt(hash, key);
}

export async function verifyPaytmChecksum(params, key, checksum) {
  try {
    const paytmHash = decrypt(checksum, key);
    const salt = paytmHash.substr(paytmHash.length - 4);
    const finalString = (typeof params === "object" && !Array.isArray(params))
      ? Object.keys(params).sort().filter((k) => k !== "CHECKSUMHASH").map((k) => params[k]).join("|")
      : String(params);
    const hash = crypto.createHash("sha256").update(finalString + "|" + salt).digest("hex") + salt;
    return hash === paytmHash;
  } catch (e) { return false; }
}

export function paytmBase(mode) {
  return mode === "production" ? "https://securegw.paytm.in" : "https://securegw-stage.paytm.in";
}
