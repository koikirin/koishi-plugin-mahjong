import { Context, Schema, Service } from 'koishi'
import { DatabaseProvider, IdDocument } from './database'
import { MajsoulProvider } from './majsoul'

export { IdDocument }

type NestedServices = {
  [K in keyof Mahjong.Services as `mahjong.${K}`]: Mahjong.Services[K]
}

declare module 'koishi' {
  interface Context extends NestedServices {
    mahjong: Mahjong
  }
}

export interface Mahjong extends Mahjong.Services {}

export class Mahjong extends Service {
  constructor(ctx: Context, config: Mahjong.Config) {
    super(ctx, 'mahjong')
    ctx.plugin(DatabaseProvider, config)
    ctx.plugin(MajsoulProvider, config)
  }
}

export namespace Mahjong {
  export interface Services {
    database: DatabaseProvider
    majsoul: MajsoulProvider
  }

  export interface Config {
    database: DatabaseProvider.Config
    majsoul: MajsoulProvider.Config
  }

  export const Config: Schema<Config> = Schema.object({
    database: DatabaseProvider.Config,
    majsoul: MajsoulProvider.Config,
  })

}

export default Mahjong
