import { Router } from "express";

import * as contestController
  from "../controllers/contest.controller";

import { requireAuth }
  from "../middleware/auth.middleware";

import { validate }
  from "../middleware/validate.middleware";

import {
  createContestSchema,
  updateContestSchema,
  joinContestSchema,
  createPrivateContestSchema
} from "../validators/contest.validator";

const router = Router();

/*
|--------------------------------------------------------------------------
| PUBLIC READ APIs
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  contestController.listContests
);

/*
|--------------------------------------------------------------------------
| GET MY (JOINED) CONTESTS
| NOTE: must be declared before "/:contestId" so "my" is not
| swallowed by the dynamic param route. Requires auth.
|--------------------------------------------------------------------------
*/

router.get(
  "/my",
  requireAuth,
  contestController.getMyContests
);

router.get(
  "/:contestId",
  contestController.getContest
);

/*
|--------------------------------------------------------------------------
| AUTHENTICATED APIs
|--------------------------------------------------------------------------
*/

router.use(requireAuth);

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  validate(createContestSchema),
  contestController.createContest
);

/*
|--------------------------------------------------------------------------
| CREATE PRIVATE
|--------------------------------------------------------------------------
*/

router.post(
  "/private",
  validate(createPrivateContestSchema),
  contestController.createPrivateContest
);

/*
|--------------------------------------------------------------------------
| JOIN BY INVITE CODE
|--------------------------------------------------------------------------
*/

router.post(
  "/join-by-code",
  contestController.joinByInviteCode
);

/*
|--------------------------------------------------------------------------
| JOIN CONTEST
|--------------------------------------------------------------------------
*/

router.post(
  "/:contestId/join",
  validate(joinContestSchema),
  contestController.joinContest
);

/*
|--------------------------------------------------------------------------
| GENERATE INVITE
|--------------------------------------------------------------------------
*/

router.post(
  "/:contestId/invite",
  contestController.generateInvite
);

/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/

router.patch(
  "/:contestId",
  validate(updateContestSchema),
  contestController.updateContest
);

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

router.delete(
  "/:contestId",
  contestController.deleteContest
);

export default router;