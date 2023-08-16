import { Context, Schema } from 'koishi'
import { DbOptions, Document, MongoClient } from 'mongodb'
import { Provider } from './service'

export class DatabaseProvider extends Provider {
  public client: MongoClient

  constructor(ctx: Context, private config: DatabaseProvider.Config) {
    super(ctx, 'database', { immediate: false })
  }

  async start() {
    this.client = await MongoClient.connect(this.config.databaseUri)
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
    databaseUri: Schema.string().default('mongodb://localhost:27017/'),
  }).description('Database')

}

export type IdDocument<T> = { _id: T } & Document
