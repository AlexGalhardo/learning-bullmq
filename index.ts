import { Queue, Worker, QueueEvents } from 'bullmq';
import { writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

const redisConnection = {
	connection: {
		host: "127.0.0.1",
		port: 6379
	},
	concurrency: 5
},
	queue = new Queue('Test', redisConnection),
	sleep = (ms: number) => new Promise((r) => setTimeout(r, ms)),
	queueEvents = new QueueEvents('Test', redisConnection),
	randomNames = ['alex', 'caio', 'mariana', 'adriana', 'patricia', 'joao', 'maria', 'pedro', 'andre', 'thiago'],
	randomCourses = ['Medicina', 'Engenharia', 'Administração', 'Direito', 'Filosofia', 'Biologia', 'Publicidade', 'Sociologia', 'Enfermagem'],
	workerJobsDone: string[] = []

let count = 100
while (count) {
	let randomJobData = {
		id: randomUUID(),
		name: randomNames[Math.floor(Math.random() * randomNames.length)],
		age: count,
		course: randomCourses[Math.floor(Math.random() * randomCourses.length)]
	}
	queue.add('students', randomJobData)
	count--;
}

const worker = new Worker('Test', async job => {
	if (job.name === 'students') {
		console.log(`Working on ID: ${job.id}`)
		await sleep(1000)
		return job.data
	}
}, redisConnection);

queueEvents.on('completed', async ({ jobId, returnvalue }) => {
	workerJobsDone.push(returnvalue)
	writeFileSync('./workers-jobs-done.json', JSON.stringify(workerJobsDone), 'utf-8')
	console.log(`\nAcabou de processar: ID: ${jobId}\nResult: ${JSON.stringify(returnvalue)}\n`,);
});

queueEvents.on(
	'failed',
	({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
		console.error(`Erro no processamento ID ${jobId}: ${failedReason}`);
	},
);