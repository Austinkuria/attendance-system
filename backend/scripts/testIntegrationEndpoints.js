const assert = require('assert');
const { isInstitutionalEmail, normalizeSSOProfile } = require('../utils/ssoUtils');
const { signPayload, verifyWebhookSignature } = require('../utils/webhookUtils');

console.log('--- Testing Institutional SSO Utilities ---');

// Test 1: Institutional email verification
assert.strictEqual(isInstitutionalEmail('student@strathmore.edu'), true);
assert.strictEqual(isInstitutionalEmail('lecturer@uonbi.ac.ke'), true);
assert.strictEqual(isInstitutionalEmail('student@ku.ac.ke'), true);
assert.strictEqual(isInstitutionalEmail('user@gmail.com'), false);
assert.strictEqual(isInstitutionalEmail('spammer@yahoo.com'), false);
console.log('✓ Institutional email checks passed.');

// Test 2: SSO Profile Normalization
const googlePayload = {
  email: 'alex.kuria@strathmore.edu',
  given_name: 'Alex',
  family_name: 'Kuria',
  sub: 'google_oidc_12345'
};
const normalized = normalizeSSOProfile(googlePayload, 'google');
assert.strictEqual(normalized.email, 'alex.kuria@strathmore.edu');
assert.strictEqual(normalized.firstName, 'Alex');
assert.strictEqual(normalized.authProvider, 'google');
assert.strictEqual(normalized.isInstitutional, true);
console.log('✓ Google SSO profile normalization passed.');

// Test 3: Webhook Signing and Verification
console.log('--- Testing Webhook Signature Utilities ---');
const secret = 'super-secret-integration-key-42';
const payload = {
  event: 'session.closed',
  sessionId: 'ses_998877',
  unitCode: 'SE301',
  timestamp: 1732087200
};

const signature = signPayload(payload, secret);
assert.strictEqual(typeof signature, 'string');
assert.strictEqual(signature.startsWith('sha256='), true);

const isValid = verifyWebhookSignature(payload, signature, secret);
assert.strictEqual(isValid, true, 'Valid signature should verify true');

const isTampered = verifyWebhookSignature({ ...payload, sessionId: 'tampered' }, signature, secret);
assert.strictEqual(isTampered, false, 'Tampered payload must fail verification');

const isWrongSecret = verifyWebhookSignature(payload, signature, 'wrong-secret');
assert.strictEqual(isWrongSecret, false, 'Wrong secret must fail verification');
console.log('✓ HMAC-SHA256 signature generation and verification passed.');

console.log('\nAll integration layer tests passed cleanly.');
