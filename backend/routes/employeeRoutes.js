import { Router } from "express";
import { jwtAuth } from "../middleware/auth.js";
import upload from "../middleware/multer";
import {
    getAllEmployees,
    updateDetails,
} from "../controllers/employeeController.js";
const employeeRouter = Router();

employeeRouter.post(
    "/update-details",
    jwtAuth,
    upload.single("profile"),
    updateDetails
);

employeeRouter.get("/", getAllEmployees);

export default employeeRouter;
