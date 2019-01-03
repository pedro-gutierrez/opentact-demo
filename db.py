import sqlite3 as sql
from log import log
sql.enable_callback_tracebacks(True)

log = log()
DB_FILE = "/db/opentact.db"

def init_db():
    res = list(map(lambda sql: __e(sql), [
        "DROP TABLE users",
        "DROP TABLE contacts",
        "CREATE TABLE users(id integer primary key autoincrement, token varchar(255) unique, email varchar(255) unique, first varchar(255), last varchar(255), password varchar(255), avatar varchar(255) unique, identity varchar(255) unique)",
        "CREATE TABLE contacts(id integer primary key autoincrement, user integer, contact integer, rel varchar(255), foreign key(user) references users(id), foreign key(contact) references users(id))"
    ]))
    log.debug("Got: %s", res)
    return True

def find_session(token):
    return __q('SELECT id, first, last, email, avatar, identity, token FROM users WHERE token = ?', [token], one=True)

def find_user(data):
    return __q('SELECT id, first, last, email, avatar, identity, token FROM users WHERE email = ? and password = ?', data, one=True)

def user_by_id(user_id):
    return __q('SELECT id, first, last, email, avatar, identity, token FROM users WHERE id = ?', [user_id], one=True)

def user_by_email(email):
    return __q('SELECT id, first, last, email, avatar, identity, token FROM users WHERE email = ?', [email], one=True)

def user_by_identity(identity):
    return __q('SELECT id, first, last, email, avatar, identity, token FROM users WHERE identity = ?', [identity], one=True)

def find_identity(data):
    return __q('SELECT id, first, last, email, avatar, identity, token FROM users WHERE identity = ?', data, one=True)

def find_contacts(data):
    return __q('SELECT u.id, u.first, u.last, u.email, u.avatar, u.identity, c.rel FROM users u JOIN contacts c ON c.contact = u.id WHERE c.user = ?', [data[0]])

def search_contacts(user, keywords):
    criteria = '%{}%'.format(keywords).upper()
    data = [user[0], criteria, criteria, criteria, user[0], user[0], criteria, criteria, criteria]
    return __q('SELECT id, first, last, email, avatar, identity, "not_followed" FROM users WHERE id != ? and (UPPER(first) LIKE ? OR UPPER(last) LIKE ? OR UPPER(email) LIKE ?) AND id NOT IN (SELECT u.id FROM users u JOIN contacts c ON c.contact = u.id WHERE c.user = ?) UNION SELECT u.id, u.first, u.last, u.email, u.avatar, u.identity, c.rel FROM users u JOIN contacts c ON c.contact = u.id WHERE c.user = ? AND (UPPER(u.first) LIKE ? OR UPPER(u.last) LIKE ? OR UPPER(u.email) LIKE ?)', data)

def create_follow_request(f, t):
    if __e("INSERT INTO contacts ('user', 'contact', 'rel') VALUES (?, ?, 'follow_sent')", [f[0], t[0]]):
        return __e("INSERT INTO contacts ('user', 'contact', 'rel') VALUES (?, ?, 'follow_received')", [t[0], f[0]])
    else:
        return False

def accept_follow_request(f, t):
    if __e("UPDATE contacts SET rel='following' WHERE user=? AND contact =?", [f[0], t[0]]):
        return __e("UPDATE contacts SET rel='following' WHERE user=? AND contact =?", [t[0], f[0]])
    else:
        return False

def decline_follow_request(f, t):
    if __e("DELETE FROM contacts WHERE user=? AND contact =?", [f[0], t[0]]):
        return __e("DELETE FROM contacts WHERE user=? AND contact =?", [t[0], f[0]])
    else:
        return False

def create_user(data):
    return __e('INSERT INTO users (first, last, email, password, avatar, identity) VALUES (?, ?, ?, ?, ?, ?)', data)

def update_token(data):
    return __e('UPDATE users SET token=? WHERE id = ?', data)

def __q(q, args=(), one=False):
    log.debug('querying %s with %s', q, args)
    c = sql.connect(DB_FILE).execute(q, args)
    res = c.fetchall()
    c.close()
    return (res[0] if res else None) if one else res

def __e(q, args=()):
    try: 
        c = sql.connect(DB_FILE)
        c.execute(q, args)
        c.commit()
        c.close()
        return True
    except sql.IntegrityError:
        return False 

