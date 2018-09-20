const dynamoDb = require('../utils/dynamo-client').getClient();
const uuidv4 = require('uuid/v4');
const cryptoHelper = require('../utils/crypto-helper');
const selectionActions = require('./selection-actions');
const emailService = require('../utils/email-client');

const async = require('async');

const actions = {
	/**
	 * Adds new user group for user
	 * @param {String} userId    AWS Cognito user Id
	 * @param {Object} userGroup User group JSON
	 */
	addNewUserGroup : function(userId, userGroup) {
		const self = this;

		return new Promise((resolve, reject) => {
			const groupId = uuidv4();

			userGroup.groupId = groupId;

			const tableRequest = {
				TableName : process.env.TABLE_NAME_USER,
				Item : {
					Id : userGroup.groupId,
					Name : userGroup.name,
					Owner : userId
				}
			};

			dynamoDb.put(tableRequest, (err, result) => {
				if(err) {
					reject(err);
				} else {
					self.addUserGroupToUser(userId, groupId).then((response) => {
						resolve(response);

						selectionActions.initDefaultSelections(groupId);
					}).catch((error) => {
						reject(error);
					});
				}
			});
		});
	},
	/**
	 * Adds user group to user
	 * @param {String} userId  AWS Cognito user id
	 * @param {String} groupId User group id
	 */
	addUserGroupToUser : function(userId, groupId) {
		const self = this;

		return new Promise((resolve, reject) => {
			self.getUser(userId).then((user) => {

				const tableRequest = {
					TableName : process.env.TABLE_NAME_USER,
					Key : {
						Id : userId
					},
					UpdateExpression : 'SET #list = list_append(#list, :vals)',
					ExpressionAttributeNames: {
					    "#list": "Groups"
					},
					ExpressionAttributeValues : {
					    ':vals': [{
					    	groupId : groupId,
					    	selected : true
					    }]
					}
				};

				dynamoDb.update(tableRequest, (err, result) => {
					if(err) {
						reject(err);
					} else {
						resolve({
							success : true
						});
					}
				});
			}).catch((error) => {
				reject(error);
			});
		});
	},
	/**
	 * Saves user to the database
	 * @param  {Object} user User object
	 * @return {Promise}
	 */
	saveUser : function(user) {
		return new Promise((resolve, reject) => {
			const tableRequest = {
				TableName : process.env.TABLE_NAME_USER,
				Item : user
			};

			dynamoDb.put(tableRequest, (err, result) => {
				if(err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	},
	/**
	 * Checks if user has rights to read the user group information
	 * @param  {String} userId  AWS Cognito userId
	 * @param  {String} groupId User group id
	 * @return {Promise}
	 */
	checkUserGroup : function(userId, groupId) {
		const self = this;

		return new Promise((resolve, reject) => {
			self.getUser(userId).then((user) => {

				let hasAccess = false;

				async.each(user.Groups, (group, callback) => {

					if(group.groupId.trim() === groupId.trim()) {
						hasAccess = true;
						callback();
					} else {
						callback();
					}
				}, (err) => {
					if(err) {
						reject(err);
					} else if(!hasAccess) {
						reject({
							message : "ACCESS_DENIED"
						});
					} else {
						resolve({
							message : "ACCESS_GRANTED"
						});
					}
				});
			}).catch((error) => {
				reject(error);
			});
		});
	},

	getSelectedUserGroup : function(userId) {
		const self = this;

		return new Promise((resolve, reject) => {
			self.getUser(userId).then((user) => {
				let userGroupId = null;

				if(user.Groups != null && user.Groups.length == 1) {
					resolve(user.Groups[0].groupId);
				} else if(user.Groups != null && user.Groups.length > 1) {
					async.each(user.Groups, (group, callback) => {
						if(group.selected) {
							userGroupId = group.groupId;
						}
					}, function(err) {
						if(userGroupId == null) {
							reject({
								message : 'NO_SELECTED_USER_GROUP'
							});
						} else {
							resolve(userGroupId);
						}
					});
				} else {
					reject({
						message : 'NO_USERGROUPS'
					});
				}
			});
		});
	},

	selectUserGroup : function(userId, groupId) {
		const self = this; 

		return new Promise((resolve, reject) => {
			self.getUser(userId).then((user) => {
				const userGroups = [];

				async.each(user.Groups, (group, callback) => {
					if(group.groupId == groupId) {
						group.selected = true;
					} else {
						group.selected = false;
					}

					userGroups.push(group);

					callback();
				}, function(err) {
					const tableRequest = {
						TableName : process.env.TABLE_NAME_USER,
						Key : {
							Id : userId
						},
						UpdateExpression : 'SET #list = :vals',
						ExpressionAttributeNames: {
						    "#list": "Groups"
						},
						ExpressionAttributeValues : {
						    ':vals': userGroups
						}

					};

					dynamoDb.update(tableRequest, (err, result) => {
						if(err) {
							reject(err);
						} else {
							resolve({
								success : true
							});
						}
					});
				});


			});
		});
	},
	/**
	 * Gets user entry from the database
	 * @param  {String} userId AWS Cognito user id
	 * @return {Promise}
	 */
	getUser : function(userId) {
		const self = this;

		return new Promise((resolve, reject) => {
			const tableRequest = {
				TableName : process.env.TABLE_NAME_USER,
				Key : {
					Id : userId
				}
			};

			dynamoDb.get(tableRequest, (err, result) => {
				if(err) {
					reject(err);
				} else {
					if(result.Item == null) {
						const user = {
							Id : userId,
							Groups : []
						}

						self.saveUser(user).then((response) => {
							resolve(user);
						}).catch((error) => {
							reject(error);
						});
					} else {
						resolve(result.Item);
					}
				}
			});
		});
	},

	getUserGroup : function(groupId) {
		const self = this;

		return new Promise((resolve, reject) => {
			const tableRequest = {
				TableName : process.env.TABLE_NAME_USER,
				Key : {
					Id : groupId
				}
			};

			dynamoDb.get(tableRequest, (err, result) => {
				if(err) {
					reject(err);
				} else {
					if(result.Item == null) {
						reject({
							message : 'NO_GROUP_EXISTS'
						}); 
					} else {
						resolve({
							id : result.Item.Id,
							name : result.Item.Name,
							invitations : result.Item.InvitationKeys
						});
					}
				}
			});
		});
	},

	sendInvitationEmail : function(email, inviteKey) {
		const emailParams = {
			Destination : {
				ToAddresses : [email]
			},
			Message : {
				Body : {
					Text : {
						Data : "I would like to invite you to use my fishing diary " + process.env.AWS_APP_DOMAIN + "/invitation/" + inviteKey 
						
					}
				}, 
				Subject : {
					Data : "Invitation to fishing diary"
				}

			},
			Source : process.env.EMAIL_SENDER
		};

		emailService.sendEmail(emailParams);
	},

	addUserInvitations: function(userId, groupId, invitations) {
		const self = this;

		return new Promise((resolve, reject) => {
			self.checkUserGroup(userId, groupId).then((response) => {
				const listOfKeys = [];

				async.each(invitations, (item, callback) => {
					cryptoHelper.generateKey(groupId + ":" + item).then((key) => {
						listOfKeys.push({
							key : key,
							valid : true
						});

						self.sendInvitationEmail(item, key);

						callback();
					});
				}, function() {
					const tableRequest = {
						TableName : process.env.TABLE_NAME_USER,
						Key : {
							Id : groupId
						},
						UpdateExpression : 'SET #list = :vals',
						ExpressionAttributeNames: {
						    "#list": "InvitationKeys"
						},
						ExpressionAttributeValues : {
						    ':vals': listOfKeys
						}
					};

					dynamoDb.update(tableRequest, (err, result) => {
						if(err) {
							reject(err);
						} else {
							resolve({
								message : 'INVITATIONS_SENT'
							});
						}
					})
				});
			}).catch((error ) => {
				reject(error);
			})
		})

	},

	invalidateInvitationId : function(groupId, invitationId) {
		const self = this;

		return new Promise((resolve, reject) => {
			self.getUserGroup(groupId).then((group) => {
				const invitations = [];
				let invitationAccepted = false;

				async.each(group.invitations, (invitation, callback) => {
					if(invitation.valid && invitation.key == invitationId) {
						invitation.valid = false;
						invitationAccepted = true;
					}

					invitations.push(invitation);

				}, (err) => {
					if(err) {
						reject(err);

					} else if(!invitationAccepted) {
						reject({
							message : 'INVITATION_INVALID'
						});
					} else {
						const tableRequest = { 
							TableName : process.env.TABLE_NAME_USER,
							Key : {
								Id : groupId
							},
							UpdateExpression : 'SET #list = :vals',
							ExpressionAttributeNames: {
							    "#list": "InvitationKeys"
							},
							ExpressionAttributeValues : {
							    ':vals': invitations
							}
						};

						dynamoDb.update(tableRequest, (err, result) => {
							if(err) {
								reject(err);
							} else {
								resolve({
									message : 'INVITATION_ACCEPTED'
								});
							}
						})
					}
				});
			}).catch((error) => {
				reject(error);
			})
		});
	},

	addUserToGroupByInvitation : function(userId, invitationId) {
		const self = this;

		return new Promise((resolve, reject) => {
			cryptoHelper.decryptValue(invitationId).then((decryptedValue) => {
				const values = decryptedValue.split(":");
				const groupId = values[0];

				self.checkUserGroup(userId, groupId).then(() => {
					reject({
						message : 'USER_BELONGS_TO_GROUP_ALREADY'
					});
				}).catch((error) => {
					if(error.message == 'ACCESS_DENIED') {
						Promise.all([self.invalidateInvitationId(groupId, invitationId), self.addUserGroupToUser(userId, groupId)]).
						then(() => {
							resolve({
								message : 'INVITATION_ACCEPTED'
							})
						}).catch((error) => {
							reject(error);
						})
					} else {
						reject(error);
					}
				});
			}).catch((error) => {
				reject({
					message : 'INVALID_INVITATION_ID'
				})
			});
		});
	}
};

module.exports = actions;
