import mongoose from "mongoose";   // ✅ correct spelling

const userSchema = new mongoose.Schema({   // ✅ correct spelling + add "new"
  username: {
    type: String,
    required: true,
  },

  gmail: {
  type: String,
  required: true,
  unique: true, // ensures DB-level uniqueness
}
,

  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
