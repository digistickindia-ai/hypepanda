import PaytmChecksum from "paytmchecksum";

// Use Paytm's official checksum library to avoid signature bugs.
// For the JSON-body APIs (initiateTransaction, order/status), the signature
// is generated over the exact JSON body STRING.
export async function paytmChecksum(bodyString, key) {
  return PaytmChecksum.generateSignature(bodyString, key);
}

export async function verifyPaytmChecksum(bodyString, key, checksum) {
  try {
    return await PaytmChecksum.verifySignature(bodyString, key, checksum);
  } catch (e) {
    return false;
  }
}

export function paytmBase(mode) {
  return mode === "production" ? "https://securegw.paytm.in" : "https://securegw-stage.paytm.in";
}
