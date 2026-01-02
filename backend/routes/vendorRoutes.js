import { Router } from "express";
import { createVendor, getVendors } from "../controllers/vendorController.js";
import { jwtAuth } from "../middleware/auth.js";

const vendorRouter = Router();

vendorRouter.post("/create-vendor", jwtAuth, createVendor);
vendorRouter.get("/", getVendors);
