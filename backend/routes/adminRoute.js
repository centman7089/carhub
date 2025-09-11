// @ts-nocheck
import express from "express";
import { changePassword, createAdmin, forgotPassword, getAdminUser, getUserProfile, login, logoutUser, resendCode, resetPassword, updateUser, verifyEmail, verifyResetCode,   getUserDocuments,
  approveUserDocuments,
  rejectUserDocuments,
  getPendingUsers,getAllUsers,updateUserRole, 
  getUserById,getDealerById,getAllDealers,getAllAccounts, exportAccountsCSV, exportAccountsExcel, promoteUserToDealer, demoteDealerToUser,
  rejectDealerDocuments,
  approveDealerDocuments} from "../controllers/adminControllers.js";
import { authorizeRoles, protectAdmin } from "../middlewares/adminAuth.js";
import { vehicleImages } from "../middlewares/upload.js";
// import { cacheMiddleware } from "../middlewares/cache.js";
// import vehicleImages from "../middlewares/multer.js";



const adminRouter = express.Router()

adminRouter.post('/login', login)
adminRouter.post('/create', createAdmin)
adminRouter.post('/logout', logoutUser)
adminRouter.post('/resend-code', resendCode)
adminRouter.post('/change-password',protectAdmin, changePassword)
adminRouter.post('/verify-email', verifyEmail)
adminRouter.post('/forgot-password', forgotPassword)
adminRouter.post( '/verify-reset-code', verifyResetCode )
adminRouter.post( '/reset-password', resetPassword )

adminRouter.get( '/get', protectAdmin,getUserProfile )
adminRouter.get( '/admin-user', protectAdmin, getAdminUser )

adminRouter.get("/accounts", protectAdmin, authorizeRoles( ["superadmin", "admin"] ), getAllAccounts);

/**
 * 📤 Export accounts as CSV
 * GET /api/admin/accounts/export/csv
 */
adminRouter.get("/accounts/export/csv", protectAdmin, authorizeRoles(["superadmin", "admin"]), exportAccountsCSV);

/**
 * 📤 Export accounts as Excel (.xlsx)
 * GET /api/admin/accounts/export/excel
 */
adminRouter.get("/accounts/export/excel", protectAdmin, authorizeRoles(["superadmin", "admin"]), exportAccountsExcel);

// Admin-only routes
adminRouter.get("/users",protectAdmin, authorizeRoles(["superadmin", "admin"]),getAllUsers);

adminRouter.patch( "/update/:id", protectAdmin,updateUser );


// adminRouter.put('/verify-cac/:employerId',protectAdmin, authorizeRoles(["superadmin", "admin"],'superadmin'),verifyCac );
// Reject CAC
// Get one user’s documents
adminRouter.get("/users/:userId/documents",protectAdmin, authorizeRoles(["superadmin", "admin"]),getUserDocuments);
adminRouter.patch("/:userId/approve",protectAdmin, authorizeRoles(["superadmin", "admin"]), approveUserDocuments);
adminRouter.patch("/:dealerId/approve",protectAdmin, authorizeRoles(["superadmin", "admin"]), approveDealerDocuments);
adminRouter.patch( "/:dealerId/reject", protectAdmin, authorizeRoles( ["superadmin", "admin"] ), rejectDealerDocuments );

adminRouter.get("/users/:userId",protectAdmin, authorizeRoles(["superadmin", "admin"]),getUserById);
adminRouter.get("/dealers/:dealerId",protectAdmin, authorizeRoles(["superadmin", "admin"]),getDealerById);
adminRouter.put( "/users/:userId/role", protectAdmin, authorizeRoles( ["superadmin", "admin"]), updateUserRole );
// Only superadmins should be allowed to do this
adminRouter.post("/promote/:userId", protectAdmin, authorizeRoles(["superadmin", "admin"]), promoteUserToDealer);
adminRouter.post("/demote/:dealerId", protectAdmin, authorizeRoles(["superadmin", "admin"]), demoteDealerToUser);

// adminRouter.get( "/accounts", protectAdmin, authorizeRoles( ["superadmin", "admin"] ), cacheMiddleware( ( req ) => `accounts:${ JSON.stringify( req.query ) }`, 120 ), getAllAccounts );


export default adminRouter