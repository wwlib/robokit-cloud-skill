# robokit-cloud-skill

An example cloud skill for use with the robokit-conitive-hub

Based on wwlib/microservice-template: A template for creating node microservices with:
- express route handling
- get/post REST api routes
- WebSocket api routes
- http admin UI routes
- JWT auth
- docker support

### medium article (about wwlib/microservice-template)

See: [A Nodejs Microservice Template](https://medium.com/@andrew.rapo/a-nodejs-microservice-template-36f080fe1418)

### customization example

For an example customization of this template, see:
- [Using Microsoft Orchestrator for Intent Recognition and Dispatch to Luis](https://github.com/wwlib/orchestrator-microservice)
- https://github.com/wwlib/orchestrator-microservice

### install

`npm install`

### build

`npm run build`

### run

`npm run start`


### docker

`docker build -t robokit-cloud-skill .` 
- or `npm run docker:build`

Copy `.env-example` to `.env`
```
SERVER_PORT=8083
USE_AUTH=true
```

`docker run -it --rm -p 8083:8083 --env-file ./.env robokit-cloud-skill` 
- or `npm run docker:run`


### curl

Without auth:

```sh
curl --location --request POST 'http://localhost:8083/post' \
     --header 'Content-Type: application/json' \
     --data-raw '{ "message": "hello" }'
```

With auth (usinf access_token from the Authentication call, below)

```sh
curl --location --request POST 'http://localhost:8083/post' \
     --header 'Content-Type: application/json' \
     --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMSIsImF1dGgiOnsicGVybWlzc2lvbnMiOlt7InNjb3BlcyI6WyJyZWFkIl0sInJlc291cmNlIjoiZXhhbXBsZSJ9XX0sImlhdCI6MTY1MzM2MTQ3OX0.WMbG7o7CaKOf6H7djUpZ7aylvUeYw3N8cdn1K1FrN8A' \
     --data-raw '{ "message": "hello" }'
```

```json
{"status":"OK","message":"hello"}
```

Authentication

```sh
curl --location --request POST 'http://localhost:8083/auth' \
     --header 'Content-Type: application/json' \
     --data-raw '{
       "accountId": "user1",
       "password": "12345!"
     }'
```

```json
{"message":"Logged in successfully.","access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMSIsImF1dGgiOnsicGVybWlzc2lvbnMiOlt7InNjb3BlcyI6WyJyZWFkIl0sInJlc291cmNlIjoiZXhhbXBsZSJ9XX0sImlhdCI6MTY1NDM2NzQ5NSwiZXhwIjoxNjU0MzY3NTU1fQ.J7yxsSoOYTvNQtMkLrmlY_TEZT6x4jEvYvnI_Gqr64Q","refresh_toke":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMSIsImlhdCI6MTY1NDM2NzQ5NSwiZXhwIjoxNjU0NDUzODk1fQ.Lj7fairF_ABjeXzIc_-38aMqfj3ce08fd33V3ymoa04","user_id":"user1"}
```

### http - dashboard

http://localhost:8083/


### socket client

```
cd tools
node socket-cli.js
```

Note; The socket client will authenticate using the credentials in the `tools/.env` file.

This will start a REPL that will accept and echo prompts.

```
client connected
ctrl-c to quit
> hello
echo hello
```

Anything typed at the `>` prompt will be echoed.
