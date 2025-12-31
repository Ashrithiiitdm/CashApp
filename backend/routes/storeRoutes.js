import { Router } from "express";
import { jwtAuth } from "../middleware/auth";
import { addStore, getStores } from "../controllers/storeController";

const storeRouter = Router();

storeRouter.post("/", jwtAuth, addStore);
storeRouter.get("/", getStores);

export default storeRouter;
