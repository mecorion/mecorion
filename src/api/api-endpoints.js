import request from '../utils/api.js';

export function getContent() {
    return request({
        url: '/getContent',
        method: 'get',
    })
}

export function getItem() {
    return request({
        url: '/getItem',
        method: 'get',
    })
}