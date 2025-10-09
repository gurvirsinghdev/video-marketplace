// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
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
     * Creates an ECS cluster within the VPC to run containerized app.
     */
    const appCluster = new sst.aws.Cluster("VididProApplicationCluster", {
      vpc: vpc,
    });

    const appService = new sst.aws.Service("VididProApplicationService", {
      cluster: appCluster,
      architecture: "arm64",
      loadBalancer: {
        ports: [{ listen: "80/http", forward: "3000/http" }],
      },
      dev: {
        command: "pnpm dev",
      },
    });

    return {
      appUrl: appService.url,
    };
  },
});
