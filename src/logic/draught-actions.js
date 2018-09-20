const dynamoDb = require('../utils/dynamo-client').getClient();
const async = require('async');
const uuidv4 = require('uuid/v4');

const placeActions = require('./place-actions');

const actions = {
	/**
	 * Fetches all the draughts for current user
	 * @param  {String} userId AWS Cognito user id
	 * @return {Promise}
	 */
	getDraughtsForUser : function(userId) {
		return new Promise((resolve, reject) => {
			const tableRequest = {
				TableName : process.env.TABLE_NAME_DRAUGHTS,
				KeyConditionExpression: "#user = :userId",
				ExpressionAttributeNames:{
				    "#user": "UserId"
				},
				ExpressionAttributeValues: {
				    ":userId": userId
				}
			};

			dynamoDb.query(tableRequest, (err, result) => {
				if(err) {
					reject(err);
				} else {
					const draughts = [];

					async.each(result.Items, (item, callback) => {
						const draught = {
							id : item.DraughtId,
							placeId : item.PlaceId,
							catchTime : new Date(item.CatchTime).toISOString(),
							fish : item.Fish,
							fisher : item.Fisher,
							gear : item.Gear,
							weight : item.Weight,
							weather : item.Weather,
							additionalAttributes : item.AdditionalAttributes
						}

						draughts.push(draught);

						callback(null);
					}, function(err) {
						if(err) {
							reject(err);
						} else {
							resolve(draughts);
						}
					});
				}
			});
		});
	},

	getOneDraught : function(userId, draughtId) {
		return new Promise((resolve, reject) => {
			const tableRequest = {
				TableName : process.env.TABLE_NAME_DRAUGHTS,
				Key : {
					UserId : userId,
					DraughtId : draughtId
				}
			};

			dynamoDb.get(tableRequest, (err, result) => {
				if(err) {
					console.log('Error occured while fetching with ' + userId + " and " + draughtId);
					reject(err);
				} else {
					if(result.Item != null) {
						const item = result.Item;
						const draught = {
							id : item.DraughtId,
							placeId : item.PlaceId,
							catchTime : new Date(item.CatchTime).toISOString(),
							fish : item.Fish,
							fisher : item.Fisher,
							gear : item.Gear,
							weight : item.Weight,
							weather : item.Weather,
							additionalAttributes : item.AdditionalAttributes
						};

						resolve(draught);
					} else {
						reject({ key : 'NO_ENTRY_FOUND'});
					}
				}
			});
		});
	},

	updateDraught : function(userId, draughtId, draught) {

		return new Promise((resolve, reject) => {				
			placeActions.getWeather(userId, draught.placeId, new Date(draught.catchTime)).then((place) => {
				
				draught.weather = place.weather;
				const params = {
				  TableName: process.env.TABLE_NAME_DRAUGHTS,
				  Key: { 
				  	UserId : userId,
				  	DraughtId : draughtId 
				  },
				  UpdateExpression: 'set #fish = :fish, #gear = :gear, #place = :place, #fisher = :fisher, #time = :time, #weight = :weight, #weather = :weather, #additionalAttributes = :additionalAttributes',
				  ExpressionAttributeNames: {'#fish' : 'Fish',
				  		"#gear" : 'Gear',
				  		'#place' : 'PlaceId',
				  		'#fisher' : 'Fisher',
				  		'#time' : 'CatchTime',
				  		'#weight' : 'Weight',
				  		'#weather' : 'Weather', 
				  		'#additionalAttributes' : "AdditionalAttributes"
					},
				  ExpressionAttributeValues: {
				    ':fish' : draught.fish,
				    ':gear' : draught.gear,
				    ':fisher' : draught.fisher,
				    ':place' : draught.placeId,
				    ':time' : draught.catchTime,
				    ':weather' : draught.weather,
				    ':weight' : draught.weight,
				    ':additionalAttributes' : draught.additionalAttributes
				  }
				};

				dynamoDb.update(params, (err, item) => {
					if(err) {
						console.log(err);


						reject(err);
					} else {
						resolve(draught);
					}
				});
			}).catch((error) => {
				reject(error);
			});
		})

	},

	saveDraught : function(userId, draught) {
		return new Promise((resolve, reject) => {
			if(draught.placeId) {
				placeActions.getWeather(userId, draught.placeId, new Date(draught.catchTime)).then((place) => {
					draught.weather = place.weather;
				
					const uuid = uuidv4();
					draught.id = uuid;

					const tableRequest = {
						TableName : process.env.TABLE_NAME_DRAUGHTS,
						Item : {
							UserId : userId,
							DraughtId : uuid,
							PlaceId : draught.placeId,
							CatchTime : new Date(draught.catchTime).toISOString(),
							Fish : draught.fish,
							Fisher : draught.fisher,
							Gear : draught.gear,
							Weight : draught.weight,
							Weather : draught.weather,
							AdditionalAttributes : draught.additionalAttributes
						}
					};

					dynamoDb.put(tableRequest, (err, result) => {
						if(err) {
							reject(err);
						} else {
							resolve(draught);
						}
					});
				}).catch((error) => {
					reject(error);
				});
			} else {
				reject({
					message : "placeId is mandatory parameter"
				});	
			}
		});
	}, 

	deleteDraught : function(groupId, draughtId) {
		const self = this;

		return new Promise((resolve, reject) => {
			self.getOneDraught(groupId, draughtId).then((response) => {
				const tableRequest = {
					TableName : process.env.TABLE_NAME_DRAUGHTS,
					Key : {
						UserId : groupId,
						DraughtId : draughtId
					}
				};

				dynamoDb.delete(tableRequest, (err, result) => {
					if(err) {
						reject(error);
					} else {
						resolve({
							deleted : draughtId
						})
					}
				})
			}).catch((error) => {
				reject(error);
			})
		})
	}
}

module.exports = actions;