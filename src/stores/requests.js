import {defineStore} from "pinia";
import {getContent, getItem} from "@/api/api-endpoints.js";

export const useRequestsStore = defineStore('requests', {
    state: () => ({
        content: [],
    }),
    actions: {
        // получить полный список видео с категориями
        async getContent(state) {
            try {
                this.content = await getContent(state);

                return true;
            } catch (e) {
                console.error("Не удалось получить список видео: ", e);
            }
        },

        // получить информацию по одному элементу
        async getItem(video_id) {
            try {
                const res = await getItem();

                const found = res.find(item => item.video_id == video_id);

                return found;
            } catch (e) {
                console.error("Не удалось получить список видео: ", e);
            }
        }
    }
})