var express = require('express');
const fs = require('fs')

// Constants
var DEFAULT_PORT = 8000;
var PORT = process.env.PORT || DEFAULT_PORT;

// App
var app = express();
app.get('/', function (req, res) {
console.log("******************Route slash worked*************")
res.sendFile('test.html', {root: __dirname })
});
      

app.get('/test', function (req, res) {
    console.log("******************Route test worked*************")
    res.send("Test route is also working ")
});

//----------------------------------------------------------------------------------------------------------
app.listen(PORT)
console.log('Running on http://localhost:' + PORT);
