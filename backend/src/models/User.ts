import { Schema, model } from 'mongoose'

const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '' },
    name: { type: String, required: true },
    photoURL: { type: String, default: '' },
    locationLabel: { type: String, default: 'Jakarta Selatan' },
    lat: { type: Number, default: -6.2615 },
    lng: { type: Number, default: 106.8106 },
    profile: { type: String, enum: ['warga', 'petugas'], default: 'warga' },
    disasterType: { type: String, default: 'banjir' },
    adminLevel4Code: { type: String, default: '' }
  },
  { timestamps: true }
)

export const UserModel = model('User', userSchema)
