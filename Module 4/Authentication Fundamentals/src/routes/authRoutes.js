const express = require('express');
const authService = require('../services/authService');
const router = express.Router();
router.post('/register', async (req, res, next) => {
try {
const user = await authService.register(req.body);
res.status(201).json({ data: user });
} catch (error) {
next(error);
}
});
router.post('/login', async (req, res, next) => {
try {
const user = await authService.login(req.body);
res.status(200).json({ data: user });
} catch (error) {
next(error);
}
});
module.exports = router;