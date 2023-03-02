import amqplib from 'amqplib'
import { ConfigModule } from './config'
import { Logger } from './utils'

const configModule = ConfigModule.getInstance()

const errorExchange = configModule.get('ERROR_EXCHANGE')
const requeueExchange = configModule.get('REQUEUE_EXCHANGE')
const errorQueue = configModule.get('ERROR_QUEUE')
const url = configModule.get('RABBIT_URL')

const logger = new Logger('ERROR_HANDLER_WORKER')

async function main() {
	const channel = await initChanel()
	logger.info(`Start`)
	channel.consume(errorQueue, async msg => {
		if (!msg) return
		const { content, properties } = msg
		const { 'x-first-death-queue': originalQueue, 'x-first-death-reason': reason, 'x-death': xDeath = [] } = properties.headers

		if (reason !== 'rejected') {
			logger.info(`Message is not valid to retry so ack message`)
			return channel.ack(msg)
		}

		const rejectCount = xDeath.find(d => d.reason === 'rejected')?.count ?? -1
		const maxRetry = 10
		if (rejectCount === -1 || rejectCount >= maxRetry) {
			return channel.ack(msg)
		}
		const delay = rejectCount * 5 * 1000
		logger.info(`Retry message come from Queue=${originalQueue} | RejectCount=${rejectCount} | Delay=${delay}ms`)

		channel.publish(requeueExchange, '', content, {
			...properties,
			headers: {
				...properties.headers,
				'x-delay': delay,
			},
		})

		return channel.ack(msg)
	})
}

async function initChanel() {
	const connection = await amqplib.connect(url)
	const channel = await connection.createChannel()

	await Promise.all([
		channel.assertExchange(errorExchange, 'fanout'),
		channel.assertExchange(requeueExchange, 'x-delayed-message', {
			arguments: { 'x-delayed-type': 'fanout' },
		}),
	])
	await channel.assertQueue(errorQueue, { durable: true })
	await channel.bindQueue(errorQueue, errorExchange, '')

	channel.prefetch(1)

	return channel
}

main()
