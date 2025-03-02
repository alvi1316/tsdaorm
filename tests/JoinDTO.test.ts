import { DatabaseConfig, JoinDAO } from '../src';
import { TokenDTO } from './TokenDTO';
import { UserDTO } from './UserDTO';

test('JoinDAO works properly', async () => {
    DatabaseConfig.setCredential(
        "",
        "",
        "",
        "",
        ""
    )
    let dtos = await new JoinDAO(UserDTO).innerJoin(TokenDTO, "table1_id", "table2_userid").execute()
    let rows = dtos?.map(row => row.map(col => col.getAsObject()))
    
    expect(rows).toMatchObject(
        [
            [
                {
                   createDate: "2025-02-28T06:08:01.149Z",
                   email: "email3@gmail,com",
                   id: 53,
                   isDeleted: 0,
                   name: "Experiment",
                   password: "wowow",
                   updateDate: "2025-02-28T08:20:08.334Z",
                },
                {
                   createDate: "2024-10-21T10:21:29.904Z",
                   id: 37,
                   isDeleted: 0,
                   jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDMsImlzRGVsZXRlZCI6MCwiY3JlYXRlRGF0ZSI6IjIwMjQtMDktMjNUMTg6MDI6MTMuODYxWiIsInVwZGF0ZURhdGUiOiIiLCJuYW1lIjoic2hhaCBhbHZpIGhvc3NhaW4iLCJlbWFpbCI6ImFsdmkxMzE2QGdtYWlsLmNvbSIsInBhc3N3b3JkIjoicG90YXRvdG9tYXRvIiwiaWF0IjoxNzI5NTA2MDg5LCJleHAiOjE3Mjk2Nzg4ODl9.2pM3ob7nrXb4FAIo7fySBRhe_Z-TZOp696x6VhR_Hlw",
                   updateDate: "2024-10-21T10:29:45.362Z",
                   userId: 53,
                },
            ],
        ]
    );
});