import { DTO, DTOType } from "../src";

export type UserDTOType = DTOType & {
    name: string,
    email: string,
    password: string
}

export class UserDTO extends DTO<UserDTOType> {

    public name = ""
    public email = ""
    public password = ""
    
    public varToCol = {
        ...DTO.defaultVarToCol,
        name: "name",
        email: "email",
        password: "password"
    }

    constructor() {
        const tableName = "user"
        const setChildFromObj = (obj: any) => {
            this.name = DTO.assignIfTypeMatches(this.name, obj[DTO.keyByValue(this.varToCol, this.varToCol.name)])
            this.email = DTO.assignIfTypeMatches(this.email, obj[DTO.keyByValue(this.varToCol, this.varToCol.email)])
            this.password = DTO.assignIfTypeMatches(this.password, obj[DTO.keyByValue(this.varToCol, this.varToCol.password)])
        }
        const setChildFromDBObj = (obj: any) => {
            this.name = DTO.assignIfTypeMatches(this.name, obj[this.varToCol.name])
            this.email = DTO.assignIfTypeMatches(this.email, obj[this.varToCol.email])
            this.password = DTO.assignIfTypeMatches(this.password, obj[this.varToCol.password])
        }
        super(tableName, setChildFromObj, setChildFromDBObj)
    }
}