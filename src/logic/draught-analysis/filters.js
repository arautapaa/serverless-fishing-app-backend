const filters = [{
	"field" : "weather",
	"name" : "byTemp",
	"action" : "temperatureFilter"
}, {
	"field" : "catchTime",
	"name" : "byYear",
	"action" : "yearFilter"
}, {
	"field" : "catchTime",
	"name" : "byMonth",
	"action" : "monthFilter"
}, {
	"field" : "weight",
	"name" : "weight",
	"action" : "weightFilter"
}, {
	"field" : "catchTime",
	"name" : "byTime",
	"action" : "hourFilter"
}, {
	"field" : "weather",
	"name" : "windD",
	"action" : "windFilter"
}]

module.exports = filters;