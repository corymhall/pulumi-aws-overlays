## Agents Instructions

Read @INSTRUCTIONS.md for the base project instructions (projen usage).

## Project Overview

This is an overlay library for `@pulumi/aws` that adds convenience methods to AWS resource classes via TypeScript module augmentation. The goal is to provide a better developer experience for common patterns like event subscriptions.

## Architecture

### Module Augmentation Pattern

The library uses TypeScript's module augmentation to extend `@pulumi/aws` classes:

```typescript
// Declare the new methods on the interface
declare module '@pulumi/aws/s3/bucket' {
  interface Bucket {
    onObjectCreated(...): BucketEventSubscription;
  }
}

// Implement via prototype extension
aws.s3.Bucket.prototype.onObjectCreated = function(...) { ... };
```

### File Structure

```
src/
├── index.ts           # Main exports (re-exports all modules)
├── utils.ts           # Shared utility functions
└── <service>/
    ├── index.ts       # Service module exports
    └── <service>Mixins.ts  # Overlay implementations
```

### Adding New Overlays

When adding overlays for a new AWS service:

1. Create `src/<service>/` directory
2. Create `<service>Mixins.ts` with:
   - Event type interfaces (matching AWS event shapes)
   - Subscription args interfaces
   - Subscription class extending appropriate base
   - Module augmentation declaration
   - Prototype implementations
3. Create `index.ts` that exports from the mixins file
4. Update `src/index.ts` to export the new module

### Dependencies

- `@pulumi/pulumi` and `@pulumi/aws` are peer dependencies
- Import Lambda utilities directly from `@pulumi/aws` (e.g., `aws.lambda.EventSubscription`)
- Use `src/utils.ts` for shared helpers

### Key Patterns from pulumi-aws

Reference implementations can be found in the pulumi-aws repository:
- `/sdk/nodejs/s3/s3Mixins.ts` - S3 bucket event subscriptions
- `/sdk/nodejs/lambda/lambdaMixins.ts` - Base EventSubscription class
- `/sdk/nodejs/sns/snsMixins.ts` - SNS topic subscriptions
- `/sdk/nodejs/sqs/sqsMixins.ts` - SQS queue subscriptions
- `/sdk/nodejs/dynamodb/dynamodbMixins.ts` - DynamoDB stream subscriptions

### Testing

Testing is currently deferred. When adding tests:
- Use `@pulumi/pulumi/testing` utilities for mocking
- Focus on type safety and resource creation patterns

## Current Status

### Implemented
- S3 overlays (`onObjectCreated`, `onObjectRemoved`, `onEvent`)

### Planned (from pulumi-aws)
- SQS overlays
- SNS overlays
- DynamoDB overlays
- Kinesis overlays
- CloudWatch overlays (EventRule, LogGroup)
- Lambda CallbackFunction

### Future Ideas
- API Gateway integrations
- EventBridge subscriptions
- Step Functions integrations
