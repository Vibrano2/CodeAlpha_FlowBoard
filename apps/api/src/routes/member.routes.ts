import { Router } from "express";
import { addMember, listMembers, removeMember } from "../controllers/member.controller.js";

export const memberRouter = Router({ mergeParams: true });

memberRouter.route("/").get(listMembers).post(addMember);
memberRouter.delete("/:userId", removeMember);
