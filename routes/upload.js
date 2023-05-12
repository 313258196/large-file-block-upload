// 导入express模块
const express = require("express");
// 导入文件上传模块
const formidable = require("formidable");
// 导入路径模块
const path = require("path");
// 导入文件操作模块
const fs = require("fs");
// 创建路由对象
const router = express.Router();

const existPath = (path, callback) => {
    if (fs.existsSync(path)) {
        console.log('Directory exists!');
        callback && callback();
    } else {
        console.log('Directory not found, then run mkdirSync.');
        let mdRs = fs.mkdirSync(path, { recursive: true });
        if (mdRs) {
            callback && callback();
        }
    }
}

// 文件山川的路由接口，采用POST请求方式
router.post("/", (req, res) => {
    const pathAbso = "/files/upload";
    const dir = path.join(__dirname, ".." + pathAbso);
    const fileUpload = () => {
        // 创建解析对象
        var form = new formidable.IncomingForm();
        // 设置解析对象的编码格式
        form.encoding = "utf-8";
        // 设置文件上传的路径
        form.uploadDir = dir;
        // 上传文件时可以使用原来的文件扩展名
        form.keepExtensions = true;
        // 设置上传文件的大小
        form.maxFieldsSize = 1024 * 1024 * 1024;
        //解析并上传文件

        form.parse(req, (err, fields, files) => {
            // 如果解析或者上传异常
            if (err) {
                // 结束并响应异常状态码和异常信息
                return res.send({
                    code: 400,
                    msg: "上传文件失败！",
                    data: err
                });
            }
            const originalFilename = files.file.originalFilename;
            // 重新拼接文件路径
            var filepath = path.join(form.uploadDir, originalFilename);
            // 将上传的文件路径及其文件名称重修修改为我们拼接的文件名称
            fs.renameSync(files.file.filepath, filepath);

            return res.send({
                code: 200,
                msg: "文件上传成功！",
                data: pathAbso + "/" + originalFilename
            });
        });
    }

    existPath(dir, fileUpload);
});



// 文件山川的路由接口，采用POST请求方式
router.post("/uploadBlock", (req, res) => {
    const pathAbso = "/files/uploadBlock";
    const dir = path.join(__dirname, ".." + pathAbso);
    const fileUpload = () => {
        // 创建解析对象
        var form = new formidable.IncomingForm();
        // 设置解析对象的编码格式
        form.encoding = "utf-8";
        // 设置文件上传的路径
        form.uploadDir = dir;
        // 上传文件时可以使用原来的文件扩展名
        form.keepExtensions = true;
        // 设置上传文件的大小
        // form.maxFieldsSize = 1024 * 1024 * 1024;
        //解析并上传文件

        form.parse(req, (err, fields, files) => {
            let { index, maxChunk, originalFilename, key } = fields;
            console.log(3333, fields);
            console.log(4444, files);
            let filename = originalFilename;
            let hash = key;
            const dirh = `${dir}/${hash}`;
            let ws = null;
            let buffer = null;
            try {
                buffer = fs.readFileSync(files.file.filepath);
                const fsWrite = async () => {
                    ws = fs.createWriteStream(`${dirh}/${index + 1}`);
                    await ws.write(buffer);
                    ws.close();

                    // 最后一个分片进行合并
                    if (parseInt(index) + 1 == maxChunk) {
                            try {
                                let len = 0
                                console.log(999, fs.readdirSync(`${dirh}`))
                                const bufferList = fs.readdirSync(`${dirh}`).map((hash, index) => {
                                    index = index + "";
                                    console.log(2222, `${dirh}/${index + 1}`)
                                    const buffer = fs.readFileSync(`${dirh}/${index + 1}`)
                                    console.log(11111133333333, Buffer.isBuffer(buffer))
                                    
                                    console.log(222333, buffer,buffer.length)
                                    len += buffer.length
                                    return buffer
                                });
                                console.log(1000, bufferList, len)
                                //Merge files
                                const buffer = Buffer.concat(bufferList, len);
                                console.log(1111, buffer)
                                const ws = fs.createWriteStream(`${dir}/${filename}`)
                                ws.write(buffer);
                                ws.close();
                                res.send({
                                    code: 200,
                                    msg: "文件上传成功2！",
                                    data: pathAbso + "/" + filename
                                });
                            } catch (error) {
                                console.error(error);
                            }
                            
                    } else {
                        res.send({
                            code: 200,
                            msg: "文件上传成功1！",
                            data: pathAbso + "/" + `${hash}/${fields.index}`
                        });
                    }
                }
                existPath(dirh, fsWrite);
            } catch (error) {
                console.error(error);
                res.status(500).send(`${filename}-${hash} Section uploading failed`);
            }
        });
    }

    existPath(dir, fileUpload);
});

module.exports = router;