CREATE TABLE "user" (
	"email" varchar PRIMARY KEY NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
