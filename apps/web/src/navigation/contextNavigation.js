import {onBeforeUnmount, onMounted, shallowRef} from "vue";

export const contextNavigation = shallowRef(null);

export function useContextNavigation(config) {
    onMounted(() => {
        contextNavigation.value = config;
    });

    onBeforeUnmount(() => {
        if (contextNavigation.value === config) {
            contextNavigation.value = null;
        }
    });
}
