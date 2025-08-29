// @ts-nocheck
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const { protectAdmin, authorizeRoles } = require( '../middlewares/adminAuth' );

// Admin-only routes
router.get('/users', protect, isAdmin, adminController.getAllUsers);
router.put('/users/role', protect, isAdmin, adminController.updateUserRole);
router.get( '/stats', protect, isAdmin, adminController.getDashboardStats );
router.patch('/approve/:userId', isAdmin, adminController.approveUser);
// Admin verify single uploaded document
router.put("/admin/users/verify-document/:userId",protectAdmin, authorizeRoles('superadmin'), adminController.verifyDocument);

router.get('/pending-dealers', isAdmin, adminController.getPendingDealers);



module.exports = router;
