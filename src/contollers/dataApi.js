class StringData{
    static
    compareValues(str_1, str_2){
        let array_1 = this.converToArray(str_1);
        let array_2 = this.converToArray(str_2);
        let result_string = '';
        for (var i = 0; i < array_1.length; i++){
            result_string += `${array_1[i]} = '${array_2[i]}'`;
            if (i < array_1.length - 1){
                result_string += ',';
            }
        }
        return result_string;
    }

    static
    converToArray(str){
        if (!(str instanceof Array)){
            return str.split(/[,; ]+/);
        }
        return str;
    }

    static
    replaceAll(string, search, replace) {
        return string.split(search).join(replace);
    }
}

class Time{
    static
    getCurrentDate(){
        var date = new Date();
        var day = String(date.getDate()).padStart(2, '0');
        var mount = String(date.getMonth() + 1).padStart(2, '0');
        var year = date.getFullYear();

        date = day + '/' + mount + '/' + year;
        return date;
    }

    static
    getDateInSeconds(){
        return new Date().getTime() / 1000
    }
}

module.exports = {
    StringData,
    Time
}