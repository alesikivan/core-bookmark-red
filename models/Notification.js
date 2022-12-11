const { Schema, model } = require('mongoose')

/*
  @Docs
  assignee – user which created a notification
  reviewer – user which will resolve the notification
  status: pending | fulfilled | rejected
  type – the type of the notification (for example: 'group-invite')
  message – the content of the notification (usually question)
*/

const Notification = new Schema({
  assignee: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'pending' },
  message: { type: String, default: '' },
  type: { type: String, default: '' },
  dateCreate: {type: Date, default: new Date()},
  dateUpdate: {type: Date, default: new Date()},
})

module.exports = model('Notification', Notification)
