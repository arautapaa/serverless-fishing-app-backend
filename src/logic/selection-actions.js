const dynamoDb = require('../utils/dynamo-client').getClient();
const async = require('async');
const fs = require('fs');

const actions = {
	/**
	 * Finds all the selection entries for current 
	 * @param  {String} userId AWS Cognito temporary userId
	 * @return {Promise} promise of execution
	 */
	findAllForUser : function(userId) {
		return new Promise((resolve, reject) => {
			const tableRequest = {
				TableName : process.env.TABLE_NAME_SELECTION,
				KeyConditionExpression: "#user = :userId",
				ExpressionAttributeNames:{
				    "#user": "UserId"
				},
				ExpressionAttributeValues: {
				    ":userId": userId
				}
			};

			dynamoDb.query(tableRequest, function(err, result) {
				if(err) {
					reject(err);
				} else {
					let processedItems = 0;
					const processedObjects = {};

					if(result.Items.length == 0) {
						resolve({});
						return;
					}

					result.Items.forEach(function(item) {
						const object = {
							type : item.Type,
							name : item.Name,
							additionalAttributes : item.AdditionalAttributes
						};

						if(!processedObjects.hasOwnProperty(object.type)) {
							processedObjects[object.type] = [];
						}

						processedObjects[object.type].push(object);

						if(++processedItems === result.Items.length) {
							resolve(processedObjects);
						}
					});
				}
			});
		});
	},

	/**
	 * Finds all selection entries for user and type
	 * @param  {String} userId AWS Cognito user id
	 * @param  {String} type   Requested type
	 * @return {Promise} promise of execution        
	 */
	findAllForUserAndType : function(userId, type) {
		return new Promise((resolve, reject) => {
			const tableRequest = {
				TableName : process.env.TABLE_NAME_SELECTION,
				KeyConditionExpression: "#user = :userId AND begins_with(#selection, :type)",
				ExpressionAttributeNames:{
				    "#user": "UserId",
				    "#selection" : "SelectionId"
				},
				ExpressionAttributeValues: {
				    ":userId": userId,
				    ":type" : type
				}
			};

			dynamoDb.query(tableRequest, function(err, result) {
				if(err) {
					reject(err);
				} else {
					let processedItems = 0;
					const processedObjects = [];

					if(result.Items.length == 0) {
						resolve({});
						return;
					}

					result.Items.forEach(function(item) {
						const object = {
							type : item.Type,
							name : item.Name,
							additionalAttributes : item.AdditionalAttributes
						};

						processedObjects.push(object);

						if(++processedItems === result.Items.length) {
							resolve(processedObjects);
						}
					});
				}
			})
		});
	},

	/**
	 * Creates new entry for user
	 * @param  {String} userId AWS Cognito user id
	 * @param  {Object} item   Item object
	 * @return {Promise}       Promise of execution
	 */
	createNewEntryForUser : function(userId, item) {
		return new Promise((resolve, reject) => {
			
			let additionalAttributes = item.additionalAttributes;

			if(additionalAttributes == null) {
				additionalAttributes = [];
			}

			const tableRequest = {
				TableName : process.env.TABLE_NAME_SELECTION,
				Item : {
					UserId : userId,
					SelectionId : (item.type + ";" + item.name), 
					Name : item.name,
					Type : item.type,
					AdditionalAttributes : additionalAttributes
				}
			};

			dynamoDb.put(tableRequest, function(err, result) {
				if(err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	},

	initDefaultSelections : function(userId) {
		const self = this;

		fs.readFile('./src/data/initial-selections.json', 'utf8', (err, data) => {

			const results = JSON.parse(data);

			Object.keys(results).forEach((key) => {
				results[key].forEach((item) => {
					self.createNewEntryForUser(userId, item).then(() => {

					}).catch((error) => {

					})
				});
			})
		})
	}

};

module.exports = actions;