import { Router } from "express";
import { createUser, getUsers } from "../controllers/users.controller";
import { validate } from "../middlewares/validate";
import { createUserSchema } from "../schemas/user.schema";

const router = Router();

router.post("/", validate(createUserSchema), createUser);
router.get("/", getUsers);

export default router;
