import { validationResult } from "express-validator";
import User from "../../../models/User.js";

export const showHomePage = (req, res) =>{
    const success = req.session.success;
    req.session.success = null; 
    res.render("client/pages/home", { 
        rooms: [],
        success
    });
    console.log("Session user:", req.session.user);

}

export const showRoom = (req, res) => {
    res.render("client/pages/room/room");
}

export const profile = (req, res) => {
    const user = req.session.user || null;
    const success = req.query.success;
    const error = req.query.error;
    res.render("client/pages/profile",{
        user,
        error,
        success
    });
}

export const updateProfile = async (req, res) => {
    try {   
        const userSession = req.session.user;
        if(!userSession || !userSession._id){
            return res.status(401).render("client/pages/profile",{
                user: null,
                error: "Vui lòng đăng nhập để tiếp tục",
                success: null
            });
        }

        const user = await User.findById(userSession._id);
        if(!user){
            return res.status(400).render("client/pages/profile",{
                user: userSession,
                error: "Người dùng không tồn tại",
                success: null
            });
        }

        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).render('client/pages/profile',{
                user,
                error: errors.array()[0].msg,
                success: null
            });
        }

        const {newUsername ,currentPassword, newPassword, confirmPassword} = req.body;
        let updated = false;
        if(newUsername){
            if(newUsername === user.username){
              return res.status(400).render('client/pages/profile',{
                    user,
                    error: 'Username mới không được trùng với username cũ',
                    success: null
                });
            }
            const existingUser = await User.findOne({username: newUsername, _id: {$ne: userSession._id}});
            if(existingUser){
                return res.status(400).render('client/pages/profile',{
                    user,
                    error: "Tên người dùng đã được sử dụng",
                    success: null
                });
            }
            user.username = newUsername;
            req.session.user.username = newUsername;
            updated = true;
        }
        if(currentPassword && newPassword && confirmPassword){
            const isMatch = await user.comparePassword(currentPassword);
            if(!isMatch){
               return res.status(400).render('client/pages/profile',{
                    user,
                    error: "Mật khẩu hiện tại không đúng",
                    success: null
                });
            }
            const passOld = await user.comparePassword(newPassword);
            if(passOld){
                return res.status(400).render('client/pages/profile',{
                    user,
                    error: "Mật khẩu mới không được trùng với mật khẩu hiện tại",
                    success: null
                });
            }
            if(newPassword !== confirmPassword){
                return res.status(400).render('client/pages/profile',{
                    user,
                    error: "Mật khẩu mới và xác nhận mật khẩu không khớp",
                    success: null
                });
            }
            user.password = newPassword;
            updated = true;
        }
        if(!updated){
           return res.status(400).render('client/pages/profile',{
                user,
                error: "Vui lòng cung cấp ít nhất 1 trường để cập nhật",
                success: null
            });
        }
        user.updatedAt = Date.now();
        await user.save();
        return res.redirect('/profile?success=Cập nhật hồ sơ thành công');
    } catch (error) {
        console.error('Lỗi khi cập nhật hồ sơ', error);
        return res.status(500).render('client/pages/profile',{
            user: req.session.user || null,
            error: 'Đã có lỗi xảy ra khi cập nhật hồ sơ',
            success: null
        });
    }
}