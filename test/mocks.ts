import * as pulumi from '@pulumi/pulumi';
import { MockCallArgs, MockResourceArgs } from '@pulumi/pulumi/runtime';

/**
 * Convert a pulumi.Output to a promise of the same type.
 * Useful for assertions in tests.
 */
export function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => output.apply(resolve));
}

/**
 * Configure Pulumi runtime mocks for testing.
 *
 * @param resources Optional array to capture all created resources
 */
export function setMocks(resources?: MockResourceArgs[]) {
  const mocks: pulumi.runtime.Mocks = {
    call: (args: MockCallArgs): { [id: string]: any } => {
      switch (args.token) {
        case 'aws:index/getCallerIdentity:getCallerIdentity':
          return { accountId: '123456789012' };
        case 'aws:index/getRegion:getRegion':
          return { name: 'us-east-1' };
        default:
          return {};
      }
    },
    newResource: (args: MockResourceArgs): { id: string; state: any } => {
      // Generate mock IDs and ARNs based on resource type
      const id = `${args.name}-id`;
      const arn = `arn:aws:${args.type.split(':')[1]}:us-east-1:123456789012:${args.name}`;

      // Handle component resources (they return empty state)
      if (
        args.type === 'aws:s3:BucketEventSubscription' ||
        args.type === 'aws:lambda:EventSubscription' ||
        args.type.startsWith('pulumi:')
      ) {
        return { id: '', state: {} };
      }

      // Capture non-component resources
      resources?.push(args);

      switch (args.type) {
        case 'aws:s3/bucket:Bucket':
          return {
            id,
            state: {
              ...args.inputs,
              id,
              arn: `arn:aws:s3:::${args.name}`,
              bucket: args.name,
            },
          };
        case 'aws:lambda/function:Function':
          return {
            id,
            state: {
              ...args.inputs,
              id,
              arn: `arn:aws:lambda:us-east-1:123456789012:function:${args.name}`,
              name: args.name,
            },
          };
        case 'aws:lambda/permission:Permission':
          return {
            id,
            state: {
              ...args.inputs,
              id,
            },
          };
        case 'aws:iam/role:Role':
          return {
            id,
            state: {
              ...args.inputs,
              id,
              arn: `arn:aws:iam::123456789012:role/${args.name}`,
              name: args.name,
            },
          };
        case 'aws:iam/rolePolicy:RolePolicy':
          return {
            id,
            state: {
              ...args.inputs,
              id,
            },
          };
        default:
          return {
            id,
            state: {
              ...args.inputs,
              id,
              arn,
            },
          };
      }
    },
  };

  void pulumi.runtime.setMocks(mocks, 'test-project', 'test-stack', false);
}
