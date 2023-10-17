const { Schema, model } = require('mongoose')

const ClusterCache = new Schema({
  hash: { type: Array, require: true },
  clusters: { type: [Object], require: true },
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
})

module.exports = model('cluster_cache', ClusterCache)