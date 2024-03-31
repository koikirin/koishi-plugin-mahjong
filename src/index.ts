import { Context, Schema, Service } from 'koishi'
import { DatabaseProvider } from './database'
import { MajsoulProvider } from './majsoul'

export * from './database'
export * from './majsoul'

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
    super(ctx, 'mahjong', true)
    ctx.provide('mahjong.database', undefined, true)
    ctx.plugin(DatabaseProvider, config.database)
    ctx.plugin(MajsoulProvider, config.majsoul)
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
