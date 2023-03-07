import path from 'path';
import Util from './util';
import Writer from './writer';

console.log('');
console.log('--- starting ---');
console.log('');

const ROOT = process.env['DATA_DIR'] || 'data';

const writer = new Writer();

await Util.mkdir(ROOT);

const boards = await Util.get('members/me/boards');

for (const basicBoard of boards) {
    console.log("Checking board: " + basicBoard.name);

    const board = await Util.get('boards/' + basicBoard.id, {
        actions: 'all',
        actions_limit: 1000,
        checklists: 'all',
        checklists_limit: 1000,
        customFields: 1,
        customFields_limit: 1000,
        fields: 'all',
        labels: 'all',
        labels_limit: 1000,
        pluginData: 1
    });

    const boardDir = path.resolve(ROOT, board.id);
    await Util.mkdir(boardDir);

    const boardFile = path.resolve(boardDir, "board.json");
    await writer.writeJson(boardFile, board);
    await writer.writeMarker(boardDir, board.name);

    const cards = await Util.getAllCards(board.id);
    for (const card of cards) {
        const cardDir = path.resolve(boardDir, card.id);
        await Util.mkdir(cardDir);
        const cardFile = path.resolve(cardDir, "card.json");
        const changed = await writer.writeJson(cardFile, card);
        if (changed) {
            console.log("Changed card: " + card.name);
        }

        await writer.writeMarker(cardDir, card.name);

        for (const attachment of card.attachments) {
            const attachmentPath = path.resolve(cardDir, attachment.id + "." + Util.cleanFilename(attachment.fileName));
            const existingSize = await writer.size(attachmentPath);
            if (attachment.bytes === existingSize) {
                //console.log("Skipping attachment (already dled)");
            } else {
                console.log("New Attachment: " + attachment.fileName);
                await writer.writeStream(attachmentPath, Util.download(attachment.url));
            }
        }
    }
}

await writer.clean(ROOT);
