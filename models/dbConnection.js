const mongoose = require('mongoose');
var constants = require('./modelConstants');
var bcrypt = require('bcryptjs');
//live url
if (process.env.ENV == "stg" || process.env.ENV == "prod") {
    const DB_USER = process.env.DB_USERNAME;
    const PASSWORD = encodeURIComponent(process.env.DB_PASSWORD);
    const HOST = process.env.DB_HOST;
    const DB_NAME = process.env.DB_NAME;
    const PORT = process.env.DB_PORT;
    var DB_URL = `mongodb://${DB_USER}:${PASSWORD}@${HOST}:${PORT}/${DB_NAME}`;

} else {
    // const DB_USER = process.env.DB_USERNAME;
    // const PASSWORD = encodeURIComponent(process.env.DB_PASSWORD);
    // const HOST = process.env.DB_HOST;
    // const DB_NAME = process.env.DB_NAME;
    // const PORT = process.env.DB_PORT;
    // var DB_URL = `mongodb://${DB_USER}:${PASSWORD}@${HOST}:${PORT}/${DB_NAME}`;
    var DB_URL = process.env.DBURL
    console.log(DB_URL);
}
console.log(DB_URL);
var connectMongoose = function() {
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useUnifiedTopology', true);
    // mongoose.set(`useFindAndModify`, false);
    // mongoose.set('useCreateIndex', true);
   
    mongoose.connect(DB_URL).then(connection => {
        console.log('Connected to MongoDB')
var AdminModel = mongoose.model(constants.adminSchema);

        async function adminCreate(){
            const adminData = await AdminModel.findOne()
            if(!adminData){
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync("admin@123", salt);
                 await AdminModel.create({
                     name:"admin,",
                     email:"admin@admin.com",
                     password:hash,
                 })
            }
         }
         adminCreate()
    }).catch(error => {
        console.log(error.message);
    })
};
connectMongoose();
// mongoose
//   .connect(DB_URL,{
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     family:4
//   })
//   .then(() => console.log('connection successfully...... '))
//   .catch((err) => {
//     console.log(err)
// });


// Error handler
mongoose.connection.on('error', function(err) {
    console.log("MongoDB connection error :", err);
});

// Reconnect when closed
mongoose.connection.on('disconnected', function() {
    setTimeout(function() {
        connectMongoose();
    }, 1000);
});

var helper = {
    importAllModels: function() {
        require('./modelBootstrap.js');
    }
}

helper.importAllModels();