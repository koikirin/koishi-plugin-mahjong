import { Context, Service } from 'koishi'
import Mahjong from '.'

export namespace Provider {
  export interface Options {
    immediate?: boolean
    authority?: number
  }
}

export abstract class Provider extends Service {
  static filter = false
  static keys = new Set<string>()
  static using = ['mahjong']

  static define(name: keyof Mahjong.Services) {
    this.keys.add(name)
    if (Object.prototype.hasOwnProperty.call(Mahjong.prototype, name)) return
    const key = `mahjong.${name}`
    Object.defineProperty(Mahjong.prototype, name, {
      get(this: Mahjong) {
        return this.caller[key]
      },
      set(this: Mahjong, value) {
        this.caller[key] = value
      },
    })
  }

  constructor(protected ctx: Context, protected key: keyof Mahjong.Services, public options: Provider.Options = {}) {
    super(ctx, `mahjong.${key}`, options.immediate)
    Provider.define(key)
  }

}
