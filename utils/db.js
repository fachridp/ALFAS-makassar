const mongoose = require("mongoose");

mongoose.connect('mongodb+srv://fachridp:panasonic003@alfas-makassar.9sbnw.mongodb.net/newALFAS?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (!err) {
    console.log('MongoDB Connection Succeeded.');
  } else {
    console.log('Error in DB connection : ' + err);
  }
});