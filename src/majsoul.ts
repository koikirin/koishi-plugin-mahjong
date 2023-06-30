import { AxiosRequestConfig } from 'axios'
import { Context, Quester, Schema } from 'koishi'
import { DatabaseProvider } from './database'
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
      ...config
    })
  }

  getPaipu<T=any>(uuid: string, config?: AxiosRequestConfig) {
    return this.http.get<T>(`${this.config.gatewayUri}/paipu`, {
      params: { uuid },
      ...config
    })
  }
  
  getObToken<T=any>(uuid: string, config?: AxiosRequestConfig) {
    return this.http.get<T>(`${this.config.gatewayUri}/token`, {
      params: { uuid },
      ...config
    })
  }

  getLivelist<T=any>(fid: string, config?: AxiosRequestConfig) {
    return this.http.get<T>(`${this.config.gatewayUri}/livelist`, {
      params: { id: fid },
      ...config
    })
  }

  getContest<T=any>(fid: string, config?: AxiosRequestConfig) {
    return this.http.get<T>(`${this.config.gatewayUri}/execute`, {
      params: {
        func: 'fetchCustomizedContestByContestId',
        data: JSON.stringify({
          contest_id: fid
        })
      },
      ...config
    })
  }

  execute<T=any>(func: string, data: object, config?: AxiosRequestConfig) {
    return this.http.get<T>(`${this.config.gatewayUri}/execute`, {
      params: {
        func: func,
        data: JSON.stringify(data)
      },
      ...config
    })
  }

  getAccountZone(account_id: number) {
    const prefix = account_id >> 23
    if (0 <= prefix && prefix <= 6) return AccountZone.CN
    else if (7 <= prefix && prefix <= 12) return AccountZone.JP
    else if (13 <= prefix && prefix <= 15) return AccountZone.EN
    else return AccountZone.UN
  }

  async queryNicknameFromAccountId(account_id: number) {
    return (await this.ctx.mahjong.database.db('majsoul').collection<DatabaseProvider.IdDocument<number>>('account_map')
      .findOne({_id: account_id}))?.nickname
  }

  async queryMultiNicknameFromAccountId(account_ids: number[]) {
    let cursor = this.ctx.mahjong.database.db('majsoul').collection<DatabaseProvider.IdDocument<number>>('account_map').find(
      { _id: { $in: account_ids } }
    )
    let ret: {
      [key: number]: string
    } = {}
    for (const aid of account_ids) ret[aid] = null
    for await (const doc of cursor) ret[<number><any>doc._id] = doc.nickname
    return ret
  }

  async queryAccountIdFromNickname(nickname: string) {
    let cursor = this.ctx.mahjong.database.db('majsoul').collection('account_map').find({nickname})
    let ret: number[] = []
    for await(const doc of cursor) ret.push(<number><any>doc._id)
    return ret
  }

  async queryMultiAccountIdFromNickname(nicknames: string[]) {
    let cursor = this.ctx.mahjong.database.db('majsoul').collection('account_map').find(
      { nickname: { $in: nicknames } }
    )
    let ret: {
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

  setAccountMap(account_id: number, nickname: string, starttime: number = 0) {
    return this.ctx.mahjong.database.db('majsoul').collection<DatabaseProvider.IdDocument<number>>('account_map').updateOne(
      { _id: account_id }, {$setOnInsert: {
        _id: account_id,
        nickname,
        starttime
      }}
    )
  }

}

enum AccountZone {
  CN = 'Ⓒ',
  JP = 'Ⓙ',
  EN = 'Ⓔ',
  UN = 'Ⓝ',
}

export namespace MajsoulProvider {
  export interface Config {
    gatewayUri: string
  }
  
  export const Config: Schema<Config> = Schema.object({
    gatewayUri: Schema.string().default('http://localhost:7236')
  }).description('Majsoul')
  
}
