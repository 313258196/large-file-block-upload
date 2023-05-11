var express = require("express");
var router = express.Router();

router.post("/", async function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Authorization,X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method' )
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, PUT, DELETE')
    res.header('Allow', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')

    console.log(111,req.avatar,req.file)
    // res.send({
    //     status: false,
    //     message: JSON.stringify(req),
    // });
    //   res.render('index', { title: 'Express' });
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: "No file uploaded",
            });
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let avatar = req.files.avatar;

            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            avatar.mv("./uploads/" + avatar.name);

            //send response
            res.send({
                status: true,
                message: "File is uploaded",
                data: {
                    name: avatar.name,
                    mimetype: avatar.mimetype,
                    size: avatar.size,
                },
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;
