const dynamoDb = require('../utils/dynamo-client').getClient();
const parseString = require('xml2js').parseString;
const request = require('request');
const DataTransform = require("node-json-transform").DataTransform;
const async = require('async');
const uuidv4 = require('uuid/v4');


const actions = {
	/**
	 * Gets all the save places for user
	 * @param  {String} userId AWS Cognito userId
	 * @return {Promise} promise of execution        
	 */
	getPlacesForUser : function(userId) {
		return new Promise((resolve, reject) => {
			const tableRequest = {
				TableName : process.env.TABLE_NAME_PLACES,
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
					const processedObjects = [];

					if(result.Items.length == 0) {
						resolve([]);
						return;
					}

					result.Items.forEach(function(item) {
						const object = {
							id : item.PlaceId,
							name : item.Name,
							latitude : item.Latitude,
							longitude : item.Longitude,
							location : item.Location
						};

						processedObjects.push(object);

						if(++processedItems === result.Items.length) {
							resolve(processedObjects);
						}
					});
				}
			});
		});


	},

	/**
	 * Gets one place for user and placeId
	 * @param  {String} userId  AWS Cognito user id
	 * @param  {String} placeId Place uuid
	 * @return {Promise}         
	 */
	getPlace: function(userId, placeId) {
		return new Promise((resolve, reject) => {
			const tableRequest = {
				TableName : process.env.TABLE_NAME_PLACES,
				Key : {
					UserId : userId,
					PlaceId : placeId
				}
			};

			dynamoDb.get(tableRequest, function(err, result) {
				if(err) {
					console.log('Error occured while fetching with ' + userId + " and " + placeId);
					reject(err);
				} else {
					if(result.Item != null) {
						const place = {
							id : result.Item.PlaceId,
							name : result.Item.Name,
							latitude : result.Item.Latitude,
							longitude : result.Item.Longitude,
							location : result.Item.Location,
							country : result.Item.Country
						};

						resolve(place);
					} else {
						reject({ key : 'NO_PLACE_FOUND'});
					}
				}
			});
		});
	},

	/**
	 * Adds new place to the DynamoDB
	 *
	 * Enriches data from the internets
	 * @param {String} userId AWS Cognito user id
	 * @param {String} place  UUID placeId
	 */
	addNewPlace : function(userId, place) {
		return new Promise((resolve, reject) => {
			request.get({
				url : process.env.MAPQUEST_API_URL,
				qs : {
					location : place.latitude + "," + place.longitude,
					key : process.env.MAPQUEST_API_KEY
				},
				json : true
			}, function(error, response, body) {

				place.location = body.results[0].locations[0].adminArea5;
				place.country = body.results[0].locations[0].adminArea1;

				const uuid = uuidv4();

				const tableRequest = {
					TableName : process.env.TABLE_NAME_PLACES,
					Item : {
						UserId : userId,
						PlaceId : uuid,
						Name : place.name,
						Latitude : place.latitude,
						Longitude : place.longitude,
						Location : place.location,
						Country : place.country
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
		});
	},

	/**
	 * Gets weather from the FMI API by the given place location
	 * @param  {String} location City
	 * @param  {Date} 	time to fetch     
	 * @return {Promise} 
	 */
	getWeatherByPlace : function(location, time) {
		return new Promise((resolve, reject) => {
			const starttime = new Date(time.getTime() - 1000 * 60 * 60 * 2);
			const fmiApiUrl = process.env.FMI_API_URL.replace('{apikey}', process.env.FMI_API_KEY);
					
			request({
				url : fmiApiUrl,
				qs : {
					request : 'getFeature',
					storedquery_id : 'fmi::observations::weather::simple',
					starttime: starttime.toISOString(),
					endtime: time.toISOString(),
					place: location
				},
				headers : {
					'ContentType' : 'application/xml'
				}
			}, ( err, response, body) => {

				parseString(body, (err, result) => {
					if(err) {
						reject(err);
						return;
					}

					const map = {
					    list : 'wfs:FeatureCollection.wfs:member',
					    item: {
					        type: "BsWfs:BsWfsElement.0.BsWfs:ParameterName.0",
					        value: "BsWfs:BsWfsElement.0.BsWfs:ParameterValue.0",
					        time : "BsWfs:BsWfsElement.0.BsWfs:Time.0"
					    }
					};

				    const dataTransform = DataTransform(result, map);
					const transformed = dataTransform.transform();
					const transformedObject = {};

					async.each(transformed, (item, callback) => {
						if(transformedObject[item.time] == null) {
							transformedObject[item.time] = { time : item.time };
						}

						let field = null;
						
						switch(item.type) {
							case "t2m":
								field = "temperature";
								break;
							case "ws_10min":
								field = "windspeed"
								break;
							case "wd_10min":
								field = "winddirection";
								break;
							case "p_sea":
								field = "pressure";
								break;
							default:
								break;
						}

						if(field != null) {
							transformedObject[item.time][field] = item.value;
						}

						callback();

					}, function(error) {
						if(error) {
							reject(error);
						} else {
							const lastKey = Object.keys(transformedObject)[Object.keys(transformedObject).length - 1];

							resolve(transformedObject[lastKey]);
						}
					});
				});
			});
		})

	},

	/**
	 * Gets weather for current user and place
	 * @param  {String} userId  AWS Cognito user id
	 * @param  {String} placeId Place id
	 * @param  {Date} 	time    Wanted time of observation data
	 * @return {Promise}         
	 */
	getWeather : function(userId, placeId, time) {
		const self = this;

		return new Promise((resolve, reject) => {
			self.getPlace(userId, placeId).then((place) => {
				self.getWeatherByPlace(place.location, time).then((weather) => {
					place.weather = weather;
					resolve(place);
				}).catch((error) => {
					reject(error);
				});
			}).catch((error) => {
				reject(error);
			});
		});
	}
};

module.exports = actions;