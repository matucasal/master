const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

// Create a schema
const userSchema = new Schema({
  books: { type: Number, default: 1000 },
  level: { type: String },
  lastLogin: { type: Date },
  avatar: {
    peinado: { type: String },
    rostro: { type: String },
    ojo_izquierdo: { type: String },
    ojo_derecho: { type: String },
    boca: { type: String },
    nariz: { type: String },
    cuerpo: { type: String }
  },
  animations: {
    anim_inicio: { type: String },
    anim_quieto: { type: String },
    anim_gano: { type: String },
    anim_perdio: { type: String }
  },
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  gamesLost: { type: Number, default: 0 },
  favoriteCategory: { type: String },
  method: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    required: true
  },
  local: {
    email: {
      type: String,
      lowercase: true
    },
    password: {
      type: String
    },
    name: {
      type: String
    },
    fechaNacimiento: {
      type: String
    },
    sexo: {
      type: String
    },

  },
  google: {
    id: {
      type: String
    },
    email: {
      type: String,
      lowercase: true
    }
  },
  facebook: {
    id: { type: String },
    name: { type: String },
    email: { type: String, lowercase: true },
  }
},
{
  timestamps: true,
  versionKey: false,
});

userSchema.pre('save', async function (next) {
  try {
    if (this.method !== 'local') {
      next();
    }

    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Generate a password hash (salt + hash)
    const passwordHash = await bcrypt.hash(this.local.password, salt);
    // Re-assign hashed version over original, plain text password
    this.local.password = passwordHash;
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.isValidPassword = async function (newPassword) {
  try {
    return await bcrypt.compare(newPassword, this.local.password);
  } catch (error) {
    throw new Error(error);
  }
}

// Create a model
const User = mongoose.model('user', userSchema);

// Export the model
module.exports = User;