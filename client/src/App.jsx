import { defineComponent, ref } from "vue";
import s from "./App.module.scss";
import { request, fileToBlock , blockBundle} from "./utils";
import { ElMessage } from 'element-plus';

export default defineComponent({
    setup(props, { slots }) {
        const uploadResponse = ref({});
		const showUploadList = ref([]);

        const fileUploadBlockChange = (e) => {
			Array.from(e.target.files).forEach(file => {
				const {
				    size,
				    name,
				    hash,
				    chunkSize,
				    maxChunk,
				    reqs
				} = fileToBlock(file, "http://localhost:3132/upload/uploadBlock");
				showUploadList.value.push({ hash, name, percent: 0 });
				blockBundle({
				    observers: reqs,
				    onProgress: (res) => {
				        console.log("onProgress...",res);
						const idx = showUploadList.value.findIndex(item => item.hash == res.data.hash);
						if(idx !== -1){
							showUploadList.value[idx].percent = res.ev.percent;
						}
				    },
				    onComplete: ({ contains, ev }) => {
				        console.log("onComplete...",contains,ev);
				        // 最后一个分片 应该返回真实的完整的文件信息
				        let resTrue = contains[contains.length - 1];
						const idx = showUploadList.value.findIndex(item => item.hash == resTrue.data.hash);
						if(idx !== -1){
							showUploadList.value[idx].percent = ev.percent;
							ElMessage({
							    message: `${showUploadList.value[idx].name}上传成功！`,
							    type: 'success',
							});
						}
				    },
				    onError: (err) => {
						// ElMessage({
						//     message: `${showUploadList.value[idx].name}上传成功！`,
						//     type: 'error',
						// });
				        console.log("onError...", err);
				    }
				});
			});
        }

        return () => (
            <div className={s.container}>
				<div className={`${s.boxLeft} ${s.boxi}`}>
					<div className={s.title}>分片上传</div>
					<label className={s.inpLabel} for="fileUploadBlock">选择文件</label>
					<input className={s.inp} type="file" name="fileUploadBlock" id="fileUploadBlock" multiple onChange={fileUploadBlockChange} />
				</div>
				<div className={`${s.boxRight} ${s.boxi}`}>
					{
						showUploadList.value.map(item => {
							return <div className={s.progressItem}>
								<div className={s.progrTitle}>{item.name}</div>
								<el-progress percentage={item.percent} striped text-inside={true} stroke-width={26} />
							</div>
						})
					}
				</div>
            </div>
        )
    }
})