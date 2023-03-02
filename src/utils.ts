import DateFormatter from 'date-and-time'

export class Logger {
  constructor(readonly name: string) {}

  private _getNow() {
    return DateFormatter.format(new Date(), 'YYYY/MM/DD HH:mm:ss')
  }

  public info(message?: any, ...meta: any[]) {
    console.log(`[${this._getNow()}] - [${this.name}]: ${message}`, ...meta)
  }

  public error(error?: any, ...meta: any[]) {
    console.error(`[${this._getNow()}] - [${this.name}][ERROR]:`, error, ...meta)
  }
}

export function canMarkFail() {
  return Math.round(Math.random()) === 1
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
