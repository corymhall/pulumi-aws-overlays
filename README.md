# @hallcor/pulumi-aws-overlays

An overlay library for `@pulumi/aws` that adds convenience methods for event subscriptions and other common patterns.

## Installation

```bash
npm install @hallcor/pulumi-aws-overlays
```

## Requirements

- `@pulumi/pulumi` (peer dependency)
- `@pulumi/aws` (peer dependency)

## Usage

### S3 Event Subscriptions

Import the S3 overlay module to add event subscription methods to `aws.s3.Bucket`:

```typescript
import '@hallcor/pulumi-aws-overlays/s3';
import * as aws from '@pulumi/aws';

const bucket = new aws.s3.Bucket('my-bucket');

// Subscribe to object creation events
bucket.onObjectCreated('on-create', async (event) => {
  for (const record of event.Records || []) {
    console.log(`Object created: ${record.s3.object.key}`);
  }
});

// Subscribe to object deletion events
bucket.onObjectRemoved('on-delete', async (event) => {
  for (const record of event.Records || []) {
    console.log(`Object deleted: ${record.s3.object.key}`);
  }
});

// Subscribe to specific events with filters
bucket.onObjectCreated('on-upload', async (event) => {
  // Handle upload
}, {
  event: 'Put',
  filterPrefix: 'uploads/',
  filterSuffix: '.json',
});
```

### S3 IAM Grants

Grant IAM permissions to roles for bucket operations:

```typescript
import '@hallcor/pulumi-aws-overlays/s3';
import * as aws from '@pulumi/aws';

const bucket = new aws.s3.Bucket('my-bucket');
const role = new aws.iam.Role('my-role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Principal: { Service: 'lambda.amazonaws.com' },
    }],
  }),
});

// Grant read permissions
bucket.grantRead('read-policy', role);

// Grant write permissions (put + delete, no ACL)
bucket.grantWrite('write-policy', role);

// Grant put-only permissions (no delete)
bucket.grantPut('put-policy', role);

// Grant delete-only permissions
bucket.grantDelete('delete-policy', role);

// Grant read and write permissions
bucket.grantReadWrite('rw-policy', role);

// Grant ACL permissions separately
bucket.grantPutAcl('acl-policy', role);

// Restrict to specific key patterns
bucket.grantRead('uploads-read', role, { objectsKeyPattern: 'uploads/*' });
```

## API Reference

### S3 Module

#### `bucket.onObjectCreated(name, handler, args?, opts?)`

Creates a subscription to object creation events.

- `name` - Unique name for the subscription
- `handler` - Lambda function or callback to handle events
- `args` - Optional configuration:
  - `event` - Specific event type: `'*'`, `'Put'`, `'Post'`, `'Copy'`, `'CompleteMultipartUpload'`
  - `filterPrefix` - Only trigger for objects with this key prefix
  - `filterSuffix` - Only trigger for objects with this key suffix
- `opts` - Pulumi resource options

#### `bucket.onObjectRemoved(name, handler, args?, opts?)`

Creates a subscription to object removal events.

- `args.event` - Specific event type: `'*'`, `'Delete'`, `'DeleteMarkerCreated'`

#### `bucket.onEvent(name, handler, args, opts?)`

Creates a subscription to any S3 events. Use this for full control over event types.

- `args.events` - Array of S3 event types (e.g., `['s3:ObjectCreated:*', 's3:ObjectRemoved:*']`)

#### `bucket.grantRead(name, role, args?, opts?)`

Grants read permissions to an IAM role.

- `name` - Unique name for the RolePolicy resource
- `role` - The IAM role to grant permissions to
- `args.objectsKeyPattern` - Optional key pattern to restrict permissions (default: `'*'`)
- **Permissions**: `s3:GetObject*`, `s3:GetBucket*`, `s3:List*`

#### `bucket.grantWrite(name, role, args?, opts?)`

Grants write permissions (put + delete) to an IAM role. Does not include ACL permissions.

- **Permissions**: `s3:PutObject`, `s3:PutObjectLegalHold`, `s3:PutObjectRetention`, `s3:PutObjectTagging`, `s3:PutObjectVersionTagging`, `s3:Abort*`, `s3:DeleteObject*`

#### `bucket.grantPut(name, role, args?, opts?)`

Grants put permissions (write without delete) to an IAM role. Does not include ACL permissions.

- **Permissions**: `s3:PutObject`, `s3:PutObjectLegalHold`, `s3:PutObjectRetention`, `s3:PutObjectTagging`, `s3:PutObjectVersionTagging`, `s3:Abort*`

#### `bucket.grantDelete(name, role, args?, opts?)`

Grants delete permissions to an IAM role.

- **Permissions**: `s3:DeleteObject*`

#### `bucket.grantPutAcl(name, role, args?, opts?)`

Grants ACL put permissions to an IAM role. Use this if you need to modify object ACLs.

- **Permissions**: `s3:PutObjectAcl`, `s3:PutObjectVersionAcl`

#### `bucket.grantReadWrite(name, role, args?, opts?)`

Grants both read and write permissions to an IAM role. Combines `grantRead` and `grantWrite`.

## How It Works

This library uses TypeScript module augmentation to add methods directly to `@pulumi/aws` classes. When you import an overlay module (e.g., `@hallcor/pulumi-aws-overlays/s3`), it:

1. Extends the TypeScript interface with new method signatures
2. Adds implementations to the class prototype
3. Creates the necessary AWS resources (Lambda functions, permissions, notifications) when methods are called

## License

Apache-2.0
