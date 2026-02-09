const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin'],
      default: 'admin',
    },
    permissions: {
      canManageUsers: {
        type: Boolean,
        default: false,
      },
      canViewMedicalData: {
        type: Boolean,
        default: false,
      },
      canManageAdmins: {
        type: Boolean,
        default: false,
      },
      canViewAnalytics: {
        type: Boolean,
        default: false,
      },
      canResetPasswords: {
        type: Boolean,
        default: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
adminSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock check
adminSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Set permissions based on role before saving
adminSchema.pre('save', function (next) {
  if (this.role === 'super_admin') {
    this.permissions = {
      canManageUsers: true,
      canViewMedicalData: true,
      canManageAdmins: true,
      canViewAnalytics: true,
      canResetPasswords: true,
    };
  }
  next();
});

// Compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked (method version)
adminSchema.methods.isAccountLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
adminSchema.methods.incLoginAttempts = function () {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  if (this.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Reset login attempts on successful login
adminSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

module.exports = mongoose.model('Admin', adminSchema);
