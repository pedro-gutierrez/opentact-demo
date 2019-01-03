from functools import reduce
import hashlib
import os,binascii

def with_body(req, params):
    def redfun(acc, item):
        value = req.json.get(item, None)
        if value is not None and len(str(value)):
            acc.append(value)
        return acc
    return reduce(redfun, params, [])

def gravatar(email):
    hashed = hashlib.md5(email.encode()).hexdigest()
    return  "{}{}".format('https://www.gravatar.com/avatar/', hashed)

def uuid():
    return binascii.b2a_hex(os.urandom(15)).decode('ascii')
