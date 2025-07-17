export const showHomePage = (req, res) =>{
    res.render("client/home", { 
        title: "Trang chủ Study Group",
        user: req.user 
    });
}