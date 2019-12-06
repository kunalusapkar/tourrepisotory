/* eslint-disable */
import axios from 'axios';
import {
    showAlert
} from './alerts';
const stripe = Stripe('pk_test_wCRT98QMNlUTRBfywGolspY000sk0p4XPW');
export const bookTour = async tourId => {
    try {
        // get checkout session from api
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session);
        // create checkout form
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (error) {
        showAlert('error', error);
    }


};