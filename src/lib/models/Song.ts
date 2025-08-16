import mongoose from 'mongoose';

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    songLanguage: {
      type: String,
      required: true,
      enum: ['Telugu', 'English', 'Hindi', 'Other'],
      default: 'Other',
    },
    lyrics: {
      type: String,
      required: true,
      trim: true,
    },
    isChoirPractice: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // ← Adds createdAt & updatedAt automatically
  }
);

// Index for search functionality
songSchema.index({ 
  title: 'text', 
  lyrics: 'text' 
});

// Index for sorting
songSchema.index({ createdAt: -1 });
songSchema.index({ title: 1 });

const Song = mongoose.models.Song || mongoose.model('Song', songSchema);

export default Song;