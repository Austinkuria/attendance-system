const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/apiKeyAuth');
const {
  syncRoster,
  getStudentExamEligibility,
  handleWebhookRegisterOrTest
} = require('../controllers/integrationController');

// All integration endpoints require valid scoped API Key authentication
router.use(requireApiKey);

// 1. Bulk roster synchronization (Idempotent upsert from SIS / ERP / CSV)
router.post('/roster/sync', syncRoster);

// 2. Exam clearance & attendance threshold evaluation
router.get('/students/:regNumber/eligibility', getStudentExamEligibility);

// 3. Webhook registration and delivery testing
router.post('/webhooks', handleWebhookRegisterOrTest);

module.exports = router;
