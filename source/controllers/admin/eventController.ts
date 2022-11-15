import { NextFunction, Request, response, Response } from 'express';
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

import Event from '../../models/eventModel';
import { formatDateToTimestamp } from '../../utils/formatDate';

const baseUrl = process.env.ARCHIVE_HOST;

// Setup Storage
const storage = multer.diskStorage({
    destination: function (req: any, file: any, callback: (arg0: null, arg1: string) => void) {
        // Set the destination where the files should be stored on disk
        callback(null, "uploads");
    },
    filename: function (req: any, file: { originalname: string; }, callback: (arg0: null, arg1: string) => void) {
        // Set the file name on the file in the uploads folder
        callback(null, Date.now() + "-" + file.originalname);
    },
    fileFilter: function (req: any, file: { mimetype: string; }, callback: (arg0: Error | null, arg1: boolean) => void) {
        // Check type file
        if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
            return callback(new Error('Only Images are allowed !'), false)
        }
        callback(null, true);
    }
});

const upload = multer({ storage: storage }).single('image');

const createEvent = (req: any, res: Response, next: NextFunction) => {
    // Create Upload Folder
    if (!fs.existsSync(`uploads`)) {
        fs.mkdirSync(`uploads`)
    }
    if (!fs.existsSync(`source/view/events`)) {
        fs.mkdirSync(`source/view/events`)
    }
    upload(req, res, async function (err: any) {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Choose an image!'
            })
        }
        let { event_name, start_date, finish_date, html_content, merchant_id } = req.body;
        let image = req.file;

        return Event.findOne({ merchant_id: merchant_id, event_name: event_name })
            .exec()
            .then((eventExist) => {
                if (!eventExist) {
                    // Prepair to send and save event image.
                    let formData = new FormData();
                    formData.append('image', fs.createReadStream(image.path), { filename: `event-` + image.originalname });
                    const config_headers = {
                        headers: {
                            "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                        }
                    }

                    axios.post(`${baseUrl}/api/event/save`, formData, config_headers)
                        .then(async (response: any) => {
                            let folderName = removeAccents(event_name) + `-${Date.now()}`;
                            let folderPath = `source/view/events/${folderName}`
                            // Create folder:
                            if (!fs.existsSync(folderPath)) {
                                fs.mkdirSync(folderPath)
                            }
                            // Write and save html file:
                            fs.writeFileSync(folderPath + `/index.html`, html_content);
                            //============================//
                            let params_create = {
                                event_name,
                                start_date: formatDateToTimestamp(start_date, 'DD/MM/YYYY'),
                                finish_date: formatDateToTimestamp(finish_date, 'DD/MM/YYYY'),
                                merchant_id,
                                html_path: folderName,
                                image: response.data.image,
                            }
                            const event = new Event(params_create);
                            return event.save((error, result) => {
                                if (error) {
                                    return res.json({
                                        error
                                    })
                                }
                                return res.status(201).json({
                                    success: true,
                                    message: "Create event successful!",
                                    event: result
                                })
                            })
                        })
                } else {
                    return res.status(401).json({
                        success: false,
                        message: `Event name has been used!`
                    })
                }
            })
            .catch((error) => {
                return res.status(500).json({
                    message: error.message,
                    error
                });
            }).finally(() => {
                fs.unlinkSync(image.path);
            });
    })
};

const getEvents = (req: Request, res: Response, next: NextFunction) => {
    let { event_name } = req.query;
    let query: any = {};
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
                    return res.status(201).json({
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

const updateEvent = (req: any, res: Response, next: NextFunction) => {

    upload(req, res, async function (err: any) {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Choose an image!'
            })
        }
        let { id, event_name, start_date, finish_date, html_content, merchant_id } = req.body;
        let image = req.file;

        return Event.findOne({ _id: { $nin: [id] }, merchant_id: merchant_id, event_name: event_name })
            .exec()
            .then(eventExist => {
                if (!eventExist) {
                    return Event.findOne({ _id: id })
                        .exec()
                        .then((eventExist: any) => {
                            if (eventExist && eventExist.image !== '') {
                                return axios.post(`${baseUrl}/api/event/delete`, { path: eventExist.image })
                                    .then((response: any) => {
                                        let formData = new FormData();
                                        formData.append('image', fs.createReadStream(image.path), { filename: `event-` + image.originalname });
                                        const config_headers = {
                                            headers: {
                                                "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
                                            }
                                        }

                                        return axios.post(`${baseUrl}/api/event/save`, formData, config_headers)
                                    })
                                    .then(async (response: any) => {
                                        let folderName = removeAccents(event_name) + `-${Date.now()}`;
                                        let folderPath = `source/view/events/${folderName}`
                                        // Create folder:
                                        if (!fs.existsSync(folderPath)) {
                                            fs.mkdirSync(folderPath)
                                        }

                                        // Delete html file before:
                                        fs.rmdirSync(`source/view/events/${eventExist.html_path}`, { recursive: true })
                                        // Write and save html file:
                                        fs.writeFileSync(folderPath + `/index.html`, html_content);
                                        //============================//

                                        let params_update = {
                                            event_name,
                                            start_date: formatDateToTimestamp(start_date, 'DD/MM/YYYY'),
                                            finish_date: formatDateToTimestamp(finish_date, 'DD/MM/YYYY'),
                                            merchant_id,
                                            html_path: folderName,
                                            image: response.data.image,
                                        }

                                        return Event.updateOne({ _id: id }, params_update)
                                            .then(() => {
                                                return res.status(200).json({
                                                    success: true,
                                                    message: "Update brand successful!"
                                                })
                                            })
                                    })
                            }
                            if (!eventExist) {
                                return res.status(401).json({
                                    success: false,
                                    message: `Not found event to update!`
                                })
                            }
                        })
                        .catch((error) => {
                            return res.status(500).json({
                                message: error.message,
                                error
                            });
                        });
                } else {
                    return res.status(401).json({
                        success: false,
                        message: `Event name has been used!`
                    })
                }
            })
            .catch((error) => {
                return res.status(500).json({
                    message: error.message,
                    error
                });
            }).finally(() => {
                fs.unlinkSync(image.path);
            });
    })
};

const deleteEvent = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;

    return Event.findOne({ _id: id })
        .exec()
        .then((eventExist: any) => {
            if (eventExist && eventExist.image !== '') {
                return axios.post(`${baseUrl}/api/event/delete`, { path: eventExist.image })
                    .then(() => {
                        // Delete html file:
                        fs.rmdirSync(`source/view/events/${eventExist.html_path}`, { recursive: true })
                    })
                    .then(async (response: any) => {
                        return Event.deleteOne({ _id: id })
                            .exec()
                            .then((response) => {
                                return res.status(200).json({
                                    success: true,
                                    message: `Delete event successful!`
                                });
                            })
                    })
            }
            if (!eventExist) {
                return res.status(401).json({
                    success: false,
                    message: `Not found event to delete!`
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

const getEventsByApproved = (req: Request, res: Response, next: NextFunction) => {
    let { event_name, approved } = req.query;
    let nowTimestamp = Math.floor(Date.now() / 1000);
    let query: any = {
        finish_date: { $gte: nowTimestamp }
    };
    event_name ? query.event_name = new RegExp(`^${event_name}$`, 'i') : null;
    approved ? query.approved = approved : null;

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

const approveEvent = (req: Request, res: Response, next: NextFunction) => {
    let { id, approved } = req.body;

    return Event.updateOne({ _id: { $in: [id] } }, { approved: approved })
        .exec()
        .then(async (response) => {
            console.log(response);
            return res.status(200).json({
                success: true,
                message: `Update approve successful!`,
            });
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

const removeAccents = (string: string) => {
    return string.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/ /g, '-');
}

export {
    createEvent,
    getEvents,
    updateEvent,
    deleteEvent,
    getEventsByApproved,
    approveEvent
};