// @ts-nocheck

import express from "express"
import {getPopularListings} from "../controllers/listingController.js"
const router = express.Router();


router.get('/popular', getPopularListings);

export default router
