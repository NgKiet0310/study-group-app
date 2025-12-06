export const formatDate = (date, options = {}, locale = "vi-VN") => {
    if (!date)
        return "";
    return new Date(date).toLocaleString(locale, {
        timeZone: "Asia/Ho_Chi_Minh",
        hour12: false,
        ...options,
    });
};
//# sourceMappingURL=dateHelper.js.map