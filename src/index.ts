import mysql from "mysql2/promise";

export type DTOType = {
    id: number
    isDeleted: number    
    createDate: string
    updateDate: string
}

export abstract class DTO<T extends DTOType> {

    public id = -1
    public isDeleted = 0
    public createDate = ""
    public updateDate = ""
    private tableName = ""
    private setChildFromObject: (obj: any) => void 
    private setChildFromDBObject: (obj: any) => void 
    public abstract varToCol: { [key in keyof T]: string };

    public getTableName() {
        return this.tableName
    }

    public constructor(
        tableName: string,
        setChildFromObject: (obj: any) => void,
        setChildFromDBObject: (obj: any) => void        
    ) {
        this.tableName = tableName
        this.setChildFromObject = setChildFromObject
        this.setChildFromDBObject = setChildFromDBObject
    }

    public setFromObject(obj: any): this {
        obj ??= {}
        this.id = DTO.assignIfTypeMatches(this.id, obj["id"])
        this.isDeleted = DTO.assignIfTypeMatches(this.isDeleted, obj["isDeleted"])
        this.createDate = DTO.assignIfTypeMatches(this.createDate, obj["createDate"])
        this.updateDate = DTO.assignIfTypeMatches(this.updateDate, obj["updateDate"])
        this.setChildFromObject(obj)
        return this
    }

    public setFromDBObject(obj: any): this {
        obj ??= {}
        this.id = DTO.assignIfTypeMatches(this.id, obj["id"])
        this.isDeleted = DTO.assignIfTypeMatches(this.isDeleted, obj["isdeleted"])
        this.createDate = DTO.assignIfTypeMatches(this.createDate, obj["createdate"])
        this.updateDate = DTO.assignIfTypeMatches(this.updateDate, obj["updatedate"])
        this.setChildFromDBObject(obj)
        return this
    }

    public getAsObject() {
        const mappedObj: {[key: string]: any} = {}
        Object.keys(this)
        .filter(e => e != "varToCol" && e != "tableName" && e != "setChildFromDBObject" && e!= "setChildFromObject")
        .forEach(e => mappedObj[e] = this[e as keyof this])
        return mappedObj
    }

    public static defaultVarToCol: { [key in keyof DTOType]: string } = {
        id: 'id',
        isDeleted: 'isdeleted',
        createDate: 'createdate',
        updateDate: 'updatedate',
    }

    public static keyByValue<T extends object, K extends keyof T>(object: T, value: T[K]): K | "" {
        return (Object.keys(object) as K[]).find(key => object[key] === value) || "";
    }

    public static assignIfTypeMatches<T>(target: T, value: unknown): T {
        if (typeof value === typeof target) {
          return value as T;
        }
        return target;
    }
}

export class DAO<T extends DTOType, TDTO extends DTO<T>> {

    private _dtoType
    private _where: string[] = []
    private _order: string[] = []
    private _limit = ""
    private _offset = ""


    public constructor(dtoType: new() => TDTO) {
        this._dtoType = dtoType
    }

    public async read(id: number[]): Promise<TDTO[] | null>
    public async read(id: number): Promise<TDTO | null>
    public async read(id: number | number[]): Promise<TDTO | TDTO[] | null> {
        
        if(Array.isArray(id)) {
            
            const dtoList = new Array<TDTO>()

            const query: string = `SELECT * FROM ${new this._dtoType().getTableName()} WHERE id in(${id.join(", ")}) AND isdeleted=0`
            const result = await DatabaseConfig.execute(query)
            if(result == null) {
                return null
            }

            const queryResult = result[0] as unknown[]

            queryResult.forEach(e => {
                const dto = new this._dtoType()
                dto.setFromDBObject(e)
                dtoList.push(dto)
            })

            return dtoList

        } else {

            const dto = new this._dtoType()

            const query: string = `SELECT * FROM ${dto.getTableName()} WHERE id=${id} AND isdeleted=0`
            const result = await DatabaseConfig.execute(query)
            if(result == null) {
                return null
            }
            dto.setFromDBObject((result[0] as unknown[])[0])
            return dto;

        }

    }

    public async create(dto: TDTO): Promise<TDTO | null>
    public async create(dto: Array<TDTO>): Promise<Array<TDTO> | null>
    public async create(dto: TDTO | Array<TDTO>): Promise<Array<TDTO> | TDTO | null> {

        if(Array.isArray(dto)) {

            if(dto.length == 0) { 
                return null 
            }

            const insertedDTOList: Array<TDTO> = []

            for(const eachDTO of dto) {
                const insertDTO = await this.create(eachDTO)
                if(insertDTO != null) {
                    insertedDTOList.push(insertDTO)
                }
            }
            
            return insertedDTOList

        } else {

            dto.createDate = new Date().toJSON()
            dto.updateDate = ""
            
            const columns = Object.values(dto.varToCol).filter(e => e != "id" && e != "isdeleted")            
            const values = columns.map(e => dto[DTO.keyByValue(dto.varToCol, e) as keyof typeof dto])
            
            const query: string = `INSERT INTO ${dto.getTableName()} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`
            const result = await DatabaseConfig.execute(query, values)

            if(result == null) {
                return null
            }

            const queryResult = result[0] as any

            const insertId = Number(queryResult["insertId"])
            if(insertId == 0 || isNaN(insertId)) {
                return null
            }

            dto.id = insertId

            return dto

        }

    }

    public async update(dto: TDTO): Promise<TDTO | null>
    public async update(dto: Array<TDTO>): Promise<Array<TDTO> | null>
    public async update(dto: TDTO | Array<TDTO>): Promise<Array<TDTO> | TDTO | null> {

        if(Array.isArray(dto)) {
            
            if(dto.length == 0) {
                return null
            }

            const updatedDTOList: Array<TDTO> = []

            for(const eachDTO of dto) {
                const insertDTO = await this.update(eachDTO)
                if(insertDTO != null) {
                    updatedDTOList.push(insertDTO)
                }
            }
            
            return updatedDTOList

        } else {
            
            dto.updateDate = new Date().toJSON()
            
            const columns = Object.values(dto.varToCol)
            .filter(e => e != "id" && e != "createdate" && e!= "isdeleted")
            .map(e => `${e} = ?`)             
            const values = Object.values(dto.varToCol)
            .filter(e => e != "id" && e != "createdate" && e!= "isdeleted")
            .map(e => dto[DTO.keyByValue(dto.varToCol, e) as keyof typeof dto])
            
            const query: string = `UPDATE ${dto.getTableName()} SET ${columns.join(", ")} WHERE id= ${dto.id}`
            const result = await DatabaseConfig.execute(query, values)
            
            return result == null ? null : dto

        }
       
    }

    public async delete(dto: TDTO): Promise<boolean>
    public async delete(dto: Array<TDTO>): Promise<Array<boolean>>
    public async delete(dto: TDTO | Array<TDTO>): Promise<boolean | Array<boolean>> {
        if(Array.isArray(dto)) {
            if(dto.length == 0) {
                return false
            }
            const successList: Array<boolean> = []
            for(const eachDTO of dto) {
                successList.push(await this.delete(eachDTO))
            }
            return successList
        } else {
            const deletedDTO = await this.read(dto.id)
            if(deletedDTO == null) {
                return false
            }
            const query: string = `UPDATE ${dto.getTableName()} SET isDeleted = 1  WHERE id = ${dto.id}`
            await DatabaseConfig.execute(query)
            return true
        }
    }

    public where(
        field: keyof T, 
        operator: "=" | "!=" | "<" | ">" | "<=" | ">=" | "like",
        value: string | number
    ) {
        this._where.push(`${field as string} ${operator} ${value}`)
        return this
    }

    public and() {
        this._where.push("AND")
        return this
    }

    public or() {
        this._where.push("OR")
        return this
    }

    public orderBy(columns: (keyof T)[], sort: "ASC" | "DESC" = "ASC") {
        this._order.push(`${columns.map(e => e as string).join(", ")} ${sort}`)
        return this
    }

    public limit(value: number) {
        this._limit = `LIMIT ${value}`
        return this
    }

    public offset(value: number) {
        this._offset = `OFFSET ${value}`
        return this
    }

    public async execute(): Promise<TDTO[] | null> {

        const where = ` ${this._where.join(" ")} AND isdeleted = 0 `
        const order = this._order.length != 0 ? `ORDER BY ${this._order.join(", ")}` : ""
        
        const query: string = `SELECT * FROM ${new this._dtoType().getTableName()} WHERE ${where} ${order} ${this._limit} ${this._offset}`
        
        this._where = []
        this._order = []
        this._offset = ""
        this._limit = ""

        const result = await DatabaseConfig.execute(query)
          
        if(result == null) {
            return null
        }

        const dtoList = new Array<TDTO>()
        const queryResult = result?.[0] as unknown[]

        queryResult.forEach(e => {
            const dto = new this._dtoType()
            dto.setFromDBObject(e)
            dtoList.push(dto)
        })

        return dtoList
    }

}

export class JoinDAO<T extends DTOType> {
    
    private _query = ""
    private _dtoTypeList = new Array<new() => DTO<T>>()

    constructor(dtoType: new() => DTO<T>, where?: string) {
        this._dtoTypeList.push(dtoType)
        let colsWithAlias = Object.values(new dtoType().varToCol).map(e => `${e} AS table${this._dtoTypeList.length}_${e}`).join(", ")
        let query = `SELECT ${colsWithAlias} FROM ${new dtoType().getTableName()} WHERE `
        if(where != null) {
            query += `${where} AND `    
        }
        query += `isdeleted = 0 `
        this._query = query
    }

    public innerJoin(dtoType: new() => DTO<T> , onCol1: string, onCol2: string, where?: string) {
        this._dtoTypeList.push(dtoType)
        let colsWithAlias = Object.values(new dtoType().varToCol).map(e => `${e} AS table${this._dtoTypeList.length}_${e}`).join(", ")
        let query = `SELECT ${colsWithAlias} FROM ${new dtoType().getTableName()} WHERE `
        if(where != null) {
            query += `${where} AND `    
        }
        query += `isdeleted = 0 `
        this._query = `SELECT * FROM (${this._query}) as t1 INNER JOIN (${query}) as t2 ON ${onCol1} = ${onCol2} `
        return this
    }

    public async execute(
        optional: { orderBy?: Array<String>, desc?: boolean, limit?: number, offset?: number} = {}
    ): Promise<DTO<T>[][] | null> {

        let {orderBy, desc, limit, offset} = optional  

        if(this._dtoTypeList.length < 2) {
            return null
        }

        if(orderBy != null) {
            this._query += `ORDER BY ${orderBy.join(", ")} `
            if(desc != null && desc == true) {
                this._query += `DESC `
            }
        }
        
        if(limit != null) {
            this._query += `LIMIT ${limit} `
        }

        if(offset != null) {
            this._query += `OFFSET ${offset} `
        }

        let result = await DatabaseConfig.execute(this._query)
        if(result == null) {
            return null
        }

        let queryResult = result?.[0] as any[]

        let dtoList = new Array<Array<DTO<T>>>()

        queryResult.forEach(e => {
            let dtoMapList = this._dtoTypeList.map(() => ({}))
            Object.keys(e).forEach(k => {
                let index = Number(k.replace("table", "").charAt(0)) - 1
                let map: any = dtoMapList[index]
                map[k.replace(`table${index+1}_`, "")] = e[k]
                dtoMapList[index] = map
            })
            let dtoRow = dtoMapList.map((v, i) => new this._dtoTypeList[i]().setFromObject(v))
            dtoList.push(dtoRow)
        })

        return dtoList
        
    }

}

export class DatabaseConfig {
    private static _DB_USER = ""
    private static _DB_PASS = ""
    private static _DB_HOST = ""
    private static _DB_PORT = ""
    private static _DB_DATABASE = ""

    public static setCredential(username = "", password = "", host = "", port = "", database = "") {
        this._DB_USER = username
        this._DB_PASS = password
        this._DB_HOST = host
        this._DB_PORT = port
        this._DB_DATABASE = database
    }
    
    public static async execute(query: string): Promise<[mysql.QueryResult, mysql.FieldPacket[]] | null>;
    public static async execute(query: string, params: unknown): Promise<[mysql.QueryResult, mysql.FieldPacket[]] | null>;
    public static async execute(query: string, params?: unknown): Promise<[mysql.QueryResult, mysql.FieldPacket[]] | null> {

        let result: null | [mysql.QueryResult, mysql.FieldPacket[]] = null;

        try {
            const connection = await mysql.createConnection({
                user: this._DB_USER,
                password: this._DB_PASS ,
                host: this._DB_HOST ,
                port: Number(this._DB_PORT),
                database: this._DB_DATABASE
            })
            
            switch(params) {
                case null:
                    result = await connection.execute(query)
                    break
                default:
                    result = await connection.execute(query, params)
                    break
            }
            await connection.end()
        } catch (e) {
            console.log(e)
        }
        return result
    }
}