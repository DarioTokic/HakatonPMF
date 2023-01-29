var bcrypt = require("bcrypt");
var jsonwebtoken = require("jsonwebtoken");

kriptovanje = {
    hashirajLozinku: async function(lozinka){
        let hashiran = await bcrypt.hash(lozinka, 10);
        return hashiran;
    },
    provjeri: async function(lozinka, hash){
        return await bcrypt.compare(lozinka, hash);
    },

    hashirajToken: async function(token){
        let kriptToken = jsonwebtoken.sign(token, 'secret');
        return kriptToken;
    },
    dehashirajToken: async function(token){
        let decoded = jsonwebtoken.verify(token, 'secret');
        return decoded;
    }
}
module.exports = kriptovanje;