const { Schema, model } = require('mongoose')

const Group = new Schema({
  title: {type: String, required: true},
  accessLevel: {type: String, required: true, default: 'public'},
  defaultRole: {type: String, required: true, default: 'member'},
  groupPhoto: {type: String, default: ''},
  membersAmount: {type: Number, default: 1},
  keywords: {type: [String], default: []},
  owner: {type: Schema.Types.ObjectId, ref: 'User'},
  resources: {type: [Schema.Types.ObjectId], ref: 'Resource'},
  members: {type: [Schema.Types.ObjectId], default: []},
  broadcasters: {type: [Schema.Types.ObjectId], default: []},
  admins: {type: [Schema.Types.ObjectId], default: []},
  moderations: {type: [Schema.Types.ObjectId], ref: 'User', default: []},
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
})

module.exports = model('Group', Group)