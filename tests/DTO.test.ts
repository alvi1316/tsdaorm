import { UserDTO } from './UserDTO';

test('DTO works properly', () => {
    let dto = new UserDTO().setFromObject({ID: 5})
    expect(dto.getAsObject()).toMatchObject({
        id: -1,
        isDeleted: 0,
        createDate: '',
        updateDate: '',
        name: '',
        email: '',
        password: ''
    });
});

test('DTO works properly', () => {
    let dto = new UserDTO().setFromObject({id: 5})
    expect(dto.getAsObject()).toMatchObject({
        id: 5,
        isDeleted: 0,
        createDate: '',
        updateDate: '',
        name: '',
        email: '',
        password: ''
    });
});