const crypto = require("crypto");
const QRCode = require("qrcode");

const generateManualPin = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pin = "";
  for (let i = 0; i < 6; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
};

/**
 * Generate 30-second rotating TOTP session PIN
 * Derived deterministically from session secret and current time slot
 */
const generateRotatingPin = (session, slotOffset = 0) => {
  const secret = getSecretForSession(session);
  const now = Date.now();
  const slot = Math.floor(now / 30000) + slotOffset;
  const hash = crypto.createHmac("sha256", secret)
    .update(`PIN:${session._id}:${slot}`)
    .digest("hex");

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pin = "";
  for (let i = 0; i < 6; i++) {
    const idx = parseInt(hash.substr(i * 4, 4), 16) % chars.length;
    pin += chars.charAt(idx);
  }
  return pin;
};

/**
 * Verify input PIN against rotating TOTP slots and optional static session fallback
 */
const verifySessionPin = (session, inputPin) => {
  if (!inputPin || typeof inputPin !== 'string') {
    return { valid: false, reason: "Manual PIN required" };
  }
  const cleanPin = inputPin.trim().toUpperCase();

  // 1. Check current 30s rotating TOTP PIN
  const currentPin = generateRotatingPin(session, 0);
  if (cleanPin === currentPin) {
    return { valid: true, type: "ROTATING_TOTP" };
  }

  // 2. Check previous 30s rotating TOTP PIN (clock skew grace window)
  const prevPin = generateRotatingPin(session, -1);
  if (cleanPin === prevPin) {
    return { valid: true, type: "ROTATING_TOTP" };
  }

  // 3. Fallback to session static manual_pin if configured
  if (session.manual_pin && cleanPin === session.manual_pin.trim().toUpperCase()) {
    return { valid: true, type: "STATIC_PIN" };
  }

  return { valid: false, reason: "Invalid or expired session PIN" };
};

/**
 * Calculate distance between two coordinates using the Haversine formula (meters)
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getSecretForSession = (session) => {
  return session.qr_secret || process.env.QR_SECRET_KEY || process.env.JWT_SECRET || "qrollcall_session_secret";
};

const generateRotatingQrPayload = async (session) => {
  const sessionId = session._id.toString();
  const secret = getSecretForSession(session);
  const now = Date.now();
  const slot = Math.floor(now / 30000);
  const nonce = crypto.randomBytes(8).toString("hex");

  const hmac = crypto.createHmac("sha256", secret)
    .update(`${sessionId}:${slot}:${nonce}`)
    .digest("hex");

  const payload = {
    sessionId,
    slot,
    nonce,
    hmac,
    expiresAt: (slot + 1) * 30000 + 5000 // 5-second clock skew grace
  };

  const rawString = JSON.stringify(payload);
  const base64Token = Buffer.from(rawString).toString("base64");
  const qrCodeDataUrl = await QRCode.toDataURL(base64Token, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 420,
    color: {
      dark: "#131926",
      light: "#FFFFFF"
    }
  });

  return {
    qrToken: base64Token,
    qrCode: qrCodeDataUrl,
    slot,
    expiresAt: payload.expiresAt,
    secondsRemaining: Math.max(0, Math.floor(((slot + 1) * 30000 - now) / 1000))
  };
};

const verifyRotatingQrPayload = (session, rawToken) => {
  try {
    let payload = null;
    if (typeof rawToken === "string") {
      try {
        const decoded = Buffer.from(rawToken, "base64").toString("utf-8");
        payload = JSON.parse(decoded);
      } catch {
        payload = JSON.parse(rawToken);
      }
    } else if (typeof rawToken === "object") {
      payload = rawToken;
    }

    if (!payload || !payload.sessionId || payload.slot === undefined || !payload.nonce || !payload.hmac) {
      // Legacy QR fallback support
      if (payload && (payload.s || payload.sessionId)) {
        const sid = payload.s || payload.sessionId;
        if (sid.toString() === session._id.toString()) {
          return { valid: true, method: "QR_LEGACY" };
        }
      }
      return { valid: false, reason: "Malformed QR token payload" };
    }

    if (payload.sessionId.toString() !== session._id.toString()) {
      return { valid: false, reason: "QR token does not match active session" };
    }

    const currentSlot = Math.floor(Date.now() / 30000);
    // Accept current 30s slot or previous 30s slot (within 35s grace window)
    if (payload.slot !== currentSlot && payload.slot !== currentSlot - 1) {
      return { valid: false, reason: "QR code expired. Please scan the current rotating code." };
    }

    const secret = getSecretForSession(session);
    const expectedHmac = crypto.createHmac("sha256", secret)
      .update(`${payload.sessionId}:${payload.slot}:${payload.nonce}`)
      .digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(payload.hmac), Buffer.from(expectedHmac))) {
      return { valid: true, method: "QR_DYNAMIC" };
    }

    return { valid: false, reason: "Invalid QR code signature" };
  } catch (err) {
    return { valid: false, reason: "QR verification error: " + err.message };
  }
};

module.exports = {
  generateManualPin,
  generateRotatingPin,
  verifySessionPin,
  calculateHaversineDistance,
  generateRotatingQrPayload,
  verifyRotatingQrPayload
};
