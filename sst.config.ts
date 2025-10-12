// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app() {
    return {
      name: "vididpro",
      removal: "remove",
      home: "aws",
      providers: {
        aws: {
          region: "eu-west-2",
        },
        cloudflare: {
          apiToken: process.env.CLOUDFLARE_API_TOKEN!,
        },
      },
    };
  },
  async run() {
    /**
     * Setting up a VPC using a more traditional approach (pre-2015).
     * This configuration includes an EC2 instance acting as the NAT
     * gateway rather than a more modern managed NAT gateway option.
     *
     * The managed NAT gateway is an overkill here.
     */
    const vpc = new sst.aws.Vpc("VididProVPC", {
      nat: {
        type: "ec2",
        ec2: {
          instance: "t4g.micro",
        },
      },
    });

    /**
     * Setting up an OpenAuth Issuer server
     */
    const auth = new sst.aws.Auth("VidIDProAuthServer", {
      issuer: {
        handler: "openauth/index.handler",
        environment: {
          MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN!,
          MAILGUN_SENDING_KEY: process.env.MAILGUN_SENDING_KEY!,
        },
      },
      domain: {
        name: "auth.yoursite.live",
        dns: sst.cloudflare.dns(),
      },
    });

    /**
     * Creates an ECS cluster within the VPC to run containerized app.
     */
    const appCluster = new sst.aws.Cluster("VididProApplicationCluster", {
      vpc: vpc,
    });

    /**
     * Setting up a relational PostgresSQL database to store data.
     */
    const db = new sst.aws.Postgres("VididProPostgresDB", {
      vpc: vpc,
      database: "vididpro_db",
      dev: {
        host: "localhost",
        port: 5432,
        username: "admin",
        password: "password",
        database: "vididpro_db",
      },
    });

    /**
     * Setting up an S3 bucket to store video
     * files. Since we have not provided public
     * access, we will be using CloudFront to
     * deliver videos quickly to users.
     */
    const bucket = new sst.aws.Bucket("VididProObjectStorage");

    /**
     * Setting up a CloudFront distribution to
     * serve the application and video files
     * with the least possible latency.
     */
    const router = new sst.aws.Router("VididProRouter", {});

    /**
     * Creates a service within the ECS Cluster to run the containerized
     * Next.js application.
     */
    const application = new sst.aws.Service("VididProApplicationService", {
      cluster: appCluster,
      architecture: "arm64",
      link: [auth, db, bucket, router],
      loadBalancer: {
        ports: [{ listen: "80/http", redirect: "3000/http" }],
      },
      dev: {
        command: "pnpm dev",
      },
    });

    /**
     * Navigating the traffic to the application
     */
    router.route("/", application.url);
  },
});
