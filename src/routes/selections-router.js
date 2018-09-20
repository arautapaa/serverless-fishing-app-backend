const express = require('express');
const router = express.Router();

const actions = require('../logic/selection-actions');
const async = require('async');

/**
 * Router function for fetching all the entries
 */
router.get('/', function(req, res) {
	const userId = req.selectedUserGroup;

	actions.findAllForUser(userId).then(function(response) {
		res.send(response);
	}).catch(function(error) {
		res.status(400).send(error);
	});
});
/**
 * Router function for adding the new entry
 */
router.post('/', function(req, res) {
	const userId = req.selectedUserGroup;

	if(Array.isArray(req.body)) {
		async.each(req.body, (selection, callback) => {
			actions.createNewEntryForUser(userId, selection).then(() => {
				callback();
			}).catch((error) => {
				callback(error);
			});
		}, (err) => {
			if(err) {
				res.status(400).send(err);
			} else {
				res.status(201).send();
			}
		});
	} else {
		actions.createNewEntryForUser(userId, req.body).then(function() {
			res.status(201).send();
		}).catch(function(error) {
			res.status(400).send(error);
		});
	}
});

router.delete('/', function(req, res) {
	res.send({ notImplemented : "yet"});
});

router.put('/', function(req, res) {
	res.send({ notImplemented : "yet"});
});

router.get('/type/:type', function(req, res) {
	const userId = req.selectedUserGroup;
	const type = req.params.type;

	actions.findAllForUserAndType(userId, type).then(function(response) {
		res.send(response);
	}).catch(function(error) {
		res.status(400).send(error);
	});
});

module.exports = router;