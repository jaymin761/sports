import {Agenda} from 'agenda';
import {TrustStatus} from "./enum";
import {arcHav} from "./locationUtils/MathUtil";
import mongoose from "mongoose";
import eventEmitter from './event';

const config = require("config");

const agenda = new Agenda({db: {address: config.get("DB_CONN_STRING"), collection: 'verifyLocationSchedule'}});
const User = require("../components/users/models/userModel")
const LocationTraces = require("../components/users/models/locationTrace")

//agenda define here

/**
 *  Verify Home address & Set trust level status for home address
 * */
agenda.define("evaluateHomeAddressVerification", async (args: any) => {

    console.log("evaluateHomeAddressVerification Called", args)

    console.log('location log')

    const data = args.attrs.data
    let user = await User.findOne({
        _id: data.userId
    }).select("trustLevel address").lean()
    console.log("AVUUUUU AVUUUU", user)

    if (user) {
        console.log("USER_TRUST_LEVEL: ", user)

        let locationTraces = await LocationTraces.find(
            {
                user_id: data.userId,
            }
        ).lean()

        console.log("LOCATION_TRACES: ", locationTraces)

        let successTraces = locationTraces.filter((doc: any) => doc.result).length

        console.log("LOCATION_TRACES_AVERAGE: ", successTraces, locationTraces.length, (successTraces / locationTraces.length) * 100)

        /**
         *   GET trust level constant
         * */
        // const myTrustConstant: number = myTrustLevel(
        //     user.trustLevel?.image?.valueOf() ?? TrustStatus.PENDING,
        //     user.trustLevel?.id?.valueOf() ?? TrustStatus.PENDING,
        //     user.trustLevel?.reference?.valueOf() ?? TrustStatus.PENDING,
        //     user.trustLevel?.address?.valueOf() ?? TrustStatus.PENDING,
        // )

        // const trust = await Trust.findOne({
        //     combine: myTrustConstant
        // }).select("message name star")

        /**
         *  Evaluate Trust Level using constant
         * */
        // await User.updateOne({
        //     _id: data.userId
        // }, {
        //     $set: {
        //         trustLevel: {
        //             image: user.trustLevel.image,
        //             id: user.trustLevel.id,
        //             reference: user.trustLevel.reference,
        //             address: ((successTraces / locationTraces.length) * 100) >= 30 ? TrustStatus.ACCEPT : TrustStatus.INVALID,
        //         },
        //         averageTrust: trust?.star ?? user.averageTrust
        //     }
        // })

        // console.log("before evaluateHomeAddressNotification");

        eventEmitter.emit('evaluateHomeAddressNotification', {userId: data.userId})

        // console.log("after evaluateHomeAddressNotification");

        // console.log(data.key);
        // console.log(data.key === 72);

        console.log("evaluateHomeAddressVerification started for 18 days");
        if (data.key === 72) {
            await agenda.start()
            await agenda.schedule("18 days", "evaluateHomeAddressVerification", {
                "userId": data.userId,
                "key": 21
            })
        }
    }

})

agenda.define('activeUser', async (job: any) => {
        const {user_id} = job.attrs.data;
        const userInactive = await User.findOne({_id: user_id});
        userInactive.status = 1
        userInactive.endDate = null
        userInactive.save();
    }
);

/**
 *  Change Event Status For Active events
 * */
agenda.define("updateEventStatus", async (args: any) => {

})

export default agenda;