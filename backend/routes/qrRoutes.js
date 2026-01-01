import { Router } from "express";
import {
    resolveStaticQr,
    createDynamicQr,
    resolveDynamicQr,
} from "../controllers/qrController.js";
import { jwtAuth } from "../middleware/auth.js";

const qrRouter = Router();

// Resolve static QR (user or store)
qrRouter.post("/resolve-static", resolveStaticQr);

// Create dynamic QR token for payment
qrRouter.post("/create-dynamic", jwtAuth, createDynamicQr);

// Resolve dynamic QR token
qrRouter.get("/resolve-dynamic/:qrToken", resolveDynamicQr);

export default qrRouter;
