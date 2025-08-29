// @ts-nocheck

import express from "express"
import {createAuction, getAuction, getAuctions, updateAuction,deleteAuction} from "../controllers/auctionController.js"
const auctionRouter= express.Router();


auctionRouter.post('/', createAuction);
auctionRouter.get('/', getAuctions);
auctionRouter.get('/:id', getAuction);
auctionRouter.put('/:id', updateAuction);
auctionRouter.delete( '/:id', deleteAuction );

export default auctionRouter

