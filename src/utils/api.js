import axios from "axios";

const request = axios.create({
    baseURL: 'https://ecc3fafd4dd3d662.mokky.dev',
    timeout: 5000,
})

// перехватчик запроса
request.interceptors.request.use(
    async (config) => {
        return config
    },
    error => {
        console.error('Ошибка запроса: ', error)
        return Promise.reject(error)
    }
)

// перехватчик ответа
request.interceptors.response.use(
    response => {
        const {status, data, config} = response

        if (status === 200) {
            if (config.method === 'head') {
                return 200;
            }
            return data;
        }

        return data;
    },
    async (error) => {
        console.error(error)
        return Promise.reject(error)
    }
)

export default request;