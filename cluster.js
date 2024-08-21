
import cluster from 'cluster';
import os from 'os';
import { performance } from 'perf_hooks';

const start = performance.now();  

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length; 
  console.log(`Number of CPUs: ${numCPUs}`);

  const bigArray = Array.from({ length: 1e6 }, () => Math.floor(Math.random() * 40));
  const chunkSize = Math.ceil(bigArray.length / numCPUs);

  let totalSum = 0;
  let completedProcesses = 0;

 
  function handleResult(sum) {
    console.log(`Received result from worker: ${sum}`);
    totalSum += sum;
    completedProcesses++;

   
    if (completedProcesses === numCPUs) {
      const end = performance.now();  
      console.log(`Общая сумма: ${totalSum}`);
      console.log(`Час виконання: ${(end - start) / 1000} s`);  
    }
  }

  
  for (let i = 0; i < numCPUs; i++) {
    const startIdx = i * chunkSize;
    const endIdx = Math.min(startIdx + chunkSize, bigArray.length);
    const worker = cluster.fork();  

    console.log(`Sending data to worker ${worker.process.pid} with indices ${startIdx} to ${endIdx}`);
    worker.send(bigArray.slice(startIdx, endIdx));  
    worker.on('message', handleResult);  
    worker.on('error', (err) => {
      console.error(`Worker error: ${err}`);
    });
    worker.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(`Worker exited with code ${code} and signal ${signal}`);
      } else {
        console.log(`Worker ${worker.process.pid} exited successfully.`);
      }
    });
  }
} else {
  
  process.on('message', (arrayChunk) => {
    console.log(`Worker ${process.pid} received chunk with length ${arrayChunk.length}`);
    try {
      const sum = arrayChunk.reduce((acc, num) => acc + num, 0);
      console.log(`Worker ${process.pid} calculated sum: ${sum}`);
      process.send(sum); 
    } catch (err) {
      console.error(`Worker ${process.pid} encountered an error: ${err}`);
    }
    process.exit();  
  });
  
}
