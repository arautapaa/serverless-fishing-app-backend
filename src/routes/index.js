const express = require('express');
const router = express.Router();
const middlewares = require('../middlewares');

router.use("/selections", middlewares.userGroup, require("./selections-router"));
router.use("/draughts",  middlewares.userGroup, require('./draughts-router'));
router.use("/places",  middlewares.userGroup, require('./places-router'));
router.use('/user',  require('./user-router'));

module.exports = router;