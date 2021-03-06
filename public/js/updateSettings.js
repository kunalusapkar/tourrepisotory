import '@babel/polyfill';
import axios from 'axios';
import {
    showAlert
} from './alerts';

// type is either password or data
export const updateSettings = async (data, type) => {

    try {
        const url = type === 'password' ? '/api/v1/users/updateMyPassword' : '/api/v1/users/updateMe'
        console.log(data);
        const res = await axios({
            method: 'PATCH',
            url,
            data

        });
        console.log(res);
        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()}succesfully`);
            // window.setTimeout(() => {
            //     location.assign('/');
            // }, 1500);
        }

    } catch (error) {
        showAlert('error', error.response.data.message);
    }
};