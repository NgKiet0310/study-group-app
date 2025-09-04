import mongoose from 'mongoose';


const { Schema } = mongoose;

const RoomSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [100, 'Room name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  code: {
    type: String,
    required: [true, 'Room code is required'],
    unique: true,
    trim: true,
    minlength: [6, 'Room code must be at least 6 characters']
  },
  admin: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin is required']
  },
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    role: {
      type: String,
      enum: ['host', 'member'],
      default: 'member'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });



export default mongoose.models.Room || mongoose.model('Room', RoomSchema);