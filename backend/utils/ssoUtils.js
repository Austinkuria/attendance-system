/**
 * Institutional SSO and Identity Verification Utilities
 * Supports Google Workspace for Education, Microsoft Entra ID, and SAML 2.0.
 */

const DEFAULT_INSTITUTIONAL_DOMAINS = [
  '.ac.ke',
  '.edu',
  '.edu.ke',
  'strathmore.edu',
  'uonbi.ac.ke',
  'ku.ac.ke',
  'jkuat.ac.ke'
];

/**
 * Validates whether an email belongs to an allowed institutional domain.
 * @param {string} email
 * @param {string[]} [customDomains]
 * @returns {boolean}
 */
const isInstitutionalEmail = (email, customDomains = []) => {
  if (!email || typeof email !== 'string') return false;
  const emailLower = email.toLowerCase().trim();
  const domain = emailLower.split('@')[1];
  if (!domain) return false;

  const envDomains = process.env.INSTITUTIONAL_DOMAINS
    ? process.env.INSTITUTIONAL_DOMAINS.split(',').map(d => d.trim().toLowerCase())
    : [];

  const candidateDomains = [...customDomains, ...envDomains, ...DEFAULT_INSTITUTIONAL_DOMAINS];

  return candidateDomains.some((d) => {
    if (d.startsWith('.')) {
      return domain.endsWith(d.slice(1)) || domain.endsWith(d);
    }
    return domain === d || domain.endsWith(`.${d}`);
  });
};

/**
 * Extracts and maps identity fields from an OAuth2 / OIDC token payload
 * (Google Workspace or Microsoft Entra ID).
 * @param {Object} payload Decoded user payload from provider
 * @param {string} provider 'google' | 'microsoft' | 'saml'
 * @returns {Object} Normalized user profile
 */
const normalizeSSOProfile = (payload, provider = 'google') => {
  if (!payload) return null;

  let email = '';
  let firstName = '';
  let lastName = '';
  let providerId = '';

  if (provider === 'google') {
    email = payload.email || '';
    firstName = payload.given_name || payload.name?.split(' ')[0] || '';
    lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';
    providerId = payload.sub || payload.id || '';
  } else if (provider === 'microsoft') {
    email = payload.preferred_username || payload.email || payload.upn || '';
    firstName = payload.given_name || payload.name?.split(' ')[0] || '';
    lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';
    providerId = payload.oid || payload.sub || '';
  } else {
    email = payload.email || '';
    firstName = payload.firstName || '';
    lastName = payload.lastName || '';
    providerId = payload.id || '';
  }

  return {
    email: email.toLowerCase().trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    authProvider: provider,
    authProviderId: providerId,
    isInstitutional: isInstitutionalEmail(email)
  };
};

module.exports = {
  isInstitutionalEmail,
  normalizeSSOProfile,
  DEFAULT_INSTITUTIONAL_DOMAINS
};
