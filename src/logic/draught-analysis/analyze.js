const fs = require('fs');
const async = require("async");
const draughtActions = require('../draught-actions');

const filters = require('./filters');
const actions = require('./actions');

class Analyzer {
	static analyze(userId) {
		return new Promise((resolve) => {

			const analyzed = {};

			draughtActions.getDraughtsForUser(userId).then((draughts) => {
				async.each(draughts, (draught, callback) => {
					async.each(filters, (filter, acallback) => {
						if(!analyzed[filter.name]) {
							analyzed[filter.name] = {};						
						}

						actions[filter.action](draught, filter.field).then((filtered) => {
							if(!analyzed[filter.name][filtered.key]) {
								analyzed[filter.name][filtered.key] = [];
							}

							analyzed[filter.name][filtered.key].push(filtered.value);
								
							acallback();
						});
					}, () => {
						callback();
					});
				}, (err) => {
					if(err) {

					} else {
						resolve(analyzed);
					}
				});				
			})
		});

	}
}
module.exports = Analyzer;