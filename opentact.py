import requests
import json

def url(path):
    return '{}{}'.format('http://149.56.96.236:8002', path)

def get_nonce():
    resp = requests.get(url('/init'), headers={ 
        'Content-type': 'application/json',
        'Authorization':'init' 
        })
    if resp.status_code == 200:
        return resp.json()['ret']
    else:
        return None


def get_token(identity):
    n = get_nonce()
    if n is not None:
        path = '/init/{}'.format(n)
        data = {'user_id': identity, "identity_token": "prepared token", "nonce": n}
        resp = requests.post(url(path),
                data=json.dumps(data),
            headers={"Content-type": "application/json",
                    "Authorization":"init"}) 
        if resp.status_code == 200:
            return resp.json()['ret']
        else:
            return None
    else:
        return None

def create_identity(email, fullname, avatar):
    t = get_token(None)
    if t is not None:
        path = '/app/{}/identity'.format('30ade2c8-f643-4bab-80d0-4da8a415577f')
        data = {'user_name': email, "name": fullname, "avatar": avatar}
        resp = requests.post(url(path),
                data=json.dumps(data),
            headers={"Content-type": "application/json",
                    "Authorization":t}) 
        if resp.status_code == 200:
            return resp.json()['ret']
        else:
            return None
    else:
        return None


def follow(f, t):
    path = '/identity/{}/follow/{}'.format(f[5], t[5])
    resp = requests.post(url(path),
            headers={"Content-type": "application/json",
                "Authorization":f[6]}) 
    if resp.status_code == 200:
        return True
    else:
        return False

def accept_follow(f, t):
    path = '/identity/{}/follow/{}'.format(t[5], f[5])
    resp = requests.post(url(path),
            headers={"Content-type": "application/json",
                "Authorization":f[6]}) 
    if resp.status_code == 200:
        return True
    else:
        return False

def decline_follow(f, t):
    return True
