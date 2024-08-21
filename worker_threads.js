import { Worker, isMainThread, parentPort } from 'worker_threads';
import os from 'os';

const start = performance.now();

if (isMainThread) {
  const numCPUs = os.cpus().length;
  const bigArray = Array.from({ length: 1e6 }, () => Math.floor(Math.random() * 40));
  const chunkSize = Math.ceil(bigArray.length / numCPUs);

  let totalSum = 0;
  let completedWorkers = 0;

  function handleResult(sum) {
    totalSum += sum;
    completedWorkers++;
    if (completedWorkers === numCPUs) {
      console.log(`Общая сумма: ${totalSum}`);
      console.log(`Time: ${(performance.now() - start) / 1000} s`);
    }
  }

  for (let i = 0; i < numCPUs; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, bigArray.length);

    const worker = new Worker(`
      const { parentPort } = require('worker_threads');
      parentPort.on('message', (arrayChunk) => {
        const sum = arrayChunk.reduce((acc, num) => acc + num, 0);
        parentPort.postMessage(sum);
      });
    `, { eval: true });

    worker.postMessage(bigArray.slice(start, end));
    worker.on('message', handleResult);
    worker.on('error', (err) => {
      console.error(`Worker error: ${err}`);
    });
  }
}


// Общая сумма: 19506872
// Time: 0.437113 s