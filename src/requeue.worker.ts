import amqplib from 'amqplib'
import { ConfigModule } from './config'
import { Logger } from './utils'

const configModule = ConfigModule.getInstance()

const requeueExchange = configModule.get('REQUEUE_EXCHANGE')
const requeueQueue = configModule.get('REQUEUE_QUEUE')
const url = configModule.get('RABBIT_URL')

const logger = new Logger('REQUEUE_WORKER')

async function main() {
	const channel = await initChanel()
	logger.info(`Start`)
	channel.consume(requeueQueue, async msg => {
		if (!msg) return
		logger.info('Received !!!')
		const { content, properties } = msg
		const originalQueue = properties.headers['x-first-death-queue']
		if (!originalQueue) {
			logger.info(`Message is not valid to retry so ack message`)
			return channel.ack(msg)
		}

		channel.sendToQueue(originalQueue, content, properties)

		return channel.ack(msg)
	})
}

async function initChanel() {
	const connection = await amqplib.connect(url)
	const channel = await connection.createChannel()

	await channel.assertExchange(requeueExchange, 'x-delayed-message', {
		arguments: { 'x-delayed-type': 'fanout' },
	})
	await channel.assertQueue(requeueQueue, { durable: true })
	await channel.bindQueue(requeueQueue, requeueExchange, '')

	channel.prefetch(1)

	return channel
}

main()
