export const showHomePage = (req, res) =>{
    res.render("client/home", { 
        title: "Trang chủ Study Group",
        rooms: [],
        view: "client/home",
        user: req.user 
    });
}