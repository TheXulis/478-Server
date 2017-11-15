
'use strict';
module.exports = function(app) {
  var todoList = require('../controllers/todoListController');

  app.route('/users')
    .get(todoList.list_all_users);

  app.route('/register')
    .post(todoList.create_a_user);

  app.route('/login1')
    .post(todoList.login_part_one);

  app.route('/login2')
    .post(todoList.login_part_two);


  app.route('/users/:userId')
    .get(todoList.read_a_user)
    .put(todoList.update_a_user)
    .delete(todoList.delete_a_user);
};

