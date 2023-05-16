// 将文件分块
export const fileToBlock = (file, url) => {
    const size = file.size;
    const name = file.name;
    const chunkSize = 2 * 1024 * 1024;// 2mb为一片
    const maxChunk = Math.ceil(size / chunkSize);
    const hash = size + (+new Date()) + Math.ceil(Math.random() * 1000);
    const reqs = Array(maxChunk).fill(0).map((v, index) => {
        const start = index * chunkSize;
        let end = start + chunkSize;
        if (size - end < 0) {
            end = size;
        }
        const formData = new FormData();
        formData.append('file', file.slice(start, end));
        formData.append('start', start.toString());
        formData.append('end', end.toString());
        formData.append('index', index.toString());
        formData.append('maxChunk', maxChunk.toString());
        formData.append('hash', hash);
        formData.append('size', size);
        formData.append('originalFilename', name);

        const req = request(url, { data: formData });
        return req;
    });

    return {
        size,
		name,
		hash,
        chunkSize,
        maxChunk,
        reqs
    }
}

// 分片上传显示进度
export const blockBundle = async ({
    observers,
    onProgress,
    onError,
    onComplete,
}) => {
    let ev = {
        percent: 0
    };
    const foo = function* (arr) {
        for (const item of arr) {
            yield () => item;
        }
    };

    let contains = [];
    const obserableBundle = (observers) => {
        return new Promise((resolve, reject) => {
            const g = foo(observers);

            const bund = ({ value, done }) => {
                value && value().then(x => {
                    ev.percent += (100 / observers.length);
                    x = { ...x, ev: {
						...ev,
						percent:parseFloat(ev.percent.toFixed(2))
					} };
                    onProgress && onProgress(x);
                    contains = [...contains, x];

                    // 参考：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next
                    if (!done) {
                        bund(g.next());
                    }

                    // 最后一个分块
                    if (contains.length == observers.length) {
                        ev.percent = 100;
                        onComplete && onComplete({ contains, ev });
                        resolve({ contains, ev });
                    }
                }).catch(err => {
                    onError && onError(err);
                    reject(err);
                });
            }
            bund(g.next());
        })
    }
    await obserableBundle(observers);
    return contains;
}

export const request = (url, {
    data,
    methods = "POST"
}) => {
    return new Promise((resolve, reject) => {
        // 使用BOM提供的XMLHttpRequest对象创建ajax请求对象
        const xhr = new XMLHttpRequest();
        // 设置请求方式和请求地址
        xhr.open(methods, url);
        // 设置请求头部的内容类型，使服务器可解析FormData格式数据
        // xhr.setRequestHeader("Content-Type", "multipart/form-data");
        // 传递参数
        xhr.send(data);
        // 监听ajax请求的状态
        xhr.onreadystatechange = function () {
            // 如果本次请求是客户端向服务器发起的最后一次请求，并且响应成功，证明本次的ajax请求真正完成
            if (xhr.readyState === 4) {
                if (xhr.status == 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(xhr);
                }
            }
        }
    })
}