import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const accessLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
  dataAccessed: [{ type: String }],
  action: { type: String, enum: ['view', 'download'], default: 'view' }
});

const shareAccessSchema = new mongoose.Schema({
  // User who is sharing their records
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Unique access code for URL
  accessCode: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(16).toString('hex')
  },

  // Share type
  type: {
    type: String,
    enum: ['link', 'email-otp', 'qr-code'],
    default: 'email-otp'
  },

  // Recipient information (for email-otp type)
  recipientEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  recipientName: {
    type: String,
    trim: true
  },

  // OTP fields
  otpHash: {
    type: String,
    select: false
  },
  otpAttempts: {
    type: Number,
    default: 0
  },
  otpLockedUntil: {
    type: Date
  },
  otpVerified: {
    type: Boolean,
    default: false
  },

  // Session management after OTP verification
  sessionToken: {
    type: String
  },
  sessionExpiresAt: {
    type: Date
  },

  // Permissions - what data can be accessed
  permissions: {
    emergencyContacts: { type: Boolean, default: true },
    medications: { type: Boolean, default: true },
    doctors: { type: Boolean, default: true },
    insurance: { type: Boolean, default: true },
    medicalHistory: { type: Boolean, default: true },
    allergies: { type: Boolean, default: true },
    vitals: { type: Boolean, default: false },
    procedures: { type: Boolean, default: false },
    events: { type: Boolean, default: false },
    documents: { type: Boolean, default: false }
  },

  // Access control
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  maxViews: {
    type: Number,
    default: null // null = unlimited
  },
  viewCount: {
    type: Number,
    default: 0
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired', 'used'],
    default: 'active'
  },
  revokedAt: {
    type: Date
  },
  revokedReason: {
    type: String
  },

  // Access log
  accessLog: [accessLogSchema],

  // Notification sent
  notificationSentToPatient: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
shareAccessSchema.index({ accessCode: 1 });
shareAccessSchema.index({ userId: 1 });
shareAccessSchema.index({ recipientEmail: 1 });
shareAccessSchema.index({ expiresAt: 1 });
shareAccessSchema.index({ status: 1 });
shareAccessSchema.index({ sessionToken: 1 });

// Virtual to check if share is currently valid
shareAccessSchema.virtual('isValid').get(function() {
  if (this.status !== 'active') return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  if (this.maxViews && this.viewCount >= this.maxViews) return false;
  return true;
});

// Virtual to check if OTP is locked
shareAccessSchema.virtual('isOtpLocked').get(function() {
  return !!(this.otpLockedUntil && this.otpLockedUntil > Date.now());
});

// Method to set OTP
shareAccessSchema.methods.setOtp = async function(otp) {
  const salt = await bcrypt.genSalt(10);
  this.otpHash = await bcrypt.hash(otp.toString(), salt);
  return this.save();
};

// Method to verify OTP
shareAccessSchema.methods.verifyOtp = async function(candidateOtp) {
  // Check if locked
  if (this.isOtpLocked) {
    const lockRemaining = Math.ceil((this.otpLockedUntil - Date.now()) / 60000);
    throw new Error(`Too many failed attempts. Try again in ${lockRemaining} minutes.`);
  }

  // Get the hash (need to explicitly select it since it's not included by default)
  const shareWithHash = await this.constructor.findById(this._id).select('+otpHash');

  if (!shareWithHash.otpHash) {
    throw new Error('OTP not set for this share');
  }

  const isMatch = await bcrypt.compare(candidateOtp.toString(), shareWithHash.otpHash);

  if (!isMatch) {
    // Increment failed attempts
    this.otpAttempts += 1;

    // Lock after 5 failed attempts for 30 minutes
    if (this.otpAttempts >= 5) {
      this.otpLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }

    await this.save();

    const remaining = 5 - this.otpAttempts;
    if (remaining > 0) {
      throw new Error(`Invalid verification code. ${remaining} attempts remaining.`);
    } else {
      throw new Error('Too many failed attempts. Please wait 30 minutes before trying again.');
    }
  }

  // Success - mark as verified and reset attempts
  this.otpVerified = true;
  this.otpAttempts = 0;
  this.otpLockedUntil = null;
  await this.save();

  return true;
};

// Method to generate session token
shareAccessSchema.methods.generateSessionToken = async function() {
  this.sessionToken = crypto.randomBytes(32).toString('hex');
  this.sessionExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await this.save();
  return this.sessionToken;
};

// Method to validate session
shareAccessSchema.methods.validateSession = function(token) {
  if (!this.sessionToken || this.sessionToken !== token) {
    return false;
  }
  if (this.sessionExpiresAt && new Date() > this.sessionExpiresAt) {
    return false;
  }
  return true;
};

// Method to log access
shareAccessSchema.methods.logAccess = async function(accessData) {
  this.accessLog.push({
    timestamp: new Date(),
    ipAddress: accessData.ipAddress,
    userAgent: accessData.userAgent,
    dataAccessed: accessData.dataAccessed,
    action: accessData.action || 'view'
  });
  this.viewCount += 1;

  // Check if max views reached
  if (this.maxViews && this.viewCount >= this.maxViews) {
    this.status = 'used';
  }

  await this.save();
};

// Method to revoke share
shareAccessSchema.methods.revoke = async function(reason = '') {
  this.status = 'revoked';
  this.revokedAt = new Date();
  this.revokedReason = reason;
  this.sessionToken = null;
  this.sessionExpiresAt = null;
  await this.save();
};

// Static method to clean up expired shares
shareAccessSchema.statics.cleanupExpired = async function() {
  return this.updateMany(
    {
      status: 'active',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

// Pre-save middleware to update status if expired
shareAccessSchema.pre('save', function(next) {
  if (this.status === 'active' && this.expiresAt && new Date() > this.expiresAt) {
    this.status = 'expired';
  }
  next();
});

export default mongoose.model('ShareAccess', shareAccessSchema);
