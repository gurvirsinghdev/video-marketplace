import { TRPCError } from "@trpc/server";
import { authRouter } from "./auth.router";
import { createTRPCRouter } from "../init";
import { userRouter } from "./user.router";
import { videoRouter } from "./video.router";

export function pipeThroughTRPCErrorHandler<T extends () => ReturnType<T>>(
  callbackFn: T,
): ReturnType<T> {
  try {
    return callbackFn();
  } catch (error) {
    console.log((error as Error).message);
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error, Please try again later!",
    });
  }
}

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  video: videoRouter,
});

export type AppRouter = typeof appRouter;
