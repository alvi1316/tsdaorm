import { DTO, DTOType } from "../src";

export type TokenDTOType = DTOType & {
    userId: number,
    jwt: string
}

export class TokenDTO extends DTO<TokenDTOType> {
    
    public userId = -1
    public jwt = ""
    
    public varToCol = {
        ...DTO.defaultVarToCol,
        userId: "userid",
        jwt: "jwt"
    }

    constructor() {
        const tableName = "token"
        const setChildFromObj = (obj: any) => {
            this.userId = DTO.assignIfTypeMatches(this.userId, obj[DTO.keyByValue(this.varToCol, this.varToCol.userId)])
            this.jwt = DTO.assignIfTypeMatches(this.jwt, obj[DTO.keyByValue(this.varToCol, this.varToCol.jwt)])
        }
        const setChildFromDBObj = (obj: any) => {
            this.userId = DTO.assignIfTypeMatches(this.userId, obj[this.varToCol.userId])
            this.jwt = DTO.assignIfTypeMatches(this.jwt, obj[this.varToCol.jwt])
        }
        super(tableName, setChildFromObj, setChildFromDBObj)
    }
}