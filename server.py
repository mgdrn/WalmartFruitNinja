# This is a backend webserver written in python, it's goal is to fetch global leaderboards
# I'm not going crazy on network security as this is a school project
# I probably shouldn't even be doing this 
# But I am :)

from flask import Flask, render_template, request, current_app, make_response
from datetime import timedelta
from operator import itemgetter
from sqlitedict import SqliteDict
from functools import update_wrapper
from random import randint as radint
app = Flask(__name__)

def crossdomain(origin=None, methods=None, headers=None, max_age=21600,
                attach_to_all=True, automatic_options=True):
    """Decorator function that allows crossdomain requests.
      Courtesy of
      https://blog.skyred.fi/articles/better-crossdomain-snippet-for-flask.html
    """
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, str):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, str):
        origin = ', '.join(origin)
    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        """ Determines which methods are allowed
        """
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        """The decorator function
        """
        def wrapped_function(*args, **kwargs):
            """Caries out the actual cross domain code
            """
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers
            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            h['Access-Control-Allow-Credentials'] = 'true'
            h['Access-Control-Allow-Headers'] = \
                "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin"
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)
    return decorator

def fetchKey(key):
    try:
        with SqliteDict("db1.sqlite3") as mydict:
            value = mydict[str(key)]

        return value
    except KeyError as ex:
        return None
    except Exception as ex:
        print(f"Error while fetching data, {ex}")
        return False
    
def saveKey(key, data):
    try:
        with SqliteDict("db1.sqlite3") as mydict:
            mydict[str(key)] = data
            mydict.commit() 
            return True
    except Exception as ex:
        print(f"Error while saving guild data, {ex}")
        return False
    
def generateRandomString(len:int=8):
    token = ""
    for x in range(len):
        token = f"{token}{chr(radint(97,122))}"
    return token

def orderList(lst:list):
    return sorted(lst, key=itemgetter('score'), reverse=True)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/backend/fetchleaderboard', methods=['GET'])
@crossdomain(origin='*')
def leaderboardFetch():
    limit = request.args.get('limit')
    mode = request.args.get('mode')
    if not mode: mode = 'easy'
    if not limit: limit = '999'
    limit = int(limit)
    fetchedData = fetchKey("leaderboard")
    if fetchedData != None:
        tr = []
        if len(fetchedData[mode]) <limit:
            limit=len(fetchedData[mode])
        for i in range(limit):
            tr.append(fetchedData[mode][i-1])
        tr = orderList(tr)
        return {'data': tr, 'message': 'Fetched leaderboard stats'}, 200
    else:
        return {'message': 'No data found'}, 404
    
@app.route('/backend/addscore', methods=['POST'])
@crossdomain(origin='*')
def addLeaderboardscore():
    user = request.args.get('user')
    score = request.args.get('score')
    mode = request.args.get('mode')
    if user != None and score != None and mode != None:
        if mode != 'easy' and mode !='medium' and mode != 'hard':
            return {'message': 'Incorrectly formatted mode'},400
        leaderboard = fetchKey('leaderboard')
        if leaderboard == None:
            leaderboard = {
                'hard': [],
                'easy': [],
                'medium': [],
            }
        
        leaderboard[mode].append({'user': user, 'score': int(score)})
        saveKey('leaderboard', leaderboard)
        return {'message': 'Saved user data'}, 200
    else:
        return {'message': 'No ?user, ?score, or ?mode arguments'}, 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')