import mongoose from 'mongoose';

const LibraryDocumentSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  subject: { type: String, default: 'General' },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String },
  publicId: { type: String },
  originalName: { type: String },
  coverColor: { type: String },
  pages: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.LibraryDocument || mongoose.model('LibraryDocument', LibraryDocumentSchema);
