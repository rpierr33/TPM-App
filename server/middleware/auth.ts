import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; sessionId?: string; email?: string };
    }
  }
}

// --- JWT Verification via Web Crypto (no SDK needed) ---

interface JWK {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg: string;
  use: string;
}

let jwksCache: { keys: JWK[]; fetchedAt: number } | null = null;
const JWKS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getJWKS(): Promise<JWK[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_CACHE_TTL) {
    return jwksCache.keys;
  }

  const domain = process.env.CLERK_DOMAIN;
  if (!domain) throw new Error("CLERK_DOMAIN env var is required");

  const res = await fetch(`https://${domain}/.well-known/jwks.json`);
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);
  const data = await res.json() as { keys: JWK[] };
  jwksCache = { keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

function base64urlToBuffer(str: string): Uint8Array {
  // Convert base64url to standard base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJWTPart(part: string): any {
  const json = new TextDecoder().decode(base64urlToBuffer(part));
  return JSON.parse(json);
}

async function verifyJWT(token: string): Promise<{ userId: string; sessionId?: string; email?: string }> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error("Invalid JWT format");

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = decodeJWTPart(headerB64);
  const payload = decodeJWTPart(payloadB64);

  // Check expiry
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    throw new Error("JWT expired");
  }

  // Find matching key
  const keys = await getJWKS();
  const key = keys.find(k => k.kid === header.kid);
  if (!key) throw new Error(`No matching JWK found for kid: ${header.kid}`);

  // Import the public key
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    { kty: key.kty, n: key.n, e: key.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Verify signature
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64urlToBuffer(signatureB64);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, signature, data);

  if (!valid) throw new Error("Invalid JWT signature");

  return {
    userId: payload.sub,
    sessionId: payload.sid,
    email: payload.email,
  };
}

// --- Known users cache (avoid DB lookup on every request) ---
const knownUserIds = new Set<string>();

async function ensureUserInDB(auth: { userId: string; email?: string }) {
  if (knownUserIds.has(auth.userId)) return;

  // Check if user exists in DB
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, auth.userId)).limit(1);
  if (existing.length > 0) {
    knownUserIds.add(auth.userId);
    return;
  }

  // Fetch user details from Clerk API and create local record
  let name = auth.email || "User";
  let email = auth.email || "";
  let profileImageUrl = "";

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (clerkSecretKey) {
    try {
      const res = await fetch(`https://api.clerk.com/v1/users/${auth.userId}`, {
        headers: { Authorization: `Bearer ${clerkSecretKey}` },
      });
      if (res.ok) {
        const userData = await res.json() as any;
        name = `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || email;
        email = userData.email_addresses?.[0]?.email_address || email;
        profileImageUrl = userData.image_url || "";
      }
    } catch {
      // Fallback to basic info
    }
  }

  await db.insert(users).values({
    id: auth.userId,
    name,
    email,
    role: "pm",
    profileImageUrl: profileImageUrl || null,
  }).onConflictDoNothing();

  knownUserIds.add(auth.userId);
}

// --- Express Middleware ---

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Skip auth in development if no Clerk domain configured
  if (!process.env.CLERK_DOMAIN) {
    req.auth = { userId: "dev-user" };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.slice(7);
  verifyJWT(token)
    .then(async (auth) => {
      req.auth = auth;
      // Sync user to DB in background (don't block the request)
      ensureUserInDB(auth).catch(err => console.error("User sync failed:", err));
      next();
    })
    .catch((err) => {
      console.error("Auth verification failed:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    });
}
