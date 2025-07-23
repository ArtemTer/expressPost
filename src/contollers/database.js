const sqlite3 = require('sqlite3');


class TableModel{
    constructor(name, ...params){
        this.name = name;
        this.params = params;
        this.keys = this.params.map(str => `${str.split(' ')[0]}`);
        this.body = this.#create();
    }


    #create(){
        let text = `create table ${this.name} (\n`;
    
        text += this.params.map((element, index) => {
            return index < this.params.length - 1 ? `    ${element},` : `    ${element}`;
        }).join('\n');
    
        text += '\n);';
        return text;
    }
}

class Database{
    constructor(name, table){
        this.tableModel = table;
        this.database = this.#create(name);
    }


    insertTable(table){
        this.database.exec(`insert into ${table.name} (${this.tableModel.keys}) values (${table.params});`);
    }

    updateTable(key, key_value, ...params){
        return this.#executeCondition(`UPDATE ${this.tableModel.name} SET ${StringManager.compareValues(this.tableModel.keys, params[0])} WHERE ${key} = ${key_value}`);
    }

    updateTableValue(key, key_value, value_name, new_value){
        return this.#executeCondition(`UPDATE ${this.tableModel.name} SET ${value_name} = '${new_value}' WHERE ${key} = '${key_value}'`);
    }

    removeTableByKey(key, $key_value){
        const deleteStatmate = this.database.prepare(`DELETE FROM ${this.tableModel.name} WHERE ${key} = $key_value`);
        deleteStatmate.run(($key_value));
        deleteStatmate.finalize();
    }

    findTableByKey(key, key_value){
        return this.#executeCondition(`SELECT * FROM ${this.tableModel.name} WHERE ${key} = '${key_value}'`);
    }

    findTablesByKey(key, key_value){
        return this.#executeCondition(`SELECT * FROM ${this.tableModel.name} WHERE LOWER(${key}) LIKE LOWER('%${key_value}%')`);
    }

    findTablesFromIntervalByKey(key, minValue, maxValue){
        return this.#executeCondition(`SELECT * FROM ${this.tableModel.name} 
        WHERE ${key} BETWEEN ${minValue} AND ${maxValue}`);
    }

    findTablesFromIntervalByIndex(minValue, maxValue){
        return this.#executeCondition(`SELECT * FROM ${this.tableModel.name} 
        LIMIT ${minValue} OFFSET ${maxValue}`);
    }

    findTablesFromIntervalByKey2(key, key_value, key2, minValue, maxValue){
        return this.#executeCondition(`SELECT * FROM ${this.tableModel.name} 
        WHERE ${key} = '${key_value}' AND ${key2} BETWEEN ${minValue} AND ${maxValue}`);
    }

    getLastTableByKey(key){
        return this.#executeCondition(`SELECT * FROM ${this.tableModel.name}
        ORDER BY ${key} DESC LIMIT 1`);
    }

    getTablesCount(){
        return this.#executeCondition(`SELECT count(*) FROM sqlite_master WHERE type = 'table'`);
    }

    #executeCondition(condition){
        return new Promise((resolve, reject) => {
            this.database.all(condition, (err, result) => {
                if (err){
                    reject(err);
                }
                resolve(result);
            })
        })
    }

    #create(name){
        const dbPath = `databases/${name}.db`;

        var db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.log(`${err}`);
                exit(1);
            }
        });
        
        db.exec(this.tableModel.body, () => {});
        return db;
    };
}

module.exports = {
    TableModel,
    Database
}