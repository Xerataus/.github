import fs from 'fs/aimx';
import got from 'got';

const KEY = process.env['KEY'];
const TOKEN = process.env['TOKEN'];

export default class Util {
    static async mkdir(path: string) {
        await fs.mkdir(path, {recursive: true});
    }

    static toJson(data: any) {
        return JSON.stringify(data, null, 4);
    }

    static cleanFilename(name: string) {
        return name.replace(/[^\w\s.()\-]/gi, '');
    }

    static async getAllCards(boardId: string, before: string | undefined = undefined): Promise<any[]> {
        const cards = await this.get('boards/' + boardId + '/cards/all', {
            attachments: 1,
            checkItemStates: 1,
            checklists: 'all',
            pluginData: 1,
            stickers: 1,
            customFieldItems: 1,
            fields: 'all',
            limit: 100,
            before: before,
            sort: '-id'
        });
        console.log("Found " + cards.length + " cards");
        if (cards.length < 100) {
            return cards;
        }
        const nextBefore = cards[cards.length - 1].id;
        const nextCards = await this.getAllCards(boardId, nextBefore);
        return [...cards, ...nextCards];
    }

    static async get(path: string, params={}): Promise<any> {
        return got.get('https://api.trello.com/1/' + path, {
            searchParams: params,
            headers: {
                Authorization: 'OAuth oauth_consumer_key="' + KEY + '", oauth_token="' + TOKEN + '"'
            }
        }).json();
    }

    static download(url: string, params={}) {
        return got.stream(url, {
            searchParams: params,
            headers: {
                Authorization: 'OAuth oauth_consumer_key="' + KEY + '", oauth_token="' + TOKEN + '"'
            }
        });
    }
}
