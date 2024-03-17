import { Context, Schema, Service } from 'koishi'
import { DbOptions, Document, MongoClient } from 'mongodb'

export class DatabaseProvider extends Service {
  static using = ['mahjong', 'database']

  public client: MongoClient

  constructor(ctx: Context, public config: DatabaseProvider.Config) {
    super(ctx, 'mahjong.database', true)
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
