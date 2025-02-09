const express = require('express');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');

const router = express.Router();

router.use('/', userRoutes);
router.use('/students', studentRoutes);

module.exports = router;
