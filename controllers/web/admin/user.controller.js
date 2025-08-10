import User from "../../../models/User";

export const showUser = async (req, res ) => {
    const users = await User.find({ role: 'user' });
    
}