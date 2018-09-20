const AWS = require('aws-sdk');


const client = {
	getClient : function() {
		let dynamoDb = null;

		if(process.env.OFFLINE) {
			AWS.config.update({
			  region: "eu-central-1",
			  endpoint: "http://localhost:8000"
			});

			dynamoDb = new AWS.DynamoDB.DocumentClient();
		} else {
			dynamoDb = new AWS.DynamoDB.DocumentClient();
		}

		return dynamoDb;
	}
}

module.exports = client;