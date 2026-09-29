import { getHomeData } from "../controllers/home.controller.js";
import express from "express";

const route = express.Router()

route.get("/", getHomeData)

export default route