import { defineComponent, ref } from "vue";
import s from "./App.module.scss";
import { request, fileToBlock , blockBundle} from "./utils";

export default defineComponent({
    setup(props, { slots }) {
        const uploadResponse = ref({});
        const uploadBlockResponse = ref({});

        const fileUploadChange = e => {
            console.log("fileUploadChange...", e);
            const files = e.target.files;
            if (files.length <= 0) {
                return alert("请选择上传的文件");
            }
            // 创建formdata对象=》上传文件必须用
            var formData = new FormData();
            formData.append("file", files[0]);

            request("http://localhost:8000/upload", { data: formData }).then((data) => {
                uploadResponse.value = data;
            }).catch(err => console.log(err));
        }

        const fileUploadBlockChange = (e) => {
            const files = e.target.files;

            for(let i = 0,len = files.length;i<len;i++){
                const file = files[i];
                const {
                    size,
                    chunkSize,
                    maxChunk,
                    reqs
                } = fileToBlock(file, "http://localhost:8000/upload/uploadBlock");

                blockBundle({
                    observers: reqs,
                    onProgress: (res) => {
                        console.log("onProgress...",res);
                        // // 处理上传进度条，必须指定 `percent` 属性来表示进度
                        // item.onProgress(res._event, item.file);
                        // this.showUploadList = setProgressPercent(res._event, item.file, { showUploadList: this.showUploadList });
        
                        // // console.log("onProgress...", this.showUploadList[0].percent)
                        // this.changeDetectorRef.markForCheck();
                        // this.changeDetectorRef.detectChanges();
                    },
                    onComplete: ({ contains, _event }) => {
                        console.log("onComplete...",contains,_event);
                        // // console.log("onComplete...", contains);
                        // this.msg.success(`${item.file.name}文件上传成功！`);
                        // let fileResTrue = contains[contains.length - 1].body;
                        // // 处理成功
                        // item.onSuccess(fileResTrue, item.file, _event);
                        // // 最后一个分片 应该返回真实的完整的文件信息
                        // this.accessoryValBundle(fileResTrue, "block");
        
                        // this.showUploadList = setProgressPercent(_event, item.file, { showUploadList: this.showUploadList, type: "onComplete" });
                        // // 清空控件upload回显列表 清空会导致upload控件内部报错字段丢失 所以还不能清空
                        // // this.accessoryFileList = [];
                        // this.changeDetectorRef.markForCheck();
                        // this.changeDetectorRef.detectChanges();
                    },
                    onError: (err) => {
                        console.log("onError...", err);
                        // this.showUploadList = setProgressPercent({}, item.file, { showUploadList: this.showUploadList, type: "onError" });
                        // this.changeDetectorRef.markForCheck();
                        // this.changeDetectorRef.detectChanges();
                        // item.onError(err, item.file);
                    }
                });
            }
        }

        return () => (
            <div className={s.container}>
                <div className={s.inpBlock}>
                    <span className={s.label}>文件上传：</span>
                    <input className={s.inp} type="file" name="fileUpload" onChange={fileUploadChange} />
                    {
                        uploadResponse.value.msg && <span>{uploadResponse.value.msg}：{uploadResponse.value?.data}</span>
                    }
                </div>
                <div className={s.inpBlock}>
                    <span className={s.label}>文件分片上传：</span>
                    <input className={s.inp} type="file" name="fileUploadBlock" onChange={fileUploadBlockChange} />
                    <span>{uploadBlockResponse.value.msg}：{uploadBlockResponse.value?.data}</span>
                </div>
            </div>
        )
    }
})