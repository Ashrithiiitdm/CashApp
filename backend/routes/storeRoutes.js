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
    addItems,
    updateStore,
} from "../controllers/storeController.js";

const storeRouter = Router();

storeRouter.post("/", jwtAuth, addStore);
storeRouter.post("/extract-items", jwtAuth, upload.single("file"), extractItems);
storeRouter.post("/add-items", jwtAuth, addItems);
storeRouter.get("/", jwtAuth, getStores);
storeRouter.get("/transactions/:store_id", getStoreRecentTransactions);
storeRouter.get("/search", searchStores);
storeRouter.get("/:storeId", getStoreDetails);
storeRouter.put("/update", jwtAuth, updateStore);

export default storeRouter;
