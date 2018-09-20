const express = require('express');
const router = express.Router();
const actions = require('../logic/user-actions');


router.get('/groups', (req, res) => {
	const userId = req.context.identity.cognitoIdentityId;

	actions.getUser(userId).then((response) => {
		res.send(response.Groups);
	}).catch((error) => {
		res.status(400).send(error);
	});
});

router.post('/groups', (req, res) => {
	const userId = req.context.identity.cognitoIdentityId;
	const groupInfo = req.body;

	actions.addNewUserGroup(userId, groupInfo).then((response) => {
		res.send(response);
	}).catch((error) => {
		res.status(400).send(error);
	});
});

router.get('/groups/:id', (req, res) => {
	const userId = req.context.identity.cognitoIdentityId;
	const groupId = req.params.id;
	actions.checkUserGroup(userId, groupId).then((response) => {
		res.send(response);
	}).catch((error) => {
		if(error.message == 'ACCESS_DENIED') {
			res.status(403).send(error);
		} else {
			res.status(400).send(error);
		}
	});
});

router.post('/groups/:id', (req, res) => {
	const userId = req.context.identity.cognitoIdentityId;
	const groupId = req.params.id;

	actions.selectUserGroup(userId, groupId).then((response) => {
		res.send(response);
	}).catch((error) => {
		if(error.message == 'ACCESS_DENIED') {
			res.status(403).send(error);
		} else {
			res.status(400).send(error);
		}
	});
});

router.put('/groups/:id', (req, res) => {
	const userId = req.context.identity.cognitoIdentityId;
	const groupId = req.params.id;

	actions.addUserGroupToUser(userId, groupId).then((response) => {
		res.status(201).send(response);
	}).catch((error) => {
		res.status(400).send(error);
	})
});

router.post('/groups/:id/invitations', (req, res) => {
	const userId = req.context.identity.cognitoIdentityId;
	const groupId = req.params.id;

	const invitationEmails = req.body.emails;

	actions.addUserInvitations(userId, groupId, invitationEmails).then((response) => {
		res.status(201).send(response);
	}).catch((error) => {
		if(error.message == 'ACCESS_DENIED') {
			res.status(403).send(error);
		} else {
			res.status(400).send(error);
		}
	});
});

router.put('/groups/invitation/:id', (req, res) => {
	const userId = req.context.identity.cognitoIdentityId;
	const invitationId = req.params.id;

	actions.addUserToGroupByInvitation(userId, invitationId).then((response) => {
		res.status(201).send(response);
	}).catch((error) => {
		res.status(400).send(error);
	});
})


module.exports = router;