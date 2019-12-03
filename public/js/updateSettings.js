import '@babel/polyfill';
import axios from 'axios';
import {
    showAlert
} from './alerts';

// type is either password or data
export const updateSettings = async (data, type) => {
    console.log(data);
    try {
        const url = type === 'password' ? 'http://localhost:3000/api/v1/users/updateMyPassword' : 'http://localhost:3000/api/v1/users/updateMe'
        const res = await axios({
            method: 'PATCH',
            url,
            data
        });
        // console.log(data)
        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()}succesfully`);
            // window.setTimeout(() => {
            //     location.assign('/');
            // }, 1500);
        }
        console.log(res);

    } catch (error) {
        showAlert('error', error.response.data.message);
    }
};