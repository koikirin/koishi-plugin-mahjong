import { Context, Schema } from 'koishi'
import { DbOptions, MongoClient } from 'mongodb'
import { Provider } from './service'

export class DatabaseProvider extends Provider {
  public client: MongoClient

  constructor(ctx: Context) {
    super(ctx, 'db', { immediate: false })
  }

  async start() {
    const url = 'mongodb://localhost:27017/'
    this.client = await MongoClient.connect(url)
  }

  stop() {
    if (this.client) return this.client.close()
  }

  public db(name: string, options?: DbOptions) {
    return this.client.db(name, options)
  }
}

export namespace DatabaseProvider {
  export interface Config {
    databaseUri: string
  }
  
  export const Config: Schema<Config> = Schema.object({
    databaseUri: Schema.string().default('mongodb://localhost:27017/')
  }).description('Database')
  
}