import User from "../../../models/User.js";
import { validationResult } from "express-validator";
export const showUser = async (req, res ) => {
    const {search, role, page = 1} = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;

    try {
        let query = {};
        if(search){
            query.username = { $regex: search, $option: 'i'};
        }

        if(role){
            query.role = role;
        }

        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await User.find(query)
        .sort( { createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const success = req.query.success;
        const error = req.query.error;

        res.render('admin/pages/user/manage-user', {
            users,
            path: req.path,
            success,
            error,
            search,
            role,
            page: parseInt(page),
            totalPages,
            limit
        });
    } catch (err) {
        console.error('Lỗi khi tải danh sách người dùng', err);
        res.status(500).render('admin/pages/user/manage-user', {
            users: [],
            path: req.path,
            error: 'Lỗi khi tải danh sách người dùng',
            success: null,
            search: '',
            role: '',
            page: 1,
            totalPages: 1,
            limit: 5
        });
    }
}

export const showCreateForm = async(req, res) => {
    try {
        res.render('admin/pages/user/form-create', {
            path: req.path,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị form tạo người dùng', error);
        res.status(500).render('admin/pages/user/form-create' , {
            path: req.path,
            error: 'Lỗi khi hiển thị form tạo người dùng',
            success: null
        });
    }
}   

export const createUser = async(req, res) => {
    try {
        const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).render('admin/pages/user/form-create', {
            path: req.path,
            error: errors.array()[0].msg,
            success: null
        });
    }
    const {username, password} = req.body;

    const existingUser = await User.findOne({ username });
    if(existingUser){
        return res.status(400).render('admin/pages/user/form-create', {
            path: req.path,
            error: 'Email hoặc số điện thoại đã được sử dụng',
            success: null
        })
    }
    
    const newUser = new User({
        username,
        password,
        createdAt: Date.now()
    });

    await newUser.save();

    res.redirect('/admin/user?success=Tạo người dùng thành công');

    } catch (error) {
        console.error('Lỗi khi tạo người dùng', error);
        res.status(500).render('admin/pages/user/form-create', {
            path: req.path,
            error: 'Lỗi khi tạo người dùng',
            success: null
        });
    }
    
}

export const showEditForm = async(req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if(!user){
            return res.redirect('/admin/user?error=Người dùng không tồn tại');
        }
        res.render('admin/pages/user/form-edit', {
            user,
            path: req.path,
            error: null,
            success: null
        })
    } catch (error) {
        console.error('Lỗi khi hiển thị form chỉnh sửa', error);
        res.redirec('/admin/user?error=lỗi khi hiển thị form chỉnh sửa');
    }
}

export const editUser = async(req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if(!user){
            return res.redirect('/admin/user?error=Người dùng không tồn tại ');
        }

        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).render('admin/pages/user/form-edit', {
                user,
                path: req.path,
                error: errors.array()[0].msg,
                success: null
            });
        }

        const {username, password} = req.body;

        const existingUser = await User.findOne({ username, _id: {$ne: userId}});
        if(existingUser){
            return res.status(400).render('admin/pages/user/form-edit', {
                user,
                path: req.path,
                error: 'Email hoặc số điện thoại đã được sử dụng',
                success: null
            });
        }

        user.username = username;
        if(password){
            user.password = password;
        }
        user.updatedAt = Date.now();
        await user.save();
        res.redirect('/admin/user?success=Chỉnh sửa người dùng thành công');
    } catch (error) {
        console.error('Lỗi khi chỉnh sửa người dùng', error);
        res.status(500).render('admin/pages/user/form-edit',{
            user,
            path: req.path,
            error: 'Đã có lỗi xảy ra khi chỉnh sửa',
            success: null
        });
    }
}

export const showUserDetail = async(req, res) => {
    try {
        const userId  = req.params.id;
        const user = await User.findById(userId);
        if(!user){
            return res.redirect('/admin/user?error=Người dùng không tồn tại');
        }

        res.render('admin/pages/user/user-detail', {
            user,
            path: req.path,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị chi tiết người dùng', error);
        res.redirect('/admin/user?error=Lỗi khi hiển thị chi tiết người dùng');
    }
}

export const deleteUser = async(req, res) => {
    try {
        const userId = req.params.id;
    const user = await User.findById(userId);
    if(!user){
        res.redirect('/admin/user?error=Người dùng không tồn tại');
    }
    await User.deleteOne({ _id: userId});
    res.redirect('/admin/user?success=Xóa người dùng thành công');
    } catch (error) {
        console.error('Lỗi khi xóa người dùng', error);
        res.redirect('/admin/user?error=Đã có lỗi xảy ra khi xóa người dùng');
    }
}