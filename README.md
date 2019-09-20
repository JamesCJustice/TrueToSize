# TrueToSize
The actual size of shoes may vary from the size that they are sold as. 
How well a shoe matches up to the size it's sold as is captured as a whole number from 1 to 5.
This microservice allows us to submit and update 'true to size' scores provided by users,
which is used to provide average scores for particular types of shoes. Averages are updated 
nightly.

## Running TrueToSize
Use `npm run start` to build and run the production docker image.

Please use the `/admin/install` and `/admin/uninstall` routes, respectively, to install and uninstall.

## Testing
Use `npm run test` to build and run the test docker image with [mocha](https://www.npmjs.com/package/mocha).
Routes are tested with [supertest](https://www.npmjs.com/package/supertest).

## Configuration
Environment variables are loaded from `./env_file`.
The scheduling for updating averages uses a [cron string](https://en.wikipedia.org/wiki/Cron) defined in `./server.js`.

## routes

TrueToSize uses a REST interface and JSON request and response bodies.
These routes cover standard [CRUD operations](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete).

### POST /submit_score
Used to submit a score for a particular shoe. If the score already exists, subsequent calls for the same user and shoe will update the score.

Parameters:
- submitter(Required): User who submitted score
- shoe_type(Required): Type of shoe score is submitted for
- score(Required): Integer value [1-5] representing true to fit value of shoes

Responses:
- 201
  - success: 1
- 400
  - success: 0
  - error: Error message
- 500
  - success: 0
  - error: Error message

### POST /delete_score
Used to remove a score to comply with legal policies such as a [right to erasure](https://gdpr-info.eu/art-17-gdpr/) data erasure request.

Parameters:
- submitter(Required): User who submitted score
- shoe_type(Required): Type of shoe score is submitted for

Responses:
- 200
  - success: 1
- 400
  - success: 0
  - error: Error message
- 404
  - success: 0
  - error: Error message
- 500
  - success: 0
  - error: Error message

### GET /fetch_submission
Used to fetch a particular submission. Useful to determine if a user has submitted a score for a particular type of shoes yet.

Parameters:
- submitter(Required): User who submitted score
- shoe_type(Required): Type of shoe score is submitted for

Responses:
- 200
  - success: 1
  - submission:
    - submitter
    - shoe_type
    - score
- 400
  - success: 0
  - error: Error message
- 404
  - success: 0
  - error: Error message
- 500
  - success: 0
  - error: Error message

### GET /fetch_average_score
Used to fetch the average score submitted by users for a particular type of shoes.

Parameters:
- shoe_type(Required): Type of shoe score is submitted for

Responses:
- 200
  - success: 1
  - average_score: The average user submitted score for this type of shoes
- 400
  - success: 0
  - error: Error message
- 404
  - success: 0
  - error: Error message
- 500
  - success: 0
  - error: Error message

### POST admin/install
Used to install the database tables for this microservice.

Parameters: None

Responses:
- 200
  - success: 1
- 500
  - success: 0
  - error: Error message

### POST admin/uninstall
Used to drop the database tables for this microservice, purging the data.

Parameters: None

Responses:
- 200
  - success: 1
- 500
  - success: 0
  - error: Error message

### GET admin/health
Used to perform a health check on this microservice.

Responses:
- 200
  - success: 1

## File structure
`/bin/` - Contains scripts for install/uninstall and updating averages
`server.js` - Main app file
`routes.js` - routes file
`tests/test.js` - Mocha tests

## Development
TrueToSize was initially developed over the course of two weeks as an engineering exercise.

### Rationale for updating scores nightly
Consideration went into when and how to calculate the average scores. Calculating each request would become prohibively expensive,
so that narrowed the approach to updating a cache of scores. Updating before requests would slow response times prohibitively and
introduce race conditions. Updating after requests would potentially introduce a large amount of overhead given a steady trickle of
submissions. Debouncing could mitigate the impact of sudden spikes in activity, but could not prevent this additional overhead. Provided
the average user is not invested in watching scores change in real time, I determined the most performant option is to update once daily
at a time when traffic is lower to prevent continual recalculation of the scores.

### Additional features
As this project is an engineering exercise of minimal scope, many features were omitted in the interest of turnaround.
If this project's scope were increased, the following would be my next ideas for features.
- authentication - Integrate with existing authentication system to prevent unwanted access.
- support for arbitrary metrics - Allow this microservice to be repurposed for future crowdsourced metrics.  
- analytics/reporting - An automated report of the last month's submissions activity could lend insight into user engagement.
- highest-rated shoes - An endpoint to get shoes with the most and highest ratings might be useful for making shoe recommendations
- swagger js-doc - An interactive documentation could make future integrations with this microservice easier for the other developers.