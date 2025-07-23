const api = require('./database');

const tableModel = new api.TableModel('post', 'name text not null', 
'data text not null', 'author text not null', 'tags text not null', 'id text not null', 'rating text not null');
const database = new api.Database('posts', tableModel);

async function createPost(name, data, author, tags) {
    const postId = await getMaxId('id') + 1;
    const postModel = new api.TableModel('post', `'${name}'`, `'${data}'`, `'${author}'`, `'${tags}'`, `'${postId}'`, '1');
    database.insertTable(postModel);

    return new Promise((resolve) => {
        resolve(postId);
    })
}

function deletePost(id){
    database.removeTableByKey('id', id);
}

function updatePost(id, ...params){
  database.updateTable('id', id, params);  
}

async function getUserPosts(user, count) {
    const userPosts = await database.findTableByKey('author', user);
    const postsCount = userPosts.length;
    const posts = await database.findTablesFromIntervalByKey2('author', user, postsCount, postsCount - count,  postsCount);
    
    return new Promise((resolve) => {
        resolve(posts.reverse());
    })
}

async function getNewPosts(count, page) {
    const maxId = await getMaxId('id');
    const posts = await database.findTablesFromIntervalByIndex(count * page, count * page - count);
    return new Promise((resolve) => {
        resolve(posts.reverse());
    })
}

async function getPostByid(id) {
    const post = await database.findTableByKey('id', id);
    return new Promise((resolve) => {
        resolve(post[0]);
    })
}

async function searchPost(name) {
    const result = await database.findTablesByKey('name', name);
    
    return new Promise((resolve) => {
        resolve(result.reverse());
    })
}

async function searchByTag(tag, page, count) {
    let result = await database.findTablesByKey('tags', tag);
    result = result.slice([count * page, count * page - count]);
    
    return new Promise((resolve) => {
        resolve(result.reverse());
    })
}

async function getMaxId(key){
    const table = await database.getLastTableByKey(key);
    if (!table[0]){
        return 0;
    }
    return parseInt(table[0].id);
}

async function rate(id, value) {
    let post = await database.findTableByKey('id', id);
    let currentRating = Number(post[0].rating);
    await database.updateTableValue('id', id, 'rating', currentRating + value);
}

async function deleteUserPosts(login) {
    
}

module.exports = {
    createPost,
    deletePost,
    getNewPosts,
    getPostByid,
    getUserPosts,
    searchPost,
    searchByTag,
    updatePost,
    rate
}