import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
    },
    siteTheme: {
      type: String,
      required: true,
      enum: ['normal', 'good-friday', 'easter', 'christmas'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
  }
);

siteSettingsSchema.index({ singletonKey: 1 }, { unique: true });

const SiteSettings =
  mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);

export default SiteSettings;
