import { Router } from "express";
import { createVendor, getVendors } from "../controllers/vendorController";
import { jwtAuth } from "../middleware/auth";

const vendorRouter = Router();

vendorRouter.post("/create-vendor", jwtAuth, createVendor);
vendorRouter.get("/", getVendors);
