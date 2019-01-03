def encode_user(u):
    return __encode_user(u, ['id', 'first', 'last', 'email', 'avatar', 'identity', 'token'])

def encode_user2(u):
    return __encode_user(u, ['id', 'first', 'last', 'email', 'avatar', 'identity' ])

def encode_contact(u):
    return __encode_user(u, ['id', 'first', 'last', 'email', 'avatar', 'identity', 'rel'])

def encode_users(users):
    return map(encode_user2, users)

def encode_contacts(users):
    return map(encode_contact, users)

def __encode_user(u, props):
    json = {}
    for idx, prop in enumerate(props):
        json[prop]=u[idx]
    return json 

