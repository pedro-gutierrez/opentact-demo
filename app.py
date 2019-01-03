from sanic import Sanic
from sanic import response
from sanic.response import json
import log 
from db import init_db, create_user, find_session, find_user, user_by_id, user_by_identity, user_by_email, find_identity, find_contacts, search_contacts, update_token, create_follow_request, accept_follow_request, decline_follow_request
from util import with_body, gravatar, uuid
from encoders import encode_user, encode_users, encode_contacts
from opentact import get_token, create_identity, follow, accept_follow, decline_follow 

app = Sanic()
log = log.log()

@app.route("/api/_init", methods=["POST"])
async def init(request):
    if init_db():
        return json({'message': 'database initialized'})
    else:
        return response.json(
            {'message': 'cannot initialize database'}, 
            status=500)

@app.route("/api/register", methods=['POST'])
async def register(request):
    data = with_body(request, ['first', 'last', 'email', 'password'])
    if len(data) == 4:
        avatar = gravatar(data[2])
        fullname = '{} {}'.format(data[0], data[1])
        data.append(avatar)
        identity = create_identity(data[2], fullname, avatar)
        if identity is not None:
            data.append(identity)
            if create_user(data):
                return json({'message': 'ok'})
            else: 
                return response.json(
                    {'message': 'already exists'}, 
                        status=409)
        else:
            return response.json(
                {'message': 'cannot create identity'}, 
                    status=500)

    else:
        return response.json(
                {'message': 'missing data'}, 
                    status=400)


@app.route("/api/login", methods=['POST'])
async def login(request):
    params = ['username', 'password']
    data = with_body(request, params)
    if len(data) == len(params):
        user = find_user(data)
        if user is not None:
            return __create_session(user)
        else:
            return response.json(
                {'message': 'invalid credentials'}, 
                    status=404)

    else:
        return response.json(
                {'message': 'missing data'}, 
                    status=400)


def __create_session(user):
    t = get_token(user[5])
    if t is not None:
        if update_token([t, user[0]]):
            return json(encode_user(user_by_id(user[0])))
        else:
            return response.json(
                {'message': 'Could not update session token for user'}, 
                status=500)
    else:
        return response.json(
            {'message': 'Could not get an Opentact session token'}, 
            status=500)

@app.route("/api/login/identity", methods=['POST'])
async def login(request):
    params = ['identity']
    data = with_body(request, params)
    if len(data) == len(params):
        user = find_identity(data)
        if user is not None:
            return __create_session(user)
        else:
            email = '{}@opentact.org'.format(data[0])
            avatar = gravatar(email)
            new_user = [ 'Anonymous', '', email, '', avatar, data[0]]
            if create_user(new_user):
                new_user = user_by_identity(data[0])
                if new_user is not None:
                    return __create_session(new_user)
                else:
                    return response.json(
                        {'message': 'cannot find user for identity'}, 
                        status=500)
            else:
                return response.json(
                    {'message': 'cannot create user'}, 
                    status=500)

    else:
        return response.json(
                {'message': 'missing data'}, 
                    status=400)


@app.route("/api/session")
async def session(request):
    token = request.headers.get('token', None) 
    if token is not None:
        user = find_session(token)
        if user is not None:
            return json(encode_user(user))        
        else:
            return response.json(
                {'message': 'no such session'}, 
                status=404
                )
    else:
        return response.json(
            {'message': 'no session token'}, 
            status=404
            )


@app.route("/api/contacts")
async def contacts(request):
    token = request.headers.get('token', None) 
    if token is not None:
        user = find_session(token)
        if user is not None:
            contacts = find_contacts(user)
            return json(encode_contacts(contacts))        
        else:
            return response.json(
                {'message': 'no such session'}, 
                status=401
                )
    else:
        return response.json(
            {'message': 'requires a session'}, 
            status=401
            )

@app.route("/api/search", methods=['POST'])
async def search(request):
    token = request.headers.get('token', None) 
    if token is not None:
        user = find_session(token)
        if user is not None:
            params = ['keywords']
            data = with_body(request, params)
            if len(data) == len(params):
                contacts = search_contacts(user, data[0]) 
                return json(encode_contacts(contacts))
            else:
                return response.json(
                    {'message': 'missing keywords'}, 
                    status=400
                )
        else:
            return response.json(
                {'message': 'no such session'}, 
                status=401
                )
    else:
        return response.json(
            {'message': 'requires a session'}, 
            status=401
            )


@app.route("/api/follow", methods=['POST'])
async def search(request):
    token = request.headers.get('token', None) 
    if token is not None:
        user = find_session(token)
        if user is not None: 
            params = ['email']
            data = with_body(request, params)
            if len(data) == len(params):
                contact = user_by_email(data[0])
                if contact is not None:
                    if follow(user, contact):
                        if create_follow_request(user, contact):
                            contacts = find_contacts(user)
                            return json(encode_contacts(contacts))        
                        else:
                            return response.json(
                                    {'message': 'cannot create follow request in db'}, 
                                    status=500
                            )
                    else:
                        return response.json(
                            {'message': 'cannot create follow request in opentact'}, 
                            status=500
                        )
                else:
                    return response.json(
                        {'message': 'no such contact'}, 
                        status=404
                        )
            else:
                return response.json(
                    {'message': 'missing email'}, 
                    status=400
                    )
        else:
            return response.json(
                {'message': 'no such session'}, 
                status=401
                )
    else:
        return response.json(
                {'message': 'requires a session'}, 
                status=401
                )

@app.route("/api/accept", methods=['POST'])
async def accept(request):
    token = request.headers.get('token', None) 
    if token is not None:
        user = find_session(token)
        if user is not None: 
            params = ['email']
            data = with_body(request, params)
            if len(data) == len(params):
                contact = user_by_email(data[0])
                if contact is not None:
                    if accept_follow(user, contact):
                        if accept_follow_request(user, contact):
                            contacts = find_contacts(user)
                            return json(encode_contacts(contacts))        
                        else:
                            return response.json(
                                    {'message': 'cannot accept follow request in db'}, 
                                    status=500
                            )
                    else:
                        return response.json(
                            {'message': 'cannot accept follow request in opentact'}, 
                            status=500
                        )
                else:
                    return response.json(
                        {'message': 'no such contact'}, 
                        status=404
                        )
            else:
                return response.json(
                    {'message': 'missing email'}, 
                    status=400
                    )
        else:
            return response.json(
                {'message': 'no such session'}, 
                status=401
                )
    else:
        return response.json(
                {'message': 'requires a session'}, 
                status=401
                )

@app.route("/api/decline", methods=['POST'])
async def accept(request):
    token = request.headers.get('token', None) 
    if token is not None:
        user = find_session(token)
        if user is not None: 
            params = ['email']
            data = with_body(request, params)
            if len(data) == len(params):
                contact = user_by_email(data[0])
                if contact is not None:
                    if decline_follow(user, contact):
                        if decline_follow_request(user, contact):
                            contacts = find_contacts(user)
                            return json(encode_contacts(contacts))        
                        else:
                            return response.json(
                                    {'message': 'cannot decline follow request in db'}, 
                                    status=500
                            )
                    else:
                        return response.json(
                            {'message': 'cannot decline follow request in opentact'}, 
                            status=500
                        )
                else:
                    return response.json(
                        {'message': 'no such contact'}, 
                        status=404
                        )
            else:
                return response.json(
                    {'message': 'missing email'}, 
                    status=400
                    )
        else:
            return response.json(
                {'message': 'no such session'}, 
                status=401
                )
    else:
        return response.json(
                {'message': 'requires a session'}, 
                status=401
                )


        
app.static('/', './static/index.html')
app.static('/*', './static')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4001, debug=False, log_config=None)
