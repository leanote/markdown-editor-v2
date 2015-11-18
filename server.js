var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require("path");
var mime = {
    "css": "text/css",
    "gif": "image/gif",
    "html": "text/html",
    "ico": "image/x-icon",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "text/javascript",
    "json": "application/json",
    "pdf": "application/pdf",
    "png": "image/png",
    "svg": "image/svg+xml",
    "swf": "application/x-shockwave-flash",
    "tiff": "image/tiff",
    "txt": "text/plain",
    "wav": "audio/x-wav",
    "wma": "audio/x-ms-wma",
    "wmv": "video/x-ms-wmv",
    "xml": "text/xml"
};
var server = http.createServer(function(request, response) {
    var pathname = url.parse(request.url).pathname;
    var realPath;
    if (pathname == '/editor.html') {
        realPath = pathname;
    } else {
        realPath = path.join("public", pathname);
    }
    if (realPath[0] === '/') {
        realPath = realPath.substr(1);
    }
    console.log(realPath);
    fs.exists(realPath, function(exists) {
        if (!exists) {
            response.writeHead(404, "Not Found", {
                'Content-Type': 'text/plain'
            });
            response.write("This request URL " + pathname + " was not found on this server.");
            response.end();
        } else {
            var ext = path.extname(realPath);
            ext = ext ? ext.slice(1) : 'unknown';
            var contentType = mime[ext] || "text/plain";
            response.setHeader("Content-Type", contentType);
            fs.stat(realPath,
            function(err, stat) {
                var lastModified = stat.mtime.toUTCString();
                var ifModifiedSince = "If-Modified-Since".toLowerCase();
                response.setHeader("Last-Modified", lastModified);
                if (request.headers[ifModifiedSince] && lastModified == request.headers[ifModifiedSince]) {
                    response.writeHead(304, "Not Modified");
                    response.end();
                } else {
                    var raw = fs.createReadStream(realPath);
                    var acceptEncoding = request.headers['accept-encoding'] || "";
                    response.writeHead(200, "Ok");
                    raw.pipe(response);
                }
            });
        }
    });
});

var PORT = '3001';
server.listen(PORT);
console.log("Server runing at port: " + PORT + '. Visit: http://localhost:3001/editor.html');