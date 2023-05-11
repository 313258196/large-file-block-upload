import { defineComponent } from "vue";
import s from "./App.module.scss";

export default defineComponent({
    setup(props, { slots }) {
        const fileUploadChange = e => {
            console.log("fileUploadChange...", e);
            const files = e.target.files;
            if (files.length <= 0) {
                return alert('请选择要上传的文件！')
            }
            // 1.创建FormData对象
            var fd = new FormData();
            // 2.向FormData中追加文件
            fd.append('avatar', files[0]);

            // 1.创建xhr对象
            var xhr = new XMLHttpRequest();
            // 2.调用open函数，指定请求类型与url地址。请求类型必须为POST
            xhr.open('POST', 'http://localhost:8000/fileUpload');
            // 3.发起请求
            xhr.send(fd);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var data = JSON.parse(xhr.responseText);

                    console.log(data);
                    // if (data.status === 200) {
                    //     // alert('文件已上传')
                    //     document.querySelector('#img').src = 'http://www.xx.yy:2345' + data.url
                    // } else {
                    //     alert('文件上传失败')
                    // }
                    // options.success(result)
                }
            }
        }

        return () => (
            <div className={s.container}>
                <div className={s.inpBlock}>
                    <span className={s.label}>文件上传：</span>
                    <input className={s.inp} type="file" name="fileUpload" onChange={fileUploadChange} />
                </div>
            </div>
        )
    }
})