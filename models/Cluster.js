const { Schema, model } = require('mongoose')

const Cluster = new Schema({
  bertId: {type: Number, require: true},
  keywords: {type: [String], default: []},
  centroid_x: {type: Number, require: true},
  centroid_y: {type: Number, require: true},
  borders: {type: String, require: true},
})

module.exports = model('Cluster', Cluster)
