import Mailgun from "mailgun.js";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { THEME_SUPABASE } from "@openauthjs/openauth/ui/theme";
import { handle } from "hono/aws-lambda";
import { issuer } from "@openauthjs/openauth";
import { subjects } from "./subjects";

const mailgun = new Mailgun(FormData).client({
  username: "no-reply",
  key: process.env.MAILGUN_SENDING_KEY!,
});

const app = issuer({
  subjects,
  providers: {
    password: PasswordProvider(
      PasswordUI({
        async sendCode(email, code) {
          await mailgun.messages
            .create(process.env.MAILGUN_DOMAIN!, {
              from: `No-Reply <no-reply@${process.env.MAILGUN_DOMAIN!}>`,
              to: [email],
              subject: "Verify Your Email Address",
              text:
                code +
                "\nPlease enter this code to verify your email address. If you did not request this, please ignore this email.",
            })
            .then(console.log)
            .catch(console.error);
        },
      }),
    ),
  },
  theme: {
    ...THEME_SUPABASE,
    title: "VidIDPro Issuer",
    font: {
      family: "DM Sans, sans-serif",
    },
    logo: "https://vidid-drm.com/assets/images/jamie-vid-id-profile-image.png",
    favicon:
      "https://vidid-drm.com/assets/images/jamie-vid-id-profile-image.png",
    primary: "#127ab7",
    css: `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400&display=swap');`,
  },
  async success(ctx, value) {
    return ctx.subject("user", {
      email: value.email,
    });
  },
});
export const handler = handle(app);
