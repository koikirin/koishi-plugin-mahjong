import { Context, h, Schema, Service } from 'koishi'
import { Tokenizer } from '@hieuzest/koishi-plugin-command'
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

  namespace Argv {
    interface Domain {
      mjlist: string[]
    }
  }
}

export interface Mahjong extends Mahjong.Services {}

export class Mahjong extends Service {
  constructor(ctx: Context, config: Mahjong.Config) {
    super(ctx, 'mahjong', true)

    if (config.database.enabled) {
      ctx.provide('mahjong.database', undefined, true)
      ctx.plugin(DatabaseProvider, config.database)
    }

    if (config.majsoul.enabled) {
      ctx.plugin(MajsoulProvider, config.majsoul)
    }

    const tokenizer = new Tokenizer()

    tokenizer.define({
      initiator: '',
      terminator: null!,
      quoted: false,
    })

    tokenizer.define({
      initiator: '\\',
      terminator: '',
      depend: ['', '"'],
      parse(source: string) {
        if (!source.length) {
          return {
            error: 'No character follows backslash',
            rest: source,
          }
        } else {
          return {
            tokens: [{ content: source[0], inters: [], quoted: false, terminator: '' }],
            rest: source.slice(1),
            inline: true,
          }
        }
      },
    })

    ctx.$commander.domain('mjlist', (source) => {
      return tokenizer.parse(source, '', /\s+|,|\|\|/).tokens?.map(token => token.content)?.map(h.unescape) || []
    }, { greedy: true })
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
