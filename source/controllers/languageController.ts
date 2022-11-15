import { NextFunction, Request, Response } from 'express';
import Language from '../models/languageModel';

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

export {
    getLanguages,
};
