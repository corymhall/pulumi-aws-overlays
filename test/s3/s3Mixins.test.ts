import * as aws from '@pulumi/aws';
import { MockResourceArgs } from '@pulumi/pulumi/runtime';
// Import the mixins to augment aws.s3.Bucket and get types
import {
  BucketEvent,
  BucketEventSubscription,
  BucketGrantArgs,
} from '../../src/s3/s3Mixins';
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

describe('S3 Bucket Grant Methods', () => {
  const assumeRolePolicy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: { Service: 'lambda.amazonaws.com' },
      },
    ],
  });

  describe('module augmentation', () => {
    it('has grant methods on Bucket prototype', () => {
      expect(typeof aws.s3.Bucket.prototype.grantRead).toBe('function');
      expect(typeof aws.s3.Bucket.prototype.grantWrite).toBe('function');
      expect(typeof aws.s3.Bucket.prototype.grantPut).toBe('function');
      expect(typeof aws.s3.Bucket.prototype.grantDelete).toBe('function');
      expect(typeof aws.s3.Bucket.prototype.grantReadWrite).toBe('function');
    });
  });

  describe('grantRead', () => {
    it('creates a RolePolicy with read permissions', async () => {
      const bucket = new aws.s3.Bucket('grant-read-bucket-1');
      const role = new aws.iam.Role('grant-read-role-1', { assumeRolePolicy });

      const policy = bucket.grantRead('grant-read-policy-1', role);

      await promiseOf(policy.id);

      const rolePolicies = resources.filter(
        (r) => r.type === 'aws:iam/rolePolicy:RolePolicy',
      );
      expect(rolePolicies.length).toBeGreaterThanOrEqual(1);
    });

    it('includes correct read actions in policy', async () => {
      const bucket = new aws.s3.Bucket('grant-read-bucket-2');
      const role = new aws.iam.Role('grant-read-role-2', { assumeRolePolicy });

      const policy = bucket.grantRead('grant-read-policy-2', role);

      const policyDoc = await promiseOf(policy.policy);
      expect(policyDoc).toContain('s3:GetObject*');
      expect(policyDoc).toContain('s3:GetBucket*');
      expect(policyDoc).toContain('s3:List*');
    });

    it('respects objectsKeyPattern argument', async () => {
      const bucket = new aws.s3.Bucket('grant-read-bucket-3');
      const role = new aws.iam.Role('grant-read-role-3', { assumeRolePolicy });

      const args: BucketGrantArgs = { objectsKeyPattern: 'uploads/*' };
      const policy = bucket.grantRead('grant-read-policy-3', role, args);

      const policyDoc = await promiseOf(policy.policy);
      expect(policyDoc).toContain('uploads/*');
    });
  });

  describe('grantWrite', () => {
    it('creates a RolePolicy with write permissions', async () => {
      const bucket = new aws.s3.Bucket('grant-write-bucket-1');
      const role = new aws.iam.Role('grant-write-role-1', { assumeRolePolicy });

      const policy = bucket.grantWrite('grant-write-policy-1', role);

      await promiseOf(policy.id);

      const rolePolicies = resources.filter(
        (r) => r.type === 'aws:iam/rolePolicy:RolePolicy',
      );
      expect(rolePolicies.length).toBeGreaterThanOrEqual(1);
    });

    it('includes correct write actions in policy', async () => {
      const bucket = new aws.s3.Bucket('grant-write-bucket-2');
      const role = new aws.iam.Role('grant-write-role-2', { assumeRolePolicy });

      const policy = bucket.grantWrite('grant-write-policy-2', role);

      const policyDoc = await promiseOf(policy.policy);
      // Modern CDK-style put actions (no wildcard on PutObject)
      expect(policyDoc).toContain('s3:PutObject');
      expect(policyDoc).toContain('s3:PutObjectLegalHold');
      expect(policyDoc).toContain('s3:PutObjectRetention');
      expect(policyDoc).toContain('s3:PutObjectTagging');
      expect(policyDoc).toContain('s3:PutObjectVersionTagging');
      expect(policyDoc).toContain('s3:DeleteObject*');
      expect(policyDoc).toContain('s3:Abort*');
      // Should NOT include ACL permissions
      expect(policyDoc).not.toContain('s3:PutObjectAcl');
    });
  });

  describe('grantPut', () => {
    it('creates a RolePolicy with put-only permissions (no delete)', async () => {
      const bucket = new aws.s3.Bucket('grant-put-bucket-1');
      const role = new aws.iam.Role('grant-put-role-1', { assumeRolePolicy });

      const policy = bucket.grantPut('grant-put-policy-1', role);

      const policyDoc = await promiseOf(policy.policy);
      // Modern CDK-style put actions (no wildcard on PutObject)
      expect(policyDoc).toContain('s3:PutObject');
      expect(policyDoc).toContain('s3:PutObjectLegalHold');
      expect(policyDoc).toContain('s3:PutObjectRetention');
      expect(policyDoc).toContain('s3:PutObjectTagging');
      expect(policyDoc).toContain('s3:PutObjectVersionTagging');
      expect(policyDoc).toContain('s3:Abort*');
      expect(policyDoc).not.toContain('s3:DeleteObject*');
      // Should NOT include ACL permissions
      expect(policyDoc).not.toContain('s3:PutObjectAcl');
    });
  });

  describe('grantDelete', () => {
    it('creates a RolePolicy with delete-only permissions', async () => {
      const bucket = new aws.s3.Bucket('grant-delete-bucket-1');
      const role = new aws.iam.Role('grant-delete-role-1', {
        assumeRolePolicy,
      });

      const policy = bucket.grantDelete('grant-delete-policy-1', role);

      const policyDoc = await promiseOf(policy.policy);
      expect(policyDoc).toContain('s3:DeleteObject*');
      expect(policyDoc).not.toContain('s3:PutObject');
      expect(policyDoc).not.toContain('s3:GetObject*');
    });
  });

  describe('grantPutAcl', () => {
    it('creates a RolePolicy with ACL put permissions only', async () => {
      const bucket = new aws.s3.Bucket('grant-put-acl-bucket-1');
      const role = new aws.iam.Role('grant-put-acl-role-1', {
        assumeRolePolicy,
      });

      const policy = bucket.grantPutAcl('grant-put-acl-policy-1', role);

      const policyDoc = await promiseOf(policy.policy);
      expect(policyDoc).toContain('s3:PutObjectAcl');
      expect(policyDoc).toContain('s3:PutObjectVersionAcl');
      // Should NOT include other put or delete permissions
      expect(policyDoc).not.toContain('"s3:PutObject"');
      expect(policyDoc).not.toContain('s3:DeleteObject*');
      expect(policyDoc).not.toContain('s3:GetObject*');
    });

    it('respects objectsKeyPattern argument', async () => {
      const bucket = new aws.s3.Bucket('grant-put-acl-bucket-2');
      const role = new aws.iam.Role('grant-put-acl-role-2', {
        assumeRolePolicy,
      });

      const args: BucketGrantArgs = { objectsKeyPattern: 'uploads/*' };
      const policy = bucket.grantPutAcl('grant-put-acl-policy-2', role, args);

      const policyDoc = await promiseOf(policy.policy);
      expect(policyDoc).toContain('uploads/*');
      expect(policyDoc).toContain('s3:PutObjectAcl');
    });
  });

  describe('grantReadWrite', () => {
    it('creates a RolePolicy combining read and write permissions', async () => {
      const bucket = new aws.s3.Bucket('grant-rw-bucket-1');
      const role = new aws.iam.Role('grant-rw-role-1', { assumeRolePolicy });

      const policy = bucket.grantReadWrite('grant-rw-policy-1', role);

      const policyDoc = await promiseOf(policy.policy);
      // Check read actions
      expect(policyDoc).toContain('s3:GetObject*');
      expect(policyDoc).toContain('s3:GetBucket*');
      expect(policyDoc).toContain('s3:List*');
      // Check write actions (modern CDK-style)
      expect(policyDoc).toContain('s3:PutObject');
      expect(policyDoc).toContain('s3:PutObjectLegalHold');
      expect(policyDoc).toContain('s3:DeleteObject*');
      expect(policyDoc).toContain('s3:Abort*');
      // Should NOT include ACL permissions
      expect(policyDoc).not.toContain('s3:PutObjectAcl');
    });

    it('respects objectsKeyPattern argument', async () => {
      const bucket = new aws.s3.Bucket('grant-rw-bucket-2');
      const role = new aws.iam.Role('grant-rw-role-2', { assumeRolePolicy });

      const args: BucketGrantArgs = { objectsKeyPattern: 'data/*' };
      const policy = bucket.grantReadWrite('grant-rw-policy-2', role, args);

      const policyDoc = await promiseOf(policy.policy);
      expect(policyDoc).toContain('data/*');
    });
  });

  describe('policy document structure', () => {
    it('generates separate statements for bucket-level and object-level actions', async () => {
      const bucket = new aws.s3.Bucket('grant-struct-bucket-1');
      const role = new aws.iam.Role('grant-struct-role-1', {
        assumeRolePolicy,
      });

      const policy = bucket.grantRead('grant-struct-policy-1', role);

      const policyDoc = await promiseOf(policy.policy);
      const parsed = JSON.parse(policyDoc as string);

      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(2);

      // First statement should be bucket-level actions
      const bucketStatement = parsed.Statement.find(
        (s: { Action: string[] }) =>
          s.Action.includes('s3:GetBucket*') || s.Action.includes('s3:List*'),
      );
      expect(bucketStatement).toBeDefined();
      expect(bucketStatement.Resource).toContain('arn:aws:s3:::');
      expect(bucketStatement.Resource).not.toContain('/*');

      // Second statement should be object-level actions
      const objectStatement = parsed.Statement.find((s: { Action: string[] }) =>
        s.Action.includes('s3:GetObject*'),
      );
      expect(objectStatement).toBeDefined();
      expect(objectStatement.Resource).toContain('/*');
    });
  });
});
