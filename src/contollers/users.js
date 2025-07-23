const argon2 = require('argon2');
const api = require('./database');
const fs = require('fs')
const dataAPI = require('./dataApi');
const { promisify } = require('util')
const unlinkAsync = promisify(fs.unlink);

const tableModel = new api.TableModel('user', 'login text not null', 'passwordHash text not null', 'date text not null', 'info text', 'image text', 'ratedPosts text');
const database = new api.Database('users', tableModel);

async function signUp(login, password){
    if (await findUser(login) != undefined){
        return undefined;
    }

    const hashedPassword = await argon2.hash(password);
    const userRecorded = new UserModel(login, hashedPassword);
    //const userId = api.Time.getDateInSeconds() + database.getLastTableByKey('login');
    const userTable = new api.TableModel('user', `'${userRecorded.login}'`, `'${userRecorded.password}'`, `'${dataAPI.Time.getCurrentDate()}'`, `''`, `${setDefaultIcon(4)}`, `''`);
    database.insertTable(userTable);

    return await new Promise((resolve) => {
        resolve(userRecorded);
    })
}

async function signIn(login, password) {
    try {
        const user = await findUser(login);
        if (!user){
            return undefined;
        }
        const result = await argon2.verify(user.passwordHash, password);

        return result ? user : undefined;
    } catch (err){
        return undefined;
    }
}

async function findUser(login) {
    let user = await database.findTableByKey('login', login);
    return new Promise((resolve) => {
        resolve(user[0]);
    })
}

async function addRatedPost(login, id, value) {
    const user = await findUser(login);

    if (user){
        let posts = user.ratedPosts.split(',');
        let index = ratedPostIndex(posts, id);

        if (index == -1){
            posts.push(`${id}#${value}`);
        }
        else {
            posts[index] = `${id}#${value}`;
        }

        posts = posts.join(',');

        database.updateTableValue('login', login, 'ratedPosts', posts);
    }
}

async function userPostRating(login, id) {
    const user = await findUser(login);
    let result = 0;

    if (user){
        let posts = user.ratedPosts.split(',');
        let index = ratedPostIndex(posts, id);

        if (index != -1){
            result = posts[index].split('#')[1];
        }
    }

    return new Promise((resolve) => {
        resolve(result);
    })
}

function ratedPostIndex(posts, id){
    let index = -1;

    for (var i = 0; i < posts.length; i++){
        let post = posts[i];
        let postData = post.split('#');

        if (postData[0] == `${id}`){
            index = i;
        }
    }

    return index;
}

async function changeInfo(login, info) {
    const user = await findUser(login);

    if (user){
        database.updateTableValue('login', login, 'info', info);
    }
}

async function removeImage(user) {
    var filePath = `public/uploads/${user.image}`;

    if (user.image != '' && user.image != 'defaultIcon.png' && fs.existsSync(filePath)){
        await unlinkAsync(filePath);
    }
}

async function changeImage(login, image) {
    const user = await findUser(login);
    if (user){
        removeImage(user);
        database.updateTableValue('login', login, 'image', image);
    }
}

async function remove(login) {
    const user = await findUser(login);

    if (user){
        removeImage(user, user.image);
        database.removeTableByKey('login', login);
    }
}

function setDefaultIcon(maxIndex){
    let randomIndex = Math.floor(Math.random() * (maxIndex - 1) + 1);
    return `'system/defaultIcon${randomIndex}.png'`
}

class UserModel{
    constructor(userLogin, passwordHash){
        this.login = userLogin;
        this.password = passwordHash;
    }
}

module.exports = {
    signUp,
    signIn,
    findUser,
    addRatedPost,
    changeInfo,
    changeImage,
    remove,
    userPostRating,
}