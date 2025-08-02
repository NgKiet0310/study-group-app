export const showAdminPage = (req, res) => {
  res.render("admin/pages/dashboard", { 
    title: "Trang chủ Admin Study Group",
    path: req.path,
  });
};
