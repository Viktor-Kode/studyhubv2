import mongoose from 'mongoose';

const SharedLibraryItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  subject: { type: String },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String },
  publicId: { type: String },
  coverColor: { type: String },
  pages: { type: Number, default: 0 },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
}, { timestamps: true });

export default mongoose.models.SharedLibraryItem || mongoose.model('SharedLibraryItem', SharedLibraryItemSchema);
