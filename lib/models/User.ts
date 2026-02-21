import mongoose from 'mongoose'

export interface IUser extends mongoose.Document {
    email: string
    password?: string
    name: string
    role: 'student' | 'teacher'
    isVerified: boolean
    verificationToken?: string
    resetPasswordToken?: string
    resetPasswordExpires?: Date
    oauthProvider?: 'google' | null
    oauthId?: string
    avatar?: string
    createdAt: Date
    updatedAt: Date
}

const UserSchema = new mongoose.Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters'],
            select: false // Don't return password by default
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true
        },
        role: {
            type: String,
            enum: ['student', 'teacher'],
            required: [true, 'Role is required'],
            default: 'student'
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        verificationToken: String,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        oauthProvider: {
            type: String,
            enum: ['google', null],
            default: null
        },
        oauthId: String,
        avatar: String
    },
    {
        timestamps: true
    }
)

// Index for faster queries
UserSchema.index({ email: 1 })
UserSchema.index({ resetPasswordToken: 1 })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
