import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities.js';
import { createTenantActivityInboundInterceptor } from './interceptors.js';

async function run() {
  const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
  const connection = await NativeConnection.connect({ address });

  const worker = await Worker.create({
    connection,
    namespace,
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'prospecting-queue',
    interceptors: {
      activityInbound: [(ctx) => createTenantActivityInboundInterceptor(ctx)],
    },
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
