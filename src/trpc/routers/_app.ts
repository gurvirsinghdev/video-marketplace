import { TRPCError } from "@trpc/server";
import { authRouter } from "./auth.router";
import { createTRPCRouter } from "../init";
import { tagsRouter } from "./tags.router";
import { userRouter } from "./user.router";
import { videoRouter } from "./video.router";
import { licenseRouter } from "./license.router";

export async function pipeThroughTRPCErrorHandler<
  // eslint-disable-next-line
  T extends () => any,
  R = ReturnType<T>,
>(callbackFn: T): Promise<R> {
  try {
    return await callbackFn();
  } catch (error) {
    console.error(error as Error);
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
  tags: tagsRouter,
  license: licenseRouter,
});

export type AppRouter = typeof appRouter;
