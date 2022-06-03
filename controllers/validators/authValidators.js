const { check } = require("express-validator");

/* USEFULL NOW, NEED TO INCLUDE IN FUTURE */

class authValidators {
  register() {
    return [
      check('username', 'Username can not be empty').notEmpty().custom((value) => !!value.trim()),
      check('password', 'Password can not be less 6 charts and more then 15 charts').isLength({min: 6, max: 15}),
      check('email').isEmail(),
    ]
  }
}

module.exports = new authValidators()