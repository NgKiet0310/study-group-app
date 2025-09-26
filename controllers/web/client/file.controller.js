import File from "../../../models/File.js";

const showFilesRoom = async(req, res) => {
    try {
       const files = await File.find({ room: roomId }).populate("uploadedBy","username").sort({ uploadedAt: -1 });
       
    } catch (error) {
        
    }
}