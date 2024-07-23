import { Context, Quester, Schema, Service } from 'koishi'
import { IdDocument } from './database'

declare module 'koishi' {
  interface Tables {
    'majsoul.records': MajsoulDHSRecord
  }
}

export interface MajsoulDHSRecord {
  id: string
  contestId: string
  uniqueId: string
  endtime: number
  value: MajsoulRecordHead
}

export interface MajsoulRecordHead {
  uuid: string
  start_time: number
  end_time: number
  config: any
  accounts: {
    account_id: number
    seat: number
    nickname: string
    avatar_id: number
    character: any
  }[]
  result: {
    players: {
      seat: number
      total_point: number
      part_point_1: number
      part_point_2: number
      grading_score: number
    }[]
  }
}

interface MajsoulGatewayError {
  err?: true
  msg?: string
  code?: number
  extra?: any
}

export class MajsoulProvider extends Service {
  static using = ['mahjong', 'mahjong.database', 'database']

  private http: Quester

  constructor(ctx: Context, public config: MajsoulProvider.Config) {
    super(ctx, 'mahjong.majsoul', true)
    this.http = ctx.http.extend({})

    ctx.model.extend('majsoul.records', {
      id: 'string',
      contestId: 'string',
      uniqueId: 'string',
      endtime: 'unsigned',
      value: 'json',
    })
  }

  async getPaipuHead(uuid: string, config?: any, meta?: { contestId?: string }): Promise<{
    head: MajsoulRecordHead
  } & MajsoulGatewayError> {
    const cursor = await this.ctx.database.get('majsoul.records', uuid)
    if (cursor.length) return { head: cursor[0].value }

    const res = await this.http.get(`${this.config.gatewayUri}/paipu_head`, {
      params: { uuid },
      ...config,
    })

    if (res && !res.err && res.head?.uuid) {
      this.ctx.database.create('majsoul.records', {
        id: res.head.uuid,
        contestId: meta?.contestId,
        uniqueId: res.head.config.meta?.contest_uid,
        endtime: res.head.end_time,
        value: res.head,
      })
    }

    return res
  }

  getPaipu<T=any>(uuid: string, config?: any) {
    return this.http.get<T>(`${this.config.gatewayUri}/paipu`, {
      params: { uuid },
      ...config,
    })
  }

  getObToken<T=any>(uuid: string, config?: any) {
    return this.http.get<T>(`${this.config.gatewayUri}/token`, {
      params: { uuid },
      ...config,
    })
  }

  getLivelist<T=any>(fid: string, config?: any) {
    return this.http.get<T>(`${this.config.gatewayUri}/livelist`, {
      params: { id: fid },
      ...config,
    })
  }

  getContest<T=any>(fid: string, config?: any) {
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

  execute<T=any>(func: string, data: object, config?: any) {
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
      { _id: accountId },
      {
        $set: {
          nickname,
          starttime,
        },
      },
      { upsert: true },
    )
  }

  decodeAccountId(e: number) {
    const fa = 67108863, ba = -67108864
    if ((e -= 1e7) <= 0) { return 0 }
    let t = e & fa
    return t = (131071 & t) << 9 | t >> 17,
    t = (131071 & t) << 9 | t >> 17,
    t = (131071 & t) << 9 | t >> 17,
    t = (131071 & t) << 9 | t >> 17,
    t = (131071 & t) << 9 | t >> 17,
    (e & ba) + t ^ 6139246
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
