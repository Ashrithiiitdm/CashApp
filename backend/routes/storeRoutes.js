import { Router } from "express";
import { jwtAuth } from "../middleware/auth.js";
import {
    addStore,
    getStores,
    searchStores,
    getStoreDetails,
    getStoreRecentTransactions,
} from "../controllers/storeController.js";

const storeRouter = Router();

storeRouter.post("/", jwtAuth, addStore);
storeRouter.get("/", getStores);
storeRouter.get("/transactions/:store_id", getStoreRecentTransactions);
storeRouter.get("/search", searchStores);
storeRouter.get("/:storeId", getStoreDetails);

export default storeRouter;
