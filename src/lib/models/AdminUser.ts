import mongoose from 'mongoose';

const adminUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);

export default AdminUser;
