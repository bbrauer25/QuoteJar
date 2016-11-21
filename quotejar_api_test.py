import requests
import simplejson as json

base_url = 'http://104.236.251.255:3000/api/'

headers = {'Content-Type': 'application/json'}

print("Testing post users with bad username and password")
payload = {
	"email": "bademail",
	"password": ""
}
url = base_url + 'userID'
user = requests.post(url, headers=headers, data=json.dumps(payload))
print(user.content + '\n')

print("Testing post userID with good username and password")
payload = {
	'email': 'tester@test.com',
	'password': 'password'
}
user = requests.post(url, headers=headers, data=json.dumps(payload))
user_json = json.loads(user.content)
user_id = user_json[0]["_id"]
print(user_id)
print(user.content + '\n')

print("Getting tags")
url = base_url + 'tags'
tags = requests.get(url, headers=headers)
print(tags.content + '\n')

print("Post query for current users quotes")
url = base_url + 'quotes'
post_url = url + '/query'
query = {
	"user_id": user_id
}
user_quotes = requests.post(post_url, headers=headers, data=json.dumps(query))
print(user_quotes.content + '\n')

print("Posting quote with tags outside index range")
payload = {
	"user_id": user_id,
	"tags": [10],
	"isFavorite": "true",
	"rating": 5,
	"text": "this is just a test",
	"said_by": "a tester"	
}
bad_tag_quote = requests.post(url, headers=headers, data=json.dumps(payload))
print(bad_tag_quote.status_code)
print(bad_tag_quote.content + '\n')

print("Posting quote with bad user id")
payload["tags"] = [1,2]
payload["user_id"] = "1234567890ab"
bad_user_quote = requests.post(url, headers=headers, data=json.dumps(payload))
print(bad_user_quote.status_code)
print(bad_user_quote.content + '\n')

print("Posting good quote")
payload["user_id"] = user_id
print(payload)
good_quote = requests.post(url, headers=headers, data=json.dumps(payload))
print(good_quote.content + '\n')

print("Updated quotes list:")
user_quotes = requests.post(post_url, headers=headers, data=json.dumps(query))
print(user_quotes.content + '\n')

print("Updating quote content")
put_query = json.loads(good_quote.content)
put_query["text"] = "this is some updated text"
update_result = requests.put(url, headers=headers, data=json.dumps(put_query))
print('Update response: ' + str(update_result) + ', ' + str(update_result.content) + '\n')

print("Updated quotes list:")
user_quotes = requests.post(post_url, headers=headers, data=json.dumps(query))
print(user_quotes.content + '\n')

print("Deleting quote")
delete_query = {
	"_id": put_query["_id"]
}
delete_result = requests.delete(url, headers=headers, data=json.dumps(delete_query))
print('Delete response: ' + str(delete_result) + '\n')

print("Quotes list after delete:")
user_quotes = requests.post(post_url, headers=headers, data=json.dumps(query))
print(user_quotes.content + '\n')




