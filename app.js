var app = require("express")();
var port = process.argv[2] || 8888;
var routes = require('./routes');

app.use("/", routes);

console.log("backend server listening at port ", port);
app.listen(port);
