const crypto = require('crypto');
const config = require('../config/config');

class Session{
    constructor(user, sessionKey){
        this.user = user;
        this.sessionKey = sessionKey;
    }
}

class SessionManager{
    constructor(){
        this.sessions = [];
    }

    create(user, res){
        const sessionKey = this.#generate_key();
        this.sessions.push(new Session(user, sessionKey));

        res.cookie('user', user, {maxAge: config.COOKIES_AGE, httpOnly: true});
        res.cookie('session', sessionKey, {maxAge: config.COOKIES_AGE, httpOnly: true});

        return this.sessions[this.sessions.length - 1];
    }

    destroy(key, req, res){
        let currentUser = req.cookies.user;
        let [currentSession, index] = this.#getSession(key);

        if (currentSession){
            this.sessions = this.sessions.slice(index, index - 1);
        }

        res.clearCookie('user');
        res.clearCookie('session');
    }

    checkUser(req, res){
        var currentUser = req.cookies.user;
        var currentKey = req.cookies.session;
        let [currentSession, index] = this.#getSession(currentKey);

        if (currentSession == undefined){
            currentSession = this.create(currentUser, res);
            currentKey = currentSession.sessionKey;
        }

        if (currentUser == currentSession.user && currentKey == currentSession.sessionKey){
            return true;
        }

        return false;
    }

    #generate_key = function() {
        return crypto.randomBytes(16).toString('base64');
    };

    #getSession = function(key){
        let result = []

        this.sessions.forEach((session, index) => {
            if (session.sessionKey == key){
                result = [session, index];
            }
        });
        return result;
    }
}

module.exports = {
    SessionManager
}