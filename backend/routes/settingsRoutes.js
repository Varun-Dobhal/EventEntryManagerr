const express = require("express");
const { 
  getProviders, 
  saveProvider, 
  testConnection, 
  getAuditLogs,
  getBatchSettings,
  saveBatchSettings
} = require("../controllers/settingsController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.use(authorize("ADMIN"));

router.get("/email-providers", getProviders);
router.post("/email-providers", saveProvider);
router.post("/test-email", testConnection);
router.get("/audit-logs", getAuditLogs);
router.get("/batch", getBatchSettings);
router.post("/batch", saveBatchSettings);

module.exports = router;

