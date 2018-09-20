const userActions = require('../logic/user-actions');

const functions = {
	userGroup : function(req, res, next) {
		const userId = req.context.identity.cognitoIdentityId;

		userActions.getSelectedUserGroup(userId).then((userGroupId) => {
			req.selectedUserGroup = userGroupId;
			next();
		}).catch((error) => {
			res.status(404).send(error);
		});
	}
};

module.exports = functions;