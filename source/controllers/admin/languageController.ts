import { NextFunction, Request, Response } from 'express';
import Language from '../../models/languageModel';

const createLanguage = (req: Request, res: Response, next: NextFunction) => {
    let params = req.body;
    let key = params.key && params.key.toLowerCase().replace(/ /g, '_');

    return Language.findOne({ key: key })
        .exec()
        .then(async (languageExist) => {
            if (!languageExist) {
                params.key = key;
                const language = new Language(params);
                return language.save((error, result) => {
                    if (error) {
                        return res.json({
                            error
                        })
                    }
                    return res.status(201).json({
                        success: true,
                        message: "Create new key language successful!",
                        language: result
                    })
                })


            } else {
                return res.status(401).json({
                    success: false,
                    message: `Key language is already in use!`
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

const getLanguages = (req: Request, res: Response, next: NextFunction) => {
    let { language } = req.query;

    let field_was_selected: object = { key: 1, vietnamese: 1 };
    let field_language = "vietnamese";
    switch (language || '') {
        case 'en':
            field_was_selected = { key: 1, english: 1 };
            field_language = "english";
            break;
        case 'vn':
            field_was_selected = { key: 1, vietnamese: 1 };
            field_language = "vietnamese";
            break;
        case 'cn':
            field_was_selected = { key: 1, chinese: 1 };
            field_language = "chinese";
            break;
        default:
            break;
    }

    return Language.find({}, field_was_selected)
        .exec()
        .then(async (languageExist) => {
            if (languageExist.length > 0) {
                let languageResponse: { [key: string]: any } = {};
                const asyncGetLanguage = async () => {
                    return Promise.all(languageExist.map(async (item: any) => {
                        languageResponse[item.key] = languageResponse[item.key] || {};
                        languageResponse[item.key] = item[field_language];
                    }))
                }

                await asyncGetLanguage().then(() => {
                    return res.status(200).json({
                        success: true,
                        message: "Get languages successful!",
                        language: languageResponse
                    })
                })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Not found any languages!`
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

const updateLanguage = (req: Request, res: Response, next: NextFunction) => {
    let { id, key, vietnamese, english, chinese } = req.body;

    key = key && key.toLowerCase().replace(/ /g, '_');
    return Language.findOne({ _id: { $nin: [id] }, key: key })
        .exec()
        .then(languageExits => {
            if (!languageExits) {
                return Language.updateOne({ _id: id }, { key: key, vietnamese: vietnamese, english: english, chinese: chinese })
                    .then(() => {
                        return res.status(200).json({
                            success: true,
                            message: `Update language successful!`
                        })
                    })
            } else {
                return res.status(400).json({
                    success: true,
                    message: `Key language is already in use!`
                })
            }
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        })
};

const deleteLanguage = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;

    return Language.deleteOne({ _id: id })
        .exec()
        .then((response) => {
            return res.status(200).json({
                success: true,
                message: `Delete language successful!`
            });
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        })
};

export {
    createLanguage,
    getLanguages,
    updateLanguage,
    deleteLanguage
};
