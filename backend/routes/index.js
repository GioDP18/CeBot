const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const routeController = require('../controllers/routeController');

// Get all routes
router.get('/routes', routeController.getAllRoutes);

// Get routes by type
router.get('/routes/type/:type', routeController.getRoutesByType);

// Get route by code
router.get('/routes/:code', routeController.getRouteByCode);

// Search routes by origin and destination
router.post('/routes/search', routeController.searchRoutes);

// Get route statistics
router.get('/routes/stats/summary', routeController.getRouteStats);

// Get popular routes
router.get('/routes/popular', routeController.getPopularRoutes);

module.exports = router;
