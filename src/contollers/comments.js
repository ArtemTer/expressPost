const dbAPI = require('./database');
const dataAPI = require('./dataApi');

const tableModel = new dbAPI.TableModel('comment', 'user text not null', 'text text not null', 'date text not null', 'postId text not null', 'id text not null');
const database = new dbAPI.Database('comments', tableModel);

async function postComment(user, text, postId) {
    const comment = new dbAPI.TableModel('comment', `'${user}'`, `'${text}'`, `'${dataAPI.Time.getCurrentDate()}'`, `'${postId}'`, `'${await getCommentId(postId)}'`);
    database.insertTable(comment);
}

async function removeComment(postId) {
    database.removeTableByKey('id', postId);
}

async function getComments(postId) {
    try{
        const result = await database.findTablesByKey('postId', postId);

        return new Promise((resolve) => {
            resolve(result.reverse());
        })

    } catch (err){
        return [];
    }
}

async function getCommentId(postId) {
    let comments = await getComments(postId);
    let index = `${postId} ${new Date().getMilliseconds()}`;

    return new Promise((resolve) => {
        resolve(index);
    })
}

module.exports = {
    postComment,
    removeComment,
    getComments,
    getCommentId
}