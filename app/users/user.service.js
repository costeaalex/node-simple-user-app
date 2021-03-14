const config = require('config.json');
const jwt = require('jsonwebtoken');
const Role = require('_helpers/role');
const mongoose = require('mongoose');
const db = require("../models");
const RoleDB = db.role;
const User = db.user;

db.mongoose
  .connect(`mongodb://mongo/db`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

function initial() {
  RoleDB.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new RoleDB({
        name: "user"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }
        console.log("added 'user' to roles collection");
      });

      new RoleDB({
        name: "admin"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }
        console.log("added 'user' to roles collection");
      });

    }
  });
}

// users hardcoded for simplicity, store in a db for production applications
const users = [
    { id: 1, username: 'admin', password: 'admin', firstName: 'Admin', lastName: 'User', role: Role.Admin },
    { id: 2, username: 'user', password: 'user', firstName: 'Normal', lastName: 'User', role: Role.User }
];

module.exports = {
    authenticate,
    getAll,
    getById,
    register
};

async function register({username,password,role}) {
    User.findOne(
                  {
                      username: {$in: username}
                  },
                  (err, userDb) => {
                    if (userDb) {
                      return;
                    }
                  }
              );

    return RoleDB.findOne(
        {
          name: { $in: role }
        },
        (err, roleDb) => {

          if (err) {
            console.log( "error:", err );
            return;
          }

          if(roleDb) {
              const user = new User({
                  username: username,
                  password: password,
                  role: roleDb
              }); 

              user.save((err, user) => {
                  if (err) {
                      console.log( "error:", err);
                      return;
                  }
                  if(user) {
                      console.log("user saved");
                      return {user};
                  }
              });
          }
        }
    )
}

async function authenticate({ username, password }) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = jwt.sign({ sub: user.id, role: user.role }, config.secret);
        const { password, ...userWithoutPassword } = user;
        return {
            ...userWithoutPassword,
            token
        };
    }
}

async function getAll() {
    return users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
}

async function getById(id) {
    const user = users.find(u => u.id === parseInt(id));
    if (!user) return;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}
