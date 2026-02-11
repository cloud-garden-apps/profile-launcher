import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";

type TokenCipher = {
  ciphertext: string;
  iv: string;
  tag: string;
};

const base64url = (input: Buffer | string): string => {
  const raw = Buffer.isBuffer(input) ? input.toString("base64") : Buffer.from(input, "utf8").toString("base64");
  return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64url = (input: string): Buffer => {
  const pad = 4 - (input.length % 4 || 4);
  const b64 = `${input.replace(/-/g, "+").replace(/_/g, "/")}${"=".repeat(pad)}`;
  return Buffer.from(b64, "base64");
};

const getAesKey = (): Buffer => {
  const secret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing GOOGLE_TOKEN_ENCRYPTION_KEY or SUPABASE_SECRET_KEY");
  }
  return createHash("sha256").update(secret).digest();
};

const getStateSigningKey = (): Buffer => {
  const secret = process.env.GOOGLE_STATE_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing GOOGLE_STATE_SECRET or SUPABASE_SECRET_KEY");
  }
  return createHash("sha256").update(secret).digest();
};

export const encryptToken = (plaintext: string): TokenCipher => {
  const key = getAesKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
};

export const decryptToken = (cipher: TokenCipher): string => {
  const key = getAesKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(cipher.iv, "base64"));
  decipher.setAuthTag(Buffer.from(cipher.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(cipher.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
};

type OAuthStatePayload = {
  u: string;
  t: number;
  n: string;
};

export const createOAuthState = (userId: string): string => {
  const payload: OAuthStatePayload = {
    u: userId,
    t: Date.now(),
    n: randomBytes(16).toString("hex"),
  };
  const payloadEncoded = base64url(JSON.stringify(payload));
  const sig = createHmac("sha256", getStateSigningKey()).update(payloadEncoded).digest();
  return `${payloadEncoded}.${base64url(sig)}`;
};

export const verifyOAuthState = (state: string): OAuthStatePayload => {
  const [payloadEncoded, signatureEncoded] = state.split(".");
  if (!payloadEncoded || !signatureEncoded) {
    throw new Error("Invalid OAuth state");
  }

  const expectedSig = createHmac("sha256", getStateSigningKey()).update(payloadEncoded).digest();
  const actualSig = fromBase64url(signatureEncoded);
  if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
    throw new Error("Invalid OAuth state signature");
  }

  const payload = JSON.parse(fromBase64url(payloadEncoded).toString("utf8")) as OAuthStatePayload;
  const ageMs = Date.now() - payload.t;
  if (ageMs > 10 * 60 * 1000) {
    throw new Error("OAuth state expired");
  }
  return payload;
};
