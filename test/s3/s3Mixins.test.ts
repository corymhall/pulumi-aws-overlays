import * as aws from '@pulumi/aws';
import { MockResourceArgs } from '@pulumi/pulumi/runtime';
// Import the mixins to augment aws.s3.Bucket and get types
import { BucketEvent, BucketEventSubscription } from '../../src/s3/s3Mixins';
import { promiseOf, setMocks } from '../mocks';

// Resources captured during test run
const resources: MockResourceArgs[] = [];

// Set up mocks once for all tests
beforeAll(() => {
  setMocks(resources);
});

// Clear resources between tests
beforeEach(() => {
  resources.length = 0;
});

const testHandler = async (event: BucketEvent) => {
  // Simple test handler
};

describe('S3 Bucket Event Subscriptions', () => {
  describe('module augmentation', () => {
    it('uses our BucketEventSubscription class', () => {
      const bucket = new aws.s3.Bucket('test-bucket-augment');
      const subscription = bucket.onObjectCreated(
        'test-sub-augment',
        testHandler,
      );

      // This verifies we're using OUR BucketEventSubscription class.
      // The instanceof check uses the class identity from our module import.
      // If @pulumi/aws's built-in implementation was used instead, it would
      // return their BucketEventSubscription class (different identity),
      // and this check would fail.
      expect(subscription).toBeInstanceOf(BucketEventSubscription);
    });

    it('has mixin methods on Bucket prototype', () => {
      expect(typeof aws.s3.Bucket.prototype.onObjectCreated).toBe('function');
      expect(typeof aws.s3.Bucket.prototype.onObjectRemoved).toBe('function');
      expect(typeof aws.s3.Bucket.prototype.onEvent).toBe('function');
    });
  });

  describe('onObjectCreated', () => {
    it('creates a BucketEventSubscription', () => {
      const bucket = new aws.s3.Bucket('test-bucket-1');
      const subscription = bucket.onObjectCreated('test-sub-1', testHandler);

      expect(subscription).toBeInstanceOf(BucketEventSubscription);
      expect(subscription.bucket).toBe(bucket);
    });

    it('creates a Lambda function', async () => {
      const bucket = new aws.s3.Bucket('test-bucket-2');
      const subscription = bucket.onObjectCreated('test-sub-2', testHandler);

      // Wait for async resource creation
      await promiseOf(subscription.func.arn);

      const lambdaFunctions = resources.filter(
        (r) => r.type === 'aws:lambda/function:Function',
      );
      expect(lambdaFunctions.length).toBeGreaterThanOrEqual(1);
    });

    it('creates a Lambda Permission with correct principal', async () => {
      const bucket = new aws.s3.Bucket('test-bucket-3');
      const subscription = bucket.onObjectCreated('test-sub-3', testHandler);

      // Wait for permission to be created
      await promiseOf(subscription.permission.id);

      const permissions = resources.filter(
        (r) => r.type === 'aws:lambda/permission:Permission',
      );
      expect(permissions.length).toBeGreaterThanOrEqual(1);

      const permission = permissions[permissions.length - 1];
      expect(permission.inputs.principal).toBe('s3.amazonaws.com');
      expect(permission.inputs.action).toBe('lambda:InvokeFunction');
    });

    it('supports specific event type Put', () => {
      const bucket = new aws.s3.Bucket('test-bucket-4');
      const sub = bucket.onObjectCreated('sub-put', testHandler, {
        event: 'Put',
      });
      expect(sub).toBeInstanceOf(BucketEventSubscription);
    });

    it('supports specific event type Post', () => {
      const bucket = new aws.s3.Bucket('test-bucket-5');
      const sub = bucket.onObjectCreated('sub-post', testHandler, {
        event: 'Post',
      });
      expect(sub).toBeInstanceOf(BucketEventSubscription);
    });

    it('supports specific event type Copy', () => {
      const bucket = new aws.s3.Bucket('test-bucket-6');
      const sub = bucket.onObjectCreated('sub-copy', testHandler, {
        event: 'Copy',
      });
      expect(sub).toBeInstanceOf(BucketEventSubscription);
    });

    it('supports specific event type CompleteMultipartUpload', () => {
      const bucket = new aws.s3.Bucket('test-bucket-7');
      const sub = bucket.onObjectCreated('sub-multipart', testHandler, {
        event: 'CompleteMultipartUpload',
      });
      expect(sub).toBeInstanceOf(BucketEventSubscription);
    });
  });

  describe('onObjectRemoved', () => {
    it('creates a BucketEventSubscription', () => {
      const bucket = new aws.s3.Bucket('test-bucket-8');
      const subscription = bucket.onObjectRemoved('test-sub-8', testHandler);

      expect(subscription).toBeInstanceOf(BucketEventSubscription);
      expect(subscription.bucket).toBe(bucket);
    });

    it('supports Delete event type', () => {
      const bucket = new aws.s3.Bucket('test-bucket-9');
      const sub = bucket.onObjectRemoved('sub-delete', testHandler, {
        event: 'Delete',
      });
      expect(sub).toBeInstanceOf(BucketEventSubscription);
    });

    it('supports DeleteMarkerCreated event type', () => {
      const bucket = new aws.s3.Bucket('test-bucket-10');
      const sub = bucket.onObjectRemoved('sub-marker', testHandler, {
        event: 'DeleteMarkerCreated',
      });
      expect(sub).toBeInstanceOf(BucketEventSubscription);
    });
  });

  describe('onEvent', () => {
    it('creates a BucketEventSubscription with custom events', () => {
      const bucket = new aws.s3.Bucket('test-bucket-11');
      const subscription = bucket.onEvent('test-sub-11', testHandler, {
        events: ['s3:ObjectCreated:Put', 's3:ObjectRemoved:Delete'],
      });

      expect(subscription).toBeInstanceOf(BucketEventSubscription);
    });

    it('accepts filter prefix', () => {
      const bucket = new aws.s3.Bucket('test-bucket-12');
      const subscription = bucket.onEvent('test-sub-12', testHandler, {
        events: ['s3:ObjectCreated:*'],
        filterPrefix: 'uploads/',
      });

      expect(subscription).toBeInstanceOf(BucketEventSubscription);
    });

    it('accepts filter suffix', () => {
      const bucket = new aws.s3.Bucket('test-bucket-13');
      const subscription = bucket.onEvent('test-sub-13', testHandler, {
        events: ['s3:ObjectCreated:*'],
        filterSuffix: '.json',
      });

      expect(subscription).toBeInstanceOf(BucketEventSubscription);
    });

    it('accepts both filter prefix and suffix', () => {
      const bucket = new aws.s3.Bucket('test-bucket-14');
      const subscription = bucket.onEvent('test-sub-14', testHandler, {
        events: ['s3:ObjectCreated:*'],
        filterPrefix: 'data/',
        filterSuffix: '.csv',
      });

      expect(subscription).toBeInstanceOf(BucketEventSubscription);
    });
  });

  describe('BucketEventSubscription properties', () => {
    it('has bucket reference', () => {
      const bucket = new aws.s3.Bucket('test-bucket-15');
      const subscription = bucket.onObjectCreated('test-sub-15', testHandler);

      expect(subscription.bucket).toBe(bucket);
    });

    it('has func property (Lambda function)', async () => {
      const bucket = new aws.s3.Bucket('test-bucket-16');
      const subscription = bucket.onObjectCreated('test-sub-16', testHandler);

      expect(subscription.func).toBeDefined();
      const arn = await promiseOf(subscription.func.arn);
      expect(arn).toContain('lambda');
    });

    it('has permission property', async () => {
      const bucket = new aws.s3.Bucket('test-bucket-17');
      const subscription = bucket.onObjectCreated('test-sub-17', testHandler);

      expect(subscription.permission).toBeDefined();
      const id = await promiseOf(subscription.permission.id);
      expect(id).toBeDefined();
    });

    it('creates Permission with sourceArn from bucket', async () => {
      const bucket = new aws.s3.Bucket('test-bucket-18');
      const subscription = bucket.onObjectCreated('test-sub-18', testHandler);

      await promiseOf(subscription.permission.id);

      const permissions = resources.filter(
        (r) => r.type === 'aws:lambda/permission:Permission',
      );
      const lastPermission = permissions[permissions.length - 1];

      expect(lastPermission.inputs.sourceArn).toBeDefined();
    });
  });
});
