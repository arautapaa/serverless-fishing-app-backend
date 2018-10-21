class DataFilters {
	static basicFilter(draught, filterName) {
		return new Promise((resolve) => {
			const filteredValue = draught[filterName];

			resolve({
				key : filteredValue,
				value : draught
			});
		})

	}

	static temperatureFilter(draught, filterName) {
		return new Promise((resolve) => {
			const filteredValue = draught[filterName];

			const temperature = parseFloat(filteredValue.temperature);

			const step = 5;

			const stepMin = parseInt(temperature / step) * step;
			const key = stepMin + "-" + (stepMin + (step - 0.1));

			resolve({
				key : key,
				value : draught
			})
		})
	}

	static monthFilter(draught, filterName) {
		return new Promise((resolve) => {
			const filteredValue = draught[filterName];

			const date = new Date(filteredValue);

			resolve({
				key : date.getMonth() + 1,
				value : draught
			})
		})
	}

	static yearFilter(draught, filterName) {
		return new Promise((resolve) => {
			const filteredValue = draught[filterName];

			const date = new Date(filteredValue);

			resolve({
				key : 1900 + date.getYear(),
				value : draught
			});	
		})

	}

	static weightFilter(draught, filterName) {
		return new Promise((resolve) => {
			const filteredValue = draught[filterName];

			const distance = 500;
			const weightStep = parseInt(draught.weight / distance) * distance;

			const step = weightStep + "-" + (weightStep + (distance - 1));


			resolve({
				key : step,
				value : draught
			});
		});
	}

	static windFilter(draught, filterName) {
		return new Promise((resolve) => {
			const valueMap = {
				"0" : "Pohjoinen",
				"15" : "Pohjoinen",
				"30" : "Koillinen",
				"45" : "Koillinen",
				"60" : "Koillinen",
				"75" : "Itä",
				"90" : "Itä",
				"105" : "Itä",
				"120" : "Kaakko",
				"135" : "Kaakko",
				"150" : "Kaakko",
				"165" : "Etelä",
				"180" : "Etelä",
				"195" : "Etelä",
				"210" : "Lounas",
				"225" : "Lounas",
				"240" : "Lounas",
				"255" : "Länsi",
				"270" : "Länsi",
				"285" : "Länsi",
				"300" : "Luode",
				"315" : "Luode",
				"330" : "Luode",
				"345" : "Pohjoinen" 
			}

			const filteredValue = draught[filterName];

			const windDirection = parseFloat(filteredValue.winddirection);

			const step = 15;

			const wdstep = (parseInt(windDirection / step) * step);

			resolve({
				key : valueMap[wdstep],
				value : draught
			})

		});
	}

	static hourFilter(draught, filterName) {
		return new Promise((resolve) => {
			const filteredValue = draught[filterName];

			const date = new Date(filteredValue);

			resolve({
				key : date.getHours(),
				value : draught
			})
		})
	}
}

module.exports = DataFilters;