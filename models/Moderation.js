const { Schema, model } = require('mongoose')

/*
  @Docs
  assignee – user which created a moderation
  reviewer – user which will resolve the moderation
  subject - the resolving element (for example: group id)
  status: pending | fulfilled | rejected
  type – the type of the moderation (for example: 'group-invite')
  message – the content of the moderation (usually question)
*/

const Moderation = new Schema({
  assignee: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User' },
  subject: { type: Schema.Types.ObjectId },
  status: { type: String, default: 'pending' },
  message: { type: String, default: '' },
  type: { type: String, default: '' },
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
})

module.exports = model('Moderation', Moderation)
