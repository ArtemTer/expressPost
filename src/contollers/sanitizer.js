const api = require('../api');
const config = require('../config/config')

class AntiXML{
    static
    checkHTML(content){
        let result = api.StringManager.replaceAll(content, '<script>', '<scriptt>');
        return result;
    }
}

class AntiSpam{
    static
    async checkPost(req, post){
        var cookies = req.cookies.userPost;
        var currentTime = api.Time.getDateInSeconds();

        if (!cookies){
            return false;
        }

        if (currentTime - cookies.postTime > config.MAX_POST_DELAY){
            cookies.postTime = currentTime;
            return false;
        }
        return true;
    }
}

module.exports = {
    AntiXML,
    AntiSpam
}