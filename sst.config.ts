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
          region: "ap-south-1",
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
    const applicationVPC = new sst.aws.Vpc("ApplicationVPC", {
      nat: {
        type: "ec2",
        ec2: {
          instance: "t4g.micro",
        },
      },
      transform: {
        natInstance: {
          associatePublicIpAddress: true,
        },
      },
    });

    /**
     * Setting up an OpenAuth Authorizer
     */
    const auth = new sst.aws.Auth("OpenAuth", {
      issuer: {
        handler: "openauth/index.handler",
        environment: {
          MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN!,
          MAILGUN_SENDING_KEY: process.env.MAILGUN_SENDING_KEY!,
        },
      },
      domain:
        $app.stage != "prod"
          ? undefined
          : { name: "auth.yoursite.live", dns: sst.cloudflare.dns() },
    });

    /**
     * Setting up a SQS queue to store video processing jobs.
     */
    const queue = new sst.aws.Queue("UnprocessedVideosQueue");

    /**
     * Setting up a S3 bucket to store videos.
     */
    const { cloudfront } = await import("@pulumi/aws");
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      "VididProOriginAccessIdentity",
    );
    const s3 = new sst.aws.Bucket("S3", {
      policy: [
        {
          effect: "allow",
          principals: [
            {
              type: "aws",
              identifiers: [originAccessIdentity.iamArn],
            },
          ],
          paths: ["thumbnails/*", "m3u8/*"],
          actions: ["s3:GetObject"],
        },
      ],
    });

    /**
     * Setting up a PostgreSQL database to store data.
     */
    const db = new sst.aws.Postgres("DB", {
      vpc: applicationVPC,
      version: "17.2",
      multiAz: false,
      dev: {
        host: "localhost",
        database: "vididpro",
        password: "password",
        port: 5432,
        username: "admin",
      },
      transform: {
        instance: {
          publiclyAccessible: true,
        },
        subnetGroup: {
          subnetIds: applicationVPC.publicSubnets,
        },
      },
    });

    /**
     * Setting up a Lambda function to process videos.
     */
    const videoProcessorPath = "lambdas/video-processor";
    const videoProcessor = new sst.aws.Function("VideoProcessor", {
      copyFiles: [
        { from: videoProcessorPath + "/watermark.png", to: "watermark.png" },
        {
          from: `${videoProcessorPath}/ffmpeg-${$app.stage != "prod" ? "m" : "arm64"}`,
          to: "ffmpeg-arm64",
        },
        { from: videoProcessorPath + "/drizzle.ts", to: "drizzle.ts" },
        { from: videoProcessorPath + "/app.schema.ts", to: "app.schema.ts" },
      ],
      architecture: "arm64",
      link: [queue, s3, db],
      handler: "lambdas/video-processor/index.handler",
      memory: "4096 MB",
      timeout: "30 seconds",
      nodejs: { install: ["mime", "chalk", "drizzle-orm", "pg"] },
    });

    /**
     * Sending ObjectCreated events to the queue.
     */
    s3.notify({
      notifications: [
        {
          queue,
          name: "ProcessVideo",
          filterPrefix: "original/",
          events: ["s3:ObjectCreated:Put"],
        },
      ],
    });

    /**
     * Setting up a Lambda trigger to process arriving videos.
     */
    queue.subscribe(videoProcessor.arn);

    /**
     * Setting up a CloudFront distribution to serve the videos
     * from the S3 bucket with minimal latency.
     */
    const videosCdnOriginId = "VididProVideosCdn";
    const defaultCacheBehavior = {
      targetOriginId: videosCdnOriginId,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      forwardedValues: {
        queryString: false,
        cookies: { forward: "none" },
        headers: ["Content-Length"],
      },
    };
    const videosCdn = new sst.aws.Cdn("VideosCdn", {
      origins: [
        {
          domainName: s3.domain,
          originId: videosCdnOriginId,
          s3OriginConfig: {
            originAccessIdentity:
              originAccessIdentity.cloudfrontAccessIdentityPath,
          },
        },
      ],
      defaultCacheBehavior,
      orderedCacheBehaviors: [
        {
          ...defaultCacheBehavior,
          pathPattern: "/thumbnails/*",
        },
        { ...defaultCacheBehavior, pathPattern: "/m3u8/*" },
      ],
    });
    const linkableVideosCdn = new sst.Linkable("Cdn", {
      properties: {
        url: videosCdn.url,
      },
    });

    /**
     * Setting up the application.
     */
    new sst.aws.Nextjs("Application", {
      vpc: applicationVPC,
      link: [auth, db, s3, linkableVideosCdn],
      domain:
        $app.stage != "prod"
          ? undefined
          : { name: "yoursite.live", dns: sst.cloudflare.dns() },
      environment: {
        NODE_ENV: $app.stage != "prod" ? "development" : "production",
      },
      server: {
        architecture: "arm64",
        install: ["pg"],
      },
      dev: {
        command: "npm run dev",
      },
    });
  },
});
