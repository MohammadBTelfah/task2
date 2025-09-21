const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,          // ضروري
      unique: true,            // ما يتكرر
      lowercase: true,         // دايمًا حروف صغيرة
      trim: true,              // يشيل المسافات قبل وبعد
      match: /^[a-z0-9-]{3,64}$/ // فقط حروف صغيرة وأرقام و - وطول 3-64
    },
    target: {
      type: String,
      required: true,          // الرابط الأصلي ضروري
      trim: true
    },
    clicks: {
      type: Number,
      default: 0               
    },
    createdAt: {
      type: Date,
      default: Date.now       
    }
  },
  { versionKey: false }         
);
function isValidHttpUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}
linkSchema.pre('validate', function (next) {
  if (!isValidHttpUrl(this.target)) {
    return next(new Error('Invalid URL'));
  }
  next();
});

module.exports = mongoose.model('Link', linkSchema);