// 将文件分块
export const fileToBlock = (file, url) => {
    console.log("fileToBlock...", file);
    const size = file.size;
    const chunkSize = 5 * 1024 * 1024;// 5mb为一片
    const maxChunk = Math.ceil(size / chunkSize);
    const key = size + (+new Date()) + Math.ceil(Math.random() * 1000);
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
        formData.append('key', key);
        formData.append('size', file.size);
        formData.append('originalFilename', file.name);

        const req = request(url, { data: formData });
        return req;
        // const req = new HttpRequest('POST', item.action, formData, {
        //     withCredentials: true
        // });
        // return http2.request(req);
    });

    return {
        size,
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
    let _event = {
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
                console.log(11111111,value)
                value && value().then(x => {
                    _event.percent += (100 / observers.length);
                    // _event.percent = _event.percent.toFixed(2);
                    x = { ...x, _event };
                    onProgress && onProgress(x);
                    contains = [...contains, x];
                    // console.log('observer next... ', x);

                    // 参考：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next
                    if (!done) {
                        bund(g.next());
                    }

                    // 最后一个分块
                    if (contains.length == observers.length) {
                        _event.percent = 100;
                        onComplete && onComplete({ contains, _event });
                        resolve({ contains, _event });
                    }
                }).catch(err => {
                    onError && onError(err);
                    reject(err);
                });

                // value.subscribe({
                //     next(x) {
                //         if (x instanceof HttpResponse) {
                //             _event.percent += (100 / observers.length);
                //             // _event.percent = _event.percent.toFixed(2);
                //             x = { ...x, _event };
                //             onProgress && onProgress(x);
                //             contains = [...contains, x];
                //             // console.log('observer next... ', x);

                //             // 参考：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next
                //             if (!done) {
                //                 bund(g.next());
                //             }
                //         }
                //     },
                //     error(err) {
                //         onError && onError(err);
                //         reject(err);
                //         // console.error('observer error...', err);
                //     },
                //     complete() {
                //         // console.log('observer complete...', contains.length, observers.length);
                //         if (contains.length == observers.length) {
                //             _event.percent = 100;
                //             onComplete && onComplete({ contains, _event });
                //             resolve({ contains, _event });
                //         }
                //     }
                // });
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
            console.log(444, xhr)
            if (xhr.readyState === 4) {
                if (xhr.status == 200) {
                    // xhr.responseText会将服务器返回的数据转化为json字符串
                    // 所以要想使用返回对象中的数据则必须转换为json对象
                    var data = JSON.parse(xhr.responseText);
                    resolve(data);
                } else {
                    reject(xhr);
                }
            }
        }
    })
}