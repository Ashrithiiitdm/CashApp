import { Router } from "express";
import { jwtAuth } from "../middleware/auth.js";
import upload from "../middleware/multer.js";
import {
    addStore,
    getStores,
    searchStores,
    getStoreDetails,
    getStoreRecentTransactions,
    extractItems,
} from "../controllers/storeController.js";

const storeRouter = Router();

storeRouter.post("/", jwtAuth, addStore);
storeRouter.post("/extract-items", jwtAuth, upload.single("file"), extractItems);
storeRouter.get("/", jwtAuth, getStores);
storeRouter.get("/transactions/:store_id", getStoreRecentTransactions);
storeRouter.get("/search", searchStores);
storeRouter.get("/:storeId", getStoreDetails);

export default storeRouter;
