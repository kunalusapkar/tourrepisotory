const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    process.exit(1);

})

dotenv.config({
    path: './config.env'
});
const app = require('./app');
const port = process.env.PORT || 3000;



const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(() => console.log("Connection succesfull"));

// const testTour = new Tour({
//     name: "Gujrat National Park",
//     ratings: 4.5,
//     price: 470
// });

// testTour.save().then(doc => {
//     console.log(doc);
// }).catch(err => {
//     console.log("Error", err);
// })

const server = app.listen(port, () => {
    console.log('Server is launching');
});
// To handle promise rejection
process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    })

});