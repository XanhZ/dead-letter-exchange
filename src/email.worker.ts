import amqplib from 'amqplib'
import { ConfigModule } from './config'
import { canMarkFail, Logger, sleep } from './utils'

const configModule = ConfigModule.getInstance()

const notificationExchange = configModule.get('NOTIFICATION_EXCHANGE')
const errorExchange = configModule.get('ERROR_EXCHANGE')
const emailQueue = configModule.get('EMAIL_QUEUE')
const errorQueue = configModule.get('ERROR_QUEUE')
const url = configModule.get('RABBIT_URL')

const logger = new Logger('EMAIL_WORKER')

async function main() {
  const channel = await initChanel()

  logger.info(`Start`)

  channel.consume(emailQueue, async (msg) => {
    if (!msg) return
    const name = Buffer.from(msg.content)
    try {
      logger.info(`Sending email to Name=${name}...`)

      await sleep(2000)
      if (canMarkFail()) throw new Error()

      logger.info(`Email was sent to Name=${name} !!!`)
      
      channel.ack(msg)
    } catch (error) {
      logger.error(`Send mail to Name=${name} fail !!!`)
      channel.nack(msg, false, false)
    }     
  })
}

async function initChanel() {
  const connection = await amqplib.connect(url)
  const channel = await connection.createChannel()
  
  await Promise.all([
    channel.assertExchange(notificationExchange, 'fanout'),
		channel.assertExchange(errorExchange, 'fanout'),
  ])

  await Promise.all([
    channel.assertQueue(emailQueue, {
      deadLetterExchange: errorExchange,
      durable: true
    }),
    channel.assertQueue(errorQueue, {
      durable: true
    })
  ])

  await Promise.all([
		channel.bindQueue(emailQueue, notificationExchange, ''),
		channel.bindQueue(errorQueue, errorExchange, ''),
	])

  channel.prefetch(1)

  return channel
}

main()
