# This is a quick and dirty debugger to help clear and edit the database
from sqlitedict import SqliteDict
from time import sleep
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
    

data = fetchKey('leaderboard')
print(data)
#data['hard'].append({'user': 'Jade <3', 'score': 13250})
#saveKey('leaderboard', data)
#print(fetchKey('leaderboard'))