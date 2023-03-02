import dotenv from 'dotenv'

export class ConfigModule {
  private static readonly _instance = new ConfigModule()

  private _store: { [x: string]: any }

  constructor() {
    const { parsed } = dotenv.config()
    this._store = Object.assign({}, parsed)
  }

  public static getInstance() {
    return this._instance
  }

  public get(key: string, defaultValue?: string): string {
    return this._store[key] || defaultValue
  }
}
