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
  generateRotatingQrPayload,
  verifyRotatingQrPayload
};
