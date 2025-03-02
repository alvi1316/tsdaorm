<img src ="https://img.shields.io/badge/TypeScript-v5.8.2-blue"/> <img src ="https://img.shields.io/badge/mysql2-v3.12.0-red"/>

## TSDAORM (TypeScript Data Access Object Relational Mapping) 
### Description 
TSDAORM is a lite TypeScript based DAO style ORM which uses [mysql2](https://www.npmjs.com/package/mysql2). </br>
NPM Link: [https://www.npmjs.com/package/tsdaorm](https://www.npmjs.com/package/tsdaorm)

### Installation
```
npm i tsdaorm
```

### Prerequisite & Rules
- The orm does not store `null` value. Use `""` - empty string or `-1` for numbers as default value.
- Every table must have the following fields:
    - id [int, autoincrement, not null]
    - isdeleted [int, default = 0, not null]
    - createdate [varchar, not null]
    - update [varchar, not null]
- The orm does not keep track of table relationships(Foraign Key).
- The orm does not hard delete any row it sets `isdeleted = 1` for the deleted row.

### Supported MySQL functions
- CREATE
- UPDATE
- DELETE
- READ
- WHERE `like` `=` `!=` `<` `>` `<=` `>=` 
- ORDER BY
- OFFSET
- LIMIT
- INNER JOIN

### How To Use

#### For raw sql query you can use `DatabaseConfig.execute()` function
```typescript
import { DatabaseConfig } from "tsdaorm";

// Needs to be setup only once 
// before any database CRUD actions
// It is best to setup at the start of your application
DatabaseConfig.setCredential(
    "mysql - username",
    "mysql - password",
    "mysql - host",
    "mysql - port",
    "mysql - database"
)

async function main() {
    console.log(await DatabaseConfig.execute("SELECT * FROM user"))
}

main()
```
#### Every `EntityDTO`(model) should extend `DTO` class which expects a generic type that extends `DTOType` and two call back functions: `setChildFromObject`, `setChildFromDBObject`. `DTO` class also has a abstruct object `varToCol` that needs to be implemented.

#### Here is an example of how to create a DTO(model)  

```typescript
import { DTO, DTOType } from "tsdaorm";

// Type for DTO<T extends DTOType>
// This should spcify table field types
export type UserDTOType = DTOType & {
    name: string,
    email: string,
    password: string
} 

export default class UserDTO extends DTO<UserDTOType> {
    
    // These variable names should match UserDTOType keys 
    // for the orm to work properly
    public name = ""
    public email = ""
    public password = ""

    // This creates the mapping between 
    // class variables and database columns
    public varToCol = {
        ...DTO.defaultVarToCol,
        name: "name",
        email: "email",
        password: "password"
    };

    public constructor() {

        // Database table name
        const tableName = "user"

        // Setter function for class variables
        const setChildFromObject = (obj: any) => {
            this.name = DTO.assignIfTypeMatches(
                this.name, 
                obj[this.varToCol.name]
            )
            this.email = DTO.assignIfTypeMatches(
                this.email, 
                obj[this.varToCol.email]
            )
            this.password = DTO.assignIfTypeMatches(
                this.password, 
                obj[this.varToCol.password]
            )
        }

        // Setter function from table 
        // column names for class variables
        const setChildFromDBObject = (obj: any) => {
            this.name = DTO.assignIfTypeMatches(
                this.name, 
                obj[DTO.keyByValue(this.varToCol, this.varToCol.name)]
            )
            this.email = DTO.assignIfTypeMatches(
                this.email, 
                obj[DTO.keyByValue(this.varToCol, this.varToCol.email)]
            )
            this.password = DTO.assignIfTypeMatches(
                this.password, 
                obj[DTO.keyByValue(this.varToCol, this.varToCol.password)]
            )
        }

        // Pass necessary variables
        super(tableName, setChildFromObject, setChildFromDBObject)

    }

}
```
#### `DAO` class is responsible for crud operation. So, after creating the DTO(model) we need to use `DAO` class to read write data.
```typescript
import { DatabaseConfig, DAO } from "tsdaorm";
import UserDTO, { UserDTOType } from "./UserDTO"

// Needs to be setup only once 
// before any database CRUD actions
// It is best to setup at the start of your application
DatabaseConfig.setCredential(
    "mysql - username",
    "mysql - password",
    "mysql - host",
    "mysql - port",
    "mysql - database"
)

async function main() {
    let dao = new DAO<UserDTOType, UserDTO>(UserDTO)
    let dto = await dao.read(43)
    console.log(dto?.getAsObject())
//  {
//      id: 43,
//      isDeleted: 0,
//      createDate: '2024-09-23T18:02:13.861Z',
//      updateDate: '',
//      name: 'test-user',
//      email: 'test-user@email.com',
//      password: 'test-password'
//  }
}

main()
```
#### But it is best to create a dedicated DAO for every DTO(model)

```typescript
import { DAO } from "tsdaorm";
import UserDTO, { UserDTOType } from "./UserDTO";

export class UserDAO extends DAO<UserDTOType, UserDTO> {
    constructor() {
        super(UserDTO)
    }

    //Custom function for specific query
    async getUserWithEmailAndPassword(email: string, password: string) {
        let userDtos = await this
        .where("email", "=", `'${email}'`)
        .and()
        .where("password", "=", `'${password}'`)
        .execute()
        return userDtos
    }
}
```
```typescript
import { DatabaseConfig, DAO } from "tsdaorm";
import { UserDAO } from "./UserDAO";

DatabaseConfig.setCredential(
    "mysql - username",
    "mysql - password",
    "mysql - host",
    "mysql - port",
    "mysql - database"
)

async function main() {
    let dtos = await new UserDAO()
    .getUserWithEmailAndPassword("email@email,com", "test-pass")
    let dto = dtos?.[0]
    console.log(dto?.getAsObject())
//  {
//    id: 49,
//    isDeleted: 0,
//    createDate: '2025-02-28T06:05:20.380Z',
//    updateDate: '',
//    name: 'User1',
//    email: 'email@email,com',
//    password: 'test-pass'
//  }
}

main()
```
#### For join operation we need to use `JoinDAO` Class. First we are going to create another `DTO`

```typescript
import { DTO, DTOType } from "../src";

export type TokenDTOType = DTOType & {
    userId: number,
    jwt: string,
} 

export default class TokenDTO extends DTO<TokenDTOType> {
    
    public userId = -1
    public jwt = ""

    public varToCol = {
        ...DTO.defaultVarToCol,
        userId: "userid",
        jwt: "jwt"
    };

    public constructor() {

        const setChildFromObject = (obj: any) => {
            this.userId = DTO.assignIfTypeMatches(
                this.userId, 
                obj[this.varToCol.userId]
            )
            this.jwt = DTO.assignIfTypeMatches(
                this.jwt, 
                obj[this.varToCol.jwt]
            )
        }

        const setChildFromDBObject = (obj: any) => {
            this.userId = DTO.assignIfTypeMatches(
                this.userId, 
                obj[DTO.keyByValue(this.varToCol, this.varToCol.userId)]
            )
            this.jwt = DTO.assignIfTypeMatches(
                this.jwt, 
                obj[DTO.keyByValue(this.varToCol, this.varToCol.jwt)]
            )
        }
        super("token", setChildFromObject, setChildFromDBObject)
    }
}
```
#### Now we can use `JoinDAO`
```TypeScript

import { DatabaseConfig, JoinDAO } from "tsdaorm";
import { UserDTO } from "./UserDTO";
import { JwtDTO } from "./JwtDTO";

DatabaseConfig.setCredential(
    "mysql - username",
    "mysql - password",
    "mysql - host",
    "mysql - port",
    "mysql - database"
)

console.log(
    await new JoinDAO(UserDTO)
    .innerJoin(JwtDTO, "table1_id", "table2_userid")
    .execute()
)

// [
//     [
//     UserDTO {
//         id: 43,
//         isDeleted: 0,
//         createDate: '2025-02-28T06:05:20.380Z',
//         updateDate: '',
//         tableName: 'user',
//         name: 'user',
//         email: 'user@email.com',
//         password: 'wowow',
//     },
//     TokenDTO {
//         id: 37,
//         isDeleted: 0,
//         createDate: '2025-02-28T06:05:20.380Z',
//         updateDate: '',
//         userId: 43,
//         jwt: 'eyJ3ob7nrX.b4FAIo7fySBRhe_Z-TZOp696x6VhR_Hlw',
//     }
//     ]
//]

```
