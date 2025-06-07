const jwt = require("jsonwebtoken");

/*
This function already expects that the id value will be an ObjectId() datatype value, 
so it converts it to a string value
*/
function createUserToken(id)
{
    const salt = process.env.BCRYPT_SALT;
    const token = jwt.sign({ _id: id.toString() }, salt, { expiresIn: "30 days" });
    return token;
}

module.exports = createUserToken;