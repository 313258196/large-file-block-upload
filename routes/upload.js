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

// https://blog.csdn.net/weixin_36136424/article/details/107722188

/**
 * Stream 合并
 * @param uploadBaseDirPath 储存上传文件的根目录
 * @param tempBlockDir 储存上传文件的临时文件夹
 * @param originalFilename 上传文件的真实文件名
 */
function streamMerge(args) {
	const { uploadBaseDirPath, tempBlockDir, originalFilename } = args;
	const sourceFiles = `${uploadBaseDirPath}/${tempBlockDir}`;
	const targetFile = `${uploadBaseDirPath}/${originalFilename}`;
	// 获取源文件目录下的所有文件 【合并流一定要注重块文件的顺序】
	const scripts = fs.readdirSync(sourceFiles).sort((a, b) => a - b); 
	// 创建一个可写流
	const fileWriteStream = fs.createWriteStream(targetFile); 

	return streamMergeRecursive(scripts, fileWriteStream, args);
}

/**
 * Stream 合并的递归调用
 * @param scripts 上传的临时块文件
 * @param fileWriteStream 可写流
 */
function streamMergeRecursive(scripts = [], fileWriteStream, args) {
	const { uploadBaseDirPath, tempBlockDir, originalFilename } = args;

	return new Promise((resolve,reject) => {
		const _bundle = (scripts, fileWriteStream, args) => {
			// console.log(000,scripts);
			// 递归到尾部情况判断
			if (!scripts.length) {
				// 最后关闭可写流，防止内存泄漏
				fileWriteStream.end(); 
				return resolve();
			}
		
			let first = scripts.shift();
			const currentFile = path.resolve(uploadBaseDirPath, `${tempBlockDir}/`, first);
			// 获取当前的可读流
			const currentReadStream = fs.createReadStream(currentFile); 
		
			currentReadStream.pipe(fileWriteStream, { end: false });
			currentReadStream.on('end', function () {
				_bundle(scripts, fileWriteStream, args);
			});
		
			// 监听错误事件，关闭可写流，防止内存泄漏
			currentReadStream.on('error', function (error) { 
				fileWriteStream.close();
				return reject(error);
			});
		}
		_bundle(scripts, fileWriteStream, args);
	})
}

// 创建文件夹
const existPath = (path, callback) => {
	if (fs.existsSync(path)) {
		callback && callback();
	} else {
		let mdRs = fs.mkdirSync(path, { recursive: true });
		if (mdRs) { callback && callback(); }
	}
}

// 删除文件夹
function removeDir(dir) {
	let files = fs.readdirSync(dir)
	for (var i = 0; i < files.length; i++) {
		let newPath = path.join(dir, files[i]);
		let stat = fs.statSync(newPath);
		if (stat.isDirectory()) {
			//如果是文件夹就递归下去
			removeDir(newPath);
		} else {
			//删除文件
			fs.unlinkSync(newPath);
		}
	}
	//如果文件夹是空的，就将自己删除掉
	fs.rmdirSync(dir);
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

// 大文件上传的路由接口，采用POST请求方式
router.post("/uploadBlock", (req, res) => {
	const pathAbso = "/files/uploadBlock";
	const uploadBaseDirPath = path.join(__dirname, ".." + pathAbso);
	const fileUpload = () => {
		// 创建解析对象
		var form = new formidable.IncomingForm();
		// 设置解析对象的编码格式
		form.encoding = "utf-8";
		// 设置文件上传的路径
		form.uploadDir = uploadBaseDirPath;
		// 上传文件时可以使用原来的文件扩展名
		form.keepExtensions = false;

		form.parse(req, (err, fields, files) => {
			let { index, maxChunk, originalFilename, hash } = fields;
			let { file } = files;

			// 储存上传文件的临时文件夹
			const tempBlockDirPath = `${uploadBaseDirPath}/${hash}`;
			let ws = null;
			let buffer = null;
			try {
				buffer = fs.readFileSync(file.filepath);
				const fsWrite = () => {
					ws = fs.createWriteStream(`${tempBlockDirPath}/${index}`);
					ws.write(buffer, (error) => {
						// 删除formidable储存的原文件地址
						fs.unlinkSync(file.filepath);

						// 最后一个分片进行合并
						if (parseInt(index) + 1 == maxChunk) {
							streamMerge({
								uploadBaseDirPath,
								tempBlockDir: hash,
								originalFilename
							}).then(() => {
								// removeDir(tempBlockDirPath);
								res.send({
									code: 200,
									msg: "上传成功！",
									data: {
										path: pathAbso + "/" + originalFilename,
										hash
									}
								});
							}).catch(err => {
								res.send({
									code: 400,
									msg: "合并失败！",
									data: err
								});
							});
						} else {
							if(error){
								res.send({
									code: 400,
									msg: "上传失败！",
									data: error
								});
								return;
							}
							res.send({
								code: 200,
								msg: "上传成功！",
								data: {
									path: pathAbso + "/" + `${hash}/${index}`,
									hash
								}
							});
						}
					});
					ws.close();
				}
				existPath(tempBlockDirPath, fsWrite);
			} catch (error) {
				res.send({
					code: 400,
					msg: "上传失败！",
					data: error
				});
			}
		});
	}
	existPath(uploadBaseDirPath, fileUpload);
});

module.exports = router;