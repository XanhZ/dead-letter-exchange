import amqplib from 'amqplib'
import Http from 'http'
import { ConfigModule } from './config'
import { Logger } from './utils'

const configModule = ConfigModule.getInstance()

const notificationExchange = configModule.get('NOTIFICATION_EXCHANGE')
const url = configModule.get('RABBIT_URL')

const logger = new Logger('PUBLISHER')

class Request {
  private _req: Http.IncomingMessage

  constructor(req: Http.IncomingMessage) {
    this._req = req
  }

  public async readBody() {
    const buffers = []
    for await (const chunk of this._req) {
      buffers.push(chunk)
    }
    const rawBody = Buffer.concat(buffers).toString()
    return JSON.parse(rawBody)
  }
}

class Response {
  private _res: Http.ServerResponse

  constructor(res: Http.ServerResponse) {
    this._res = res
  }

  public status(code: number) {
    this._res.statusCode = code
    return this
  }

  public send(data: any) {
    this._res.setHeader('Content-Type', 'application/json')
    this._res.end(JSON.stringify(data))
    return this
  }
}

async function main() {
  const channel = await initChanel()

  const server = Http.createServer(async (req, res) => {
    const request = new Request(req)
    const response = new Response(res)
    
    const body = await request.readBody()
    switch (req.url) {
      case '/': {
        logger.info(`Body=${JSON.stringify(body, null, 2)}`)
        const { name } = body
        channel.publish(notificationExchange, '', Buffer.from(name))
        return response.status(200).send({ message: 'OK' })
      }
      default: {
        return response.status(404).send({ error: 'Not Found' })
      }
    }
  })

  server.listen(3000, () => logger.info('App is listening on port 3000'))
}

async function initChanel() {
  const connection = await amqplib.connect(url)
  const channel = await connection.createChannel()
  await channel.assertExchange(notificationExchange, 'fanout')
  return channel
}

main()
