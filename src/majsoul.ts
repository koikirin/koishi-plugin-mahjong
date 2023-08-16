import { AxiosRequestConfig } from 'axios'
import { Context, Quester, Schema } from 'koishi'
import { IdDocument } from './database'
import { Provider } from './service'

export class MajsoulProvider extends Provider {
  static using = ['mahjong.database']

  private http: Quester

  constructor(ctx: Context, private config: MajsoulProvider.Config) {
    super(ctx, 'majsoul', { immediate: true })
    this.http = ctx.http.extend({})
  }

  getPaipuHead<T=any>(uuid: string, config?: AxiosRequestConfig) {
    return this.http.get<T>(`${this.config.gatewayUri}/paipu_head`, {
      params: { uuid },
      ...config,
    })
  }

  getPaipu<T=any>(uuid: string, config?: AxiosRequestConfig) {
    return this.http.get<T>(`${this.config.gatewayUri}/paipu`, {
      params: { uuid },
      ...config,
    })
  }

  getObToken<T=any>(uuid: string, config?: AxiosRequestConfig) {
    return this.http.get<T>(`${this.config.gatewayUri}/token`, {
      params: { uuid },
      ...config,
    })
  }

  getLivelist<T=any>(fid: string, config?: AxiosRequestConfig) {
    return this.http.get<T>(`${this.config.gatewayUri}/livelist`, {
      params: { id: fid },
      ...config,
    })
  }

  getContest<T=any>(fid: string, config?: AxiosRequestConfig) {
    return this.http.get<T>(`${this.config.gatewayUri}/execute`, {
      params: {
        func: 'fetchCustomizedContestByContestId',
        data: JSON.stringify({
          contest_id: fid,
        }),
      },
      ...config,
    })
  }

  execute<T=any>(func: string, data: object, config?: AxiosRequestConfig) {
    return this.http.get<T>(`${this.config.gatewayUri}/execute`, {
      params: {
        func,
        data: JSON.stringify(data),
      },
      ...config,
    })
  }

  getAccountZone(accountId: number): AccountZone {
    const prefix = accountId >> 23
    if (prefix >= 0 && prefix <= 6) return 'Ⓒ'
    else if (prefix >= 7 && prefix <= 12) return 'Ⓙ'
    else if (prefix >= 13 && prefix <= 15) return 'Ⓔ'
    else return 'Ⓝ'
  }

  async queryNicknameFromAccountId(accountId: number): Promise<string> {
    return (await this.ctx.mahjong.database.db('majsoul').collection<IdDocument<number>>('account_map')
      .findOne({ _id: accountId }))?.nickname
  }

  async queryMultiNicknameFromAccountId(accountIds: number[]) {
    const cursor = this.ctx.mahjong.database.db('majsoul').collection<IdDocument<number>>('account_map').find(
      { _id: { $in: accountIds } },
    )
    const ret: {
      [key: number]: string
    } = {}
    for (const aid of accountIds) ret[aid] = null
    for await (const doc of cursor) ret[<number><any>doc._id] = doc.nickname
    return ret
  }

  async queryAccountIdFromNickname(nickname: string) {
    const cursor = this.ctx.mahjong.database.db('majsoul').collection('account_map').find({ nickname })
    const ret: number[] = []
    for await (const doc of cursor) ret.push(<number><any>doc._id)
    return ret
  }

  async queryMultiAccountIdFromNickname(nicknames: string[]) {
    const cursor = this.ctx.mahjong.database.db('majsoul').collection('account_map').find(
      { nickname: { $in: nicknames } },
    )
    const ret: {
      [key: string]: {
        [key: number]: number
      }
    } = {}
    for (const nickname of nicknames) ret[nickname] = {}
    for await (const doc of cursor) {
      ret[doc.nickname][<number><any>doc._id] = doc.starttime
    }
    return ret
  }

  setAccountMap(accountId: number, nickname: string, starttime: number = 0) {
    return this.ctx.mahjong.database.db('majsoul').collection<IdDocument<number>>('account_map').updateOne(
      { _id: accountId }, {
        $setOnInsert: {
          _id: accountId,
          nickname,
          starttime,
        },
      },
    )
  }
}

export type AccountZone = 'Ⓒ' | 'Ⓙ' | 'Ⓔ' | 'Ⓝ'

export namespace MajsoulProvider {
  export interface Config {
    gatewayUri: string
  }

  export const Config: Schema<Config> = Schema.object({
    gatewayUri: Schema.string().default('http://localhost:7236'),
  }).description('Majsoul')

}
