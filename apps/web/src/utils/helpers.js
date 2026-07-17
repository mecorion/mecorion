import router from "@/router/index.js";

export const openVideo = async (item) => {
    await router.push({
        path: `/watch/${item.video_id}`,
        query: { video_id: item.video_id,
            cat: item.category,
            url: item.url }
    });
}