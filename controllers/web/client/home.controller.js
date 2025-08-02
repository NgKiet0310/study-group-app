export const showHomePage = (req, res) =>{
    res.render("client/pages/home", { 
        title: "Trang chủ Study Group",
        rooms: [],
        view: "client/home",
        user: req.session.user 
    });
}