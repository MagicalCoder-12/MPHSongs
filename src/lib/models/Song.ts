import mongoose from 'mongoose';

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
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
    isChristmasSong: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // ← Adds createdAt & updatedAt automatically
  }
);

// Compound indexes for common query patterns
songSchema.index({ isChoirPractice: 1, createdAt: -1 });
songSchema.index({ isChristmasSong: 1, createdAt: -1 });
songSchema.index({ tags: 1, createdAt: -1 });
songSchema.index({ isChoirPractice: 1, title: 1 });
songSchema.index({ isChristmasSong: 1, title: 1 });

// Index for search functionality
songSchema.index({
  title: 'text',
  subtitle: 'text',
  lyrics: 'text',
  tags: 'text',
});

// Index for sorting
songSchema.index({ createdAt: -1 });
songSchema.index({ title: 1 });

const Song = mongoose.models.Song || mongoose.model('Song', songSchema);

export default Song;
