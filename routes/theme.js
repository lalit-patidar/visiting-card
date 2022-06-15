import express from "express";
import { body } from "express-validator";
import auth from "../middlewares/auth";

const router = express.Router();


router.post('/create-package',createPackage);
