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

## How It Works

This library uses TypeScript module augmentation to add methods directly to `@pulumi/aws` classes. When you import an overlay module (e.g., `@hallcor/pulumi-aws-overlays/s3`), it:

1. Extends the TypeScript interface with new method signatures
2. Adds implementations to the class prototype
3. Creates the necessary AWS resources (Lambda functions, permissions, notifications) when methods are called

## License

Apache-2.0
