import { NextFunction, Request, Response } from 'express';
const axios = require('axios');

import Event from '../models/eventModel';

const baseUrl = process.env.ARCHIVE_HOST;

const getEvents = (req: Request, res: Response, next: NextFunction) => {
    let { event_name } = req.query;
    let nowTimestamp = Math.floor(Date.now() / 1000);
    let query: any = {
        approved: true,
        finish_date: { $gte: nowTimestamp }
    };
    if (event_name) {
        query.event_name = new RegExp(`^${event_name}$`, 'i');
    }

    return Event.find(query)
        .exec()
        .then(async (eventExist) => {
            if (eventExist.length > 0) {
                const asyncGetEventImage = async () => {
                    return Promise.all(eventExist.map(async (event: any) => {
                        if (event.image !== '') {
                            await axios.post(`${baseUrl}/api/event/get`, { path: event.image })
                                .then(async (response: any) => {
                                    let data = response.data;
                                    event.image = data.image;
                                    return event;
                                })
                        }
                        return event;
                    }))
                }
                await asyncGetEventImage().then(() => {
                    return res.status(200).json({
                        success: true,
                        message: "Get events successful!",
                        events: eventExist
                    })
                })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Not found any events!`
                })
            }
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

export {
    getEvents,
};
