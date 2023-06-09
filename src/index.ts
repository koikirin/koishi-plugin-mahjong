import { Context, Schema, Service } from 'koishi'
import { DbOptions, MongoClient } from 'mongodb'

export const name = 'mahjong'

export interface Config {
  databaseUri: string
}

export const Config: Schema<Config> = Schema.object({
  databaseUri: Schema.string().default("mongodb://localhost:27017/")
})

declare module 'koishi' {
  interface Context {
    mahjong: Mahjong
  }
}

class Mahjong extends Service {
  public client: MongoClient

  constructor(ctx: Context, private config: Config) {
    super(ctx, name, false)
  }

  async start() {
    const url = this.config.databaseUri
    this.client = await MongoClient.connect(url)    
  }

  stop() {
    if (this.client) return this.client.close()
  }

  public db(name: string, options?: DbOptions) {
    return this.client.db(name, options)
  }

}

export function apply(ctx: Context, config: Config) {
  ctx.plugin(Mahjong, config)
}
