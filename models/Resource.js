const { Schema, model } = require('mongoose')

const Resource = new Schema({
  link: {type: String, required: true},
  access: {type: String, required: true, default: 'public'},
  description: {type: String, default: ''},
  title: {type: String, default: ''},
  bertId: {type: Number},
  coordinates: {
    x: Number,
    y: Number
  },
  tags: {type: [String], default: []},
  anomaly: {type: Boolean, default: false},
  groups: {type: [Schema.Types.ObjectId], ref: 'Group', default: []},
  lists: {type: [Schema.Types.ObjectId], ref: 'List', default: []},
  owner: {type: Schema.Types.ObjectId, ref: 'User'},
  comments: {type: [Schema.Types.ObjectId], ref: 'Feedback'},
  exploreLater: {type: Boolean, default: false},
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
})

module.exports = model('Resource', Resource)