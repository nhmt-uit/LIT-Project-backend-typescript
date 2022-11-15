import { NextFunction, Request, Response } from 'express';
import categoryInterface from '../../interfaces/categoryInterface';

import Category from '../../models/categoryModel';

const createCategory = (req: Request, res: Response, next: NextFunction) => {
    let params = req.body;

    return Category.findOne({ $or: [{ en_name: params.en_name }, { vn_name: params.vn_name }] })
        .exec()
        .then((categoryExist) => {
            if (!categoryExist) {
                const category = new Category(params);
                return category.save((error, result) => {
                    if (error) {
                        return res.json({
                            error
                        })
                    }
                    return res.status(201).json({
                        success: true,
                        message: "Create category successful!",
                        category: result
                    })
                })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Category name has been used!`
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

const getCategories = (req: Request, res: Response, next: NextFunction) => {
    return Category.find({})
        .exec()
        .then(async (categories: any) => {
            const buildListToTree = (list: any[]) => {
                let node, i, roots = [];

                const idMapping = categories.reduce((acc: { [x: string]: any; }, el: { id: string | number; }, i: any) => {
                    acc[el.id] = i;
                    list[i].children = [];
                    return acc;
                }, {});

                for (i = 0; i < list.length; i += 1) {
                    node = list[i];
                    if (node.parent_id) {
                        list[idMapping[node.parent_id]].children.push(node);
                    } else {
                        roots.push(node);
                    }
                }
                return roots;
            }

            let result = buildListToTree((JSON.parse(JSON.stringify(categories))));
            return res.status(200).json({
                success: true,
                message: `Get categories successful!`,
                result
            });
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

const updateCategory = (req: Request, res: Response, next: NextFunction) => {
    let { id, en_name, vn_name, parent_id, priority } = req.body;
    let params_update = {
        en_name, vn_name, parent_id, priority
    };

    return Category.findOne({ _id: { $nin: [id] }, $or: [{ en_name: en_name }, { vn_name: vn_name }] })
        .exec()
        .then(categoryExist => {
            if (!categoryExist) {
                return Category.updateOne({ _id: id }, params_update)
                    .then(() => {
                        return res.status(200).json({
                            success: true,
                            message: "Update category successful!"
                        })
                    })
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Category name has been used!`
                })
            }
        })
};

const deleteCategory = (req: Request, res: Response, next: NextFunction) => {
    let { id } = req.body;

    return Category.deleteOne({ _id: id })
        .exec()
        .then((response) => {
            return res.status(200).json({
                success: true,
                message: `Delete category successful!`
            });
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

export {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
};
